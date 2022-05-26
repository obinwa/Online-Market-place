const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  searchAllUsers,
  getUserProfile,
  disapproveUser,
  deactivateUser,
  approveArtisan,
  activateUser,
  getCustomerServiceHistory,
  getArtisanServiceHistory,
  getPendingSettlements,
  getOngoingTasks,
  getAdminStatistics,
  getStats,
  getCompeletedRequests,
  sortUsers,
  exportUser,
} = require('../../controllers/admin/user');
let { getTransactionHistory, 
  getTaskHistory} = require('../../controllers/transaction');

const {
  verifyToken,
  verifyAdminRole,
  checkIsActivated,
} = require('../../middleware/');

router.get(
  '/users',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getAllUsers
);
router.get(
  '/users/search',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  searchAllUsers
);
router.get(
  '/users/sort/:sort',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  sortUsers
);
router.get(
  '/users/single/:id',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getUserProfile
);
router.put(
  '/users/approve',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  approveArtisan
);
router.put(
  '/users/disapprove',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  disapproveUser
);
router.put(
  '/users/reactivate',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  activateUser
);
router.put(
  '/users/deactivate',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  deactivateUser
);

router.get(
  '/users/transaction-history',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getTransactionHistory
);

router.get(
  '/users/task-history',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getTaskHistory
);

router.get(
  '/customer/service-history',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getCustomerServiceHistory
);

router.get(
  '/artisan/service-history',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getArtisanServiceHistory
);

router.get(
  '/settlement/pending',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getPendingSettlements
);

router.get(
  '/task/ongoing',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getOngoingTasks
);

router.get(
  '/statistics',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getAdminStatistics
);

router.get('/stats', verifyToken, checkIsActivated, verifyAdminRole, getStats);
router.get(
  '/users/export',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  exportUser
);
router.get(
  '/completed-requests/:filter',
  verifyToken,
  checkIsActivated,
  verifyAdminRole,
  getCompeletedRequests
);

module.exports = router;
