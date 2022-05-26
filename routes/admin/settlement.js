express = require("express");
const router = express.Router();

const {
  setSettlement,
  getSettlement,
} = require("../../controllers/admin/settlement");

const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require("../../middleware/");

router.post("/",verifyToken, checkIsActivated, verifyAdminRole, setSettlement);
router.get("/",verifyToken, checkIsActivated, verifyAdminRole, getSettlement);


module.exports = router;