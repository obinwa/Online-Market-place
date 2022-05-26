const {
  artisanGetMessages,
  adminGetMessages,
  adminGetAllMessages
  } = require("../services/support");
const { AppSuccess, AppError } = require("../utils");

exports.getUserChats = async function (req, res, next) {
  try {
    let data = await artisanGetMessages(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getAdminChats = async function (req, res, next) {
  try {
    let data = await adminGetMessages(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.adminGetAllMessages = async function (req, res, next) {
  try {
    let data = await adminGetAllMessages();
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};
