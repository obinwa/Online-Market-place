const SERVER_CONFIG = require("./env");
const AppSuccess = require("./appSuccess");
const AppError = require("./appError");
const {
  verifyAccessToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
} = require("./token");
const { hashPassword, verifyPassword } = require("./hash");
const { createLoginCreds } = require("./createLoginCreds");
const { errorHandler } = require("./errohandler");

const {
  getFileAsBase64String,
  saveFileAndGetUrl,
  uploadFile,
  updateUserFiles,
  generateRandomWithSeedCharacters,
  deleteFile,
} = require("./file-manager");
const { isFuture, isAhead, difference,minus,plus, sameDay,isToday,formatDate } = require("./date");

const {
  sendEmail,
  sendInAppMessage,
  sendInAppAction,
  sendInAppRequestService,
  mailer,
  sendNotification,
} = require("./message");

const { generateFiveDigits } = require("./generateFiveDigits");

module.exports = {
  SERVER_CONFIG,
  AppSuccess,
  AppError,
  hashPassword,
  verifyPassword,
  //generateOTP,
  verifyAccessToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  createLoginCreds,
  errorHandler,
  saveFileAndGetUrl,
  decodeToken,
  getFileAsBase64String,
  deleteFile,
  isFuture,
  isAhead,
  difference,
  minus,
  plus,
  sameDay,
  isToday,
  formatDate,
  sendEmail,
  sendInAppMessage,
  sendInAppAction,
  sendInAppRequestService,
  mailer,
  sendNotification,
  generateFiveDigits,
  uploadFile,
  updateUserFiles,
  generateRandomWithSeedCharacters,
};
