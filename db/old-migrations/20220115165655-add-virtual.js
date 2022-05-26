'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Service", "lowerCaseName", {
      type: Sequelize.VIRTUAL,
      get() {
        return this.getDataValue("name").toLowerCase();
      }

    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
