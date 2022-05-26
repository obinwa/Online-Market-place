'use strict';
require('dotenv').config();
const env = process.env.NODE_ENV || 'development';
const { User } = require('../db/models');

const { AppError, verifyAccessToken } = require('../utils/');

exports.verifyToken = async (req, res, next) => {
  try {
    const authority = req.headers['authorization'];
    if (!authority) throw new AppError().UNVERIFIED_TOKEN();
    const token = authority.split(' ')[1];
    if (!token) throw new AppError().UNVERIFIED_TOKEN();
    const decoded = await verifyAccessToken(token);
    if (decoded && decoded.name === 'TokenExpiredError')
      throw new AppError().EXPIRED_TOKEN();
    if (decoded && decoded.name === 'JsonWebTokenError')
      throw new AppError().UNVERIFIED_TOKEN();

    req.user = {
      ...decoded,
    };
    next();
  } catch (error) {
    next(error);
  }
};

exports.checkIsActivated = async (req, res, next) => {
  try {
    const { user } = req;
    const { isActivated, approvalStatus } = await User.findOne({
      where: { id: user.id },
    });
    if (!isActivated) throw new AppError().DEACTIVATED();
    if (approvalStatus === 'declined') throw new AppError().DISSAPROVED();
    next();
  } catch (error) {
    next(error);
  }
};

exports.verifyAdminRole = (req, res, next) => {
  try {
    const { user } = req;
    if (user.role !== 'admin') throw new AppError().UNAUTHORIZED();

    next();
  } catch (error) {
    next(error);
  }
};

exports.verifyClientRole = (req, res, next) => {
  try {
    const { user } = req;
    if (user.role !== 'artisan' && user.role !== 'customer')
      throw new AppError().UNAUTHORIZED();

    next();
  } catch (error) {
    next(error);
  }
};

exports.verifyArtisanRole = (req, res, next) => {
  try {
    const { user } = req;
    if (user.role !== 'artisan') throw new AppError().UNAUTHORIZED();

    next();
  } catch (error) {
    next(error);
  }
};

exports.addTestUser = async (req, res, next) => {
  try {
    if (env === 'test') {
      req.user = {
        id: 3,
      };
    }
    next();
  } catch (error) {
    next();
  }
};
