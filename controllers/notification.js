const { getNotification } = require("../services/notification");
const { AppSuccess, AppError } = require("../utils");

exports.getUserNotification = async function (req, res, next) {
  try {
    let data = await getNotification(req.user.id,req.query);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};
