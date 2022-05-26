const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const {AppError, 
  difference} = require("../../../utils");

module.exports = function (sequelize, DataTypes) {
  const Task = sequelize.define(
    "Task",
    {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      state:{
        type: DataTypes.TEXT,
      },
      address:{
        type: DataTypes.TEXT,
      },
      localGovernment:{
        type: DataTypes.TEXT,
      },
      price:{
        type:DataTypes.INTEGER,
      },
      startTime:{
        type: DataTypes.DATE,
      },
      completionTime:{
        type: DataTypes.DATE,
      },
      customerConfirmedDate:{
        type: DataTypes.DATE,
      },
      artisanStartDate:{
        type: DataTypes.DATE,
      },
      artisanCompleteDate:{
        type: DataTypes.DATE,
      },
      paymentDate:{
        type: DataTypes.DATE,
      },
      paymentStatus:{
        type: DataTypes.ENUM(
          "pendingInCollections",
          "failedInCollections", 
          "verifiedInCollections", 
          "pendingInArtisan", 
          "failedInArtisan", 
          "verifiedInArtisan"),
          get() {
            let value = this.getDataValue("paymentStatus");
            if (!value) {
              return "pendingInCollections";
            }
            return value;
          },
      },
      paymentData:{
        type: DataTypes.JSON,
      },
      transferData:{
        type: DataTypes.JSON
      },
      jobStatus:{
        type: DataTypes.ENUM(
          "initiated", 
          "negotiating", 
          "accepted",
          "customerCancelled",
          "artisanRejected",
          "jobDispute",
          "artisanArrived",
          "started",
          "completed",
          "customerConfirmed"),
          
      },
      description:{
        type: DataTypes.TEXT,
      },
      serviceName:{
        type: DataTypes.TEXT,
      },
      serviceId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'Service',
          key: "id",
        }
      },
      title:{
        type: DataTypes.TEXT,
      },
      customerId:{
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
        },
        allowNull: true,
        onDelete:"SET NULL"
      },
      idImageUrl:{
        type: DataTypes.TEXT
      },
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      artisanAmount:{
        type: DataTypes.FLOAT,
      },
      afriserveAmount:{
        type: DataTypes.FLOAT,
      },
      attachments:{
        type: DataTypes.JSON,
      },
    },
    {
      sequelize,
      name: {
        singular: "task",
        plural: "tasks",
      },
      tableName: "Task",
      timestamps: true,
    }
  );

  Task.associate = function (models) {
    Task.belongsTo(models.User, { foreignKey: "customerId" });
    Task.belongsTo(models.ArtisanService, { foreignKey: "artisanServiceId" });
    Task.belongsTo(models.Service, { foreignKey: "serviceId" });
    Task.hasOne(models.Review, { foreignKey: "taskId" });
    Task.hasMany(models.TaskBid, { foreignKey: "taskId" });
  };

  Task.addMethods = function (models) {

    Task.prototype.initiateJob = async function(){
      let currentState = this?.jobStatus;
      if(currentState){
         throw new AppError().GENERIC_ERROR(`Task cannot be initiated as it is currently ${currentState}`);
      }
      this.jobStatus = "initiated";
      await this.save();
    };

    Task.prototype.negotiateJob = async function(newPrice){
      let currentState = this?.jobStatus;
      if(currentState === "initiated" || currentState === "negotiating"){
        if(!Number.isInteger(newPrice)){
          throw new AppError().GENERIC_ERROR(`Invalid price ${newPrice}`);
        }
        this.jobStatus = "negotiating";
        await this.save();
        return;
        
      }
      else{
        throw new AppError().GENERIC_ERROR(`Task cannot be negotiated as it is currently ${currentState}`);
      }

    };


    Task.prototype.acceptJob = async function(){
      let currentState = this?.jobStatus;
      if(currentState !== "initiated" && currentState !== "negotiating"){
         throw new AppError().GENERIC_ERROR(`Task cannot be accepted at this time`);
      }
      this.jobStatus = "accepted";
      this.paymentStatus = "pendingInCollections";
      await this.save();
    };

    Task.prototype.acceptNewPrice = async function(){
      let currentState = this.jobStatus;
      if(currentState !== "negotiating"){
         throw new AppError().GENERIC_ERROR(`Task cannot be accepted as it is currently ${currentState}`);
      }
      this.jobStatus = "accepted";
      await this.save();
    }

    Task.prototype.cancelJob = async function(){
      let currentState = this?.jobStatus;
      if(currentState === "customerCancelled" || currentState === "artisanRejected"){
        throw new AppError().GENERIC_ERROR(`Task has been halted`);
      }
      if(currentState === "artisanArrived" || currentState === "completed" || currentState === "jobDispute" ){
        throw new AppError().GENERIC_ERROR(`Task cannot be cancelled as it is currently ${currentState}`);
      }
      if(this.paymentDate && difference(new Date(),this.paymentDate,"d") >= 3) {
        throw new AppError().GENERIC_ERROR(`Task cannot be cancelled because payment has been made since over three days back`);
      }
      this.jobStatus = "customerCancelled";
      await this.save();
    };

    Task.prototype.declineJob = async function(status="negotiating") {
      let currentState = this?.jobStatus;
      if(currentState === "customerCancelled" || currentState === "artisanRejected"){
        throw new AppError().GENERIC_ERROR(`Task has been halted`);
      }
      if(currentState === "artisanArrived" || currentState === "started" || currentState === "completed" || currentState === "jobDispute" ){
        throw new AppError().GENERIC_ERROR(`Task cannot be declined at the moment`);
      }
      if(this.paymentDate) {
        throw new AppError().GENERIC_ERROR(`Task cannot be declined because payment has been made`);
      }
      this.jobStatus = status;
      await this.save();
      return;
    };

    Task.prototype.artisanArrived = async function() {
      let currentState = this?.jobStatus;
      if(currentState === "customerCancelled" || currentState === "artisanRejected"){
        throw new AppError().GENERIC_ERROR(`Task has been halted`);
      }
      if(currentState === "completed" || currentState === "started"){
        throw new AppError().GENERIC_ERROR(`Artisan has started task already`);
      }
      if(currentState === "accepted"){
        this.jobStatus = "artisanArrived";
        await this.save();
        return;
      }
      throw new AppError().GENERIC_ERROR(`Task needs to be accepted before artisan can go to location`);

    };

    Task.prototype.artisanStarted = async function() {
      let currentState = this?.jobStatus;
      if(currentState === "customerCancelled" || currentState === "artisanRejected"){
        throw new AppError().GENERIC_ERROR(`Task has been halted`);
      }
      if(currentState === "completed" || currentState === "started"){
        throw new AppError().GENERIC_ERROR(`Artisan has started task already`);
      }
      if(currentState === "artisanArrived"){
        this.jobStatus = "started";
        this.artisanStartDate = Date.now();
        await this.save();
        return;
      }
      throw new AppError().GENERIC_ERROR(`Artisan needs to arrive at location before task can be started`);
    };

    Task.prototype.completed = async function() {
      let currentState = this?.jobStatus;
      if(currentState === "started" ){
        this.jobStatus = "completed";
        this.artisanCompleteDate = Date.now();
        await this.save();
        return;
      }
      else if(currentState === "completed" ){
        throw new AppError().GENERIC_ERROR(`Task  has already been completed`);
      }
      else{
        throw new AppError().GENERIC_ERROR(`Artisan has not started job`);
      }
    };
  }

  return Task
}