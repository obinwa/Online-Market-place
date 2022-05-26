const {
  registerService,
  verifyOtpService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
  resendOtpService,
  deleteUser,
  refreshTokenService,
  registerByFacebookService,
  changePasswordService,
} = require('../services/auth');
const db = require('../db/models');
const {
  AppSuccess,
  createLoginCreds,
  errorHandler,
  AppError,
  decodeToken,
  generateAccessToken,
  sendEmail,
} = require('../utils');

const { generateOTP } = require('../utils/otpgenerator');
const { getIO } = require('../utils/socket');
const { saveAudit } = require('./admin/audit-trail');

// Registration Controller;
const register = async (req, res, next) => {
  try {
    const { email, id, userRole, firstName, lastName } = await registerService(
      req.files,
      req.body
    );

    if (userRole !== 'admin') {
      const fullName = `${firstName} ${lastName}`;

      const otp = await generateOTP(email, 'PENDING_REGISTRATION', id);
      const templateData = {
        fullName,
        otp,
        websiteUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
      };
      await sendEmail(
        email,
        'd-2b64903d2f7746558049f0720c1cc0af',
        templateData
      );
      await saveAudit(
        id,
        `registered as ${userRole.startsWith('a') ? 'an' : 'a'} ${userRole}`,
        'successful',
        req
      );
      return new AppSuccess(res).OTP_CREATED();
    }
    await saveAudit(
      id,
      `registered as ${userRole.startsWith('A') ? 'an' : 'a'} ${userRole}`,
      'successful',
      req
    );
    return new AppSuccess(res).ACCOUNTCREATED();
  } catch (error) {
    next(error);
  }
};

// OTP Controller
const verifyOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const { payload, type } = await verifyOtpService(otp);
    if (type === 'PENDING_REGISTRATION') await createLoginCreds(res, payload);
    if (type === 'RESET_PASSWORD') {
      const { email, id } = payload;
      const token = await generateAccessToken({
        email,
        id,
        type: 'RESET_PASSWORD',
      });

      const dataInfo = {
        email: payload.email,
        token,
      };
      return new AppSuccess(res, dataInfo).OTP_VERIFIED();
    }
  } catch (error) {
    next(error);
  }
};

// Login Controller

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { payload, status } = await loginService(email, password);
    if (status === 'pending') {
      const { email, id } = payload;
      const dataInfo = await generateOTP(
        email,
        'PENDING_REGISTRATION',
        id,
        'Verify your email address'
      );
      return new AppSuccess(res, dataInfo).OTP_CREATED();
    }
    if (status === 'login') {
      await saveAudit(
        payload.id,
        'logged in to the platform',
        'successful',
        req
      );
      return await createLoginCreds(res, payload);
    }
  } catch (error) {
    next(error);
  }
};

// Forgot Password

const forgotPassword = async (req, res, next) => {
  try {
    const { email, id, firstName, lastName } = await forgotPasswordService(
      req.body.email,
      req.params.userRole
    );
    const otp = await generateOTP(email, 'RESET_PASSWORD', id);
    const templateData = {
      fullName: `${firstName} ${lastName}`,
      otp,
      websiteUrl: null,
      facebookUrl: null,
      twitterUrl: null,
      instagramUrl: null,
    };
    await sendEmail(email, 'd-37e7424806fe429094339d27af474f8a', templateData);
    await saveAudit(id, 'requested for a password change', 'successful', req);
    return new AppSuccess(res).OTP_CREATED();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { password, email, token } = req.body;
    const { status, payload } = await resetPasswordService(
      email,
      password,
      token
    );
    if (status === 'pending') {
      const { email, id } = payload;
      const dataInfo = await generateOTP(email, 'PENDING_REGISTRATION', id);
      await saveAudit(id, 'resetted password', 'successful');
      return new AppSuccess(res, dataInfo).OTP_CREATED();
    }
    if (status === 'login') {
      return await createLoginCreds(res, payload);
    }
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email, otpType } = req.body;
    const { id, firstName, lastName } = await resendOtpService(email, otpType);

    const fullName = `${firstName} ${lastName}`;
    if (otpType === 'PENDING_REGISTRATION') {
      const otp = await generateOTP(email, 'PENDING_REGISTRATION', id);
      const templateData = {
        fullName,
        otp,
        websiteUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
      };
      await sendEmail(
        email,
        'd-2b64903d2f7746558049f0720c1cc0af',
        templateData
      );
    }
    if (otpType === 'RESET_PASSWORD') {
      const otp = await generateOTP(email, 'RESET_PASSWORD', id);
      const templateData = {
        fullName: `${firstName} ${lastName}`,
        otp,
        websiteUrl: null,
        facebookUrl: null,
        twitterUrl: null,
        instagramUrl: null,
      };
      await sendEmail(
        email,
        'd-37e7424806fe429094339d27af474f8a',
        templateData
      );
    }
    return new AppSuccess(res).OTP_CREATED();
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken, id } = req.body;
    if (!refreshToken) return new AppError().EXPIRED_TOKEN();

    const payload = await refreshTokenService(refreshToken, id);
    return await createLoginCreds(res, payload);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
};

const registerByFacebook = async (req, res, next) => {
  try {
    const { data, secret } = req.body;

    if (!data || !secret) throw new AppError().GENERIC_ERROR('Bad Requesst');

    const decrypt = await decodeToken(secret);
    if (decrypt.secret !== process.env.FACEBOOK_SECRET)
      throw new AppError().INVALID_TOKEN();
    const profile = await decodeToken(data);
    const payload = await registerByFacebookService(profile);
    await saveAudit(payload.id, 'logged in to the platform', 'successful', req);
    return await createLoginCreds(res, payload);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await changePasswordService(req.body, req.user.id);
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Your password');
  } catch (error) {
    next(error);
  }
};
module.exports = {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  resendOtp,
  refreshToken,
  logout,
  registerByFacebook,
  changePassword,
};
