const cron = require("node-cron");

const { 
  deleteExpiredOtps,
  makeDuePaymentToArtisan,
  confirmAllPaymentToArtisan
 } = require("./jobs");

 const { 
  serviceDueEmail
 } = require("../services/email-sender/service-request-helper")

 module.exports = function(){
  cron.schedule("04 */1 * * *",async function(){
     await deleteExpiredOtps();
     await makeDuePaymentToArtisan();
     await confirmAllPaymentToArtisan();
     await serviceDueEmail();
  });
};

