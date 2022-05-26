const {
  User,
  Location,
  Task,
  Review,
  ArtisanService,
  Service,
  sequelize,
} = require('../../db/models');
const { Op } = require('sequelize');
const { saveAudit } = require('../../controllers/admin/audit-trail');
const { AppError, difference, sendEmail } = require('../../utils');
const excelJS = require('exceljs');
const { uploadFile } = require('../../utils');
require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const config = require('../../config/config')[env];
const path = require('path');
const fs = require('fs');

const findOneUser = async (id, userRole) => {
  const user = await User.findOne({ where: { userRole, id } });
  return user;
};

exports.artisanServiceHistory = async function (userId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');
  let user = await User.findOne({
    where: {
      id: userId,
    },
    include: [
      {
        model: ArtisanService,
        include: {
          model: Service,
        },
      },
      {
        model: Location,
      },
    ],
  });

  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  let tasks = [];
  if (user.userRole === 'admin' || user.userRole === 'artisan') {
    tasks = await Task.findAll({
      where: {
        [Op.and]: [
          { '$artisanService.user.id$': userId },
          {
            [Op.not]: {
              paymentDate: null,
            },
          },
        ],
      },
      include: [
        {
          model: ArtisanService,
          required: true,
          include: [
            {
              model: User,
              include: {
                model: Location,
              },
            },
            {
              model: Service,
            },
          ],
        },
        {
          model: Review,
          include: [
            { model: User, as: 'customer' },
            { model: User, as: 'artisan' },
          ],
        },
        {
          model: User,
        },
      ],
    });
  } else {
    throw new AppError().GENERIC_ERROR(
      'An error ocurred while processing customer history'
    );
  }

  let reviews = [];
  let artisanServiceHistory = tasks.map(function (task) {
    reviews.push(task.review);
    let data = {
      taskId: reviews.length + 1421,
      service: task.serviceName,
      customer: `${task.user.firstName} ${task.user.lastName}`,
      charge: task.price,
      status: getStatus(task.jobStatus),
      date: task.completionTime,
      artisanService: task.artisanService,
      id: task.id,
      artisanStartDate: task.artisanStartDate,
      artisanCompleteDate: task.artisanCompleteDate,
    };
    return data;
  });

  let scheduledJobsStatus = ['accepted', 'artisanArrived'];
  let scheduledJobs = tasks.map(function (task) {
    let taskStatus = task.jobStatus.trim();
    if (scheduledJobsStatus.includes(taskStatus)) {
      return task;
    }
  });

  let earnings = getEarnings(tasks);

  return {
    history: artisanServiceHistory,
    reviews: reviews.filter((review) => review),
    customer: user,
    ...earnings,
    completedTaskCount: getTaskCounts(tasks),
    scheduledJobs: scheduledJobs.filter((task) => task),
  };
};

function getEarnings(tasks) {
  let totalEarnings = 0;

  for (let task of tasks) {
    if (task.jobStatus === 'customerConfirmed') {
      totalEarnings = totalEarnings + task.price;
    }
  }

  let paymentRatio = 1 - parseFloat(config.paymentRatio);
  let commission = Number(totalEarnings * paymentRatio).toFixed(2);

  return {
    totalEarnings,
    commission,
  };
}

function getTaskCounts(tasks) {
  let completedTaskCount = 0;

  let stopped = ['customerCancelled', 'artisanRejected', 'jobDispute'];
  let active = ['accepted', 'artisanArrived', 'started'];
  let completed = ['completed', 'customerConfirmed'];
  for (let task of tasks) {
    if (completed.includes(task.jobStatus.trim())) completedTaskCount++;
  }

  return completedTaskCount;
}

exports.customerServiceHistory = async function (userId) {
  if (!userId) throw new AppError().GENERIC_ERROR('Invalid credentials');

  let user = await User.findOne({
    where: {
      id: userId,
    },
    include: [
      {
        model: ArtisanService,
        include: {
          model: Service,
        },
      },
      {
        model: Location,
      },
    ],
  });

  if (!user) throw new AppError().GENERIC_ERROR(' Invalid credentials');

  let tasks = [];
  if (user.userRole === 'customer' || user.userRole === 'admin') {
    tasks = await Task.findAll({
      where: {
        [Op.and]: [
          { customerId: userId },
          {
            [Op.not]: {
              paymentDate: null,
            },
          },
        ],
      },
      include: [
        {
          model: ArtisanService,
          required: true,
          include: {
            model: User,
          },
        },
        {
          model: Review,
          include: [
            { model: User, as: 'customer' },
            { model: User, as: 'artisan' },
          ],
        },
      ],
    });
  } else {
    throw new AppError().GENERIC_ERROR(
      'An error ocurred while processing customer history'
    );
  }

  let reviews = [];
  let customerServiceHistory = tasks.map(function (task) {
    reviews.push(task.review);
    let data = {
      taskId: reviews.length + 1061,
      service: task.serviceName,
      artisan: `${task.artisanService.user.firstName} ${task.artisanService.user.lastName}`,
      charge: task.price,
      status: getStatus(task.jobStatus),
      date: task.completionTime,
      id: task.id,
      artisanStartDate: task.artisanStartDate,
      artisanCompleteDate: task.artisanCompleteDate,
    };
    return data;
  });

  reviews = reviews.filter((review) => review);

  return {
    history: customerServiceHistory,
    reviews: reviews,
    customer: user,
    averageRating: getAverageRating(reviews),
  };
};

function getAverageRating(ratings) {
  if (ratings.length > 0) {
    let total = 0;
    for (let i = 0; i < ratings.length; i++) {
      total += ratings[i].artisanRating;
    }
    return total / ratings.length;
  } else {
    return 0;
  }
}

function getStatus(jobStatus) {
  let stopped = ['customerCancelled', 'artisanRejected', 'jobDispute'];
  let active = ['accepted', 'artisanArrived', 'started'];
  let completed = ['completed', 'customerConfirmed'];

  if (stopped.includes(jobStatus)) return 'Stopped';
  else if (active.includes(jobStatus)) return 'Active';
  else if (completed.includes(jobStatus)) return 'Completed';
  else return 'Processing';
}

exports.getAllUsersService = async ({ page, limit, location, ...data }) => {
  // const { id } = await Location.findOne({ where: { name: location } });

  const offset = (page - 1) * +limit;
  if (location) {
    const allUsers = await User.findAndCountAll({
      where: {
        ...data,
      },
      include: {
        model: Location,
        where: { state: location || '' },
      },
      offset: (+page - 1) * +limit,
      limit: +limit,
      order: [['createdAt', 'ASC']],
    });
    return {
      users: allUsers.rows,
      total: allUsers.count,
    };
  } else {
    const allUsers = await User.findAndCountAll({
      where: {
        ...data,
      },
      include: {
        model: Location,
      },
      offset: (+page - 1) * +limit,
      limit: +limit,
      order: [['createdAt', 'DESC']],
    });
    return {
      users: allUsers.rows,
      total: allUsers.count,
    };
  }
};

exports.searchAllUsersService = async (role, search) => {
  let searchKeywords =
    search && search.trim() ? search.split(/\s+/) : ['*', ''];
  let firstToken = searchKeywords[0].trim().toLowerCase();
  let secondToken = searchKeywords[1];

  if (searchKeywords[1] && searchKeywords[1].trim()) {
    secondToken - secondToken.trim().toLowerCase();
    const allUsers = await User.findAll({
      where: {
        userRole: role,
        [Op.or]: [
          {
            firstName: sequelize.where(
              sequelize.fn('LOWER', sequelize.col('firstName')),
              'LIKE',
              `%${firstToken}%`
            ),
          },
          {
            lastName: sequelize.where(
              sequelize.fn('LOWER', sequelize.col('lastName')),
              'LIKE',
              `%${secondToken}%`
            ),
          },
        ],
      },
      include: {
        model: Location,
      },
    });

    return allUsers;
  }

  const allUsers = await User.findAll({
    where: {
      userRole: role,
      [Op.or]: [
        {
          email: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('email')),
            'LIKE',
            `%${firstToken}%`
          ),
        },
        {
          firstName: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('firstName')),
            'LIKE',
            `%${firstToken}%`
          ),
        },
        {
          lastName: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('lastName')),
            'LIKE',
            `%${firstToken}%`
          ),
        },
        {
          phoneNumber: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('phoneNumber')),
            'LIKE',
            `%${firstToken}%`
          ),
        },
        // { artisanId: search },
      ],
    },
    include: {
      model: Location,
    },
  });

  return allUsers;
};

exports.sortUsersService = async (sort, query) => {
  const offset = (query.page - 1) * +query.limit;

  const allUsers = await User.findAndCountAll({
    where: {
      userRole: query.userRole,
    },
    order: [[sort, 'DESC']],
    offset: offset,
    limit: +query.limit,
  });
  return {
    users: allUsers.rows,
    count: allUsers.count,
  };
};

exports.getUserProfileService = async (id, userRole) => {
  const user = await findOneUser(id, userRole);
  return user;
};

exports.approveArtisanService = async (id, userRole, admin) => {
  if (typeof id === 'object') {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      user.approvalStatus = 'approved';

      await user.save();

      const templateData = {
        fullName: `${user.firstName} ${user.lastName}`,
        websiteUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
      };
      await sendEmail(
        user.email,
        'd-9bc4ab0b27d6439ab4d81452b5a5cc7f',
        templateData
      );
    });

    return 'group';
  } else {
    const user = await findOneUser(id, userRole);
    user.approvalStatus = 'approved';
    const templateData = {
      fullName: `${user.firstName} ${user.lastName}`,
      websiteUrl: null,
      facebookUrl: null,
      twitterUrl: null,
      instagramUrl: null,
    };
    await sendEmail(
      user.email,
      'd-9bc4ab0b27d6439ab4d81452b5a5cc7f',
      templateData
    );
    await user.save();
    return 'single';
  }
};

exports.disapproveArtisanService = async (id, userRole, admin) => {
  if (typeof id === 'object') {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      user.approvalStatus = 'declined';
      const templateData = {
        fullName: `${user.firstName} ${user.lastName}`,
        websiteUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
      };
      await sendEmail(
        user.email,
        'd-00ff705cb807404facfcab22777f101a',
        templateData
      );

      await user.save();
    });

    return 'group';
  } else {
    const user = await findOneUser(id, userRole);
    user.approvalStatus = 'declined';
    await user.save();
    return 'single';
  }
};

exports.deactivateUserService = async (id, userRole, admin) => {
  if (typeof id === 'object') {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      console.log(`user object -> ${user}`);
      if(!user) throw new AppError().GENERIC_ERROR('Invalid client credentials');
      user.isActivated = false;
      user.isOnline = false;

      await user.save();

      const templateData = {
        fullName: `${user.firstName} ${user.lastName}`,
        websiteUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
      };
      await sendEmail(
        user.email,
        'd-19a6b977f4344be98bc135e54a9f1c39',
        templateData
      );
    });
    return 'group';
  } else {
    const user = await findOneUser(id, userRole);
    console.log(`user object -> ${user}`);
    if(!user) throw new AppError().GENERIC_ERROR('Invalid client credentials');
    user.isActivated = false;
    user.isOnline = false;
    const templateData = {
      fullName: `${user.firstName} ${user.lastName}`,
      websiteUrl: null,
      facebookUrl: null,
      twitterUrl: null,
      instagramUrl: null,
    };
    await sendEmail(
      user.email,
      'd-19a6b977f4344be98bc135e54a9f1c39',
      templateData
    );

    await user.save();
    return 'single';
  }
};

exports.activateUserService = async (id, userRole, admin) => {
  if (typeof id === 'object') {
    id.forEach(async (item) => {
      const user = await findOneUser(item, userRole);
      user.isActivated = true;

      await user.save();
    });
    return 'group';
  } else {
    const user = await findOneUser(id, userRole);
    user.isActivated = true;
    await user.save();
    return 'single';
  }
};

async function getPendingPaymentTasks() {
  let pendingSettlementTasks = await Task.findAll({
    where: {
      paymentStatus: {
        [Op.in]: ['pendingInArtisan', 'failedInArtisan'],
      },
    },
    include: {
      model: ArtisanService,
      include: {
        model: User,
      },
    },
  });

  return pendingSettlementTasks;
}

exports.pendingSettlement = async () => {
  let pendingSettlementTasks = await getPendingPaymentTasks();
  let pendingSettlements = pendingSettlementTasks.map((task) => {
    let id = 1235 + task.id;
    return {
      orderNumber: `NIN${id}`,
      vendor: `${task.artisanService.user.firstName} ${task.artisanService.user.lastName}`,
      amount: task.price,
      status: task.paymentStatus?.split('In')[0],
    };
  });

  return pendingSettlements;
};

async function getOngoingTasks() {
  let ongoingTasks = await Task.findAll({
    where: {
      jobStatus: {
        [Op.in]: ['accepted', 'artisanArrived', 'started'],
      },
    },
    include: [
      {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
      { model: User },
    ],
  });

  return ongoingTasks;
}

exports.ongoingTasks = async () => {
  return getOngoingTasks();
};

exports.adminStatistics = async function () {
  let ongoingTasks = await getOngoingTasks();
  let ongoingTaskAmount = ongoingTasks.reduce(getSum, 0);

  let pendingSettlements = await getPendingPaymentTasks();
  let pendingSettlementAmount = pendingSettlements.reduce(getSum, 0);

  let vendors = await getUsers(['artisan']);
  let vendorCount = vendors.length;

  let customers = await getUsers(['customer']);
  let customerCount = customers.length;

  let users = await getUsers(['customer', 'artisan', 'admin']);
  let userCount = users.length;

  let newCustomersThisWeek = customers
    .map(function (customer) {
      let currentDate = new Date();
      if (Math.abs(difference(currentDate, customer.createdAt, 'd')) <= 7) {
        return customer;
      }
    })
    .filter((customer) => customer);
  let newCustomersThisWeekCount = newCustomersThisWeek.length;

  let artisanPendingApproval = vendors
    .map(function (vendor) {
      if (vendor.approvalStatus === 'pending') return vendor;
    })
    .filter((vendor) => vendor);
  let artisanPendingApprovalCount = artisanPendingApproval.length;

  let lastYearTasks = await getLastYearTasks();
  let taskAmountLastYear = lastYearTasks.reduce(function (total, task) {
    return total + task.price;
  }, 0);

  let allTasks = await getAllPaidTasks();
  let allTaskAmount = allTasks.reduce(function (total, task) {
    return total + task.price;
  }, 0);

  let afriserveAmount = allTasks.reduce(function (total, task) {
    return total + task.afriserveAmount;
  }, 0);

  return {
    ongoingTaskAmount,
    pendingSettlementAmount,
    vendorCount,
    customerCount,
    userCount,
    newCustomersThisWeekCount,
    artisanPendingApprovalCount,
    taskAmountLastYear,
    allTaskAmount,
    afriserveAmount,
  };
};

async function getLastYearTasks() {
  var oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() - 1);
  let tasks = await Task.findAll({
    where: {
      [Op.and]: [
        { paymentStatus: 'verifiedInArtisan' },
        { paymentDate: { [Op.ne]: null } },
        { paymentDate: { [Op.gte]: oneYearFromNow } },
      ],
    },
  });

  return tasks;
}

async function getAllPaidTasks() {
  let tasks = await Task.findAll({
    where: {
      [Op.and]: [
        { paymentStatus: 'verifiedInArtisan' },
        { paymentDate: { [Op.ne]: null } },
      ],
    },
  });

  return tasks;
}

async function getUsers(typeArray) {
  let users = await User.findAll({
    where: {
      userRole: {
        [Op.in]: typeArray,
      },
    },
  });

  return users;
}

function getSum(total, num) {
  if (isNaN(num)) return total;
  return total + num;
}

exports.getStatsService = async () => {
  const totalCustomer = await User.findAll({ where: { userRole: 'customer' } });
  const totalArtisan = await User.findAll({ where: { userRole: 'artisan' } });
  const getCustomerWithinAWeek = new Date();
  getCustomerWithinAWeek.setDate(getCustomerWithinAWeek.getDate() + 7);
  const totalCustomerWithinAWeek = await User.findAll({
    where: {
      userRole: 'customer',
      createdAt: { [Op.lte]: getCustomerWithinAWeek },
    },
  });
  const artisanPendingApproval = await User.findAll({
    where: { userRole: 'artisan', approvalStatus: 'pending' },
  });
  const stats = {
    totalCustomer: totalCustomer.length,
    totalArtisan: totalArtisan.length,
    totalCustomerWithinAWeek: totalCustomerWithinAWeek.length,
    totalArtisanPendingApproval: artisanPendingApproval.length,
  };
  return stats;
};

exports.getCompeletedRequestsService = async (filter) => {
  let time;
  switch (filter) {
    case 'today':
      time = new Date();
      time.setHours(0, 0, 0, 0);
      break;
    case 'yesterday':
      time = new Date();
      time.setDate(time.getDate() - 1);
      time.setHours(0, 0, 0, 0);
      break;
    case 'thisWeek':
      time = new Date();
      time.setDate(time.getDate() - 7);
      time.setHours(0, 0, 0, 0);
      break;
    case 'lastWeek':
      time = new Date();
      time.setDate(time.getDate() - 14);
      time.setHours(0, 0, 0, 0);
      break;
    case 'thisMonth':
      time = new Date();
      time.setDate(1);
      time.setHours(0, 0, 0, 0);
      break;
    case 'lastMonth':
      time = new Date();
      time.setDate(1);

      time.setMonth(time.getMonth() - 1);
      time.setHours(0, 0, 0, 0);
      break;
    case 'thisYear':
      time = new Date();
      time.setMonth(0);
      time.setDate(1);
      time.setHours(0, 0, 0, 0);
      break;
    case 'lastYear':
      time = new Date();
      time.setMonth(0);
      time.setDate(1);
      time.setFullYear(time.getFullYear() - 1);
      time.setHours(0, 0, 0, 0);
      break;
    default:
      time = new Date();
      time.setHours(0, 0, 0, 0);
      break;
  }

  const services = await Service.findAll({});
  const servicRequestPromise = services.map(async (item) => {
    const { count, rows } = await Task.findAndCountAll({
      where: {
        serviceId: item.id,
        jobStatus: 'completed',
        createdAt: { [Op.gte]: time },
      },
    });
    return {
      service: item.name,
      count: count,
    };
  });

  const serviceRequest = await Promise.all(servicRequestPromise);
  const labels = serviceRequest.map((item) => item.service);
  const values = serviceRequest.map((item) => item.count);

  return {
    labels,
    values,
  };
};

exports.exportUserService = async (userRole) => {
  const users = await User.findAll({
    where: { userRole: userRole },
    include: [{ model: Location }],
  });
  const workbook = new excelJS.Workbook();
  const sheet = workbook.addWorksheet(`${userRole}`);
  const filePath = './file';
  sheet.columns = [
    { header: 'Name', key: 'name', width: 100 },
    { header: 'Email', key: 'email', width: 100 },
    { header: 'Phone', key: 'phone', width: 100 },
    { header: 'Address', key: 'address', width: 100 },
    { header: 'Approval Status', key: 'approvalStatus', width: 100 },
    { header: 'Date Joined', key: 'createdAt', width: 100 },
    { header: '#ID', key: 'ID', width: 100 },
  ];
  if (userRole === 'artisan') {
    users.forEach((user) => {
      sheet.addRow({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phoneNumber,
        address: `${user?.location?.address} ${user?.location?.city} ${user?.location?.state} `,
        approvalStatus: user.approvalStatus,
        createdAt: user.createdAt,
        ID: user.userId,
      });
    });
  } else {
    users.forEach((user) => {
      sheet.addRow({
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phoneNumber,
        approvalStatus: user.approvalStatus,
        createdAt: user.createdAt,
        ID: user.userId,
      });
    });
  }
  await workbook.xlsx.writeFile(`${filePath}/${userRole}.xlsx`);
  const xlsxPath = `${filePath}/${userRole}.xlsx`;
  const fullPath = path.join(__dirname, `../../${xlsxPath}`);
  const buffered = await fs.readFileSync(fullPath);
  const file = {
    buffer: buffered,
    originalname: `${userRole}.xlsx`,
  };
  const uploaded = await uploadFile(file, 'downloaded');
  // await fs.unlinkSync(fullPath);
  return { url: uploaded.url.Location };
};
