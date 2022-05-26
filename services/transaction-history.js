const {
  User,
  Task,
  ArtisanService,
  Service,
  Review,
  Location
} = require("../db/models/index");
const { Op } = require("sequelize");
const {
  AppError,
  AppSuccess,
  isToday
} = require("../utils");
const {
  paginate,
  getDateRange,
  getJobStatuses,
} = require("../helper/service-helper");
const serviceEnum = require("../enums/service-requests-constants")
require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];


exports.getTasktHistory = async function (userId, { page, pageSize,startDate,endDate,status }) {
  let user = await User.findByPk(userId);
  if(!user) throw new Error("User not found");
  return taskHistory(user, page, pageSize,startDate,endDate,status);
}

async function taskHistory(admin, page, pageSize,startDate,endDate,status) {
  let { limit, offset } = paginate(page, pageSize);
  let [minDate, maxDate] = getDateRange(startDate, endDate);
  let jobStatus = getJobStatuses(status);
  let tasks = await Task.findAll({
    where: {
      [Op.and]:[
        {paymentDate: { [Op.ne]: null }},
        {startTime:{ [Op.gte]: minDate}},
        {startTime:{ [Op.lte]: maxDate}},
        //   [Op.between]:[minDate,maxDate]
        // }},
        {jobStatus: { [Op.in]: jobStatus}}
      ]
    },
    limit,
    offset,
    include: [
      {
        model: ArtisanService,
        required: true,
        include: {
          model: User
        }
      },
      { model: Service },
      { model: User },
      { model: Review}
    ]
  });

  let taskHistory = [];

  for(let task of tasks) {
    let afriserveIncome = task.price * (1 - config.paymentRatio);
    let vendorName = `${task.artisanService?.user?.firstName} ${task?.artisanService?.user?.lastName}`;
    let customerName = `${task.user.firstName} ${task.user.lastName}`;
    let customerId = task.user.id;
    let vendorId = task.artisanService?.user.id;
    let completionDate = task.artisanCompleteDate;
    let customerLocation = await getUserLocation(task.user.id);
    let taskStatus = task.jobStatus;
    let requestDate = task.startTime;
    let review = task.review;
    let artisanStartDate = task.artisanStartDate;
    let artisanCompleteDate = task.artisanCompleteDate;

    taskHistory.push({
      customerId,
      vendorId,
      customerName,
      serviceName: task?.service.name,
      amount: task.price,
      afriserveIncome,
      vendorName,
      completionDate,
      customerLocation,
      taskStatus,
      requestDate,
      review,
      artisanStartDate,
      artisanCompleteDate,
    });
  }
     
  return taskHistory;

}

async function getTask(userId){
  let location = await Location.findOne({ 
    where:{
      userId
    }
  });
  return location;
}


async function getUserLocation(userId){
  let location = await Location.findOne({ 
    where:{
      userId
    }
  });
  return location;
}

exports.getTransactionHistory = async function (userId, { page, pageSize,startDate,endDate }) {
  let user = await User.findByPk(userId);
  if (user.userRole === "artisan") return getArtisanTransactions(user, page, pageSize,startDate,endDate);
  if (user.userRole === "customer") return getCustomerTransactions(user, page, pageSize,startDate,endDate);
  if (user.userRole === "admin") return getAdminTransactions(user, page, pageSize,startDate,endDate);
  return;
}

async function getAdminTransactions(admin, page, pageSize,startDate,endDate) {
  let { limit, offset } = paginate(page, pageSize);
  let [minDate, maxDate] = getDateRange(startDate, endDate);
  let tasks = await Task.findAll({
    where: {
      [Op.and]:[
        {paymentDate: { [Op.ne]: null }},
        {paymentDate:{ [Op.gte]: minDate}},
        {paymentDate:{ [Op.lte]: maxDate}},
      ]
    },
    limit,
    offset,
    include: [
      {
        model: ArtisanService,
        required: true,
        include: {
          model: User
        }
      },
      { model: Service },
      { model: User }
    ]
  });

  let transactions = tasks
    .map(task => {
      let paymentStatus = task.paymentStatus;
      let statusParts = paymentStatus.split("In");
      let customerPaymentStatus = "pending";
      let settlementStatus = "pending";
      if (statusParts[2] === "Collection") customerPaymentStatus = statusParts[0];
      if (statusParts[2] === "artisan") {
        customerPaymentStatus = "Paid";
        settlementStatus = statusParts[0];
      }
      let afriserveIncome = task.price * (1 - config.paymentRatio);
      let vendorName = `${task.artisanService?.user?.firstName} ${task?.artisanService?.user?.lastName}`;
      let customerName = `${task.user.firstName} ${task.user.lastName}`;

      return {
        customerName,
        serviceName: task?.service.name,
        amount: task.price,
        afriserveIncome,
        vendorName,
        paymentDate: task.paymentDate,
        customerPaymentStatus,
        settlementStatus,
        transferData: task.transferData,
        paymentData: task.paymentData
      }
    });

  return transactions;

}

async function getCustomerTransactions(customer, page, pageSize,startDate, endDate) {
  let { limit, offset } = paginate(page, pageSize);
  let [minDate, maxDate] = getDateRange(startDate, endDate);
  let tasks = await Task.findAndCountAll({
    where: {
      [Op.and]: [
        { customerId: customer.id },
        { paymentDate: { [Op.ne]: null } },
        {paymentDate:{ [Op.gte]: minDate}},
        {paymentDate:{ [Op.lte]: maxDate}},
      ]
    },
    limit,
    offset,
    include: [
      { model: ArtisanService },
      { model: Service },
    ]
  });

  let transactions = tasks.rows
    .map(task => {
      return {
        serviceName: task?.service.name,
        charge: task.price,
        paymentDate: task.paymentDate,
      }
    });

  return {transactions, total : tasks.count};

}

async function getArtisanTransactions(artisan, page, pageSize,startDate, endDate) {
  let { limit, offset } = paginate(page, pageSize);
  let [minDate, maxDate] = getDateRange(startDate, endDate);
  let tasks = await Task.findAndCountAll(
    {
      where: {
        [Op.and]: [
          { "$artisanService.userId$": artisan.id },
          { paymentDate: { [Op.ne]: null } },
          {paymentDate:{ [Op.gte]: minDate}},
          {paymentDate:{ [Op.lte]: maxDate}},
        ]
      },
      limit,
      offset,
      include: [
        { model: ArtisanService },
        { model: Service },
      ]
    }
  );

  let transactions = tasks.rows
    .map(task => {
    let paymentStatus = task.paymentStatus;
    let statusParts = paymentStatus.split("In");
    let customerPaymentStatus = "pending";
    let artisanSettlementStatus = "pending";
    if (statusParts[2] === "Collection") customerPaymentStatus = statusParts[0];
    if (statusParts[2] === "artisan") {
      customerPaymentStatus = "verified";
      artisanSettlementStatus = statusParts[0];
    }

    return {
      serviceName: task?.service.name,
      charge: task.price,
      paymentDate: task.paymentDate,
      customerPaymentStatus,
      artisanSettlementStatus,
    }
  });

  return { transactions, total: tasks.count };
}

exports.artisanWallet = async function (artisanId) {
  let artisan = await User.findByPk(artisanId);
  if (artisan.userRole !== "artisan") throw new AppError().UNAUTHORIZED();

  let tasks = await Task.findAll(
    {
      where: {
        [Op.and]: [
          { "$artisanService.userId$": artisan.id },
          { paymentDate: { [Op.ne]: null } }
        ]
      },
      include: [
        { model: ArtisanService },
        { model: Service },
      ]
    }
  );

  let todaysBalance = 0;
  let totalEarnings = 0;
  let withdrawablePayment = 0;

  for (let task of tasks) {
    if (task.jobStatus === serviceEnum.CUSTOMER_CONFIRM_JOB.taskStatus) {
      totalEarnings = totalEarnings + task.price;
      if (task.paymentStatus === serviceEnum.VERIFIED_IN_ARTISAN) {
        withdrawablePayment = withdrawablePayment + task.artisanAmount;
      }
      if (isToday(task.paymentDate)) {
        todaysBalance = todaysBalance + task.artisanAmount;
      }
    }

  }

  return {
    todaysBalance,
    totalEarnings,
    withdrawablePayment,
  }

}


