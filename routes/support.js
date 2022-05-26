const express = require("express");
const router = express.Router();
let {
  getUserChats,
  getAdminChats,
  adminGetAllMessages
} = require("../controllers/support");
const {
  verifyToken,
  verifyAdminRole,
  verifyClientRole,
  checkIsActivated,
} = require("../middleware/");


router.get("/admin/chats", verifyToken, verifyAdminRole,getAdminChats);
router.get("/client/chats", verifyToken,verifyClientRole, getUserChats);
router.get("/admin/all-chats", verifyToken,verifyAdminRole, adminGetAllMessages);



module.exports = router;