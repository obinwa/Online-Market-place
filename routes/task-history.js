const express = require("express");
const router = express.Router();
let transactionController = require("../controllers/transaction");

const {   verifyToken,
  verifyAdminRole,
  verifyArtisanRole,
 } = require("../middleware");


router.get(
  "/history",
  verifyToken,
  verifyAdminRole,
  transactionController.getTaskHistory
);


module.exports = router;