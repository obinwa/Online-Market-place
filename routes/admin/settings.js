const express = require("express");
const router = express.Router();
const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require("../../middleware/");
const {
  updateEmailNotifications,
  updateOrderNotification,
  updateVendorNotification,
  updateCustomerNotification,
} = require("../../controllers/admin/settings");

router.patch(
  "/email",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  updateEmailNotifications
);
router.patch(
  "/order",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  updateOrderNotification
);
router.patch(
  "/vendor",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  updateVendorNotification
);
router.patch(
  "/customer",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  updateCustomerNotification
);

module.exports = router;
