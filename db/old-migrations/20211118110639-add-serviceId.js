"use strict";
const { generateFiveDigits } = require("../../utils");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Service", "serviceId", {
      type: Sequelize.INTEGER,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Service", "serviceId");
  },
};
