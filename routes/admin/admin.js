const express = require("express");
const router = express.Router();

const {
  sendInvite,
  acceptInvite,
  changePassword,
  updateAdmin,
  getProfile,
  deactivateAccount,
  activateAccount,
  getTeamMembers,
} = require("../../controllers/admin/admin");

const {
  changePasswordSchema,
} = require("../../utils/validation/authValidation");
const { validateSchema } = require("../../utils/validation");

const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require("../../middleware/");

router.post(
  "/adduser",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  sendInvite
);

router.post(
  "/acceptInvite/:token/:email",

  acceptInvite
);
router.put(
  "/update/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  updateAdmin
);
router.get("/", verifyToken, verifyAdminRole, checkIsActivated, getProfile);
router.put(
  "/deactivate/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  deactivateAccount
);
router.put(
  "/activate/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  activateAccount
);
router.get(
  "/all",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getTeamMembers
);


module.exports = router;
