/* jshint indent: 2 */
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
  const AuditTrail = sequelize.define(
    "AuditTrail",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      auditId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: "User",
          key: "id",
        },
        allowNull: false,
      },
      activity: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM,
        values: ["successful", "unsuccessful"],
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      endpoint: {
        type: DataTypes.STRING,
      },
      ip: {
        type: DataTypes.STRING,
      },
      device: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "AuditTrail",
      timestamps: true,
    }
  );

  AuditTrail.associate = function (models) {
    AuditTrail.belongsTo(models.User, { foreignKey: "userId" });
  };

  return AuditTrail;
};
