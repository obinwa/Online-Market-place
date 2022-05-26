"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Otp", "expiryDate", Sequelize.DATE);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Otp", "expiryDate");
  },
};
