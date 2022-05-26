const { AppSuccess } = require('../../utils/');

const {
  resolveIssue,
  getAllReports,
  getAllUnresolvedReports,
} = require('../../services/admin/issue-report');

exports.resolveIssue = async function (req, res, next) {
  try {
    const { id } = req.params;
    await resolveIssue(id);
    return new AppSuccess(res).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getAllReports = async function (req, res, next) {
  try {
    const { id } = req.params;
    let data = await getAllReports();
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};

exports.getAllUnresolvedReports = async function (req, res, next) {
  try {
    const { id } = req.params;
    let data = await getAllUnresolvedReports();
    return new AppSuccess(res, data).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
};
