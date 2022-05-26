"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.createTable("AuditTrail", {
      id: {
        autoIncrement: true,
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      auditId: {
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.DataTypes.INTEGER,
        references: {
          model: {
            tableName: "User",
          },
          key: "id",
        },
        allowNull: false,
      },
      activity: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.DataTypes.ENUM,
        values: ["successful", "unsuccessful"],
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.dropTable("AuditTrail");
  },
};
