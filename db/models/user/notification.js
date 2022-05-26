const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Notification = sequelize.define(
    "Notification",
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
      isRejected:{
        type:DataTypes.BOOLEAN,
      },
      taskId: {
        type: DataTypes.INTEGER,
        references: {
          model: "Task",
          key: "id",
        },
      },

    },
    {
      sequelize,
      name: {
        singular: "notification",
        plural: "notifications",
      },
      tableName: "Notification",
      timestamps: false,
    }
  );

  Notification.associate = function (models) {
    Notification.belongsTo(models.User, {
      as: "Sender",
      foreignKey: "senderId",
    });

    Notification.belongsTo(models.User, {
      as: "Receiver",
      foreignKey: "receiverId",
    });

    Notification.belongsTo(models.Task, {
      foreignKey: "taskId",
    });
  };

  return Notification;
};
