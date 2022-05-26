"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Service", "createdAt", {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });

    await queryInterface.addColumn("Service", "updatedAt", {
      type: Sequelize.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    });
    await queryInterface.addColumn("Service", "status", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });
    await queryI;
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Service", "createdAt");
    await queryInterface.removeColumn("Service", "updatedAt");
    await queryInterface.removeColumn("Service", "status");
  },
};
