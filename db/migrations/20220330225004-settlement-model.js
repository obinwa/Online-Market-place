'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    queryInterface.createTable(
      "Settlement",
    {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      settlementPercentage:{
        type: DataTypes.INTEGER,
      },
      settlementHours:{
        type: DataTypes.INTEGER,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      }
    });     
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.dropTable("Settlement");
  }
};
