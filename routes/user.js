const express = require("express");
const router = express.Router();

const {
  getAllServices,
  toggleOnlieStatus,
  getAllStates,
  getLGAs,
  updateRegToken,
  deactivateAccount,
  searchService
} = require("../controllers/user");
const {
  verifyToken,
  checkIsActivated
} = require("../middleware");

router.get("/services/get", getAllServices);
router.put("/toggle/:userId", verifyToken, toggleOnlieStatus);
router.get("/getAllStates", getAllStates);
router.get("/getLgas/:state", getLGAs);
router.put("/update/reg-token", verifyToken, updateRegToken);
router.put("/deactivate", verifyToken, checkIsActivated, deactivateAccount);
router.get("/service", searchService);


module.exports = router;
