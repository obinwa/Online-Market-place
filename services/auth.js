const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  Notification,
  Device,
} = require('../db/models/index');

const {
  AppError,
  verifyAccessToken,
  verifyPassword,
  hashPassword,
  saveFileAndGetUrl,
  uploadFile,
  generateFiveDigits,
  verifyRefreshToken,
  sendEmail,
  sendNotification,
  formatDate,
} = require('../utils');
const { verifyService } = require('../helper/service-helper');
const { generateOTP } = require('../utils/otpgenerator');
const { Op } = require('sequelize');
const log = require('../utils/logger');

const client = require('../connect/redis');
// Registration Service
exports.registerService = async (files, data) => {
  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
    userRole,
    address,
    localGovernment,
    city,
    state,
    country,
    price,
    serviceId,
  } = data;

  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !email?.trim() ||
    !phoneNumber?.trim()
  ) {
    throw Error('Biodata cannot contain empty values. Please enter valid');
  }

  const userExist = await User.findOne({ where: { email } });

  if (userExist && userExist.registrationStatus === 'blocked') {
    throw new AppError().GENERIC_ERROR('User is blocked');
  }
  if (userExist) {
    throw new AppError().EMAIL_ALREADY_EXISTS();
  }

  if (await User.findOne({ where: { phoneNumber } })) {
    throw new AppError().PHONE_NUMBER_ALREADY_EXISTS();
  }

  const userId = generateFiveDigits();

  if (
    userRole.toLowerCase() === 'customer' ||
    userRole.toLowerCase() === 'admin'
  ) {
    let newUser = await User.create({
      userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      userRole: userRole.trim(),
      approvalStatus: 'approved',
    });
    newUser.password = await hashPassword(password);
    const admins = await User.findAll({
      where: { userRole: 'admin', isCustomerNotify: true },
    });

    if (userRole.toLowerCase() === 'customer') {

      admins.forEach((admin) => {
        const templateData = {
          fullName: `${admin.firstName} ${admin.lastName}`,
          userId,
          websiteUrl: null,
          facebookUrl: null,
          twitterUrl: null,
          instagramUrl: null,
        };
        sendEmail(
          admin.email,
          'd-31d7de6440744253a82741030fb4f4ea',
          templateData
        );
      });
    }
    await newUser.save();
    await sendRegNotification(newUser, admins);
    return newUser;
  }
  if (userRole.toLowerCase() === 'artisan') {
    await verifyService(serviceId);

    let newUser = await User.create({
      userId: userId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      password,
      userRole: userRole.trim(),
      registrationStatus: 'pending',
      isOnline: false,
      isActivated: false,
    });

    let imageKeyPrefix = `${firstName}-${lastName}`;

    for (const key in files) {
      for (const file of files[key]) {
        const { fieldName, url } = await uploadFile(file, imageKeyPrefix);
        newUser[fieldName] = url.Location;
      }
    }

    await newUser.addLocation(address, localGovernment, city, state, country);
    await newUser.addArtisanService(price, 'naira', serviceId);
    newUser['profileCompletion']['profile'] = 'added';
    newUser.password = await hashPassword(password);
    const templateData = {
      websiteUrl: null,
    };

    const admins = await User.findAll({
      where: { userRole: 'admin', isVendorNotify: true },
    });
    admins.forEach((admin) => {
      const templateData = {
        fullName: `${admin.firstName} ${admin.lastName}`,
        userId,
        websiteUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
      };
      sendEmail(
        admin.email,
        'd-31d7de6440744253a82741030fb4f4ea',
        templateData
      );
    });

    await sendEmail(
      newUser.email,
      'd-4c7e9919097c48c5a9e67005e76f06e8',
      templateData
    );
    await newUser.save();
    await sendRegNotification(newUser, admins);
    return newUser;
  }
};

async function sendRegNotification(fromUser, toUsers){
   try {
    let userTokens = [];
    for (let toUser of toUsers) {
      await Notification.create({
        type: "Registration",
        senderId: fromUser.id,
        receiverId: toUser.id,
        data: `${fromUser.userRole} registration`,
        dateTime: new Date(),
      });

      let device = await Device.findOne({
        where: {
          userId: toUser.id,
        },
      });
      userTokens.push(device?.regToken);
    }

    let filteredTokens = userTokens.filter((token) => token);

    let notificationMessageObject = {
      data: {
        view: 'Registration',
        click_action: 'registration',
        google_sent_time: formatDate(new Date()),
        description: "Registration",
      },
      notification: {
        title: "Registration",
        body: `${fromUser.userRole} registration`,
      },
    };
    await sendNotification(filteredTokens, notificationMessageObject);
  } catch (error) {
    log.info(error);
  }
}

exports.verifyOtpService = async (otp) => {
  if (!otp || otp.length !== 5 || otp === '')
    throw new AppError().INVALID_OTP();
  const userOtp = await Otp.findOne({
    where: { otpDigits: otp },
  });
  if (!userOtp) throw new AppError().INVALID_OTP();

  if (userOtp.expiresIn < Date.now()) throw new AppError().EXPIRED_OTP();

  const user = await User.findByPk(userOtp.userId);
  if (!user) throw new AppError().INVALID_OTP();

  if (userOtp.otpType === 'PENDING_REGISTRATION') {
    user.registrationStatus = 'completed';
    user.isActivated = true;
    user.lastLoginDate = new Date();
    await user.save();
  }
  await userOtp.destroy({ truncate: true, restartIdentity: true });
  const payload = {
    id: user.id,
    role: user.userRole,
    email: user.email,
    isActivated: user.isActivated,
  };
  return { payload, type: userOtp.otpType };
};

// Login Services

exports.loginService = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password)))
    throw new AppError().INCORRECT_DETAILS();

  if (user.registrationStatus === 'blocked')
    throw new AppError().USER_BLOCKED();
  if (!user.isActivated) throw new AppError().DEACTIVATED();
  if (user.registrationStatus === 'pending' && user.userRole === 'artisan') {
    return {
      payload: user,
      status: 'pending',
    };
  }
  if (user.approvalStatus !== 'approved')
    throw new AppError().GENERIC_ERROR(
      'Your application is still pending, please contact admin'
    );

  if (
    user.registrationStatus === 'completed' &&
    user.userRole === 'customer' &&
    user.regType === 'facebook'
  )
    throw new AppError().USER_REGISTER_MODE('Faecbook');

  // update user last login date

  user.lastLoginDate = new Date();
  await user.save();

  const payload = {
    id: user.id,
    role: user.userRole,
    email: user.email,
    isActivated: user.isActivated,
    name: `${user.firstName} ${user.lastName}`,
    userId: user.userId,
  };

  return { status: 'login', payload };
};

exports.forgotPasswordService = async (email, userRole) => {
  if (!userRole) {
    throw new AppError().GENERIC_ERROR('No context for user');
  }
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError().USER_NOT_FOUND();

  if (user.userRole.toLowerCase() !== userRole.trim().toLowerCase()) {
    throw new AppError().GENERIC_ERROR(
      `User with user role ${userRole} not found`
    );
  }

  return user;
};

exports.resetPasswordService = async (email, password, token) => {
  if (!token) throw new AppError().INVALID_OTP();
  const decoded = await verifyAccessToken(token);
  if (
    decoded &&
    decoded.name !== 'JsonWebTokenError' &&
    decoded.name !== 'TokenExpiredError' &&
    decoded.type === 'RESET_PASSWORD'
  ) {
    const user = await User.findOne({ where: { email } });

    if (!user) throw new AppError().USER_NOT_FOUND();

    if (await verifyPassword(password, user.password))
      throw new AppError().PASSWORD_MATCH();

    user.password = await hashPassword(password);
    await user.save();

    if (user.registrationStatus === 'pending') {
      return {
        payload: user,
        status: 'pending',
      };
    }
    const payload = {
      id: user.id,
      role: user.userRole,
      email: user.email,
      isActivated: user.isActivated,
    };

    const templateData = {
      fullName: `${user.firstName} ${user.lastName}`,
      websiteUrl: null,
      facebookUrl: null,
      twitterUrl: null,
      instagramUrl: null,
    };
    await sendEmail(
      user.email,
      'd-87d3754d36cf4a92be65741abb7e9112',
      templateData
    );
    return { status: 'login', payload };
  } else throw new AppError().EXPIRED_TOKEN();
};

exports.resendOtpService = async (email, otpType) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError().USER_NOT_FOUND();
  const otpExists = await Otp.findAll({
    where: {
      [Op.and]: [{ userId: user.id }, { otpType: otpType }],
    },
  });
  if (otpExists.length > 0) {
    await otpExists.forEach(
      async (item) =>
        await item.destroy({ truncate: true, restartIdentity: true })
    );
  }

  return user;
};

exports.refreshTokenService = async (refreshToken, id) => {
  const decoded = await verifyRefreshToken(refreshToken);
  if (
    decoded &&
    decoded.name !== 'JsonWebTokenError' &&
    decoded.name !== 'TokenExpiredError'
  ) {
    if (id !== decoded.id) {
      throw new AppError().INVALID_TOKEN();
    }

    const payload = {
      id: decoded.id,
      role: decoded.userRole,
      email: decoded.email,
      isActivated: decoded.isActivated,
      name: decoded.name,
      userId: decoded.userId,
      role: decoded.role,
    };
    return payload;
  } else {
    throw new AppError().EXPIRED_TOKEN();
  }
};

exports.registerByFacebookService = async (profile) => {
  const userExist = await User.findOne({ where: { email: profile.email } });
  if (userExist && userExist.registerType === 'email')
    throw new AppError().USER_REGISTER_MODE();
  if (!userExist) {
    const userId = generateFiveDigits();

    const user = User.create({
      userId,
      firstName: profile.firstname,
      lastName: profile.lastname,
      email: profile.email,
      phoneNumber: profile.phone,
      approvalStatus: 'approved',
      registerType: 'facebook',
      userRole: profile.role,
    });

    const payload = {
      id: user.id,
      role: user.userRole,
      email: user.email,
      isActivated: user.isActivated,
      name: `${user.firstName} ${user.lastName}`,
      userId: user.userId,
    };
    return { status: 'login', payload };
  } else {
    const payload = {
      id: userExist.id,
      role: userExist.userRole,
      email: userExist.email,
      isActivated: userExist.isActivated,
      name: `${userExist.firstName} ${userExist.lastName}`,
      userId: userExist.userId,
    };
    return { status: 'login', payload };
  }
};

exports.changePasswordService = async (data, id) => {
  const { oldPassword, newPassword } = data;

  const user = await User.findOne({ where: { id } });
  if (!user) throw new AppError().USER_NOT_FOUND();

  if (!(await verifyPassword(oldPassword, user.password)))
    throw new AppError().INCORRECT_DETAILS();
  user.password = await hashPassword(newPassword);
  await user.save();
  return true;
};
