const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Chat = sequelize.define(
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
    },
    {
      sequelize,
      name: {
        singular: "chat",
        plural: "chats",
      },
      tableName: "Chat",
      timestamps: true,
    }
  );

  Chat.associate = function (models) {
    Chat.belongsTo(models.User, {
      as: "Client",
      foreignKey: "clientId",
    });

    Chat.belongsTo(models.User, {
      as: "Admin",
      foreignKey: "adminId",
    });
  };

  return Chat;
};
