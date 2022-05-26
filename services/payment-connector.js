const axios = require('axios');
require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const { AppSuccess, AppError } = require('../utils');
const logger = require('../utils/logger');
const qs = require('qs');

const baseUrl = `https://api.paystack.co`;
const token = `Bearer ${process.env.PAYSTACK_SECRETKEY}`;

const urlSuffices = {
  transferRecipient: 'transferrecipient',
};

module.exports.listBanks = async function () {
  let url = `${baseUrl}/bank`;
  let params = { countryCode: 'nigeria', user_cursor: false };
  let headers = { Authorization: token };
  let response = await axios.get(url, { params }, { headers });
  let responseData;

  if (response.status === 200 && response.data.status === true) {
    responseData = response.data.data.map((bankInfo) => {
      let { name, code } = bankInfo;
      return { name, code };
    });
    return responseData;
  } else throw Error(`Request processing error ${response.status}`);
};

module.exports.getUserName = async function (bankCode, accountNumber) {
  bankCode = bankCode.trim();
  accountNumber = accountNumber.trim();

  if (!bankCode || !accountNumber) {
    throw new AppError().GENERIC_ERROR(
      'bank code and account number must not be empty'
    );
  }

  let url = `${baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
  let response = await axios.get(url, {
    headers: { Authorization: token },
  });

  logger.info(response.data);
  if (response.status === 200 && response.data.status === true) {
    return response.data.data;
  } else if (response.data.message === 'Invalid key') {
    throw new AppError().INVALID_KEY();
  } else throw new AppError().GENERIC_ERROR(response.data.message);
};

module.exports.reversePayment = async function (task) {
  let url = `${baseUrl}/refund`;
  let data = {
    transaction: task.paymentData['data'].reference,
    // reason: taskDescription
  };

  let response = null;

  try {
    response = await axios.post(url, data, {
      headers: { Authorization: token },
    });

    if (response?.data?.status && response?.data?.data?.status === 'success') {
      return {
        status: true,
        data: response?.data?.message,
      };
    } else {
      return {
        status: false,
        data: response?.data?.message,
      };
    }
  } catch (error) {
    let responseData = error?.response?.data;
    logger.info(error);
    logger.info(responseData);

    if (responseData?.message && responseData.message.includes('reversed')) {
      return {
        status: true,
        data: error.response?.data?.message,
      };
    }

    return {
      status: false,
      data: response?.data?.message,
    };
  }
};

//to debit customer
module.exports.debit = async function (customer, price) {
  if (!customer?.email || !price) {
    throw new AppError().GENERIC_ERROR('Invalid parameters');
  }
  let url = `${baseUrl}/transaction/initialize`;
  let data = {
    email: customer.email,
    amount: price * 100,
  };

  let response = await axios.post(url, data, {
    headers: { Authorization: token },
  });

  if (response?.data?.status === true) {
    return response.data;
  } else {
    throw new AppError().GENERIC_ERROR(response?.data?.message);
  }
};

//change to verify customer debit
module.exports.verifyPayment = async function (reference) {
  logger.info(`reference for reversal ${reference}`);
  if (!reference) return false;
  try {
    let url = `${baseUrl}/transaction/verify/${reference}`;
    let headers = { Authorization: token };

    let response = await axios.get(url, { headers });

    if (response?.data?.status && response?.data?.data?.status === 'success') {
      return true;
    }
    return false;
  } catch (error) {
    logger.info(error);
    return false;
  }
};

module.exports.createTransferReceipt = async function (accountDetails) {
  let url = `${baseUrl}/${urlSuffices.transferRecipient}`;
  let data = {
    type: 'nuban',
    name: accountDetails.accountName,
    account_number: accountDetails.accountNumber,
    bank_code: accountDetails.bankCode,
    currency: 'NGN',
  };

  try {
    var config = {
      method: 'post',
      url: url,
      headers: {
        Authorization: token,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: data,
    };
    let response = await axios(config);
    if (response) return response?.data?.data;
  } catch (error) {
    throw new AppError().GENERIC_ERROR(error?.response?.data);
  }
};

module.exports.createValidTransferReceipt = async function (accountDetails) {
  let url = `${baseUrl}/${urlSuffices.transferRecipient}`;
  let qs = require('qs');

  let data = qs.stringify({
    type: 'nuban',
    name: accountDetails.accountName,
    account_number: accountDetails.accountNumber,
    bank_code: accountDetails.bankCode,
    currency: 'NGN',
  });

  try {
    var config = {
      method: 'post',
      url: url,
      headers: {
        Authorization: token,
      },
      data: data,
    };
    let response = await axios(config);
    if (!response.data) {
      throw new AppError().GENERIC_ERROR(
        `An Error occurred ::: ${response.data.message}`
      );
    }
    return response?.data?.data;
  } catch (error) {
    logger.info(`error data ${JSON.stringify(error?.response?.data)}`);
    logger.info(error.message);
    throw new AppError().GENERIC_ERROR(
      error?.response?.data?.message
        ? error?.response?.data?.message
        : 'Internal Processing Error at Transfer Initialization'
    );
  }
};

module.exports.transfer = async function (
  referenceCode,
  amount,
  taskDescription
) {
  let url = `${baseUrl}/transfer`;
  let data = {
    source: 'balance',
    amount,
    recipient: referenceCode,
    reason: taskDescription,
  };

  try {
    let response = await axios.post(url, data, {
      headers: { Authorization: token },
    });

    if (response?.data?.status && response?.data?.data?.status === 'success') {
      return {
        status: true,
        data: response?.data?.data,
      };
    } else {
      //log response
      return {
        status: false,
        data: response?.data?.data,
      };
    }
  } catch (error) {
    logger.info(error);
    // return;
    // return {

    // }
    throw new AppError().GENERIC_ERROR(error.message);
  }
};

module.exports.verifyTransfer = async function (transferCode) {
  try {
    let url = `${baseUrl}/transfer/${transferCode}`;

    let response = await axios.get(url, { headers: { Authorization: token } });

    if (response?.data?.data?.status) {
      return response.data.data.status.toLowerCase() === 'success'
        ? true
        : false;
    }
  } catch (error) {
    logger.info(error);
    return false;
  }
};
