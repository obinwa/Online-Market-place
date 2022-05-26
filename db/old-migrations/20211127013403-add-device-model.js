'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    queryInterface.createTable(
    "Device",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      regToken: {
        type: DataTypes.STRING,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
      }
    });     
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.dropTable("Device");
  }
};
