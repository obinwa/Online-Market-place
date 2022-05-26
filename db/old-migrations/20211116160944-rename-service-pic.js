"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn("Service", "pictureUrl", "idImageUrl");
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameColumn("Users", "idImageUrl", "pictureUrl");
  },
};
