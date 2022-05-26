const {
  getServices,
  addToService,
  updateService,
  deleteService,
  activateServiceService,
  deActivateServiceService,
  // searchServiceService
} = require('../../services/admin/service');

const { AppSuccess } = require('../../utils/index');
const { saveAudit } = require('./audit-trail');

const getServ = async (req, res, next) => {
  try {
    const services = await getServices(req.query);
    return new AppSuccess(res, services).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};
// const searchService = async (req, res, next) => {
//   try {
//     const services = await searchServiceService(req.query.query);
//     return new AppSuccess(res, services).FETCHED_SUCCESFULLY();
//   } catch (error) {
//     next(error);
//   }
// }
const addServ = async (req, res, next) => {
  try {
    // const { name } = req.body;
    const service = await addToService(req.files, req.body);
    await saveAudit(
      req.user.id,
      `Added ${service.name} to service record`,
      'successful',
      req
    );
    return new AppSuccess(res, service).CREATED_SUCCESSFULLY('service');
  } catch (error) {
    await saveAudit(
      req.user.id,
      `tried adding to the service records`,
      'unsuccessful',
      req
    );
    next(error);
  }
};

const updateServ = async (req, res, next) => {
  try {
    const { id } = req.params;
    // const { name } = req.body;
    const service = await updateService(req.body, req.files, id);
    await saveAudit(
      req.user.id,
      `Updated ${service.name} in the service category`,
      'successful',
      req
    );
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Service');
  } catch (error) {
    await saveAudit(
      req.user.id,
      'tried updating a service in the service records',
      'unsuccessful',
      req
    );
    next(error);
  }
};

const deleteServ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await deleteService(id);
    await saveAudit(
      req.user.id,
      `Deleted ${service.name} from the service records`,
      'successful',
      req
    );
    return new AppSuccess(res).DELETED_SUCCESSFULLY('Service');
  } catch (error) {
    await saveAudit(
      req.user.id,
      `tried deleting a service from the service records`,
      'successful',
      req
    );
    next(error);
  }
};

const activateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    await activateServiceService(id);
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Service');
  } catch (error) {
    next(error);
  }
};

const deActivateService = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deActivateServiceService(id);
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Service');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getServ,
  addServ,
  updateServ,
  deleteServ,
  activateService,
  deActivateService,
  // searchService
};
