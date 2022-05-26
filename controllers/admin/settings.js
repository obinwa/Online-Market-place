const {
  updatedEmailService,
  updatedOrderService,
  updatedVendorService,
  updatedCustomerService,
} = require('../../services/admin/settings');

const { saveAudit } = require('./audit-trail');

const { AppSuccess } = require('../../utils/');
const updateEmailNotifications = async (req, res, next) => {
  try {
    await updatedEmailService(req.user.id, req.body.email);
    await saveAudit(
      req.user.id,
      'Updated Email Notifications',
      'successful',
      req
    );

    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Email Notification');
  } catch (err) {
    await saveAudit(
      req.user.id,
      'Updated Email Notifications',
      'unsuccessful',
      req
    );
    next(err);
  }
};

const updateOrderNotification = async (req, res, next) => {
  try {
    await updatedOrderService(req.user.id, req.body.order);
    await saveAudit(
      req.user.id,
      'Updated Order Notifications',
      'successful',
      req
    );
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Order Notification');
  } catch (err) {
    await saveAudit(
      req.user.id,
      'Updated Order Notifications',
      'unsuccessful',
      req
    );
    next(err);
  }
};
const updateVendorNotification = async (req, res, next) => {
  try {
    await updatedVendorService(req.user.id, req.body.vendor);
    await saveAudit(
      req.user.id,
      'Updated Vendor Notifications',
      'successful',
      req
    );
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Vendor Notification');
  } catch (err) {
    await saveAudit(
      req.user.id,
      'Updated Vendor Notifications',
      'unsuccessful',
      req
    );
    next(err);
  }
};
const updateCustomerNotification = async (req, res, next) => {
  try {
    await updatedCustomerService(req.user.id, req.body.customer);
    await saveAudit(
      req.user.id,
      'Updated Customer Notifications',
      'successful',
      req
    );
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Customer Notification');
  } catch (err) {
    await saveAudit(
      req.user.id,
      'Updated Customer Notifications',
      'unsuccessful',
      req
    );
    next(err);
  }
};

module.exports = {
  updateEmailNotifications,
  updateOrderNotification,
  updateVendorNotification,
  updateCustomerNotification,
};
