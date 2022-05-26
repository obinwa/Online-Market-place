'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("User","nokRelationship",Sequelize.TEXT);
    await queryInterface.addColumn("User","nokCountry",Sequelize.TEXT);
    await queryInterface.addColumn("User","nokAddress",Sequelize.TEXT);
    await queryInterface.addColumn("User","nokCity",Sequelize.TEXT);
    await queryInterface.addColumn("User","nokState",Sequelize.TEXT);
    await queryInterface.addColumn("User","nokLocalGovernment",Sequelize.TEXT);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("User","nokRelationship");
    await queryInterface.removeColumn("User","nokCountry");
    await queryInterface.removeColumn("User","nokAddress");
    await queryInterface.removeColumn("User","nokCity");
    await queryInterface.removeColumn("User","nokLocalGovernment");
    await queryInterface.removeColumn("User","nokState");
  }
};
