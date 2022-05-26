// name,
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Service = sequelize.define(
    "Service",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      idImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      commission: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      lowerCaseName: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.getDataValue("name")?.toLowerCase();
        }
      }
    },
    {
      sequelize,
      name: {
        singular: "service",
        plural: "services",
      },
      tableName: "Service",
      timestamps: true,
    }
  );

  Service.associate = function (models) {
    Service.hasOne(models.Task, { foreignKey: "serviceId" ,onDelete:"RESTRICT" });
    Service.belongsToMany(
      models.User,
      { through: models.ArtisanService },
      { foreignKey: "serviceId" }
    );
  };

  return Service;
};
