
let { 
  sendEmail,
  sendEmailWithCopy,
} = require("../../utils/message/sendgrid");

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
  IssueReport,
  sequelize
} = require("../../db/models/index");

const {
  artisanWallet
} = require("../transaction-history");

const {
  formatDate
} = require("../../utils/index");
const log = require("../../utils/logger");

exports.otpEmail = async function(receiver,otp){
  let templateId = "d-2b64903d2f7746558049f0720c1cc0af";

  let templateData = {
    otp:otp,
    websiteUrl:null,
    fullName:`${receiver.firstName} ${receiver.lastName}`,
  }

  await sendEmail(receiver.email,templateId,templateData);
}