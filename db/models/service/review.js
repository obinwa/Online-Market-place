const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Review = sequelize.define(
    "Review",
    {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      customerId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: "id",
        }
      },
      artisanId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: "id",
        }
      },
      customerRating:{
        type: DataTypes.INTEGER,
      },
      customerComment:{
        type: DataTypes.TEXT,
      },
      artisanRating:{
        type: DataTypes.INTEGER,
      },
      artisanComment:{
        type: DataTypes.TEXT,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      taskId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'Task',
          key: "id",
        },
        onDelete:"SET NULL"
      },
    },
    {
      sequelize,
      name: {
        singular: "review",
        plural: "reviews",
      },
      tableName: "Review",
      timestamps: true,
    }
  );

  Review.associate = function (models) {
    Review.belongsTo(models.Task, { foreignKey: "taskId" });
    Review.belongsTo(models.User,{ as: 'artisan', constraints: false }, { foreignKey: "artisanId" });
    Review.belongsTo(models.User,{ as: 'customer', constraints: false }, { foreignKey: "customerId" });
  };

  return Review;
}