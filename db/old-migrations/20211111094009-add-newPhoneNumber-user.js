"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      "User",
      "newPhoneNumber",
      Sequelize.STRING(35)
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("User", "newPhoneNumber");
  },
};
