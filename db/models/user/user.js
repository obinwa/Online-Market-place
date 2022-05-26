/* jshint indent: 2 */
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const { hashPassword } = require("../../../utils/hash");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(350),
        allowNull: false,
        unique: true,
      },
      phoneNumber: {
        type: DataTypes.STRING(35),
        allowNull: false,
        unique: true,
      },
      firstName: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING(1000),
      },
      registerType: {
        type: DataTypes.ENUM("facebook", "email"),
      },
      userRole: {
        type: DataTypes.ENUM("artisan", "customer", "admin"),
        allowNull: false,
        set(value) {
          this.setDataValue("userRole", value);
          if (value !== "admin")
            this.setDataValue("registrationStatus", "pending");
          else this.setDataValue("registrationStatus", "completed");
          if (value === "artisan")
            this.setDataValue("approvalStatus", "pending");
          else this.setDataValue("approvalStatus", "approved");
          if (value === "admin") {
            this.setDataValue("isEmailNotify", true);
            this.setDataValue("isOrderNotify", true);
            this.setDataValue("isVendorNotify", true);
            this.setDataValue("isCustomerNotify", true);
          }
        },
      },
      registrationStatus: {
        type: DataTypes.ENUM("pending", "incomplete", "completed"),
        // allowNull: false,
      },
      approvalStatus: {
        type: DataTypes.ENUM("approved", "pending", "declined"),
      },
      isActivated: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isEmailNotify: {
        type: Sequelize.BOOLEAN,
      },
      isOrderNotify: {
        type: Sequelize.BOOLEAN,
      },
      isVendorNotify: {
        type: Sequelize.BOOLEAN,
      },
      isCustomerNotify: {
        type: Sequelize.BOOLEAN,
      },
      nokFirstName: {
        type: DataTypes.TEXT,
      },
      nokLastName: {
        type: DataTypes.TEXT,
      },
      nokEmail: {
        type: DataTypes.STRING(350),
      },
      nokPhoneNumber: {
        type: DataTypes.STRING(35),
      },
      nokRelationship: {
        type: DataTypes.TEXT,
      },
      nokAddress: {
        type: DataTypes.TEXT,
      },
      nokState: {
        type: DataTypes.TEXT,
      },
      nokLocalGovernment: {
        type: DataTypes.TEXT,
      },
      nokCity: {
        type: DataTypes.TEXT,
      },
      nokCountry: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      lastOrderedDate: {
        type: DataTypes.DATE,
      },
      isOnline: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      profileImageUrl: {
        type: DataTypes.TEXT,
        set(value) {
          if (value) {
            this.setDataValue("profileImageUrl", value);
          }
        },
      },
      idImageUrl: {
        type: DataTypes.TEXT,
        set(value) {
          if (value) {
            this.setDataValue("idImageUrl", value);
            let profileCompletion = this.get("profileCompletion");
            profileCompletion["idImage"] = "added";
            this.setDataValue("profileCompletion", profileCompletion);
          } else {
            if (!this.getDataValue("idImageUrl")) {
              let profileCompletion = this.get("profileCompletion");
              profileCompletion["idImage"] = "";
              this.setDataValue("profileCompletion", profileCompletion);
            }
          }
        },
      },
      proofOfAddressUrl: {
        type: DataTypes.TEXT,
        set(value) {
          if (value) {
            this.setDataValue("proofOfAddressUrl", value);
            let profileCompletion =
              this.getDataValue("profileCompletion") || {};
            profileCompletion["proofOfAddress"] = "added";
            this.setDataValue("profileCompletion", profileCompletion);
          } else {
            if (!this.getDataValue("proofOfAddressUrl")) {
              let profileCompletion =
                this.getDataValue("profileCompletion") || {};
              profileCompletion["proofOfAddress"] = "";
              this.setDataValue("profileCompletion", profileCompletion);
            }
          }
        },
      },
      // let profileCompletion = {
      //   "location":"",
      //   "profile":  "",
      //   "proofOfAddress": "",
      //   "service":"",
      //   "bankDetails":""
      // };
      profileCompletion: {
        type: DataTypes.JSON,
        get() {
          let value = this.getDataValue("profileCompletion");
          if (!value) {
            return {};
          }
          return value;
        },
      },
      newPhoneNumber: {
        type: DataTypes.STRING(35),
      },
      lastLoginDate: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      name: {
        singular: "user",
        plural: "users",
      },
      tableName: "User",
      timestamps: true,
    }
  );

  User.associate = function (models) {
    User.hasMany(models.Otp, { foreignKey: "userId" });
    User.belongsToMany(
      models.Service,
      { through: models.ArtisanService },
      { foreignKey: "userId" }
    );
    User.hasMany(models.ArtisanService, { foreignKey: "userId" });
    User.hasOne(models.Location, { foreignKey: "userId" });
    User.hasOne(models.AccountDetails, { foreignKey: "userId" });
    User.hasOne(models.Device, { foreignKey: "userId" });
    User.hasMany(models.Task, { foreignKey: "customerId" });
    User.hasMany(models.AuditTrail, { foreignKey: "userId" });
  };

  User.addScopes = function (models) {
    User.addScope("isArtisan", { where: { userRole: "artisan" } });

    User.addScope("isCustomer", { where: { userRole: "customer" } });

    User.addScope("default", { where: { registrationStatus: "completed" } });
  };

  User.addMethods = function (models) {
    User.prototype.hasRegistered = async () => {
      let whereCondition = { registrationStatus: "completed" };

      return models.User.findAll({
        where: whereCondition,
      });
    };

    User.prototype.isPending = async () => {
      let whereCondition = { registrationStatus: "pending" };

      return models.User.findAll({
        where: whereCondition,
      });
    };

    User.prototype.addLocation = async function (
      address,
      localGovernment,
      city,
      state,
      country
    ) {
      address = address?.trim();
      localGovernment = localGovernment?.trim();
      city = city?.trim();
      state = state?.trim();
      country = country?.trim();

      if (address && localGovernment && city && state && country) {
        await models.Location.create({
          address,
          localGovernment,
          city,
          state,
          country,
          userId: this.id,
        });
        this["profileCompletion"]["location"] = "added";
        await this.save();
      } else if (address || localGovernment || city || state || country) {
        await models.Location.create({
          address,
          localGovernment,
          city,
          state,
          country,
          userId: this.id,
        });
        this["profileCompletion"]["location"] = "";
        await this.save();
      }
      return;
    };

    User.prototype.addArtisanService = async function (
      price,
      currency,
      serviceId
    ) {
      if ((price, currency, serviceId)) {
        await models.ArtisanService.create({
          price,
          currency,
          ranking: "Primary",
          userId: this.id,
          serviceId,
        });
        await this.save();
      }
    };

    // User.prototype.addPrimaryUserService = async function (serviceName) {
    //   let ranking = "Primary";
    //   if (serviceName.trim().length === 0)
    //     throw Error("user must have primary service");

    //   let service = await models.Service.findOne({
    //     where: { name: serviceName },
    //   });
    //   if (!service)
    //     service = await models.Service.create({ name: serviceName }); //to be adjusted

    //   await models.ArtisanService.create({
    //     price: null,
    //     ranking,
    //     userId: this.id,
    //     serviceId: service.id,
    //   });

    return;
  };

  User.prototype.addSecondaryServices = async function (services) {
    let ranking = "Secondary";
    let previousUserServices = await models.ArtisanService.findAll({
      where: { [Op.and]: [{ userId: this.id }, { ranking }] },
    });
    await previousUserServices.destroy();

    // User.prototype.addSecondaryServices = async function (services) {
    //   let ranking = "Secondary";
    //   let previousUserServices = await models.ArtisanService.findAll({
    //     where: { [Op.and]: [{ userId: this.id }, { ranking }] },
    //   });
    //   await previousUserServices.destroy();

    //   if (!services) return;
    //   if (!Array.isArray(services)) services = [services];

    //   for (let i = 0; i < services.length; i++) {
    //     let service = await models.Service.findOne({
    //       where: { name: services[i] },
    //     });
    //     if (!service) service = await models.Service.create({ name: service }); //to be adjusted
    //     await ArtisanService.create({
    //       price: null,
    //       ranking,
    //       userId: this.id,
    //       serviceId: service.id,
    //     });
    //   }
    //   this["profileCompletion"]["services"] = "updated";
    //   await this.save();
    //   return;
    // };

    User.prototype.saveFileAndGetUrl = async function (url) {
      return url;
    };

    User.prototype.getFile = async function (url) {
      return url;
    };

    User.prototype.hashPassword = async function (password) {
      this.password = await hashPassword(password);
      await this.save();
    };
  };

  User.prototype.saveFileAndGetUrl = async function (url) {
    return url;
  };

  // await User.sync({ force: true });

  return User;
};
