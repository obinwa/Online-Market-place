const {
  User,
  Notification,
  Task,
  sequelize
} = require("../db/models/index");
const { Op } = require("sequelize");
const {
  AppError,
  AppSuccess,
} = require("../utils");
const log = require("../utils/logger");
const{ 
  paginate
} = require("../helper/service-helper");
require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];

exports.getNotification = async function(userId,{page,pageSize}) {
  let {limit,offset} = paginate(page,pageSize);
  if(!userId) throw new AppError().GENERIC_ERROR("Invalid user");
  let user = await User.findByPk(userId);
  if(!user) throw new AppError().GENERIC_ERROR("User not found");

  let notifications = await Notification.findAll({
    where: {
      [Op.or]:[
      {receiverId: userId},
      {senderId: userId}
      ]
    },
    order: [
      ['dateTime', 'DESC'],
    ],
    limit,
    offset
  });

  // let notificationsFromUser = await Notification.findAll({
  //   where: {
  //     senderId: userId,
  //   }
  // });

  return { 
    notifications
  }
}
