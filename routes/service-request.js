const express = require("express");
const router = express.Router();
const {
  getAvailableArtisansForService,
  getServicesInformation,
  requestService,
  customerCancelRequest,
  artisanDeclineRequest,
  artisanAcceptRequest,
  artisanNegotiateRequest,
  customerAcceptNewPrice,
  artisanConfirmArrival,
  artisanConfirmTaskCompletion,
  customerReviewArtisan,
  artisanReviewCustomer,
  artisanViewPendingServiceRequest,
  artisanViewCompletedTaskRequest,
  customerConfirmJobDone,
  bookArtisansForService,
  userViewBids,
  getNotifiedTasks,
  allTasks,
  customerTasks,
  getCustomerOngoingTasks,
  customerTask,
  artisanInfoForCustomer,
  artisanStartTask,
  getNewTasksForArtisan,
  getArtisanScheduledTask,
  getArtisanOngoingTaskCount,
  getArtisanTaskForToday,
  reportAbuse,
  getTaskDetails,
} = require("../controllers/service-request");
const { verifyToken, checkIsActivated } = require("../middleware");
const {
  serviceRequest,
  bookServiceSchema,
  acceptRequestSchema,
  artisanSearchSchema,
  negotiateRequestSchema,
  reportSchema
} = require("../utils/validation/serviceRequestValidation");
const { validateSchema } = require("../utils/validation");

const {makeDuePaymentToArtisan} = require("../jobs/jobs")

/* GET home page. */
router.get("/all", getServicesInformation);
router.get("/:serviceName/artisans",validateSchema(artisanSearchSchema),verifyToken, getAvailableArtisansForService);
router.post("/request",validateSchema(serviceRequest),verifyToken, requestService);
router.post("/customer/cancel",verifyToken, customerCancelRequest);
router.post("/artisan/decline",verifyToken, artisanDeclineRequest);
router.post("/artisan/negotiate",validateSchema(negotiateRequestSchema),verifyToken, artisanNegotiateRequest);
router.post("/customer/accept",verifyToken,validateSchema(acceptRequestSchema), customerAcceptNewPrice);
router.post("/artisan/arrive",verifyToken, artisanConfirmArrival);
router.post("/artisan/start",verifyToken, artisanStartTask);
router.post("/artisan/confirm/complete",verifyToken, artisanConfirmTaskCompletion);
router.post("/customer/review",verifyToken, customerReviewArtisan);
router.post("/artisan/review",verifyToken, artisanReviewCustomer);
router.get("/artisan/requests/pending",verifyToken, artisanViewPendingServiceRequest);
router.get("/user/request/bids",verifyToken, userViewBids);
router.get("/artisan/requests/completed",verifyToken, artisanViewCompletedTaskRequest);
router.get("/artisan/tasks/ongoing",verifyToken, getArtisanOngoingTaskCount);
router.get("/artisan/tasks/scheduled",verifyToken, getArtisanScheduledTask);
router.get("/artisan/tasks/today",verifyToken, getArtisanTaskForToday);
router.post("/customer/confirm",verifyToken, customerConfirmJobDone);
router.post("/customer/book",verifyToken,validateSchema(bookServiceSchema),bookArtisansForService);
router.get("/artisan/tasks",verifyToken, getNotifiedTasks);
router.get("/artisan/tasks/new",verifyToken, getNewTasksForArtisan);
router.get("/tasks",verifyToken, allTasks);
router.get("/customer/tasks",verifyToken, customerTasks);
router.get("/customer/tasks/ongoing",verifyToken, getCustomerOngoingTasks);
router.get("/customer/task/:taskId",verifyToken, customerTask);
router.get("/customer/artisan",verifyToken, artisanInfoForCustomer);
router.post("/issue/report",verifyToken,validateSchema(reportSchema), reportAbuse);
router.get("/task/details/:taskId",verifyToken, getTaskDetails);

// router.get("/test/bulk-transfer",makeDuePaymentToArtisan);

// router.get("/artisan/",verifyToken, artisanViewLocalTasks);

module.exports = router;
