const { Service, User } = require('../db/models');
const { AppSuccess } = require('../utils');
const states = require('../constants');
const customerService = require('../services/customer/profile');
const { saveAudit } = require('./admin/audit-trail');
const { Op } = require('sequelize');
const updateRegToken = async function (req, res, next) {
  try {
    await customerService.updateRegToken(req.user.id, req.body.regToken);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

const getAllServices = async (req, res, next) => {
  try {
    let services;
    if (req.query.keyword) {
      services = await Service.findAll({
        where: {
          name: {
            [Op.iLike]: `%${req.query.keyword}%`,
          },
        },
      });
    } else {
      services = await Service.findAll();
    }
    return new AppSuccess(res, services).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const toggleOnlieStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    const user = await User.findByPk(userId);

    user.isOnline = isOnline;

    await user.save();

    return new AppSuccess(res, null).UPDATED_SUCCESSFULLY('User');
  } catch (error) {
    next(error);
  }
};

const getAllStates = async (req, res, next) => {
  try {
    const state = states.map((item) => item.state);
    return new AppSuccess(res, state).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const getLGAs = async (req, res, next) => {
  try {
    const { state } = req.params;
    const lgas = states.find((item) => item.state === state);
    return new AppSuccess(res, lgas).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const deactivateAccount = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const user = await User.findOne({ where: { id, userRole: role } });
    user.isActivated = false;
    await user.save();
    await saveAudit(id, 'deactivated account', 'successful', req);
    return new AppSuccess(res).UPDATED_SUCCESSFULLY(user.userRole);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const searchService = async (req, res, next) => {
  try {
    const services = await Service.findAll({
      where: {
        name: {
          [Op.iLike]: `%${req.query.keyword}%`,
        },
      },
    });
    return new AppSuccess(res, services).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServices,
  toggleOnlieStatus,
  getAllStates,
  getLGAs,
  updateRegToken,
  deactivateAccount,
  searchService,
};
