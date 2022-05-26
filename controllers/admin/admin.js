const {
  addUserService,
  acceptInviteService,
  changePasswordService,
  updateAdminService,
  getAdminService,
  deactivateAccountService,
  activateAccountService,
  getTeamMembersService,
  getStatsService,
  getCompeletedRequestsService,
} = require('../../services/admin/admin');
const { AppSuccess, createLoginCreds } = require('../../utils/');
const { saveAudit } = require('./audit-trail');

const getProfile = async (req, res, next) => {
  try {
    const profile = await getAdminService(req.user.id);
    return new AppSuccess(res, profile).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const sendInvite = async (req, res, next) => {
  try {
    const origin = req.headers['origin'];
    const url = await addUserService(req.body, origin);
    await saveAudit(req.user.id, 'invited a new user', 'successful', req);
    return new AppSuccess(res, url).USER_ADDED();
  } catch (error) {
    await saveAudit(req.user.id, 'invited a new user', 'unsuccessful', req);
    next(error);
  }
};

const acceptInvite = async (req, res, next) => {
  try {
    const payload = await acceptInviteService(req.params, req.body);
    // await saveAudit(payload.id, "has accepted invite", "successful", req);
    return await createLoginCreds(res, payload);
  } catch (error) {
    next(error);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = await updateAdminService(id, req.files, req.body);
    await saveAudit(payload.id, 'updated profile', 'successful', req);
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Your profile');
    return res.json({ middleware: 'Done' });
  } catch (error) {
    next(error);
  }
};

// const changePassword = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const user = await changePasswordService(req.body, id);
//     return new AppSuccess(res).UPDATED_SUCCESSFULLY("Your password");
//   } catch (error) {
//     next(error);
//   }
// };

const deactivateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = deactivateAccountService(id);
    await saveAudit(id, 'deactivated account', 'successful', req);
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Account');
  } catch (error) {
    next(error);
  }
};

const activateAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = activateAccountService(id);
    await saveAudit(id, 'activated account', 'successful', req);
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Account');
  } catch (error) {
    next(error);
  }
};

const getTeamMembers = async (req, res, next) => {
  try {
    const team = await getTeamMembersService();
    return new AppSuccess(res, team).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendInvite,
  acceptInvite,
  updateAdmin,
  getProfile,
  deactivateAccount,
  activateAccount,
  getTeamMembers,
};
