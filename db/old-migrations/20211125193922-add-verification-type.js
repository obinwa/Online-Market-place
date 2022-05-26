"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("User", "registerType", {
      type: Sequelize.ENUM,
      values: ["email", "facebook"],
      defaultValue: "email",
    });
  },

  down: async (queryInterface, Sequelize) => {
     await queryInterface.removeColumn("User", "registerType");
  },
};
