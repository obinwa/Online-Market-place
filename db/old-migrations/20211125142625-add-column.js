"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.addColumn("User", "isEmailNotify", {
    //   type: Sequelize.BOOLEAN,
    // });
    // await queryInterface.addColumn("User", "isOrderNotify", {
    //   type: Sequelize.BOOLEAN,
    // });
    // await queryInterface.addColumn("User", "isVendorNotify", {
    //   type: Sequelize.BOOLEAN,
    // });
    // await queryInterface.addColumn("User", "isCustomerNotify", {
    //   type: Sequelize.BOOLEAN,
    // });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
