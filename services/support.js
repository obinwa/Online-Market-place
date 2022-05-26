const { User, Chat, sequelize } = require('../db/models/index');
const { Op } = require('sequelize');
const {
  AppError,
  AppSuccess,
  uploadFile,
  generateRandom,
  sendInAppMessage,
} = require('../utils');

exports.artisanGetMessages = async function (artisanId) {
  let chats = await Chat.findAll({
    where: {
      clientId: artisanId,
    },
    order: [['createdAt', 'DESC']],
  });

  return chats;
};

exports.adminGetMessages = async function (adminId) {
  let chats = await Chat.findAll({
    where: {
      adminId: adminId,
    },
    order: [['createdAt', 'DESC']],
  });

  return chats;
};

exports.adminGetAllMessages = async function () {
  let chats = await Chat.findAll({
    order: [['createdAt', 'DESC']],
  });

  let chatsMap = new Map();
  for (let chat of chats) {
    if (chatsMap.get(chat.clientId)) {
      let chatArray = chatsMap.get(chat.clientId);
      chatArray.push(chat);
      chatsMap.set(chat.clientId, chatArray);
    } else {
      chatsMap.set(chat.clientId, [chat]);
    }
  }

  let userChats = [];
  for (const [key, value] of chatsMap.entries()) {
    let user = await User.findByPk(key);
    user = user.toJSON();
    user['chats'] = value;
    userChats.push(user);
  }

  return userChats;
};

async function sendMessage(res, fromUserId, toUserId, message, file, type) {
  message = message.trim();
  if (!message) return;
  let fileKey;
  let fileUrl;
  let adminId;
  let clientId;

  let fromUser = await getRegisteredUser(fromUserId);
  let toUser = await getRegisteredUser(toUserId);

  if (file) {
    fileKey = generateRandomWithSeedCharacters(5, fromUser.lastName);
    fileUploadObj = await uploadFile(file, fileKey);
    fileUrl = fileUploadObj.url.Location;
  }
  if (
    fromUser.userRole === 'admin' &&
    (toUser.userRole === 'artisan' || toUser.userRole === 'customer')
  ) {
    adminId = fromUserId;
    clientId = toUserId;
  } else if (
    toUser.userRole === 'admin' &&
    (fromUser.userRole === 'artisan' || fromUser.userRole === 'customer')
  ) {
    adminId = toUserId;
    clientId = fromUserId;
  } else {
    throw new AppError().GENERIC_ERROR(
      `Cannot send message between ${fromUser.userRole} and ${toUser.userRole} users`
    );
  }
  let chat = await Chat.create({
    adminId,
    clientId,
    message,
    fileUrl,
    dateTime: new Date(),
  });

  await sendInAppMessage(res.io, fromUser.email, message, fileUrl);

  //upload file
  //save message to db
  //get toId user and email address
  //send notification to user
}
