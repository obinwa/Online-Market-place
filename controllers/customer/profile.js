const {
  User,
  Otp,
  Location,
  Service,
  Artisan,
  AccountDetails,
} = require('../../db/models');
const { AppSuccess, AppError } = require('../../utils');

const customerService = require('../../services/customer/profile');
const { generateOTP, generateOTPForSMS } = require('../../utils/otpgenerator');

// develop isRegistered middleware

exports.getServices = async function (req, res, next) {
  try {
    let services = await customerService.getListedServices();
    return new AppSuccess(res, services).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.deleteFiles = async function (req, res, next) {
  try {
    let isDeleted = await customerService.deleteUserFiles(
      req.body,
      req.user.id
    );
    if (isDeleted) return new AppSuccess(res).OPERATION_SUCCESSFUL();
    throw new AppError().GENERIC_ERROR('An error occurred while deleting file');
  } catch (error) {
    next(error);
  }
};

exports.updatePhoneNumber = async function (req, res, next) {
  try {
    const dataInfo = await generateOTPForSMS(
      req.body.phoneNumber,
      'CHANGE_USER_DETAILS',
      req.user.id,
      'Verify your phone number'
    );
    return new AppSuccess(res, dataInfo).OTP_CREATED_SMS();
  } catch (error) {
    next(error);
  }
};

exports.verifyOtpForSMS = async function (req, res, next) {
  try {
    const { token, otp } = req.body;
    await customerService.verifyOtpForSMS(token, otp);
    return new AppSuccess(res).OTP_VERIFIED();
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { otpType } = req.body;
    const { userId, email, id, newPhoneNumber } =
      await customerService.resendOtpService(req.user.id, otpType);
    const dataInfo = await generateOTPForSMS(
      newPhoneNumber,
      otpType,
      req.user.id,
      'Verify your phone number'
    );
    return new AppSuccess(res, dataInfo).OTP_CREATED();
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async function (req, res, next) {
  try {
    const { email, id, userRole } = await customerService.saveProfile(
      req.files,
      req.body,
      req.user.id
    );
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getUserInformation = async function (req, res, next) {
  try {
    let data = await customerService.userInformationService(req?.user?.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.saveAccountDetails = async function (req, res, next) {
  try {
    await customerService.saveAccountDetailsService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.saveKycDetails = async function (req, res, next) {
  try {
    await customerService.saveUserKycService(
      req?.user?.id,
      req.body,
      req.files
    );
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.updateIdImage = async function (req, res, next) {
  try {
    await customerService.updateIdImageService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.updateUserLocation = async function (req, res, next) {
  try {
    await customerService.updateUserLocationService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.updateProofOfAddress = async function (req, res, next) {
  try {
    await customerService.updateProofOfAddressService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.getProfileCompleteStage = async function (req, res, next) {
  try {
    let data = await customerService.profileCompleteStageService(req?.user?.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.showAllCustomers = async function (req, res, next) {
  try {
    let data = await getAllCustomers();
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

async function getAllCustomers() {
  let customers = await User.scope('isCustomer').findAll();
  let artisansResponse = customers?.map(function (customer) {
    return {
      username: customer.username,
      firstName: customer.firstName,
      lastName: customer.lastName,
    };
  });
  return artisansResponse;
}

exports.showArtisansWithOtp = async function (req, res, next) {
  try {
    let response = await User.findAll({ include: Otp });
    res.json(response);
  } catch (err) {
    next(err);
  }
};
