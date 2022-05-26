const express = require("express");
const router = express.Router();
let transactionController = require("../controllers/transaction");

const {   verifyToken,
  verifyAdminRole,
  verifyArtisanRole,
 } = require("../middleware");


router.get("/banks", verifyToken, transactionController.getAllBanks);
router.post(
  "/verifiedAccountName",
  verifyToken,
  transactionController.getBankUserName
);
router.get(
  "/history",
  verifyToken,
  transactionController.getTransactionHistory
);
router.get("/verify", verifyToken,transactionController.verifyPayment );
router.get("/verify/transfer", verifyToken,verifyAdminRole,transactionController.verifyTransfer);
router.get("/test/transfer",transactionController.testTransfer);
router.get("/wallet",verifyToken,verifyArtisanRole,transactionController.getArtisanWallet);

module.exports = router;