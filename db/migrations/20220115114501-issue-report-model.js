'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    queryInterface.createTable(
      "IssueReport", {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      dateTime: {
        type: DataTypes.DATE
      },
      reporterId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: "id",
        }
      },
      reporteeId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: "id",
        }
      },
      description:{
        type: DataTypes.TEXT,
      },     
      taskId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'Task',
          key: "id",
        }
      },
      isResolved:{
        type: DataTypes.BOOLEAN,
      }
    });     
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.dropTable("IssueReport");
  }
};
