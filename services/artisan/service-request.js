const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
  Task,
  Review,
  sequelize,
} = require('../../db/models/index');
const { Op } = require('sequelize');
const {
  AppError,
  AppSuccess,
  isFuture,
  isAhead,
  difference,
  sameDay,
} = require('../../utils');
const {
  sendEmail,
  sendInAppMessage,
  sendInAppAction,
  sendInAppRequestService,
  mailer,
} = require('../utils/message');
const {
  reversePayment,
  debit,
  verifyPayment,
} = require('../payment-connector');
const log = require('../utils/logger');
require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

//create a task table
// to do
//2. System shall send automated reminders at intervals to Artisan to continue kyc process

exports.getServices = async function () {
  let services = await Service.findAll();
  let dataList = [];
  for (let service of services) {
    let artisanServices = await ArtisanService.findAll({
      where: { serviceId: service.id },
    });
    let { maximum, average, minimum } = await getArtisanServiceStatistics(
      artisanServices
    );
    dataList.push({
      serviceName: service.name,
      averagePrice: average,
      minimumPrice: minimum,
      maximumPrice: maximum,
      serviceImageUrl: service.pictureUrl,
    });
  }
  return dataList;
};

async function getArtisanServiceStatistics(artisanServiceList) {
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

function rendersService(artisanWithService, serviceName) {
  let artisanServices = artisanWithService?.artisanServices;
  for (let artisanService of artisanServices) {
    if (
      artisanService.service?.name?.toLowerCase() ===
      serviceName.toLowerCase().trim()
    )
      return true;
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
  return true;
}

async function verifyArtisan(artisanId) {
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

function formRequestMessage(user, description, price) {
  return {
    title: 'Service Request',
    body: `${description} \n price is ${price}`,
    price: price,
    toEmail: user.email,
  };
}

function formMessage(user, description, title) {
  return {
    title,
    body: description,
    toEmail: user.email,
  };
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

async function getCustomerFromTask(taskId) {
  let task = await Task.findByPk(taskId);
  if (!task) throw new AppError().GENERIC_ERROR(`Task not found`);
  let customer = await User.findByPk(task.customerId);
  if (!customer)
    throw new AppError().GENERIC_ERROR(`Customer not found for task`);

  return customer;
}

exports.artisanDeclineRequest = async function (res, taskId, id) {
  if (!taskId) throw new AppError().GENERIC_ERROR(`Task not found`);

  let customer = await getCustomerFromTask(taskId);

  let message = formMessage(
    customer,
    'Artisan decline of service request',
    `${artisan.firstName} ${artisan.lastName} declined request ${task.title}`
  );
  await sendEmail(message);
  sendInAppMessage(res.io, customer.email, message);
};

exports.artisanAcceptRequest = async function (res, taskId, id) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');

  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (artisan.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for artisan`);

  let transaction = await sequelize.transaction();
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

    await task.acceptJob(transaction);
    let paymentData = await debit(customer, task.price);
    task.paymentData = paymentData;
    task.paymentDate = new Date();
    await task.save();
    //send messages
    let message = formMessage(
      customer,
      `${task.title} accepted by artisan ${artisan.firstName}. Click on link ${paymentData.data.authorization_url} to make payment`,
      'Artisan accepted service request'
    );
    await sendEmail(message);
    sendInAppAction(res.io, customer.email, 'payment', paymentData);

    // update transaction data

    return {
      ...paymentData,
      callbackUrl: config.paymentRedirectUrl,
      taskId: task.id,
    };
  } catch (error) {
    await transaction.rollback();
    log.error(error);
    throw new AppError().GENERIC_ERROR('Internal processing error');
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

exports.verifyPayment = async function (res) {
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
      await sendEmail(message);
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
      await sendEmail(message);
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

exports.customerConfirmJobDone = async function (res, taskId, userId) {
  let message;
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
  if (artisanAccount) {
    let transferReceiptData = await createTransferReceipt(artisanAccount);
    task.transferData = {
      receipt: transferReceiptData,
    };

    let paymentRatio = isValidRatio(config.paymentRatio)
      ? parseFloat(config.paymentRatio)
      : 0.6;
    let artisanPay = task.price * paymentRatio;
    let referenceCode = task.transferData.receipt.recipient_code;
    let transferResponse = await transfer(
      referenceCode,
      artisanPay,
      task.description
    );
    if (transferResponse.status) {
      task.paymentStatus = 'pendingInArtisan';
      task.transferData.transfer = transferResponse.data;

      message = formMessage(
        artisan,
        `Payment for ${task.title} has been Initiated`,
        'Payment initiated'
      );
    } else {
      task.paymentStatus = 'failedInArtisan';
      task.transferData.transfer = transferResponse.data;

      message = formMessage(
        artisan,
        `Payment for ${task.title} is processing`,
        'Payment processing'
      );
    }
  } else {
    let message = formMessage(
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
    await sendEmail(message);
    sendInAppMessage(res.io, artisan.email, message);

    throw new AppError().GENERIC_ERROR('User needs to populate account');
  }
  await task.save();
  await sendEmail(message);
  sendInAppMessage(res.io, artisan.email, message);
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
      await sendEmail(message);
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

exports.artisanNegotiateRequest = async function (
  res,
  { taskId, newPrice },
  { id }
) {
  //find task with task id,
  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (artisan.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for artisan`);

  let task = await Task.findByPk(taskId);
  await task.negotiateJob(newPrice);

  let message = formMessage(
    customer,
    `${artisan.firstName} asks for ${newPrice}`,
    'Artisan negotiates new price'
  );
  await sendEmail(message);
  sendInAppMessage(res.io, customer.email, message);
};

exports.customerAcceptNewPrice = async function (res, taskId, id) {
  if (!id || !taskId) throw new AppError().GENERIC_ERROR('Invalid parameters');

  let customer = await getCustomerFromTask(taskId);
  let artisan = await getArtisanFromTask(taskId);
  if (customer.id !== id)
    throw new AppError().GENERIC_ERROR(`Task not found for customer`);

  try {
    let task = await Task.findByPk(taskId);
    await task.acceptNewPrice();
    let paymentData = await debit(customer, task.price);
    task.paymentData = paymentData;
    task.paymentDate = new Date();
    await task.save();

    let message = formMessage(
      artisan,
      `${customer.firstName} accepts new price ${task.price}`,
      'Customer accepts new price'
    );
    await sendEmail(message);
    sendInAppMessage(res.io, artisan.email, message);

    let message2 = formMessage(
      customer,
      `Click on link ${paymentData.data.authorization_url} to make payment`,
      'Artisan accepted service request'
    );
    await sendEmail(message2);
    sendInAppAction(res.io, customer.email, 'payment', paymentData);

    return {
      ...paymentData,
      callbackUrl: config.paymentRedirectUrl,
      taskId: task.id,
    };
  } catch (error) {
    // await transaction.rollback();
    log.error(error);
    throw new AppError().GENERIC_ERROR('Internal processing error');
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

  let message = formMessage(
    customer,
    `Artisan ${artisan.firstName} ${artisan.lastName} confirms arrival at location`,
    'Artisan arrival at location'
  );
  await sendEmail(message);
  sendInAppMessage(res.io, customer.email, message);
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
      'Artisan completes task'
    );
    await sendEmail(message);
    sendInAppAction(res.io, customer.email, 'rate', message);
  } catch (error) {
    log.error(error);
    throw new AppError().GENERIC_ERROR('Internal processing error');
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
    });
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
    });
  } else {
    if (review.artisanRating)
      throw new AppError().GENERIC_ERROR('Artisan already reviewed customer');
    review.artisanRating = rating;
    review.artisanComment = comment;
    await review.save();
  }
};

exports.artisanViewPendingServiceRequest = async function (artisanId) {
  await verifyArtisan(artisanId);

  let pendingTasks = await Task.findAll({
    where: {
      [Op.and]: [
        { jobStatus: 'initiated' },
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
    ],
  });
  let response = [];

  for (let task of pendingTasks) {
    // pendingTasks = pendingTasks.map(task =>{
    let {
      price,
      startTime,
      completionTime,
      paymentDate,
      paymentStatus,
      jobStatus,
      description,
      title,
      user,
    } = task;

    let userCompletedTask = await Task.findAll({
      where: [{ customerId: user.id }, { jobStatus: 'Completed' }],
    });

    response.push({
      price,
      startTime,
      completionTime,
      paymentDate,
      paymentStatus,
      jobStatus,
      description,
      title,
      user,
      userCompletedTask,
    });
  }

  return response;
};
