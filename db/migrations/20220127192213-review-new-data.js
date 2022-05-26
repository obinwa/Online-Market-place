'use strict';

module.exports = {
  up: async(queryInterface, Sequelize) => {
    await queryInterface.addColumn("Review","createdAt",Sequelize.DATE);
    await queryInterface.addColumn("Review","updatedAt",Sequelize.DATE);
    await queryInterface.addColumn("Review","artisanId",Sequelize.INTEGER);
    await queryInterface.addColumn("Review","customerId",Sequelize.INTEGER);
  },

  down: async(queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Review","createdAt");
    await queryInterface.removeColumn("Review","updatedAt");
    await queryInterface.removeColumn("Review","artisanId");
    await queryInterface.removeColumn("Review","customerId");
  }
};
