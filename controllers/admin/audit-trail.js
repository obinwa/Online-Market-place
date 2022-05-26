const { AuditTrail, User } = require('../../db/models');
const { generateFiveDigits } = require('../../utils');
const { AppSuccess } = require('../../utils/');
const { Op } = require('sequelize');
const fs = require('fs');
const { uploadFile } = require('../../utils');
const path = require('path');
const {
  getDateRange,
} = require("../../helper/service-helper");

const excelJS = require('exceljs');

const formatAudits = (audits) => {
  return audits.rows.map((item) => {
    return {
      ...item.dataValues,
      user: {
        id: item.user.id,
        imageUrl: item.user.profileImageUrl,
        firstName: item.user.firstName,
        lastName: item.user.lastName,
        userRole: item.user.userRole,
        email: item.user.email,
      },
    };
  });
};

const saveAudit = async (userId, type, status, req) => {
  const auditId = generateFiveDigits();

  const audit = new AuditTrail({
    auditId,
    userId,
    activity: type,
    status,
    endpoint: req.originalUrl,
    ip: req.socket.remoteAddress,
    device: req.headers['user-agent'],
  });

  await audit.save();
};

const getAuditTrails = async (req, res, next) => {
  try {
    const { page, limit,role,startDate,endDate,email} = req.query;
    let [minDate, maxDate] = getDateRange(startDate, endDate);
    let audits = [];
    if(!role && !email){
      audits = await AuditTrail.findAndCountAll({
        where: {
          createdAt: {
            [Op.lte]: new Date(maxDate),
            [Op.gte]: new Date(minDate),
          },
        },
        include: {
          model: User,
        },
        offset: (page - 1) * limit,
        limit: +limit,
      });

    }else if(role && !email){
      audits = await AuditTrail.findAndCountAll({
        where: {
          createdAt: {
            [Op.lte]: new Date(maxDate),
            [Op.gte]: new Date(minDate),
          },
        },
        include: {
          model: User,
          where: { userRole: role },
        },
        offset: (page - 1) * limit,
        limit: +limit,
      });
    }else if(!role && email){
      audits = await AuditTrail.findAndCountAll({
        where: {
          createdAt: {
            [Op.lte]: new Date(maxDate),
            [Op.gte]: new Date(minDate),
          },
        },
        include: {
          model: User,
          where: { email: email },
        },
        offset: (page - 1) * limit,
        limit: +limit,
      });
    }else{
      audits = await AuditTrail.findAndCountAll({
        where: {
          createdAt: {
            [Op.lte]: new Date(maxDate),
            [Op.gte]: new Date(minDate),
          },
        },
        include: {
          model: User,
          where:{ 
            [Op.and]:[
              { userRole: role },
              { email: email }
            ]
          }  
        },
        offset: (page - 1) * limit,
        limit: +limit,
      });
    }

    
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (err) {
    next(err);
  }
};
const filterByRoleAuditTrail = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const audits = await AuditTrail.findAndCountAll({
      include: {
        model: User,
        where: { userRole: req.query.role },
      },
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const filterByDateAuditTrail = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const audits = await AuditTrail.findAndCountAll({
      where: {
        createdAt: {
          [Op.lte]: new Date(req.query.date),
        },
      },
      include: {
        model: User,
      },
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const filterAuditTrail = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    let query = {};

    if (req.query.userRole) {
      query = {
        include: {
          model: User,
          where: { userRole: req.query.userRole },
        },
      };
    }
    if (req.query.createdAt) {
      query = {
        ...query,
        where: {
          ...query.where,
          createdAt: {
            [Op.lte]: new Date(req.query.createdAt),
          },
        },
      };
    }
    if ((req, query.time)) {
      query = {
        ...query,
        where: {
          ...query.where,
          createdAt: {
            [Op.lte]: new Date(req.query.time),
          },
        },
      };
    }
    const audits = await AuditTrail.findAndCountAll({
      ...query,
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (err) {
    next(err);
  }
};

const sortByCreatedAtAuditTrail = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const audits = await AuditTrail.findAndCountAll({
      order: [['createdAt', 'DESC']],
      include: {
        model: User,
      },
      offset: (page - 1) * limit,
      limit: +limit,
    });
    const data = formatAudits(audits);
    return new AppSuccess(res, {
      data,
      count: audits.count,
    }).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

const exportAuditTrail = async (req, res, next) => {
  try {
    const trails = await AuditTrail.findAll({ include: { model: User } });
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Trail');
    const filePath = './file';
    worksheet.columns = [
      { header: 'Audit Id', key: 'auditId', width: 10 },
      { header: 'User', key: 'user', width: 10 },
      { header: 'email', key: 'email', width: 10 },
      { header: 'Role', key: 'role', width: 10 },
      { header: 'Activity', key: 'activity', width: 10 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Endpoint', key: 'endpoint', width: 10 },
      { header: 'IP', key: 'ip', width: 10 },
      { header: 'Device', key: 'device', width: 10 },
      { header: 'Created At', key: 'createdAt', width: 10 },
    ];

    trails.forEach((item) => {
      worksheet.addRow({
        auditId: item.auditId,
        user: item.user.firstName + ' ' + item.user.lastName,
        email: item.user.email,
        role: item.user.userRole,
        activity: item.activity,
        status: item.status,
        endpoint: item.endpoint,
        ip: item.ip,
        device: item.device,
        createdAt: item.createdAt,
      });
    });
    await workbook.xlsx.writeFile(`${filePath}/audit-trail.xlsx`);
    const xlsxPath = `${filePath}/audit-trail.xlsx`;
    const fullPath = path.join(__dirname, `../../${xlsxPath}`);
    const buffered = await fs.readFileSync(fullPath);
    const file = {
      buffer: buffered,
      originalname: `audit-trail.xlsx`,
    };
    const uploaded = await uploadFile(file, 'downloaded');
    return new AppSuccess(res, uploaded.url.Location).FETCHED_SUCCESFULLY();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveAudit,
  getAuditTrails,
  filterAuditTrail,
  sortByCreatedAtAuditTrail,
  exportAuditTrail,
};
