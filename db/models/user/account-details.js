const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = (sequelize, DataTypes) => {
  const AccountDetails = sequelize.define(
    "AccountDetails",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      bankName: {
        type: DataTypes.STRING(350),
      },
      bankCode: {
        type: DataTypes.STRING(35),
      },
      accountName: {
        type: DataTypes.STRING(350),
      },
      accountNumber: {
        type: DataTypes.STRING(35),
        unique: true
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
          singular: "accountDetails",
          plural: "accountDetails",
        },
        tableName: "AccountDetails",
        timestamps: false,
      }
    );

    AccountDetails.associate = function (models) {
      AccountDetails.belongsTo(models.User, { foreignKey: "userId" });
    };

    return AccountDetails;
  }