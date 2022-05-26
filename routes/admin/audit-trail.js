const express = require('express');
const router = express.Router();

const {
  getAuditTrails,
  filterAuditTrail,
  sortByCreatedAtAuditTrail,
  exportAuditTrail,
} = require('../../controllers/admin/audit-trail');
const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require('../../middleware/');

router.get('/', verifyToken, checkIsActivated, verifyAdminRole, getAuditTrails);
router.get(
  '/filter',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  filterAuditTrail
);
router.get(
  '/sort',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  sortByCreatedAtAuditTrail
);
router.get(
  '/export',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  exportAuditTrail
);

module.exports = router;
