'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Task", "state", Sequelize.STRING);
    await queryInterface.addColumn("Task", "address", Sequelize.TEXT);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Task", "state");
    await queryInterface.removeColumn("Task", "address");
  },
};
