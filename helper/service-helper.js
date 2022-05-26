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
  sequelize,
} = require('../db/models/index');
const { AppError, AppSuccess } = require('../utils');

exports.getJobStatuses = function(status){
  if(!status){
    return ["initiated", 
    "negotiating", 
    "accepted",
    "customerCancelled",
    "artisanRejected",
    "jobDispute",
    "artisanArrived",
    "started",
    "completed",
    "customerConfirmed"];
  }

  else return [status];
}

exports.getDateRange = function(startDate,endDate){
  let maxDate = new Date('2038-01-19Z00:00:00.000');
  let minDate = new Date('1970-01-01Z00:00:00:000');

  if(startDate){
    if(isNaN(Date.parse(startDate))) throw new Error('Invalid start date');
    minDate = new Date(startDate);
  } 
  if(endDate){
    if(isNaN(Date.parse(endDate))) throw new Error('Invalid end date');
    maxDate = new Date(endDate);
  }

  return [minDate, maxDate];
}

exports.verifyService = async function (serviceId) {
  let service = await Service.findByPk(serviceId);
  if (!service) {
    throw new AppError().GENERIC_ERROR('Service not found');
  }
  return service.name;
};

//pass a list, page, and pageSize
exports.paginate = function (page, pageSize) {
  if (!isPositiveInteger(page)[0] || !isPositiveInteger(pageSize)[0]) {
    throw new AppError().GENERIC_ERROR('Invalid pagination value');
  }

  let endIndex = page * pageSize;
  let startIndex = endIndex - pageSize;
  return {
    offset: startIndex,
    limit: +pageSize,
  };
};

function isPositiveInteger(value) {
  if (!value) return [false, 'Null or undefined'];
  if (!Number.isInteger(+value)) return [false, `${value} is not an integer`];
  if (value <= 0) return [false, 'Not positive integer'];
  return [true, 'All checks passed'];
}
