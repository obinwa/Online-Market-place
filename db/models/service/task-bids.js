const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const TaskBid = sequelize.define(
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
      artisanServiceId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'ArtisanService',
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
    {
      sequelize,
      name: {
        singular: "taskBid",
        plural: "taskBids",
      },
      tableName: "TaskBid",
      timestamps: false,
    }
  );

  TaskBid.associate = function (models) {
    TaskBid.belongsTo(models.Task, { foreignKey: "taskId" });
    TaskBid.belongsTo(models.User, { foreignKey: "artisanId" });
    TaskBid.belongsTo(models.ArtisanService, { foreignKey: "artisanServiceId" });
  };

  return TaskBid;
}