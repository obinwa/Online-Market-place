const { User } = require("../../db/models");

const findOneUser = async (id) => {
  const user = await User.findOne({ where: { id } });
  return user;
};

exports.updatedEmailService = async (id, value) => {
  const user = await findOneUser(id);
  user.isEmailNotify = value;
  await user.save();
};

exports.updatedOrderService = async (id, value) => {
  const user = await findOneUser(id);
  user.isOrderNotify = value;
  await user.save();
};

exports.updatedVendorService = async (id, value) => {
  const user = await findOneUser(id);
  user.isVendorNotify = value;
  await user.save();
};

exports.updatedCustomerService = async (id, value) => {
  const user = await findOneUser(id);
  user.isCustomerNotify = value;
  await user.save();
};
