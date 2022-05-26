const express = require('express');
const router = express.Router();
let userController = require('../../controllers/artisan/user');

const {
  verifyToken,
  addTestUser,
  checkIsActivated,
} = require('../../middleware');

const {
  profileSchema,
  bankAccountSchema,
  kycSchema,
  phoneNumberSchema,
  serviceSchema,
  profileFilesSchema,
} = require('../../utils/validation/userValidation');
const { validateSchema } = require('../../utils/validation');

/* GET home page. */
router.get(
  '/all',
  verifyToken,
  checkIsActivated,
  userController.showAllArtisans
);

router.get('/artisansAndOtp', userController.showArtisansWithOtp);

router.get(
  '/me',
  verifyToken,
  checkIsActivated,
  userController.getUserInformation
);

router.put(
  '/resendOtp',
  verifyToken,
  checkIsActivated,
  userController.resendOtp
);

router.put(
  '/resendOtp',
  verifyToken,
  checkIsActivated,
  userController.resendOtp
);

router.post(
  '/updatePhoneNumber',
  verifyToken,
  checkIsActivated,
  validateSchema(phoneNumberSchema),
  userController.updatePhoneNumber
);

router.post(
  '/updateProfile',
  verifyToken,
  checkIsActivated,
  validateSchema(profileSchema),
  userController.updateProfile
);

router.post(
  '/updateService',
  verifyToken,
  checkIsActivated,
  validateSchema(serviceSchema),
  userController.updateUserServices
);

router.post(
  '/verify/otp',
  verifyToken,
  checkIsActivated,
  userController.verifyOtpForSMS
);
router.post(
  '/updateAccount',
  verifyToken,
  checkIsActivated,
  validateSchema(bankAccountSchema),
  userController.saveAccountDetails
);
router.post(
  '/updateKyc',
  verifyToken,
  checkIsActivated,
  validateSchema(kycSchema),
  userController.saveKycDetails
);

router.delete(
  '/delete/file',
  verifyToken,
  checkIsActivated,
  validateSchema(profileFilesSchema),
  userController.deleteFiles
);

router.get('/services', userController.getServices);

module.exports = router;
