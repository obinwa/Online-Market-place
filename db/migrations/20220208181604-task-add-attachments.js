'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Task", "attachments", Sequelize.JSON);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Task", "attachments");
  },
};
