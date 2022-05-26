const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
  Task,
  Review,
  Notification,
  TaskBid,
  Device,
  IssueReport,
  Settlement,
  sequelize,
} = require('../db/models/index');
const { Op } = require('sequelize');
const {
  AppError,
  AppSuccess,
  isFuture,
  formatDate,
  isAhead,
  difference,
  sameDay,
  isToday,
  uploadFile,
  sendEmail,
  sendNotification,
} = require('../utils');

const {
  reversePayment,
  debit,
  verifyPayment,
  createTransferReceipt,
  transfer,
} = require('./payment-connector');

const { verifyService } = require('../helper/service-helper');
const {
  sendAcceptBidEmail,
  sendBroadcastEmailOnBookService,
  serviceNegotiationForCustomerEmail,
  priceBidAcceptedEmail,
  vendorArrivedForCustomer,
  artisanCompleteTaskEmail,
  sendServiceRequestEmail,
} = require('./email-sender/service-request-helper');
const { userInformationService } = require('./artisan/user');
const serviceEnum = require('../enums/service-requests-constants');
const log = require('../utils/logger');
require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

//create a task table
// to do
//2. System shall send automated reminders at intervals to Artisan to continue kyc process

exports.notifiedTasks = async function (userId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');
  let user = await User.findByPk(userId);
  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  let notificationsToUser = [];
  if (user.userRole === 'artisan') {
    notificationsToUser = await getArtisanNotifications(userId);
  } else {
    throw new AppError().GENERIC_ERROR('User cannot view tasks');
  }

  let notifiedTasks = notificationsToUser
    .filter((notification) => notification.task && !notification.isRejected)
    .map((notification) => {
      let task = notification.task;
      task.jobStatus = 'initiated';
      return task;
    });

  let taskBids = await TaskBid.findAll({
    where: {
      artisanId: userId,
    },
    order: [[Task, 'createdAt', 'DESC']],
    include: {
      model: Task,
      include: {
        model: User,
      },
    },
  });

  let bidedTasks = taskBids.map((bid) => {
    return bid.task;
  });
  bidedTasks = [...new Map(bidedTasks.map((item) => [item.id, item])).values()];
  notifiedTasks = [
    ...new Map(notifiedTasks.map((item) => [item.id, item])).values(),
  ];

  let ids = new Set(bidedTasks.map((item) => item.id));
  let tasks = [...bidedTasks, ...notifiedTasks.filter((d) => !ids.has(d.id))];
  tasks.sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // let allArtisanTasks = notifiedTasks.concat(bidedTasks);

  // let tasks = [...new Map(allArtisanTasks.map(item => [item.id, item])).values()];

  let userTasksInfo = user.toJSON();
  tasks['user'] = userTasksInfo;

  return tasks;
};

exports.customerTasks = async function (userId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');
  let user = await User.findByPk(userId);
  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  let tasks = [];
  if (user.userRole === 'customer') {
    tasks = await Task.findAll({
      where: {
        customerId: userId,
      },
      include: {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
    });
  } else {
    throw new AppError().GENERIC_ERROR('User cannot view tasks');
  }

  let tasksWithServiceCharges = [];
  for (let task of tasks) {
    let artisanServices = await ArtisanService.findAll({
      where: { serviceId: task.serviceId },
    });
    let { maximum, average, minimum } = await getArtisanServiceStatistics(
      artisanServices
    );
    tasksWithServiceCharges.push({
      ...task.toJSON(),
      minimumServicePrice: minimum,
      maximumServicePrice: maximum,
    });
  }

  return tasksWithServiceCharges;
};

exports.customerOngoingTasks = async function (userId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');
  let user = await User.findByPk(userId);
  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  let tasks = [];
  if (user.userRole === 'customer') {
    tasks = await Task.findAll({
      where: {
        [Op.and]: [{ customerId: userId }, { jobStatus: 'started' }],
      },
      include: {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
    });
  } else {
    throw new AppError().GENERIC_ERROR('User cannot view tasks');
  }

  return tasks;
};

exports.customerTaskDetails = async function (userId, taskId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');
  let user = await User.findByPk(userId);
  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  if (user.userRole === 'customer') {
    let taskDetails = await Task.findOne({
      where: {
        [Op.and]: [{ id: taskId }, { customerId: user.id }],
      },
      include: {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
    });
    if (!taskDetails)
      throw new AppError().GENERIC_ERROR('Task not found for customer');
    return taskDetails;
  } else {
    throw new AppError().GENERIC_ERROR('User cannot view task');
  }
};

exports.clientTaskDetails = async function (userId, taskId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');
  let user = await User.findByPk(userId);
  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  if (user.userRole === 'customer' || user.userRole === 'artisan') {
    let taskDetails = await Task.findOne({
      where: { id: taskId },
      include: [
        {
          model: ArtisanService,
          include: {
            model: User,
          },
        },
        {
          model: Review,
        },
      ],
    });

    if (!taskDetails)
      throw new AppError().GENERIC_ERROR('Task not found for customer');
    return taskDetails;
  } else {
    throw new AppError().GENERIC_ERROR('User cannot view task');
  }
};

exports.allTasks = async function (userId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');
  let user = await User.findByPk(userId);
  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  let tasks = await Task.findAll();

  return tasks;
};

async function getArtisanNotifications(userId) {
  let notificationsToUser = await Notification.findAll({
    where: {
      receiverId: userId,
    },
    include: {
      model: Task,
      include: {
        model: User,
      },
    },
  });

  return notificationsToUser;
}

async function getCustomerNotifications(userId) {
  let notificationsToUser = await Notification.findAll({
    where: {
      senderId: userId,
    },
    include: {
      model: Task,
    },
  });

  return notificationsToUser;
}

exports.getServices = async function ({ page, limit }) {
  if (isNaN(limit) || isNaN(page)) {
    throw new AppError().GENERIC_ERROR('Invalid pagination values');
  }
  let pagination = {};
  if (limit) {
    pagination = {
      offset: (page - 1) * limit,
      limit: +limit,
    };
  }
  let services = await Service.findAll({
    ...pagination,
  });

  let dataList = [];
  for (let service of services) {
    let artisanServices = await ArtisanService.findAll({
      where: { serviceId: service.id },
    });
    let { maximum, average, minimum } = await getArtisanServiceStatistics(
      artisanServices
    );
    dataList.push({
      ...service.toJSON(),
      averagePrice: average,
      minimumPrice: minimum,
      maximumPrice: maximum,
      serviceImageUrl: service.pictureUrl,
    });
  }
  let count = await Service.count();
  return {
    services: dataList,
    count,
  };
};

async function getArtisanServiceStatistics(artisanServiceList) {
  //ensure user is artisan or customer
  let maximum = null;
  let minimum = 0;
  let average = null;
  let count = 0;
  let totalValid = 0;

  for (let artisanService of artisanServiceList) {
    if (artisanService.price && Number.isInteger(artisanService.price)) {
      totalValid = artisanService.price + totalValid;
      count = count + 1;
      maximum = artisanService.price > maximum ? artisanService.price : maximum;
      minimum = artisanService.price < minimum ? artisanService.price : minimum;
    }
  }

  average = count > 0 ? totalValid / count : null;
  return { maximum, average, minimum };
}

//data in the form of service
//{serviceName,price,description,title,dateTime,location}
exports.bookArtisansForService = async function ({ id }, data, files) {
  let customer = await verifyRegisteredUser(id);
  if (!isFuture(data.dateTime))
    throw new AppError().GENERIC_ERROR('Task time must be in the future');

  // let previousTask = await Task.findAll({
  //   where: {
  //     title: data.title,
  //     customerId: id,
  //   },
  // });
  // if (previousTask.length > 0)
  //   throw new AppError().GENERIC_ERROR('Task already booked');

  let serviceName = await verifyService(data.serviceId);

  let taskObj = {
    price: data.price,
    startTime: data.dateTime,
    jobStatus: 'initiated',
    description: data.description,
    title: data.title,
    serviceId: data.serviceId,
    customerId: id,
    localGovernment: data.location,
    state: data.state,
    address: data.address,
    serviceName,
  };

  let imageKeyPrefix = `${customer.firstName}-${data.serviceName}`;

  for (const key in files) {
    let attachments = [];
    for (const file of files[key]) {
      const { fieldName, url, type, size, name } = await uploadFile(
        file,
        imageKeyPrefix
      );
      taskObj['idImageUrl'] = url.Location;
      attachments.push({
        url: url.Location,
        type,
        size,
        name,
      });
      // await task.save();
    }
    taskObj['attachments'] = {
      files: attachments,
    };
  }

  let task = await Task.create(taskObj);

  try {
    let filter = {
      [Op.and]: [
        { userRole: 'artisan' },
        { '$location.localGovernment$': data.location.trim() },
      ],
    };
    let artisans = await getArtisansWithAllRelations(filter);

    artisans = artisans
      .filter((artisan) => rendersService(artisan, data.serviceId))
      .filter((artisan) => isOnline(artisan));

    for (let artisan of artisans) {
      await Notification.create({
        type: 'initiated',
        senderId: customer.id,
        receiverId: artisan.id,
        data: task.description,
        dateTime: new Date(),
        taskId: task.id,
      });
    }

    sendServiceRequestMessages(customer, artisans, task, data);

    let artisanIdList = artisans.map(function (artisan) {
      return artisan.id;
    });

    customer['lastOrderedDate'] = new Date();
    await customer.save();

    return artisanIdList;
  } catch (error) {
    await task.destroy();
    await Notification.destroy({
      where: {
        taskId: task.id,
      },
    });
    throw new AppError().GENERIC_ERROR(error.message);
  }
};

async function sendServiceRequestMessages(customer, artisans, task, data) {
  try {
    let messageBody = {
      price: data.price,
      description: data.description,
      title: data.title,
    };

    await sendBroadcastEmailOnBookService(task, artisans, customer);
    await sendNotificationsToUsersWithScreenInfo(
      artisans,
      serviceEnum.BOOK_SERVICE,
      data.description,
      task,
      customer,
      false
    );
  } catch (error) {
    return;
  }
}

async function sendNotificationsToUsers(users, title, body) {
  let userTokens = [];
  for (let user of users) {
    let device = await Device.findOne({
      where: {
        userId: user.id,
      },
    });
    userTokens.push(device?.regToken);
  }
  let filteredTokens = userTokens.filter((token) => token);
  // let bodyString = JSON.stringify(body);
  let notificationMessageObject = {
    data: {
      title,
      description: body,
    },
    notification: {
      title,
      body,
    },
  };
  await sendNotification(filteredTokens, { title, body });
}

/**
 * @param {Object} users The list of users to send notifications to
 * @param {object} serviceEnum The object containing title and name of notification
 * @param {string} body The notification message
 * @param {object} task The task for which notification is being sent
 * @param {object} sender The user who is initiating the request
 **/
async function sendNotificationsToUsersWithScreenInfo(
  users,
  serviceEnum,
  body,
  task,
  sender,
  createNotification = true
) {
  if (createNotification) {
    for (let user of users) {
      await Notification.create({
        type: serviceEnum.notificationName,
        senderId: sender.id,
        receiverId: user.id,
        data: task.description,
        dateTime: new Date(),
        taskId: task.id,
      });
    }
  }

  try {
    let userTokens = [];
    for (let user of users) {
      let device = await Device.findOne({
        where: {
          userId: user.id,
        },
      });
      userTokens.push(device?.regToken);
    }

    let filteredTokens = userTokens.filter((token) => token);

    let notificationMessageObject = {
      data: {
        view: 'Service',
        click_action: 'task',
        status: serviceEnum.notificationName,
        status_id: `${task.id}`,
        google_sent_time: formatDate(new Date()),
        price: `${task.price}`,
        taskId: `${task.id}`,
        title: task.title,
        description: body,
      },
      notification: {
        title: serviceEnum.notificationTitle,
        body: task.title,
      },
    };
    await sendNotification(filteredTokens, notificationMessageObject);
  } catch (error) {
    log.info(error);
  }
}

exports.newTasksForArtisan = async function (artisanId) {
  let artisan = await User.findByPk(artisanId);
  if (!artisan) throw new Error('User not found');
  if (artisan.userRole !== 'artisan') throw new Error('User is not an artisan');
  let newTaskNotifications = await Notification.findAll({
    where: {
      [Op.and]: [
        { receiverId: artisanId },
        { isRejected: { [Op.not]: true } },
        { '$task.jobStatus$': { [Op.in]: ['initiated', 'negotiating'] } },
      ],
    },
    order: [['dateTime', 'DESC']],
    include: {
      model: Task,
      required: true,
      include: {
        model: User,
      },
    },
  });

  let newTasks = newTaskNotifications.map(function (notification) {
    return notification.task;
  });

  return [...new Map(newTasks.map((item) => [item.id, item])).values()];
};

exports.scheduledTasks = async function (artisanId) {
  let scheduledTasks = await Task.findAll({
    where: {
      [Op.and]: [
        { receiverId: artisanId },
        { '$task.jobStatus$': 'initiated' },
      ],
    },
    include: {
      model: Task,
      required: true,
    },
  });

  let newTasks = newTaskNotifications.map(function (notification) {
    return notification.task;
  });

  return [...new Map(newTasks.map((item) => [item.id, item])).values()];
};

exports.getArtisansForService = async function (
  localGovernment,
  dateTime,
  serviceName
) {
  if (!isFuture(dateTime))
    throw new AppError().GENERIC_ERROR('Task time must be in the future');
  let filter = {
    [Op.and]: [
      { userRole: 'Artisan' },
      { '$location.localGovernment$': localGovernment.trim() },
    ],
  };
  let artisans = await getArtisansWithAllRelations(filter);
  artisans = artisans.filter((artisan) => rendersService(artisan, serviceName));
  artisans = artisans.filter((artisan) => isAvailable(artisan, dateTime));
  artisans = artisans.filter((artisan) => isOnline(artisan));

  artisans = getArtisansTaskCount(artisans);
  return artisans;
};

async function getArtisansWithAllRelations(filter) {
  let artisans = await User.findAll({
    where: filter,
    attributes: {
      exclude: [
        'profileCompletion',
        'nokFirstName',
        'nokLastName',
        'nokEmail',
        'password',
        'createdAt',
        'updatedAt',
      ],
    },
    include: [
      { model: Location },
      { model: Device },
      {
        model: ArtisanService,
        include: [
          {
            model: Task,
            include: {
              model: Review,
            },
          },
          {
            model: Service,
          },
        ],
      },
    ],
  });
  return artisans;
}

function rendersService(artisanWithService, serviceId) {
  let artisanServices = artisanWithService?.artisanServices;
  for (let artisanService of artisanServices) {
    if (artisanService.service?.id === +serviceId) return true;
  }
  return false;
}

function isAvailable(artisan, serviceTime) {
  let artisanTasks = artisan?.artisanServices.reduce(
    (allTasks, artisanService) => {
      return allTasks.concat(artisanService.tasks);
    },
    []
  );

  let conflictingTask = artisanTasks.filter((task) => {
    if (sameDay(serviceTime, task.startTime)) return true;
  });
  return conflictingTask.length === 0;
}

function getArtisansTaskCount(artisans) {
  artisans = artisans.map((artisan) => {
    let artisanTasks = artisan?.artisanServices.reduce(
      (allTasks, artisanService) => {
        return allTasks.concat(artisanService.tasks);
      },
      []
    );
    let artisanData = artisan.toJSON();
    artisanData.taskLength = artisanTasks.length;
    return artisanData;
  });

  return artisans;
}

function isOnline(artisan) {
  return artisan?.isOnline;
}

exports.customerRequestService = async function (
  res,
  { artisanId, serviceName, price, description, title, dateTime },
  { id }
) {
  let customer = await verifyRegisteredUser(id);
  let artisan = await verifyArtisan(artisanId);
  if (!isFuture(dateTime))
    throw new AppError().GENERIC_ERROR('Task time must be in the future');

  let artisanService = await getArtisanService(serviceName, artisanId); // throws an error if user does not offer service

  let tasks = await Task.findAll({
    where: {
      [Op.and]: [
        { artisanServiceId: artisanService.id },
        { price: price },
        // {startTime: dateTime},
        { description: description },
        { title: title },
        { customerId: id },
      ],
    },
  });

  for (let task of tasks) {
    let diff = difference(dateTime, task.startTime, 'd');
    if (task && diff === 0)
      throw new AppError().GENERIC_ERROR('Task already started');
  }

  let message = formMessage(artisan, title, description);
  // await sendEmail(message);
  sendInAppMessage(res.io, artisan.email, message);
  await Task.create({
    artisanServiceId: artisanService.id,
    price,
    startTime: dateTime,
    jobStatus: 'initiated',
    description,
    title,
    customerId: id,
  });
};

async function verifyRegisteredUser(userId) {
  let user = await User.findOne({
    where: {
      [Op.and]: [{ id: userId }, { userRole: 'customer' }],
    },
  });

  if (!user) throw new AppError().GENERIC_ERROR('Customer not found');
  if (user.registrationStatus !== 'completed')
    throw new AppError().GENERIC_ERROR('Kindly complete your registration');
  return user;
}

async function verifyUser(userId) {
  let user = await User.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) throw new AppError().GENERIC_ERROR('Invalid credentials');
  if (user.registrationStatus !== 'completed')
    throw new AppError().GENERIC_ERROR('Kindly complete your registration');
  return user;
}

async function verifyArtisan(artisanId) {
  if (!artisanId) throw new AppError().GENERIC_ERROR('Invalid Artisan');
  let artisan = await User.findOne({
    where: {
      [Op.and]: [
        { id: artisanId },
        { userRole: 'artisan' },
        { registrationStatus: 'completed' },
      ],
    },
  });

  if (!artisan) throw new AppError().GENERIC_ERROR('Artisan not found');
  return artisan;
}

async function getArtisanService(serviceName, artisanId) {
  let artisanService = await ArtisanService.findOne({
    where: {
      [Op.and]: [
        { '$user.id$': artisanId },
        { '$service.name$': serviceName.trim() },
      ],
    },
    include: [{ model: Service }, { model: User }],
  });

  if (!artisanService)
    throw new AppError().GENERIC_ERROR(
      `Artisan does not offer service ${serviceName}`
    );
  return artisanService;
}

exports.customerCancelRequest = async function (
  res,
  { taskId, reason },
  { id }
) {
  if (!Number.isInteger(taskId))
    throw new AppError().GENERIC_ERROR(`Invalid parameters`);
  reason = reason.trim() ? reason.trim() : 'Client cancelled request';

  let task = await Task.findByPk(taskId);
  if (!task) throw new AppError().GENERIC_ERROR(`Task not found`);

  if (task.jobStatus === 'initiated' || task.jobStatus === 'negotiating') {
    await task.cancelJob();
    return;
  }

  let customer = await getCustomerFromTask(taskId);

  if (task.customerId !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for customer`);

  let artisan = await findArtisanFromTask(taskId);

  if (!artisan) {
    await task.cancelJob();
    return;
  }

  let previousJobStatus = task.jobStatus;

  try {
    let cancelledJobStatus = [
      'customerCancelled',
      'artisanRejected',
      'jobDispute',
    ];

    let irreversibleJobStatus = [
      'artisanArrived',
      'started',
      'completed',
      'customerConfirmed',
    ];

    if (cancelledJobStatus.includes(task.jobStatus)) {
      throw new AppError().GENERIC_ERROR('Task has been halted');
    }
    if (irreversibleJobStatus.includes(task.jobStatus)) {
      throw new AppError().GENERIC_ERROR('Artisan already arrived');
    }

    //no payment data
    if (
      !task?.paymentData?.data?.reference ||
      !(await verifyPayment(task?.paymentData?.data?.reference))
    ) {
      await task.cancelJob();

      let message = formMessage(
        artisan,
        reason,
        'Service Cancellation by client'
      );
      sendNotificationsToUsersWithScreenInfo(
        [artisan],
        serviceEnum.CUSTOMER_CANCEL_JOB,
        message,
        task,
        customer
      );
      return;
    }

    if (
      task.paymentDate &&
      difference(task.paymentDate, new Date(), 'h') <= 3
    ) {
      let reverseResponse = await reversePayment(task);
      if (!reverseResponse?.status)
        throw new AppError().GENERIC_ERROR(
          'Payment cannot be reversed at the moment, kindly try again'
        );
      await task.cancelJob();

      let message = formMessage(
        artisan,
        reason,
        'Service Cancellation by client'
      );
      sendNotificationsToUsersWithScreenInfo(
        [artisan],
        serviceEnum.CUSTOMER_CANCEL_JOB,
        message,
        task,
        customer
      );
    } else {
      throw new AppError().GENERIC_ERROR(
        'Payment already made over three hours ago, task cannot be cancelled'
      );
    }
  } catch (error) {
    task.jobStatus = previousJobStatus;
    await task.save();
    log.error(error);
    throw new AppError().GENERIC_ERROR(error.message);
  }
};

function formRequestMessage(user, description, price) {
  return {
    title: 'Service Request',
    body: `${description} \n price is ${price}`,
    price: price,
    toEmail: user.email,
  };
}

function formMessage(user, description, title) {
  return description;
  // return {
  //   title,
  //   body: description,
  //   toEmail: user.email
  // }
}

async function getArtisanFromTask(taskId) {
  let task = await Task.findByPk(taskId);
  if (!task) throw new AppError().GENERIC_ERROR(`Task not found`);
  let artisanService = await ArtisanService.findByPk(task.artisanServiceId);
  if (!artisanService)
    throw new AppError().GENERIC_ERROR(`Artisan service not found for task`);
  let artisan = await User.findByPk(artisanService.userId);

  if (!artisan)
    throw new AppError().GENERIC_ERROR(`Artisan not found for task`);

  return artisan;
}

async function findArtisanFromTask(taskId) {
  let task = await Task.findByPk(taskId);
  if (!task) throw new AppError().GENERIC_ERROR(`Task not found`);
  let artisanService = await ArtisanService.findByPk(task.artisanServiceId);
  if (!artisanService) return null;
  let artisan = await User.findByPk(artisanService.userId);

  if (!artisan) null;

  return artisan;
}

async function getCustomerFromTask(taskId) {
  let task = await Task.findByPk(taskId);
  if (!task) throw new AppError().GENERIC_ERROR(`Task not found`);
  let customer = await User.findByPk(task.customerId);
  if (!customer)
    throw new AppError().GENERIC_ERROR(`Customer not found for task`);

  return customer;
}

exports.artisanDeclineRequest = async function (res, taskId, id) {
  if (!taskId)
    throw new AppError().GENERIC_ERROR(`Please pass a valid task id`);
  let customer = await getCustomerFromTask(taskId);
  let artisan = await User.findByPk(id);

  let task = await Task.findByPk(taskId);
  let taskBids = await TaskBid.findAll({
    where: { taskId: taskId },
  });
  if (taskBids.length === 1 && +taskBids[0].artisanId === +id) {
    await task.declineJob('initiated');
  } else if (taskBids.length > 1) {
    if (task.artisanServiceId) {
      let artisanService = await ArtisanService.findOne({
        where: {
          id: task.artisanServiceId,
        },
        include: {
          model: User,
        },
      });

      if (+artisanService.userId === +id) {
        await task.declineJob('negotiating');
      }
    }
  }

  let message = formMessage(
    customer,
    'Artisan decline of service request',
    `${artisan.firstName} ${artisan.lastName} declined request ${task.title}`
  );
  // await sendEmail(message);

  let notifications = await Notification.findAll({
    where: {
      [Op.and]: [{ taskId }, { receiverId: id }],
    },
  });

  for (let notification of notifications) {
    if (
      notification.type === serviceEnum.BOOK_SERVICE.notificationName ||
      notification.type === serviceEnum.NEGOTIATE.notificationName
    ) {
      notification.isRejected = true;
      await notification.save();
    }
  }

  sendNotificationsToUsersWithScreenInfo(
    [custmer],
    serviceEnum.ARTISAN_DECLINE_JOB,
    message,
    task,
    artisan
  );
};

exports.artisanAcceptRequest = async function (res, taskId, id) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');
  let artisan = await User.findByPk(id);
  if (!artisan || artisan.userRole !== 'artisan')
    throw new AppError().GENERIC_ERROR('User is not an artisan');
  let customer = await getCustomerFromTask(taskId);
  // let artisan = await getArtisanFromTask(taskId);
  // if(artisan.id !== id) throw new AppError().GENERIC_ERROR(`Task not found for artisan`);

  // let transaction = await sequelize.transaction();
  try {
    let task = await Task.findOne({
      where: {
        id: taskId,
      },
      include: {
        model: ArtisanService,
        include: {
          model: Service,
        },
      },
    });

    if (!task) throw new AppError().GENERIC_ERROR('Task not found');

    let artisanService = await getArtisanService(task.serviceName, id);
    await task.acceptJob();
    task.status = 'accepted';
    let paymentData = await debit(customer, task.price);
    task.paymentData = paymentData;
    task.paymentDate = new Date();
    task.artisanServiceId = artisanService.id;

    await task.save();

    let message = formMessage(
      customer,
      `${task.title} accepted by artisan ${artisan.firstName}. Click on link ${paymentData.data.authorization_url} to make payment`,
      'Artisan accepted service request'
    );
    // await sendEmail(message);

    await Notification.create({
      type: 'accept-task',
      senderId: id,
      receiverId: customer.id,
      data: message,
      dateTime: new Date(),
      taskId: task.id,
    });
    //send messages

    // sendInAppAction(res.io,customer.email,"payment", paymentData);

    // update transaction data

    return {
      ...paymentData,
      callbackUrl: config.paymentRedirectUrl,
      taskId: task.id,
    };
  } catch (error) {
    log.error(error);
    throw new AppError().GENERIC_ERROR(error.message);
  }
};

exports.customerPayment = async function (taskId, customerId) {
  let customer = await getCustomerFromTask(taskId);
  if (customer.id !== customerId) throw new Error('Customer not found');

  let task = await Task.findByPk(taskId);
  task.paymentStatus = 'pendingInCollections';
  task.paymentDate = new Date();
  await task.save();
};

exports.verifyArtisanPayments = async function (res) {
  let pendingCollectionsTasks = await Task.findAll({
    where: {
      paymentStatus: 'pendingInCollections',
    },
  });

  for (let task of pendingCollectionsTasks) {
    let reference = task.paymentData.data.reference;
    let isSuccessful = await verifyPayment(reference);
    if (isSuccessful) {
      let artisan = await getArtisanFromTask(task.id);
      task.paymentStatus = 'verifiedInCollections';
      task.paymentDate = new Date();
      await task.save();
      let message = formMessage(
        artisan,
        `${task.title} has commenced`,
        'Task commencement'
      );
      // await sendEmail(message);
      sendInAppMessage(res.io, artisan.email, message);
    }
    //else if for another status by paystack
    else {
      let customer = await getCustomerFromTask(task.id);
      let artisan = await getArtisanFromTask(task.id);
      task.paymentStatus = 'failedInCollections';
      task.paymentDate = new Date();
      await task.save();
      let message = formMessage(
        customer,
        `payment for ${task.title} failed`,
        'Payment failed'
      );
      // await sendEmail(message);
      sendInAppMessage(res.io, customer.email, message);
    }
  }
  return true;
};

function isValidRatio(number) {
  if (Number.isNaN(parseFloat(number))) return false;
  if (number >= 1) return false;
  if (number <= 0) return false;
  return true;
}

async function getPaymentRatio() {
  let settlementPercentage = config.settlementPercentage;

  let settlements = await Settlement.findAll();
  if (settlements.length > 0)
    settlementPercentage = settlements[0].settlementPercentage;

  return 1 - settlementPercentage / 100;
}

/*
 @param task - task containing artisanService and artisan
*/
async function doTransfer(task, artisanAccount) {
  let message;
  let transferResponse;
  let transferReceiptData;
  if (artisanAccount) {
    // try{
    if (!task.transferData?.receipt?.recipient_code) {
      transferReceiptData = await createTransferReceipt(artisanAccount);
      task.transferData = {
        receipt: transferReceiptData,
      };
    }

    let paymentRatio = await getPaymentRatio();
    let artisanPay = task.price * paymentRatio;
    let referenceCode = task.transferData.receipt.recipient_code;

    transferResponse = await transfer(
      referenceCode,
      artisanPay,
      task.description
    );
    task.paymentStatus = 'pendingInArtisan';
    task.transferData['transfer'] = transferResponse?.data;
    task.artisanAmount = artisanPay;
    task.afriserveAmount = task.price - artisanPay;
    task.paymentDate = new Date();

    let artisan = task.artisanService.user;
    message = formMessage(
      artisan,
      `Payment for ${task.title} has been Initiated`,
      'Payment initiated'
    );

    await task.save();
    //await sendEmail(message);
    return {
      transferReceiptData,
      transferStatus: transferResponse?.data,
    };
  } else {
    message = formMessage(
      artisan,
      `Payment for ${task.title} has been stopped because your account information is not complete`,
      'Complete account information'
    );

    task.paymentStatus = 'failedInArtisan';
    task.transferData = {
      transfer: {
        status: 'No account details for artisan',
      },
    };
    await task.save();
    // await sendEmail(message);
    //sendInAppMessage(res.io,artisan.email, message);

    return 'User needs to populate account';
  }
}

exports.customerConfirmJobDone = async function (res, taskId, userId) {
  let customer = await getCustomerFromTask(taskId);
  if (customer.id !== userId) {
    throw new AppError().GENERIC_ERROR(
      'User unable to confirm job for this task'
    );
  }

  let task = await Task.findByPk(taskId);
  if (task.jobStatus !== 'completed' && task.jobStatus !== 'artisanArrived') {
    throw new AppError().GENERIC_ERROR('Task cannot be marked as done');
  }

  let artisan = await getArtisanFromTask(task.id);
  let artisanAccount = await AccountDetails.findOne({
    where: { userId: artisan.id },
  });

  task.jobStatus = 'customerConfirmed';
  task.customerConfirmedDate = new Date();
  await task.save();

  let message = formMessage(
    artisan,
    `${customer.firstName} has confirmed job done`,
    serviceEnum.CUSTOMER_CONFIRM_JOB.notificationTitle
  );
  sendNotificationsToUsersWithScreenInfo(
    [artisan],
    serviceEnum.CUSTOMER_CONFIRM_JOB,
    message,
    task,
    artisan
  );

  let rateCustomerMessage = formMessage(
    artisan,
    `Please review customer ${customer.firstName}`,
    serviceEnum.CUSTOMER_CONFIRM_JOB.notificationTitle
  );

  sendNotificationsToUsersWithScreenInfo(
    [artisan],
    serviceEnum.REVIEW_CUSTOMER,
    rateCustomerMessage,
    task,
    artisan
  );
};

exports.verifyTransfer = async function (res) {
  let pendingArtisanTasks = await Task.findAll({
    where: {
      paymentStatus: 'pendingInArtisan',
    },
  });

  for (let task of pendingArtisanTasks) {
    let reference = task?.transferData?.transfer?.transfer_code;
    let data = await verifyTransfer(reference);
    if (data?.status === 'success') {
      let artisan = await getArtisanFromTask(task.id);
      task.paymentStatus = 'verifiedInArtisan';
      task.paymentDate = new Date();
      await task.save();

      let message = formMessage(
        artisan,
        `You have received payment`,
        'Payment completed'
      );
      // await sendEmail(message);
      sendInAppMessage(socketServer, artisan.email, message);
    } else if (data?.status === 'pending');
    else {
      task.paymentStatus = 'failedInArtisan';
      task.transferData.failure = data;
      task.paymentDate = new Date();
      await task.save();
    }
  }
};

exports.artisanViewLocalTasks = async function (id) {};

async function getArtisanServiceFromTask(taskId, artisanId) {
  let task = await Task.findOne({
    where: {
      id: taskId,
    },
    include: {
      model: Service,
    },
  });

  let artisanServices = await ArtisanService.findAll({
    where: {
      userId: artisanId,
    },
  });

  for (let artisanService of artisanServices) {
    if (artisanService.serviceId === task.service?.id) {
      return artisanService;
    }
  }
  throw new AppError().GENERIC_ERROR('Artisan does not offer service');
}

exports.artisanNegotiateRequest = async function (
  res,
  { taskId, newPrice, message, artisanServiceId },
  { id }
) {
  let customer = await getCustomerFromTask(taskId);
  let artisan = await User.findByPk(id);

  let artisanService = await getArtisanServiceFromTask(taskId, id);
  artisanServiceId = artisanService.id;

  let previousTaskBids = await TaskBid.findAll({
    where: {
      [Op.and]: [{ artisanServiceId }, { taskId }],
    },
  });

  if (previousTaskBids.length > 0)
    throw new AppError().GENERIC_ERROR('Artisan already bided for task');

  let task = await Task.findByPk(taskId);
  if (artisanService.serviceId !== task.serviceId)
    throw new AppError().GENERIC_ERROR(
      'Artisan service does not match task service'
    );
  let newMessage = formMessage(
    customer,
    `${artisan.firstName} asks for ${newPrice}`,
    serviceEnum.NEGOTIATE.notificationTitle
  );

  let taskBid = await TaskBid.create({
    dateTime: new Date(),
    negotiatedPrice: newPrice,
    artisanId: id,
    bidMessage: message,
    taskId: taskId,
    artisanServiceId: artisanServiceId,
  });

  await task.negotiateJob(newPrice);

  await sendNotificationsToUsersWithScreenInfo(
    [customer],
    serviceEnum.NEGOTIATE,
    newMessage,
    task,
    artisan
  );
  await serviceNegotiationForCustomerEmail(task, taskBid, artisan, customer);
};

//add artisan service at this point
exports.customerAcceptNewPrice = async function (
  res,
  { taskId, artisanServiceId },
  id
) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');

  let customer = await getCustomerFromTask(taskId);
  if (customer.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for customer`);

  let artisanService = await ArtisanService.findOne({
    where: {
      id: artisanServiceId,
    },
    include: {
      model: User,
      required: true,
    },
  });

  if (!artisanService)
    throw new AppError().GENERIC_ERROR(`Artisan service not found`);

  let artisan = artisanService.user;

  let taskBid = await TaskBid.findOne({
    where: {
      [Op.and]: [{ artisanServiceId: artisanServiceId }, { taskId: taskId }],
    },
  });

  if (!taskBid) throw new AppError().GENERIC_ERROR(`No bid found for artisan`);

  let task = await Task.findByPk(taskId);
  try {
    task.artisanServiceId = artisanServiceId;
    task.price = taskBid.negotiatedPrice;
    let paymentData = await debit(customer, task.price);
    task.paymentData = paymentData;
    task.paymentDate = new Date();

    let service = await Service.findByPk(task.serviceId);
    task.serviceName = task.serviceName ? task.serviceName : service.name;

    await priceBidAcceptedEmail(task, artisan, customer);

    await task.acceptNewPrice();
    await task.save();

    let message = formMessage(
      artisan,
      `${customer.firstName} accepts new price ${task.price}`,
      serviceEnum.CUSTOMER_ACCEPT.notificationTitle
    );
    await sendNotificationsToUsersWithScreenInfo(
      [artisan],
      serviceEnum.CUSTOMER_ACCEPT,
      message,
      task,
      artisan
    );

    let message2 = formMessage(
      customer,
      `Click on link ${paymentData.data.authorization_url} to make payment`,
      serviceEnum.CUSTOMER_MAKE_PAYMENT.notificationTitle
    );

    await sendNotificationsToUsersWithScreenInfo(
      [customer],
      serviceEnum.CUSTOMER_MAKE_PAYMENT,
      message2,
      task,
      artisan
    );

    return {
      ...paymentData,
      callbackUrl: config.paymentRedirectUrl,
      taskId: task.id,
    };
  } catch (error) {
    task.jobStatus = 'negotiating';
    await task.save();
    log.error(error);
    throw new AppError().GENERIC_ERROR(error.message);
  }
};

exports.artisanConfirmArrival = async function (res, taskId, id) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');
  ``;

  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (artisan.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for artisan`);

  let task = await Task.findByPk(taskId);

  await task.artisanArrived();

  await vendorArrivedForCustomer(task, artisan, customer);
  let message = formMessage(
    customer,
    `Artisan ${artisan.firstName} ${artisan.lastName} confirms arrival at location`,
    serviceEnum.ARTISAN_ARRIVE.notificationTitle
  );

  sendNotificationsToUsersWithScreenInfo(
    [customer],
    serviceEnum.ARTISAN_ARRIVE,
    message,
    task,
    artisan
  );
};

exports.artisanStartTask = async function (res, taskId, id) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');
  ``;

  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (artisan.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for artisan`);

  let task = await Task.findByPk(taskId);
  await task.artisanStarted();

  let message = formMessage(
    customer,
    `Artisan ${artisan.firstName} ${artisan.lastName} confirms commencement of work`,
    serviceEnum.ARTISAN_ARRIVE.notificationTitle
  );
  // sendEmail(message);

  sendNotificationsToUsers(
    [customer],
    serviceEnum.ARTISAN_STARTED_TASK,
    message,
    task,
    artisan
  );
  //sendInAppMessage(res.io,customer.email, message);
};

exports.artisanConfirmTaskCompletion = async function (res, taskId, id) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');

  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (artisan.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for artisan`);

  try {
    let task = await Task.findByPk(taskId);
    await task.completed();

    let message = formMessage(
      customer,
      `Artisan ${artisan.firstName} ${artisan.lastName} confirms completion`,
      serviceEnum.ARTISAN_CONFIRM_JOB.notificationTitle
    );

    await artisanCompleteTaskEmail(task, artisan, customer);
    sendNotificationsToUsersWithScreenInfo(
      [customer],
      serviceEnum.ARTISAN_CONFIRM_JOB,
      message,
      task,
      artisan
    );
  } catch (error) {
    log.error(error);
    throw error;
  }
};

exports.customerReviewArtisan = async function (
  { taskId, rating, comment },
  { id }
) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');

  let task = await Task.findByPk(taskId);
  if (
    !task?.jobStatus === 'completed' ||
    !task?.jobStatus === 'customerConfirmed'
  )
    throw new AppError().GENERIC_ERROR('Task is not confirmed by customer');

  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (customer.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for customer`);

  let review = await Review.findOne({ where: { taskId } });
  if (!review) {
    review = await Review.create({
      customerRating: rating,
      customerComment: comment,
      taskId,
      customerId: customer.id,
      artisanId: artisan.id,
    });

    let message = formMessage(
      artisan,
      `${customer.firstName} sent a review`,
      serviceEnum.CUSTOMER_RATING.notificationTitle
    );
    sendNotificationsToUsersWithScreenInfo(
      [artisan],
      serviceEnum.CUSTOMER_RATING,
      message,
      task,
      artisan
    );
  } else {
    if (review.customerRating)
      throw new AppError().GENERIC_ERROR('Customer already reviewed artisan');
    review.customerRating = rating;
    review.customerComment = comment;
    await review.save();
  }
  task.jobStatus = 'customerConfirmed';
  await task.save();
};

exports.artisanReviewCustomer = async function (
  { taskId, rating, comment },
  { id }
) {
  let task = await Task.findByPk(taskId);
  if (task?.jobStatus !== 'customerConfirmed')
    throw new AppError().GENERIC_ERROR('Task is not marked as done yet');

  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (artisan.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for artisan`);

  let review = await Review.findOne({ where: { taskId } });
  if (!review) {
    review = await Review.create({
      artisanRating: rating,
      artisanComment: comment,
      taskId,
      customerId: customer.id,
      artisanId: artisan.id,
    });

    let message = formMessage(
      customer,
      `${artisan.firstName} sent a review`,
      serviceEnum.ARTISAN_RATING.notificationTitle
    );
    sendNotificationsToUsersWithScreenInfo(
      [customer],
      serviceEnum.ARTISAN_RATING,
      message,
      task,
      artisan
    );
  } else {
    if (review.artisanRating)
      throw new AppError().GENERIC_ERROR('Artisan already reviewed customer');
    review.artisanRating = rating;
    review.artisanComment = comment;
    await review.save();
  }
};

exports.artisanViewCompletedTaskRequest = async function (artisanId) {
  await verifyArtisan(artisanId);

  let pendingTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { jobStatus: 'completed' },
            { jobStatus: 'customerConfirmed' },
          ],
        },
        { '$artisanService.user.id$': artisanId },
      ],
    },
    include: [
      {
        model: User,
      },
      {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
      {
        model: TaskBid,
      },
    ],
  });
  let response = [];

  for (let task of pendingTasks) {
    response.push(task);
  }

  return response;
};

exports.artisanTaskForToday = async function (artisanId) {
  await verifyArtisan(artisanId);

  let acceptedTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ jobStatus: 'accepted' }, { jobStatus: 'artisanArrived' }],
        },
        { '$artisanService.user.id$': artisanId },
      ],
    },
    include: [
      {
        model: User,
      },
      {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
      {
        model: TaskBid,
      },
    ],
  });

  let todaysTasks = acceptedTasks
    .map(function (task) {
      if (isToday(task.startTime)) return task;
    })
    .filter((task) => task);

  let taskInfo = {
    tasks: todaysTasks,
    tasksCount: todaysTasks.length,
  };

  return taskInfo;
};

exports.artisanOngoingTaskCount = async function (artisanId) {
  await verifyArtisan(artisanId);

  let scheduledTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { jobStatus: 'accepted' },
            { jobStatus: 'artisanArrived' },
            { jobStatus: 'started' },
          ],
        },
        { '$artisanService.user.id$': artisanId },
      ],
    },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
      },
      {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
      {
        model: TaskBid,
      },
    ],
  });

  let taskInfo = {
    tasks: scheduledTasks,
    tasksCount: scheduledTasks.length,
  };

  return taskInfo;
};

exports.artisanViewScheduledTask = async function (artisanId) {
  await verifyArtisan(artisanId);

  let scheduledTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ jobStatus: 'accepted' }, { jobStatus: 'artisanArrived' }],
        },
        { '$artisanService.user.id$': artisanId },
      ],
    },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
      },
      {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
      {
        model: TaskBid,
      },
    ],
  });

  let taskInfo = {
    tasks: scheduledTasks,
    tasksCount: scheduledTasks.length,
  };

  return taskInfo;
};

exports.userViewBids = async function (userId, taskId) {
  await verifyUser(userId);
  if (!taskId) throw new AppError().GENERIC_ERROR('Please pass task id');
  let task = await Task.findByPk(taskId);
  if (!task) throw new AppError().GENERIC_ERROR('Task not found');

  let pendingTaskFromTaskBid = await TaskBid.findAll({
    where: {
      '$task.id$': taskId,
    },
    include: {
      model: Task,
      required: true,
      include: {
        model: ArtisanService,
      },
    },
  });
  let taskBids = [];

  for (let pendingTask of pendingTaskFromTaskBid) {
    let user = await User.findByPk(pendingTask.artisanId);
    pendingTask = pendingTask.toJSON();
    pendingTask['artisan'] = user;
    let reviews = await Review.findAll({
      where: {
        artisanId: pendingTask.artisanId,
      },
    });

    let totalRating = 0;
    let averageRating = 0;
    if (reviews.length > 0) {
      for (let review of reviews) {
        totalRating += review.customerRating;
      }
      averageRating = totalRating / reviews.length;
    }
    pendingTask['review'] = {
      reviews,
      averageRating,
    };

    taskBids.push(pendingTask);
  }

  return taskBids;
  //  {
  //   ,
  //   averageRating
  // }
};

exports.artisanViewPendingServiceRequest = async function (artisanId) {
  await verifyArtisan(artisanId);

  let pendingTaskFromTaskBid = await TaskBid.findOne({
    where: {
      [Op.and]: [
        { '$task.jobStatus$': 'negotiating' },
        { artisanId: artisanId },
      ],
    },
    include: [
      {
        model: Task,
      },
    ],
  });

  let pendingTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [{ jobStatus: 'initiated' }, { jobStatus: 'negotiating' }],
        },
        { '$artisanService.user.id$': artisanId },
      ],
    },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
      },
      {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
      {
        model: TaskBid,
      },
    ],
  });

  let response = {
    pendingTasks,
    pendingTaskFromTaskBid,
  };

  return response;
};

exports.getArtisanInfoForCustomer = async function (
  customerId,
  artisanId,
  taskBidId
) {
  await verifyArtisan(artisanId);
  if (!taskBidId)
    throw new AppError().GENERIC_ERROR(
      'Artisan Id and Bid Id must be specified'
    );

  let taskBid = await TaskBid.findOne({
    where: {
      id: taskBidId,
    },
    include: {
      model: Task,
      include: {
        model: User,
      },
    },
  });

  if (taskBid?.task?.user?.id !== customerId)
    throw new AppError().GENERIC_ERROR('Customer not associated with task bid');
  if (taskBid?.artisanId !== +artisanId)
    throw new AppError().GENERIC_ERROR('Artisan not associated with task bid');

  let userInfo = await userInformationService(artisanId);
  userInfo['artisanBiddingPrice'] = taskBid.negotiatedPrice;
  userInfo['customerPrice'] = taskBid.task?.price;
  userInfo['artisanServiceId'] = taskBid.artisanServiceId;
  userInfo['task'] = taskBid.task;
  userInfo['comment'] = taskBid.bidMessage;
  return userInfo;
};

exports.reportAbuse = async function (id, data) {
  let { reporteeId, taskId, description } = data;

  let task = await Task.findByPk(taskId);
  let reporter = await User.findByPk(id);
  let reportee = await User.findByPk(reporteeId);

  if (!task) throw new AppError().GENERIC_ERROR('Task not found');
  if (!reporter) throw new AppError().GENERIC_ERROR('Invalid credentials');
  if (!reportee) throw new AppError().GENERIC_ERROR('Client not found');
  if (task.customerId !== id && task.customerId !== reporteeId)
    throw new AppError().GENERIC_ERROR('Task not associated with Users');

  await IssueReport.create({
    reporterId: id,
    reporteeId,
    taskId,
    description,
    dateTime: new Date(),
    isResolved: false,
  });

  let message = formMessage(
    reportee,
    `${reporter.firstName} ${reporter.lastName} has filed a report against you`,
    'ISSUE REPORT'
  );
  // sendEmail(message);

  let admins = await User.findAll({
    where: {
      userRole: 'admin',
    },
  });

  sendNotificationsToUsersWithScreenInfo(
    [admins],
    serviceEnum.JOB_DISPUTE,
    description,
    task,
    reporter
  );
  jobDisputeEmail(task, reporter, reportee, description);

  return;
};

module.exports.doTransfer = doTransfer;
module.exports.sendNotificationsToUsersWithScreenInfo = sendNotificationsToUsersWithScreenInfo;
