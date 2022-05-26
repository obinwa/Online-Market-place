'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    queryInterface.createTable(
    "Chat",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      adminId: {
        type: DataTypes.INTEGER,
        references: {
          model: "User",
          key: "id",
        },
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id",
        },
      },
      message: {
        type: DataTypes.TEXT,
      },
      fileUrl: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
    }
    );     
  },

  down: async (queryInterface, Sequelize) => {
    queryInterface.dropTable("Chat");
  }
};
