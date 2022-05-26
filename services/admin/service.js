const { Service } = require('../../db/models');
const {
  uploadFile,
  generateFiveDigits,
  AppError,
} = require('../../utils/index');
const { Op } = require('sequelize');

exports.getServices = async (query) => {
  const { page, limit, status } = query;

  const offset = (page - 1) * limit;

  let services;
  if (status) {
    services = await Service.findAndCountAll({
      where: {
        status,
      },
      offset,
      limit,
    });
  } else {
    services = await Service.findAndCountAll({
      offset,
      limit,
    });
  }

  return {
    data: services.rows,
    count: services.count,
  };
};

// exports.searchServiceService = async (search) => {
//   const services = await Service.findAll({
//     where: {
//       name: {
//         [Op.iLike]: `%${search}%`,
//       },
//     },
//   });
//   return services
// }

exports.addToService = async (files, data) => {
  const serviceId = generateFiveDigits();

  data.name = data.name.trim();
  let previousService = await Service.findAll({
    where: {
      name: data.name,
    },
  });

  if (previousService.length > 0)
    throw new AppError().GENERIC_ERROR('Service already exists');
  const service = await Service.create({ ...data, serviceId, idImageUrl: '' });
  let imageKeyPrefix = `${service.name}`;
  for (const key in files) {
    for (const file of files[key]) {
      const { fieldName, url } = await uploadFile(file, imageKeyPrefix);
      service[fieldName] = url.Location;
      await service.save();
    }
  }

  return service;
};

exports.updateService = async (data, files, id) => {
  const service = await Service.findOne({ where: { id } });
  if (!service) throw new AppError().GENERIC_ERROR('Service does not exist');

  let imageKeyPrefix = `${service.name}`;
  for (const key in files) {
    for (const file of files[key]) {
      const { fieldName, url } = await uploadFile(file, imageKeyPrefix);
      service[fieldName] = url.Location;
      await service.save();
    }
  }

  await Service.update(data, {
    where: {
      id: id,
    },
  });
  return service;
};

exports.deleteService = async (id) => {
  const service = await Service.findOne({ where: { id } });
  if (!service) throw new AppError().GENERIC_ERROR('Service does not exist');
  await Service.destroy({ where: { id } });
  return service;
};

exports.activateServiceService = async (id) => {
  const service = await Service.findOne({ where: { id } });
  if (!service) throw new AppError().GENERIC_ERROR('Service does not exist');

  await Service.update(
    { status: true },
    {
      where: {
        id: id,
      },
    }
  );

  return true;
};
exports.deActivateServiceService = async (id) => {
  const service = await Service.findOne({ where: { id } });
  if (!service) throw new AppError().GENERIC_ERROR('Service does not exist');

  await Service.update(
    { status: false },
    {
      where: {
        id: id,
      },
    }
  );

  return true;
};
