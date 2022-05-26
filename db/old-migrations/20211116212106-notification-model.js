'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable("Notification",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      type:{
        type: DataTypes.TEXT,
      },
      senderId: {
        type: DataTypes.INTEGER,
        references: {
          model: "User",
          key: "id",
        },
      },
      receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
      },
      data: {
        type: DataTypes.JSON,
      },
      dateTime: {
        type: DataTypes.DATE,
      },
      
    },
  );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Notification");
  }
};
