express = require("express");
const router = express.Router();

const {
resolveIssue, 
getAllReports,
getAllUnresolvedReports,
} = require("../../controllers/admin/issue-report");
const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require("../../middleware/");

router.post("/issue/resolve/:id",verifyToken, checkIsActivated, verifyAdminRole, resolveIssue);
router.get("/issue/all",verifyToken, checkIsActivated, verifyAdminRole, getAllReports);
router.get("/issue/unresolved",verifyToken, checkIsActivated, verifyAdminRole, getAllUnresolvedReports);

module.exports = router;