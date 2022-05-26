const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Device = sequelize.define(
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
      },
    },
    {
      sequelize,
      name: {
        singular: "device",
        plural: "devices",
      },
      tableName: "Device",
      timestamps: false,
    }
  );
  
    Device.associate = function (models) {
      Device.belongsTo(models.User, { foreignKey: "userId" });
    };
  
    return Device;
}