require('dotenv').config();
const jwt = require('jsonwebtoken');

const accessSecret = process.env.AFRISERVE_TOKEN_ACCESS_SECRET;
const refreshSecret = process.env.AFRISERVE_TOKEN_REFRESH_SECRET;

exports.generateAccessToken = async (payload) => {
  const options = {
    expiresIn: process.env.AFRISERVE_TOKEN_ACCESS_EXPIRE,
  };

  const token = await jwt.sign(payload, accessSecret, options);

  return token;
};

exports.verifyAccessToken = async (token) => {
  try {
    const payload = await jwt.verify(token, accessSecret);
    return payload;
  } catch (err) {
    return err;
  }
};

exports.decodeToken = async (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return error;
  }
};

exports.generateRefreshToken = async (payload) => {
  const options = {
    expiresIn: process.env.AFRISERVE_TOKEN_REFRESH_EXPIRE,
  };
  const token = await jwt.sign(payload, refreshSecret, options);
  return token;
};

exports.verifyRefreshToken = async (token) => {
  try {
    const payload = await jwt.verify(token, refreshSecret);
    return payload;
  } catch (err) {
    return err;
  }
};
exports.decodeToken = async (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return error;
  }
};
