require('dotenv').config();
// let countryCodes = require("../countryCodes.json");
const AppError = require('../appError');

const credentials = {
  apiKey: process.env.SMS_API_KEY,
  username: process.env.SMS_USERNAME,
};
// const Africastalking = require('africastalking')(credentials);

// // Initialize a service e.g. SMS
// const sms = Africastalking.SMS

// // Initialize a service e.g. SMS
// const sms = Africastalking.SMS

function getPhoneNumberWithCountryCode(phoneNumber, country) {
  // let countryPrefix = countryCodes[country]["countryCode"];
  // if (countryPrefix) {
  //   if (phoneNumber.startsWith(countryPrefix)) return phoneNumber;
  //   if (phoneNumber.startsWith("0"))
  //     return `${countryPrefix}${phoneNumber.substring(1)}`;
  //   else return `${countryPrefix}${phoneNumber}`;
  // } else {
  //   throw new AppError().GENERIC_ERROR(
  //     "No country code found for phone number"
  //   );
  // }
}

// Send message and capture the response or error
exports.sendSMS = async function (phoneNumber, message, country = 'NGN') {
  try {
    let normalizedPhoneNumber = getPhoneNumberWithCountryCode(
      phoneNumber,
      (country = 'NGN')
    );
    const options = {
      to: [normalizedPhoneNumber],
      message,
    };
    // await sms.send(options);
  } catch (error) {
    throw new AppError().GENERIC_ERROR(
      'An error occurred while sending sms for otp'
    );
  }
};
