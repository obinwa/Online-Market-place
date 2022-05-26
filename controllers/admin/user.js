const {
  getAllUsersService,
  searchAllUsersService,
  getUserProfileService,
  approveArtisanService,
  disapproveArtisanService,
  deactivateUserService,
  activateUserService,
  customerServiceHistory,
  artisanServiceHistory,
  pendingSettlement,
  ongoingTasks,
  adminStatistics,
  getCompeletedRequestsService,
  getStatsService,
  sortUsersService,
  exportUserService,
} = require('../../services/admin/user');
const { AppSuccess } = require('../../utils/');

const { saveAudit } = require('./audit-trail');
const getAllUsers = async (req, res, next) => {
  // const { role, limit, page, service, location, online, approval } = req.query;

  const getAllUsers = await getAllUsersService(req.query);
  return new AppSuccess(res, getAllUsers).FETCHED_SUCCESFULLY();
};

const searchAllUsers = async (req, res, next) => {
  const { userRole, value } = req.query;
  // const { search } = req.params;
  const allUsers = await searchAllUsersService(userRole, value);
  return new AppSuccess(res, allUsers).FETCHED_SUCCESFULLY();
};

const sortUsers = async (req, res, next) => {
  try {
    const allUsers = await sortUsersService(req.params.sort, req.query);
    return new AppSuccess(res, allUsers).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  const { id } = req.params;
  const { userRole } = req.query;

  const userProfile = await getUserProfileService(id, userRole);
  return new AppSuccess(res, userProfile).FETCHED_SUCCESFULLY();
};

const approveArtisan = async (req, res, next) => {
  try {
    const { id } = req.body;
    const { userRole } = req.query;
    const result = await approveArtisanService(id, userRole, req.user);
    if (result === 'group') {
      await saveAudit(
        req.user.id,
        `${id.length} ${id.length > 1 ? 'users' : 'user'} approved`,
        'successful',
        req
      );
    } else {
      await saveAudit(req.user.id, '1 user apprroved', 'successful', req);
    }
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('User');
  } catch (error) {
    await saveAudit(req.user.id, 'failed to approve', 'unsuccessful', req);
    next(error);
  }
};
const disapproveUser = async (req, res, next) => {
  try {
    const { id } = req.body;
    const { userRole } = req.query;
    const user = await disapproveArtisanService(id, userRole, req.user);
    if (user === 'group') {
      await saveAudit(
        req.user.id,
        `${id.length} ${id.length > 1 ? 'users' : 'user'} disapproved`,
        'successful',
        req
      );
    } else {
      await saveAudit(req.user.id, '1 user disapproved', 'successful', req);
    }
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('User');
  } catch (error) {
    await saveAudit(req.user.id, 'failed to disapprove', 'unsuccessful', req);
    next(error);
  }
};

const activateUser = async (req, res, next) => {
  try {
    const { id } = req.body;
    const { userRole } = req.query;

    const user = await activateUserService(id, userRole, req.user);
    if (user === 'group') {
      await saveAudit(
        req.user.id,
        `${id.length} ${id.length > 1 ? 'users' : 'user'} activated`,
        'successful',
        req
      );
    } else {
      await saveAudit(req.user.id, '1 user activated', 'successful', req);
    }
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('User');
  } catch (error) {
    await saveAudit(req.user.id, 'failed to activate', 'unsuccessful', req);
    next(error);
  }
};
const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.body;
    const { userRole } = req.query;

    const user = await deactivateUserService(id, userRole, req.user);
    if (user === 'group') {
      await saveAudit(
        req.user.id,
        `${id.length} ${id.length > 1 ? 'users' : 'user'} deactivated`,
        'successful',
        req
      );
    } else {
      await saveAudit(req.user.id, '1 user deactivated', 'successful', req);
    }
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('User');
  } catch (error) {
    await saveAudit(req.user.id, 'failed to deactivate', 'unsuccessful', req);
    next(error);
  }
};

const getCustomerServiceHistory = async (req, res, next) => {
  try {
    const { customerId } = req.query;
    const customerHistory = await customerServiceHistory(customerId);
    return new AppSuccess(res, customerHistory).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const getArtisanServiceHistory = async (req, res, next) => {
  try {
    const { artisanId } = req.query;
    const customerHistory = await artisanServiceHistory(artisanId);
    return new AppSuccess(res, customerHistory).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const getPendingSettlements = async (req, res, next) => {
  try {
    const pendingSettlementList = await pendingSettlement();
    return new AppSuccess(res, pendingSettlementList).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const getOngoingTasks = async (req, res, next) => {
  try {
    const ongoingTaskList = await ongoingTasks();
    return new AppSuccess(res, ongoingTaskList).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const getAdminStatistics = async (req, res, next) => {
  try {
    const adminStatisticsData = await adminStatistics();
    return new AppSuccess(res, adminStatisticsData).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};
const getStats = async (req, res, next) => {
  try {
    const statistics = await getStatsService();
    return new AppSuccess(res, statistics).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const getCompeletedRequests = async (req, res, next) => {
  try {
    const services = await getCompeletedRequestsService(req.params.filter);
    return new AppSuccess(res, services).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const exportUser = async (req, res, next) => {
  try {
    const { userRole } = req.query;
    const url = await exportUserService(userRole);
    return new AppSuccess(res, url).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getAllUsers,
  searchAllUsers,
  getUserProfile,
  approveArtisan,
  disapproveUser,
  deactivateUser,
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
};
