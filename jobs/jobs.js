const {
  Otp,
  Task,
  AccountDetails,
  ArtisanService,
  Settlement,
  User,
} = require("../db/models");
const { Op } = require("sequelize");
const { doTransfer } = require("../services/service-request");
const {verifyTransfer} = require("../services/payment-connector");
const { minus, plus } = require("../utils/index");

require('dotenv').config();
const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];


const checkNodeVersion = minimumVersion => {
  let nodeVersion = process.versions.node.split(".")[0];
  const versionCorrect = process.versions.node.match(versionRegex);
  if (nodeVersion < minimumVersion) {
    throw Error(
      `Running on wrong Nodejs version. Please upgrade the node runtime to version ${version}`
    );
  }
};

const sendReminderToCompleteKycProcess = async function(){
  let allClients = await User.findAll({
    where:{
      userRole:{
        [Op.in]:["artisan","customer"]
      }
    }
  });

  let kycSections = ["idImageUrl","proofOfAddressUrl","profileImageUrl"];

  for(client of allClients){
    for(let kycSection of kycSections){
      if(!client[kycSection]){
        await sendNotification(client,kycSection);
      }
    } 
  }
}

async function sendNotification(user,kycSection){
  console.log(` user(${user.id}) => ${kycSection}`);
}



async function deleteExpiredOtps(){
  const expiredOtps = await Otp.findAll({
    where:{
      expiresIn: { [Op.lt] : new Date() },
    }
  });
  if (expiredOtps) {
    await Otp.destroy({
      where:{
        id: { [Op.in] : expiredOtps.map((otp) => otp.id) },
      }
    });
  }
};

async function makeDuePaymentToArtisan() {
  let allTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          paymentStatus: {
            [Op.in]: ['verifiedInCollections', 'failedInArtisan'],
          },
        },
        { jobStatus: 'customerConfirmed' },
      ],
    },
    include: {
      model: ArtisanService,
      include: {
        model: User,
      },
    },
  });

  await pendingArtisanSettlement(allTasks);
};


const pendingArtisanSettlement = async function (allTasks) {
  for (let task of allTasks) {
    if (task?.artisanService?.user) {
      let accountDetails = await AccountDetails.findOne({
        where: {
          userId: task.artisanService.user.id,
        },
      });

      await doBulkSettlement(task, accountDetails);
    }
  }
};

async function getSettlementHours(){
  let settlement = await Settlement.findOne();
  if(settlement && settlement.settlementHours){
    return settlement.settlementHours;
  }
  return config.settlementHours;
}

const doBulkSettlement = async function (task, account) {
  let numberOfHoursBeforePayment = await getSettlementHours();
  let dueDate = new Date(
    plus(task.completionTime, numberOfHoursBeforePayment, 'h')
  );

  let currentDate = new Date();
  if (currentDate >= dueDate) {
    try {
      await doTransfer(task, account);
    } catch (error) {
      return;
    }
  }
};

async function confirmAllPaymentToArtisan() {
  let allTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          paymentStatus: {
            [Op.in]: ['pendingInArtisan'],
          },
        },
        { jobStatus: 'customerConfirmed' },
      ],
    },
    include: {
      model: ArtisanService,
      include: {
        model: User,
      },
    },
  });

  await confirmSettlements(allTasks);
};

confirmSettlements = async function(allTasks) {
  for(let task of allTasks){
    if(task?.transferData){
      let status = await verifyTransfer(task.transferData.transfer?.transfer_code);
      if(status){
        task.paymentStatus = "verifiedInArtisan";

        await task.save();
      }
    }
  }
}

module.exports = {
  deleteExpiredOtps,
  makeDuePaymentToArtisan,
  pendingArtisanSettlement,
  sendReminderToCompleteKycProcess,
  confirmAllPaymentToArtisan,
  checkNodeVersion
};
