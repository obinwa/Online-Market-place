const express = require("express");
const router = express.Router();

const {
  getServ,
  addServ,
  updateServ,
  deleteServ,
  activateService,
  deActivateService,
  // searchService
} = require("../../controllers/admin/service");
const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require("../../middleware/");

router.post("/add", verifyToken, checkIsActivated, verifyAdminRole, addServ);
router.get("/get", verifyToken, checkIsActivated, verifyAdminRole, getServ);
router.put(
  "/update/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  updateServ
);
router.delete(
  "/delete/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  deleteServ
);
router.put(
  "/activate/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  activateService
);
router.put(
  "/deactivate/:id",
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  deActivateService
);

module.exports = router;
