const express = require('express');
const router = express.Router();

const {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  changePasswordSchema,
  forgotPasswordSchema,
} = require('../utils/validation/authValidation');
const { validateSchema } = require('../utils/validation');

const { verifyToken, checkIsActivated } = require('../middleware');

const {
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
} = require('../controllers/auth');

router.post('/register', validateSchema(registerSchema), register);
router.post('/verify/otp', verifyOtp);
router.post('/login', validateSchema(loginSchema), login);
router.post(
  '/forgot-password/:userRole',
  validateSchema(forgotPasswordSchema),
  forgotPassword
);
router.post(
  '/reset-password',
  validateSchema(resetPasswordSchema),
  resetPassword
);

router.post('/resend/otp', resendOtp);
router.post('/refreshToken', refreshToken);
router.post('/logout', logout);
router.post('/register/facebook', registerByFacebook);
router.patch(
  '/change-password',
  verifyToken,
  checkIsActivated,
  validateSchema(changePasswordSchema),
  changePassword
);
module.exports = router;
