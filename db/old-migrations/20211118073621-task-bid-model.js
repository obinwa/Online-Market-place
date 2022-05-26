'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    queryInterface.createTable(
      "TaskBid",
      {
        id:{
          autoIncrement: true,
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        dateTime: {
          type: DataTypes.DATE
        },
        negotiatedPrice:{
          type: DataTypes.INTEGER,
        },
        artisanId:{
          type: DataTypes.INTEGER,
          references: {
            model: 'User',
            key: "id",
          }
        },
        bidMessage:{
          type: DataTypes.TEXT,
        },     
        taskId:{
          type: DataTypes.INTEGER,
          references: {
            model: 'Task',
            key: "id",
          }
        },
      },
    );     
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.dropTable("TasBid");
  }
};
