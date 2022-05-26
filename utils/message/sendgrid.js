const sgMail = require('@sendgrid/mail');
const log = require('../logger');
require('dotenv').config();
sgMail.setApiKey(process.env.SENDGRID_KEY);
let allowedEnvironment = ['production', 'development'];

function overWriteRecipientEmailAddress(recipientEmailAddress) {
  if (allowedEnvironment.includes(process.env.NODE_ENV)) {
    return recipientEmailAddress;
  }
  return 'chidiebereonyeagba@yahoo.com';
}

/**
 * @param {string} recipientEmailAddress The email address of the recipient
 * @param {string} templateId The id of the email template
 * @param {object} templateData The data object for the email template
 **/

exports.sendEmail = async function (
  recipientEmailAddress,
  templateId,
  templateData
) {
  try {
    const msg = {
      to: overWriteRecipientEmailAddress(recipientEmailAddress),
      from: process.env.FROM,
      templateId: templateId,
      dynamicTemplateData: {
        ...templateData,
        frontendURL: process.env.FRONTEND_URL,
      },
    };

    await sgMail.send(msg);
  } catch (error) {
    log.info(`There was an error sending email to ${recipientEmailAddress}`);
  }
};
