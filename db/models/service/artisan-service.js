const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const ArtisanService = sequelize.define(
    "ArtisanService",
    {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      price:{
        type:DataTypes.INTEGER,
        // set(value){
        //   if(value <= 0) throw Error("Price must be a positive number");
        //   else this.setDataValue('price', value);
        // }
      },
      currency:{
        type:DataTypes.STRING
      },
      ranking:{
        type: DataTypes.ENUM("Primary", "Secondary", "Other"),
        allowNull: false,
      },
      userId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: "id",
        }
      },
      serviceId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'Service',
          key: "id",
        },
        allowNull: true,
        onDelete:"SET NULL",
        onUpdate:"RESTRICT"
      },
    },
    {
      sequelize,
      name: {
        singular: "artisanService",
        plural: "artisanServices",
      },
      tableName: "ArtisanService",
      timestamps: false,
    }
  );

  ArtisanService.associate = function (models) {
    ArtisanService.belongsTo(models.User, { foreignKey: "userId" });
    ArtisanService.belongsTo(models.Service, { foreignKey: "serviceId" ,onDelete:"RESTRICT" });
    ArtisanService.hasOne(models.TaskBid, { foreignKey: "artisanServiceId" });
    ArtisanService.hasMany(models.Task, { foreignKey: "artisanServiceId",onDelete:"RESTRICT" },);
  };
  return ArtisanService;
}