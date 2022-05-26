const express = require("express");
const router = express.Router();
let notificationController = require("../controllers/notification");

const { verifyToken} = require("../middleware");


router.get("/all", verifyToken, notificationController.getUserNotification);

module.exports = router;