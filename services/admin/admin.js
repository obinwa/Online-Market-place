const {
  generateAccessToken,
  AppError,
  verifyAccessToken,
  hashPassword,
  generateFiveDigits,
  verifyPassword,
  uploadFile,
  sendEmail,
} = require('../../utils/index');
const { User, Service, Task } = require('../../db/models/index');
const { Op } = require('sequelize');

exports.addUserService = async (data, origin) => {
  const { email } = data;
  const token = await generateAccessToken(data);

  const inviteLink = `${origin}/adduser/verify?token=${token}&email=${email}`;
  const templateData = {
    fullName: `${data.firstName} ${data.lastName}`,
    inviteLink,
    websiteUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
  };
  await sendEmail(email, 'd-d9754b4561fb4e8ca834bbcb5659fec2', templateData);
  return token;
};

exports.acceptInviteService = async ({ email, token }, { password }) => {
  const userExists = await User.findOne({ where: { email } });
  if (userExists) throw new AppError().EMAIL_ALREADY_EXISTS();

  const decoded = await verifyAccessToken(token);
  if (!decoded) throw new AppError().UNVERIFIED_TOKEN();
  if (decoded && decoded.name === 'TokenExpiredError')
    throw new AppError().EXPIRED_TOKEN();
  if (decoded && decoded.name === 'JsonWebTokenError')
    throw new AppError().UNVERIFIED_TOKEN();
  if (decoded.email !== email) throw new AppError().UNVERIFIED_TOKEN();
  const userId = await generateFiveDigits();
  const user = await User.create({
    firstName: decoded.firstName.trim(),
    lastName: decoded.lastName,
    phoneNumber: decoded.phoneNumber,
    password: password,
    email: decoded.email.trim(),
    registrationStatus: 'completed',
    approvalStatus: 'approved',
    userRole: 'admin',
    userId,
  });
  user.password = await hashPassword(password);
  await user.save();

  const payload = {
    id: user.id,
    role: user.userRole,
    email: user.email,
    isActivated: user.isActivated,
    name: `${user.firstName} ${user.lastName}`,
  };
  return payload;
};

exports.updateAdminService = async (id, files, data) => {
  const user = await User.update({ ...data }, { where: { id } });
  const updatedUser = await User.findOne({ where: { id } });

  let imageKeyPrefix = `${data.firstName}-${data.lastName}`;
  if (files) {
    for (const key in files) {
      for (const file of files[key]) {
        const { fieldname, url } = await uploadFile(file, imageKeyPrefix);
        updatedUser[fieldname] = url.Location;
        await updatedUser.save();
      }
    }
  }

  return updatedUser;
};

exports.getAdminService = async (id) => {
  return await User.findOne({ where: { id, userRole: 'admin' } });
};

exports.deactivateAccountService = async (id) => {
  const user = await User.findOne({ where: { id } });
  user.isActivated = false;
  await user.save();
  return true;
};

exports.activateAccountService = async (id) => {
  const user = await User.findOne({ where: { id } });
  user.isActivated = true;
  await user.save();
  return true;
};

exports.getTeamMembersService = async () => {
  const team = await User.findAndCountAll({ where: { userRole: 'admin' } });
  return team;
};
