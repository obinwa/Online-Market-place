"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("AuditTrail", "endpoint", Sequelize.STRING);
    await queryInterface.addColumn("AuditTrail", "ip", Sequelize.STRING);
    await queryInterface.addColumn("AuditTrail", "device", Sequelize.STRING);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("AuditTrail", "ip");
  },
};
