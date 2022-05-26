const bcrypt = require("bcrypt");

/**
 *
 * @param password  - user password
 * @returns {String} - hashed password
 */

exports.hashPassword = async (password) => {
  try {
    const hashed = await bcrypt.hash(password, 12);
    return hashed;
  } catch (error) {
    return false;
  }
};

exports.verifyPassword = async (password, hashed) => {
  try {
    const doMatch = await bcrypt.compare(password, hashed);
    return doMatch;
  } catch (error) {
    (error);
    return false;
  }
};
