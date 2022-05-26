const { is } = require("bluebird");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const Settlement = sequelize.define(
    "Settlement",
    {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      settlementPercentage:{
        type: DataTypes.INTEGER,
        get(){
          if(!this.getDataValue("settlementPercentage")) return 40;
          return this.getDataValue("settlementPercentage");
        },
        set(value){
          if(isNaN(value)) throw Error("settlement percentage should be a number");
          if(value < 1) throw Error("settlement percentage cannot be less than 1");
          this.setDataValue('settlementPercentage', value);
        }
      },
      settlementHours:{
        type: DataTypes.INTEGER,
        get(){
          if(!this.getDataValue("settlementHours")) return 36;
          return this.getDataValue("settlementHours");
        },
        set(value){
          if(isNaN(value)) throw Error("settlement hour(s) should be a number");
          if(value < 1) throw Error("settlement hour(s) cannot be less than 1");
          this.setDataValue('settlementHours', value);
        }
      },
     
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      }
    },
    {
      sequelize,
      name: {
        singular: "settlement",
        plural: "settlements",
      },
      tableName: "Settlement",
      timestamps: true,
    }
  );

  return Settlement;
}