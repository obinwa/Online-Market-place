const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
} = require('../../db/models');
const { AppSuccess, AppError } = require('../../utils');

const artisanService = require('../../services/artisan/user');
const { generateOTP, generateOTPForSMS } = require('../../utils/otpgenerator');

// develop isRegistered middleware

exports.getServices = async function (req, res, next) {
  let services = await artisanService.getListedServices();
  return new AppSuccess(res, services).OPERATION_SUCCESSFUL();
};

exports.deleteFiles = async function (req, res, next) {
  try {
    let isDeleted = await artisanService.deleteUserFiles(req.body, req.user.id);
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
    await artisanService.verifyOtpForSMS(token, otp);
    return new AppSuccess(res).OTP_VERIFIED();
  } catch (error) {
    next(error);
  }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const { otpType } = req.body;
    const { userId, email, id, newPhoneNumber } =
      await artisanService.resendOtpService(req.user.id, otpType);
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
    const { email, id, userRole } = await artisanService.saveProfile(
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
    let data = await artisanService.userInformationService(req?.user?.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.saveAccountDetails = async function (req, res, next) {
  try {
    await artisanService.saveAccountDetailsService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.saveKycDetails = async function (req, res, next) {
  try {
    await artisanService.saveUserKycService(req?.user?.id, req.body, req.files);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.updateIdImage = async function (req, res, next) {
  try {
    await artisanService.updateIdImageService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.updateUserServices = async function (req, res, next) {
  try {
    await artisanService.updateUserServicesAction(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.updateUserLocation = async function (req, res, next) {
  try {
    await artisanService.updateUserLocationService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.updateProofOfAddress = async function (req, res, next) {
  try {
    await artisanService.updateProofOfAddressService(req?.user?.id, req.body);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.getProfileCompleteStage = async function (req, res, next) {
  try {
    let data = await artisanService.profileCompleteStageService(req?.user?.id);
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (err) {
    next(err);
  }
};

exports.showAllArtisans = async function (req, res, next) {
  try {
    let data = await getAllArtisans();
    return new AppSuccess(res, data).ACCOUNTCREATED();
  } catch (err) {
    next(err);
  }
};

async function getAllArtisans() {
  let artisans = await User.scope('isArtisan').findAll();
  let artisansResponse = artisans?.map(function (artisan) {
    return {
      username: artisan.username,
      firstName: artisan.firstName,
      lastName: artisan.lastName,
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
