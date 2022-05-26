'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Task","createdAt",Sequelize.DATE);
    await queryInterface.addColumn("Task","updatedAt",Sequelize.DATE);
    await queryInterface.addColumn("Task","artisanAmount",Sequelize.FLOAT);
    await queryInterface.addColumn("Task","afriserveAmount",Sequelize.FLOAT);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Task","createdAt");
    await queryInterface.addColumn("Task","updatedAt");
    await queryInterface.addColumn("Task","artisanAmount");
    await queryInterface.addColumn("Task","afriserveAmount");
  }
};
