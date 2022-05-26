"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("AuditTrail", "createdAt", Sequelize.DATE);
    await queryInterface.addColumn("AuditTrail", "updatedAt", Sequelize.DATE);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("AuditTrail", "createdAt");
    await queryInterface.removeColumn("AuditTrail", "updatedAt");
  },
};
