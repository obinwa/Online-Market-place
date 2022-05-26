/* jshint indent: 2 */
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Otp = sequelize.define(
    "Otp",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      expiresIn: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      otpDigits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      otpType: {
        type: DataTypes.ENUM,
        values: [
          "PENDING_REGISTRATION",
          "RESET_PASSWORD",
          "CHANGE_USER_DETAILS",
        ],

        allowNull: false,
      },
      newPhoneNumber: {
        type: DataTypes.STRING(35),
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      },
    },

    {
      sequelize,
      name: {
        singular: "otp",
        plural: "otps",
      },
      tableName: "Otp",
      timestamps: false,
    }
  );

  Otp.associate = function (models) {
    Otp.belongsTo(models.User, { foreignKey: "userId" });
  };

  return Otp;
};
