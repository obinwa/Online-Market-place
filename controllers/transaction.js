const {
  listBanks,
  getUserName,
  verifyPayment,
  verifyTransfer,
} = require('../services/payment-connector');
const {
  getTransactionHistory,
  artisanWallet,
  getTasktHistory,
} = require('../services/transaction-history');
const { AppSuccess, AppError } = require('../utils');

const { testTransfer } = require('../services/service-request');

exports.getAllBanks = async function (req, res, next) {
  try {
    let data = await listBanks();
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getBankUserName = async function (req, res, next) {
  try {
    let data = await getUserName(req.body.bankCode, req.body.accountNumber);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getTransactionHistory = async function (req, res, next) {
  try {
    let data = await getTransactionHistory(req.user.id, req.query);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getTaskHistory = async function (req, res, next) {
  try {
    let data = await getTasktHistory(req.user.id, req.query);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async function (req, res, next) {
  try {
    let data = await verifyPayment(req.query.reference);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.verifyTransfer = async function (req, res, next) {
  try {
    let data = await verifyTransfer(req.query.reference);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.testTransfer = async function (req, res, next) {
  try {
    let data = await testTransfer();
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getArtisanWallet = async function (req, res, next) {
  try {
    let data = await artisanWallet(req.user.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};
