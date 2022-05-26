'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("User", "lastOrderedDate", Sequelize.DATE);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("User", "lastOrderedDate");
  },
};
