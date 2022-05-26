const { AppSuccess } = require('../../utils/');
const { Settlement } = require("../../db/models");
require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const config = require("../../config/config")[env];

exports.getSettlement = async function(req, res, next) {
  try {
    let settlement = {
      settlementHours : config.settlementHours,
      settlementPercentage : config.settlementPercentage
    }
    let settlements = await Settlement.findAll();
    if(settlements.length > 0) settlement = settlements[0];
    return new AppSuccess(res, settlement).OPERATION_SUCCESSFUL();
  } catch (error) {
    next(error);
  }
}

exports.setSettlement = async function(req, res, next) {
  try {
    let settlement = {}
    settlementObject = await Settlement.findOne();
    if(settlementObject){
      settlement = settlementObject;
      settlement.settlementHours = req.body.settlementHours? req.body.settlementHours : settlement.settlementHours ;
      settlement.settlementPercentage = req.body.settlementPercentage? req.body.settlementPercentage : settlement.settlementPercentage ;

      await settlement.save();
    } else{
      validateSettlementRequest(req.body);
      settlement.settlementHours = req.body.settlementHours;
      settlement.settlementPercentage = req.body.settlementPercentage;

      await Settlement.create({ 
        settlementHours: req.body.settlementHours,
        settlementPercentage: req.body.settlementPercentage
      });
    }
    return new AppSuccess(res).UPDATED_SUCCESSFULLY('Settlement');
  } catch (error) {
    next(error);
  } 
}

function validateSettlementRequest(requestBody){
  if(!requestBody.settlementHours || isNaN(requestBody.settlementHours) || requestBody.settlementHours < 1){
    throw Error("Please enter a valid settlement hour(s)")
  }
  if(!requestBody.settlementPercentage || isNaN(requestBody.settlementPercentage) || requestBody.settlementPercentage < 1){
    throw Error("Please enter a valid settlement percentage")
  }
}