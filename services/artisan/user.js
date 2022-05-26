const {
  User,
  Otp,
  Location,
  Service,
  Review,
  ArtisanService,
  AccountDetails,
  Task,
  sequelize,
} = require('../../db/models/index');

const {
  AppError,
  getFileAsBase64String,
  saveFileAndGetUrl,
  verifyAccessToken,
  uploadFile,
  updateUserFiles,
  deleteFile,
} = require('../../utils');

const {
  PROOF_OF_ADDRESS,
  PROFILE_IMAGE,
  ID_IMAGE,
} = require('../../enums/profileFileTypes');

const { Op } = require('sequelize');

exports.getListedServices = async function () {
  let services = await Service.findAll();
  return services;
};

exports.deleteUserFiles = async function ({ file }, id) {
  try {
    let user = await User.findByPk(id);
    if (file.toLowerCase() === PROOF_OF_ADDRESS.toLocaleLowerCase()) {
      return deleteFileAndUpdateUser(user, PROOF_OF_ADDRESS);
    } else if (file.toLowerCase() === ID_IMAGE.toLocaleLowerCase()) {
      return deleteFileAndUpdateUser(user, ID_IMAGE);
    } else if (file.toLowerCase() === PROFILE_IMAGE.toLocaleLowerCase()) {
      return deleteFileAndUpdateUser(user, PROFILE_IMAGE);
    }
    return false;
  } catch (error) {
    throw new AppError().GENERIC_ERROR(error.message);
  }
};

async function deleteFileAndUpdateUser(user, type) {
  let fileUrl = user[type];
  if (!fileUrl) throw new AppError().GENERIC_ERROR('No file found');
  let isDeleted = await deleteFile(fileUrl);
  if (isDeleted) {
    user[type] = '';
    await user.save();
    return true;
  }
  return false;
}

exports.resendOtpService = async function (id, otpType) {
  const user = await User.findByPk(id);
  if (!user) throw new AppError().USER_NOT_FOUND();
  const otpExists = await Otp.findAll({
    where: {
      [Op.and]: [{ userId: user.id }, { otpType: otpType }],
    },
  });

  if (otpExists.length > 0) {
    if (!phoneNumberOtpValid(otpExists, user))
      new AppError().GENERIC_ERROR('No otp found');

    await otpExists.forEach(async function (item) {
      await item.destroy({ truncate: true, restartIdentity: true });
    });
  } else {
    throw new AppError().GENERIC_ERROR('No otp found');
  }
  return user;
};

function phoneNumberOtpValid(otpList, user) {
  otpList.forEach(function (otp) {
    if (otp.newPhoneNumber === user.newPhoneNumber) {
      return true;
    }
  });
  return false;
}

exports.userInformationService = async function (userId) {
  let user = await getRegisteredUser(userId);
  if (user.userRole !== 'artisan')
    throw new AppError().GENERIC_ERROR('Invalid credentials');

  let userInfo = await User.findOne({
    where: { id: userId },
    include: [
      {
        model: ArtisanService,
        include: [
          {
            model: Task,
            include: [
              {
                model: Review,
              },
            ],
          },
          Service,
        ],
      },
      Location,
      AccountDetails,
    ],
  });

  let userJSONInfo = userInfo.toJSON();
  userJSONInfo['taskCount'] = getTaskCounts(userInfo.artisanServices);
  userJSONInfo['totalEarnings'] = getEarnings(userInfo.artisanServices);
  return userJSONInfo;
  //return userInfo;
};

function getEarnings(artisanServices) {
  let totalEarnings = 0;

  for (let artisanService of artisanServices) {
    for (let task of artisanService.tasks) {
      if (task.jobStatus === 'customerConfirmed') {
        totalEarnings = totalEarnings + task.price;
      }
    }
  }
  return totalEarnings;
}

function getTaskCounts(artisanServices) {
  let ongoingTaskCount = 0;
  let scheduledTaskCount = 0;
  let completedTaskCount = 0;

  let stopped = ['customerCancelled', 'artisanRejected', 'jobDispute'];
  let active = ['started'];
  let completed = ['completed', 'customerConfirmed'];
  let scheduled = ['accepted', 'artisanArrived'];
  for (let artisanService of artisanServices) {
    for (let task of artisanService.tasks) {
      if (completed.includes(task.jobStatus.trim())) completedTaskCount++;
      else if (active.includes(task.jobStatus.trim())) ongoingTaskCount++;
      else if (scheduled.includes(task.jobStatus.trim())) scheduledTaskCount++;
    }
  }

  return {
    ongoingTaskCount,
    scheduledTaskCount,
    completedTaskCount,
  };
}

async function resolveUserFiles(user) {
  user = user.toJSON();
  if (user.profileImageUrl) {
    user['profileImage'] = await getFileAsBase64String(user.profileImageUrl);
  }

  if (user.idImageUrl) {
    user['idImage'] = await getFileAsBase64String(user.idImageUrl);
  }

  if (user.proofOfAddressUrl) {
    user['proofOfAddress'] = await getFileAsBase64String(
      user.proofOfAddressUrl
    );
  }

  return user;
}

async function updateModel(model, obj) {
  for (let propName in obj) {
    if (obj[propName] && obj[propName].trim().length !== 0) {
      model[propName] = obj[propName].trim();
    }
  }
  model.save();
  return model;
}

exports.saveProfile = async function (files, data, userId) {
  let {
    firstName,
    lastName,
    email,
    phoneNumber,
    address,
    localGovernment,
    state,
    country,
    city,
    nokFirstName,
    nokLastName,
    nokEmail,
    nokPhoneNumber,
    nokRelationship,
    nokAddress,
    nokState,
    nokLocalGovernment,
    nokCity,
    nokCountry,
  } = data;

  let user = await getRegisteredUser(userId);

  if (email) {
    const userWithEmail = await User.findOne({ where: { email } });
    if (userWithEmail && userWithEmail.id !== userId) {
      throw new AppError().EMAIL_ALREADY_EXISTS();
    }
  }

  delete data[phoneNumber];
  user = await updateModel(user, data);
  user = await updateUserFiles(user, files);
  await updateUserLocation(user, {
    address,
    localGovernment,
    state,
    country,
    city,
  });

  await user.save();
  return user;
};

async function updateUserLocation(user, locationObject) {
  let { address, localGovernment, state, country, city } = locationObject;
  let location = await Location.findOne({ where: { userId: user.id } });
  if (location) {
    await updateModel(location, locationObject);
    return;
  }
  await user.addLocation(address, localGovernment, city, state, country);
  return;
}

exports.verifyOtpForSMS = async (token, otp) => {
  const decoded = await verifyAccessToken(token);
  if (!decoded) throw new AppError().INVALIDTOKEN();

  const userOtp = await Otp.findByPk(decoded.otpID);

  if (!userOtp) throw new AppError().INVALID_OTP();

  if (+otp !== userOtp.otpDigits) throw new AppError().INVALID_OTP();

  const expiresIn = new Date(userOtp.expiresIn);

  if (expiresIn.getTime() < Date.now()) throw new AppError().EXPIRED_OTP();

  const user = await User.findByPk(userOtp.userId);
  if (userOtp.otpType === 'CHANGE_USER_DETAILS') {
    user.phoneNumber = decoded.phoneNumber;
    await user.save();
  }
  await userOtp.destroy({ truncate: true, restartIdentity: true });
  return true;
};

async function validateEmail(user, email) {
  email = email.trim();
  if (!email) {
    return user.email;
  }
  let usersWithEmail = await User.findAll({ where: { email } });
  if (
    usersWithEmail.length === 0 ||
    (usersWithEmail.length === 1 && usersWithEmail[0].id === user.id)
  ) {
    return email;
  }
  throw new AppError().GENERIC_ERROR(
    `Email ${email} is already in use by another user`
  );
}

exports.saveUserKycService = async function (userId, requestBody, files) {
  let user = await getRegisteredUser(userId);
  let {
    nokFirstName,
    nokLastName,
    nokEmail,
    nokPhoneNumber,
    nokRelationship,
    nokAddress,
    nokState,
    nokLocalGovernment,
    nokCity,
    nokCountry,
    idImage,
    proofOfAddress,
  } = requestBody;

  user.nokFirstName = nokFirstName.trim();
  user.nokLastName = nokLastName.trim();
  user.nokEmail = nokEmail.trim();
  user.nokPhoneNumber = nokPhoneNumber.trim();
  user.nokRelationship = nokRelationship.trim();
  user.nokAddress = nokAddress.trim();
  user.nokState = nokState.trim();
  user.nokLocalGovernment = nokLocalGovernment.trim();
  user.nokCity = nokCity.trim();
  user.nokCountry = nokCountry.trim();
  user = await updateUserFiles(user, files);

  await user.save();
  return;
};

function checkSize(file, maxSize) {
  return true;
}

exports.saveAccountDetailsService = async function (userId, requestBody) {
  let user = await getRegisteredUser(userId);

  let { accountNumber, bankName, accountName, bankCode } = requestBody;

  if (!bankName.trim() || !accountName.trim() || !bankCode.trim()) {
    throw new AppError().GENERIC_ERROR(
      'Bank account details must not contain empty strings'
    );
  }

  accountNumber = await validateAccountNumber(user, accountNumber);

  await AccountDetails.create({
    userId,
    accountNumber: accountNumber.trim(),
    bankName: bankName.trim(),
    bankCode: bankCode.trim(),
    accountName: accountName.trim(),
  });

  //update user profile
  user.profileCompletion['bankDetails'] = 'updated';
  await user.save();
  return;
};

async function validateAccountNumber(user, accountNumber) {
  accountNumber = accountNumber.trim();
  if (!/^\d{10}$/.test(accountNumber)) {
    throw new AppError().GENERIC_ERROR('Account Number must be 10 digits');
  }
  if (!accountNumber) {
    throw new AppError().GENERIC_ERROR('Account cannot be empty');
  }
  let accounts = await AccountDetails.findAll({ where: { accountNumber } });
  if (
    accounts.length === 0 ||
    (accounts.length === 1 && accounts[0].id === user.id)
  ) {
    if (accounts.length > 0) accounts[0].destroy();
    return accountNumber;
  }

  throw new AppError().GENERIC_ERROR(
    `Account number ${accountNumber} is already in use by another user`
  );
}

exports.updateUserLocationService = async function (userId, requestBody) {
  let user = await getValidUser(userId);
  let { address, localGovernment, city, state, country } = requestBody;
  await Location.destroy({ where: { userId } });

  await user.addLocation(address, localGovernment, city, state, country);
  return;
};

exports.updateIdImageService = async function (userId, requestBody) {
  let user = await getValidUser(userId);
  let { idImage } = requestBody;
  if (!checkSize(idImage, 5)) {
    throw new AppError().GENERIC_ERROR(
      'Profile image must not be grater than 5mb'
    );
  }

  let imageUrl = await getSavedFileLink(idImage);
  user.idImageUrl = imageUrl;
  await user.save();
  return;
};

exports.updateProofOfAddressService = async function (userId, requestBody) {
  let user = await getValidUser(userId);
  let { proofOfAddress } = requestBody;
  if (!checkSize(proofOfAddress, 5)) {
    throw new AppError().GENERIC_ERROR(
      'Proof of address file must not be grater than 5mb'
    );
  }

  let imageUrl = await getSavedFileLink(proofOfAddress);
  user.idImageUrl = imageUrl;
  await user.save();
  return;
};

exports.profileCompleteStageService = async function (userId) {
  let user = await getValidUser(userId);
  return user.profileCompletion;
};

async function getValidUser(userId) {
  if (!userId) throw new AppError().NULL_USER_ID_FROM_SESSION();
  let user = await User.findByPk(userId);
  if (!user) throw new AppError().LOGGED_IN_USER_NOT_FOUND();
  if (user.registrationStatus === 'blocked')
    throw new AppError().GENERIC_ERROR('User account is not active');
  return user;
}

async function getRegisteredUser(userId, pass = false) {
  let user = await getValidUser(userId);
  if (user.registrationStatus !== 'completed' && !pass)
    throw new AppError().GENERIC_ERROR('Kindly complete your registration');
  return user;
}

exports.updateUserServicesAction = async function (userId, requestBody) {
  let user = await getValidUser(userId);
  let {
    primaryServiceId,
    primaryServicePrice,
    secondaryServiceId,
    secondaryServicePrice,
  } = requestBody;

  let primaryArtisanService = await ArtisanService.findOne({
    where: {
      [Op.and]: [
        { userId: user.id },
        { ranking: 'Primary' },
        { id: secondaryServiceId },
      ],
    },
  });

  if (primaryArtisanService) {
    throw new AppError().GENERIC_ERROR(
      'Primary service must be different from secondary service'
    );
  }

  let service = await Service.findOne({ where: { id: secondaryServiceId } });
  if (!service)
    throw new AppError().GENERIC_ERROR('Secondary service not found');

  let ranking = 'Secondary';

  await ArtisanService.destroy({
    where: { [Op.and]: [{ userId: user.id }, { ranking }] },
  });

  await ArtisanService.create({
    userId,
    price: secondaryServicePrice,
    serviceId: secondaryServiceId,
    ranking: 'Secondary',
    currency: 'NGN',
  });

  return;
};

module.resolveUserFiles = resolveUserFiles;
