const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const http = require("http");
const multer = require("multer");
const socketIO = require("socket.io");
const artisanApi = require("./routes/artisan/user");
const customerApi = require("./routes/customer/profile");
const userRoutes = require("./routes/user");
const authRoutes = require("./routes/auth");
const adminUserRoutes = require("./routes/admin/user");
const adminServiceRoutes = require("./routes/admin/service");
const adminTeamRoutes = require("./routes/admin/admin");
const adminSettingsRoutes = require("./routes/admin/settings");
const requestRoutes = require("./routes/service-request");
const paymentRoutes = require("./routes/transaction");
const auditRoutes = require("./routes/admin/audit-trail");
const notificationRoutes = require("./routes/notification");
const supportRoutes = require("./routes/support");
const settlementRoutes = require("./routes/admin/settlement");
const issueReportRoutes = require("./routes/admin/issue-report");
const testRoutes = require("./routes/test-routes");
const device = require("express-device");

const app = express();

// Multi Part
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }
 });


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  upload.fields([
    { name: 'proofOfAddressUrl', maxCount: 1 },
    { name: 'idImageUrl', maxCount: 1 },
    { name: 'profileImageUrl', maxCount: 1 },
  ])
);
// app.use(upload.single("image"));

app.use(logger('dev'));
app.use(device.capture());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(helmet());

app.get('/', function (req, res) {
  res.send('Welcome to Afriserve');
});

app.use("/api/v1/artisan", artisanApi);
app.use("/api/v1/customer", customerApi);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminUserRoutes);
app.use("/api/v1/admin/team", adminTeamRoutes);
app.use("/api/v1/admin/service", adminServiceRoutes);
app.use("/api/v1/admin/settings", adminSettingsRoutes);
app.use("/api/v1/admin/report", issueReportRoutes);
app.use("/api/v1/admin/settlement", settlementRoutes);
app.use("/api/v1/service", requestRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/admin/audit", auditRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/test", testRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (error, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = error.message;
  res.locals.error = req.app.get('env') === 'development' ? error : {};
  // render the error page
  if (!error.statusCode) {
    return res.status(500).json({
      message: error.message || 'Error processing request',
      status: false,
      data: null,
    });
  }
  return res.status(error.statusCode).json({
    message: error.message,
    status: false,
    data: null,
  });
});

module.exports = app;
