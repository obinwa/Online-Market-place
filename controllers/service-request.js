const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
} = require('../db/models');
const { AppSuccess, AppError } = require('../utils');

const requestService = require('../services/service-request');

exports.artisanViewLocalTasks = async function (req, res, next) {
  try {
    let data = await requestService.artisanViewLocalTasks(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

// develop is registered middleware
exports.getNotifiedTasks = async function (req, res, next) {
  try {
    let data = await requestService.notifiedTasks(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.customerTasks = async function (req, res, next) {
  try {
    let data = await requestService.customerTasks(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getCustomerOngoingTasks = async function (req, res, next) {
  try {
    let data = await requestService.customerOngoingTasks(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.customerTask = async function (req, res, next) {
  try {
    let data = await requestService.customerTaskDetails(
      req.user.id,
      req.params.taskId
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getTaskDetails = async function (req, res, next) {
  try {
    let data = await requestService.clientTaskDetails(
      req.user.id,
      req.params.taskId
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.allTasks = async function (req, res, next) {
  try {
    let data = await requestService.allTasks(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.bookArtisansForService = async function (req, res, next) {
  try {
    let data = await requestService.bookArtisansForService(
      req.user,
      req.body,
      req.files
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.getNewTasksForArtisan = async function (req, res, next) {
  try {
    let data = await requestService.newTasksForArtisan(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.customerConfirmJobDone = async function (req, res, next) {
  try {
    let data = await requestService.customerConfirmJobDone(
      res,
      req.body.taskId,
      req.user.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};
exports.verifyPayment = async function (req, res, next) {
  try {
    let data = await requestService.verifyPayment(res);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.getServicesInformation = async function (req, res, next) {
  try {
    let data = await requestService.getServices(req.query);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.getAvailableArtisansForService = async function (req, res, next) {
  try {
    let serviceName = req.params.serviceName;
    let localGovernment = req.query.localGovernment;
    let dateTime = req.query.dateTime;
    let data = await requestService.getArtisansForService(
      localGovernment,
      dateTime,
      serviceName
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.requestService = async function (req, res, next) {
  try {
    let data = await requestService.customerRequestService(
      res,
      req.body,
      req.user
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.customerCancelRequest = async function (req, res, next) {
  try {
    let data = await requestService.customerCancelRequest(
      res,
      req.body,
      req.user
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanDeclineRequest = async function (req, res, next) {
  try {
    let data = await requestService.artisanDeclineRequest(
      res,
      req.body.taskId,
      req.user.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanAcceptRequest = async function (req, res, next) {
  try {
    let data = await requestService.artisanAcceptRequest(
      res,
      req.body?.taskId,
      req.user?.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanNegotiateRequest = async function (req, res, next) {
  try {
    let data = await requestService.artisanNegotiateRequest(
      res,
      req.body,
      req.user
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.customerAcceptNewPrice = async function (req, res, next) {
  try {
    let data = await requestService.customerAcceptNewPrice(
      res,
      req.body,
      req.user.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanConfirmArrival = async function (req, res, next) {
  try {
    let data = await requestService.artisanConfirmArrival(
      res,
      req.body.taskId,
      req.user.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanStartTask = async function (req, res, next) {
  try {
    let data = await requestService.artisanStartTask(
      res,
      req.body.taskId,
      req.user.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanConfirmTaskCompletion = async function (req, res, next) {
  try {
    let data = await requestService.artisanConfirmTaskCompletion(
      res,
      req.body.taskId,
      req.user.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.customerReviewArtisan = async function (req, res, next) {
  try {
    let data = await requestService.customerReviewArtisan(req.body, req.user);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanReviewCustomer = async function (req, res, next) {
  try {
    let data = await requestService.artisanReviewCustomer(req.body, req.user);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanViewPendingServiceRequest = async function (req, res, next) {
  try {
    let data = await requestService.artisanViewPendingServiceRequest(
      req.user?.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.userViewBids = async function (req, res, next) {
  try {
    let data = await requestService.userViewBids(
      req.user?.id,
      req.query.taskId
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanViewCompletedTaskRequest = async function (req, res, next) {
  try {
    let data = await requestService.artisanViewCompletedTaskRequest(
      req.user?.id
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.getArtisanScheduledTask = async function (req, res, next) {
  try {
    let data = await requestService.artisanViewScheduledTask(req.user?.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};
exports.getArtisanOngoingTaskCount = async function (req, res, next) {
  try {
    let data = await requestService.artisanOngoingTaskCount(req.user?.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.getArtisanTaskForToday = async function (req, res, next) {
  try {
    let data = await requestService.artisanTaskForToday(req.user?.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.artisanInfoForCustomer = async function (req, res, next) {
  try {
    let data = await requestService.getArtisanInfoForCustomer(
      req.user?.id,
      req.query.artisanId,
      req.query.taskBidId
    );
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.reportAbuse = async function (req, res, next) {
  try {
    await requestService.reportAbuse(req.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};
