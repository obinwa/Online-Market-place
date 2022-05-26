let { sendEmail, sendEmailWithCopy } = require('../../utils/message/sendgrid');

const {
  User,
  Otp,
  Location,
  Service,
  ArtisanService,
  AccountDetails,
  Task,
  Review,
  Notification,
  TaskBid,
  Device,
  IssueReport,
  sequelize,
} = require('../../db/models/index');

const { Op } = require('sequelize');

const { artisanWallet } = require('../transaction-history');

const { formatDate, minus, plus } = require('../../utils/index');
const log = require('../../utils/logger');

exports.artisanCompleteTaskEmail = async function (task, artisan, customer) {
  let templateId = 'd-195ed9f300844403a7bb75f69e0eaec1';
  let recipient = customer;

  let templateData = {
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
    createdAt: formatDate(new Date()),
    serviceCategory: task.serviceName,
    userId: artisan.id,
    price: formatAmount(task.price),
    websiteUrl: null,
    fullName: `${artisan.firstName} ${artisan.lastName}`,
  };

  await sendEmail(recipient.email, templateId, templateData);
};

exports.sendAcceptBidEmail = async function (task, artisan, customer) {
  let templateId = 'd-9c71f77620504e1caea588716379ee29';
  let recipient = artisan;
  let sender = customer;

  let templateData = {
    fullName: `${artisan.firstName} ${artisan.lastName}`,
    price: formatAmount(task.price),
    serviceCategory: task.serviceName,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    createdAt: formatDate(new Date()),
    vendorNumber: `${artisan.phoneNumber}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
  };

  await sendEmail(recipient.email, templateId, templateData);
};

exports.sendBroadcastEmailOnBookService = async function (
  task,
  artisans,
  customer
) {
  let templateId = 'd-1964127865e64675a58d832c854f0102';
  let sender = customer;
  for (let artisan of artisans) {
    let recipient = artisan;

    let templateData = {
      location: `${task.address}, ${task.localGovernment}, ${task.state}`,
      vendorName: `${artisan.firstName} ${artisan.lastName}`,
      createdAt: formatDate(new Date()),
      serviceCategory: task.serviceName,
      userId: artisan.id,
      price: formatAmount(task.price),
      websiteUrl: null,
      fullName: `${customer.firstName} ${customer.lastName}`,
    };

    await sendEmail(recipient.email, templateId, templateData);
  }
};

exports.sendServiceRequestEmail = async function (task, artisan, customer) {
  let templateId = 'd-da2c66164dd24933b0d4cf8b65e1f4cd';

  let recipient = customer;

  let templateData = {
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    vendorName: `${artisan.firstName} ${artisan.lastName}`,
    createdAt: formatDate(new Date()),
    serviceCategory: task.serviceName,
    userId: artisan.id,
    price: formatAmount(task.price),
    websiteUrl: null,
    fullName: `${customer.firstName} ${customer.lastName}`,
  };

  await sendEmail(recipient.email, templateId, templateData);
};

exports.serviceAcceptedEmail = async function (task, artisan, customer) {
  let templateId = 'd-9c71f77620504e1caea588716379ee29';
  let recipient = artisan;
  let sender = customer;
  let templateData = {
    fullName: `${artisan.firstName} ${artisan.lastName}`,
    price: formatAmount(task.price),
    serviceCategory: task.serviceName,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    createdAt: formatDate(new Date()),
    vendorNumber: `${artisan.phoneNumber}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
  };

  await sendEmail(recipient.email, templateId, templateData);
};

exports.serviceRequestCompletedEmail = async function (
  task,
  artisans,
  customer
) {
  let templateId = 'd-da2c66164dd24933b0d4cf8b65e1f4cd';
  let sender = customer;

  for (let artisan of artisans) {
    let recipient = artisan;
    let templateData = {
      location: getLocation(task),
      vendorName: `${artisan.firstName} ${artisan.lastName}`,
      createdAt: formatDate(new Date()),
      serviceCategory: task.serviceName,
      userId: artisan.id,
      price: formatAmount(task.price),
      websiteUrl: null,
      fullName: `${sender.firstName} ${sender.lastName}`,
    };

    await sendEmail(recipient.email, templateId, templateData);
  }
};

async function serviceDueEmail() {
  let templateId = 'd-6346a033d5bb486ca4bad3c361c5c348';
  let anHourAgo = minus(new Date(), 1, 'h');
  let anHourLater = plus(new Date(), 1, 'h');

  let scheduledTasks = await Task.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            { jobStatus: 'accepted' },
            { jobStatus: 'artisanArrived' },
            { jobStatus: 'started' },
          ],
        },
        { startTime: { [Op.gte]: anHourAgo } },
        { startTime: { [Op.lte]: anHourLater } },
      ],
    },
    include: [
      {
        model: User,
      },
      {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
    ],
  });

  for (let task of scheduledTasks) {
    let artisan = task.artisanService.user;
    let artisanEmail = artisan.email;
    let templateData = {
      vendorName: `${artisan.firstName} ${artisan.lastName}`,
      createdAt: formatDate(task.startTime),
      serviceCategory: task.serviceName,
      vendorNumber: artisan.phoneNumber,
      location: getLocation(task),
      vendorStatus: artisan.isOnline ? 'Online' : 'Offline',
      vendorJobs: '',
    };

    let customer = task.user;
    let customerEmail = customer.email;

    await sendEmail(artisanEmail, templateId, templateData);
    await sendEmail(customerEmail, templateId, templateData);
  }
}

function getLocation(task) {
  if (task) {
    if (task.address && task.localGovernment && task.state) {
      return `${task.address}, ${task.localGovernment}, ${task.state}`;
    } else if (task.address || task.localGovernment || task.state) {
      let addressArray = [
        task.address,
        task.localGovernment,
        task.state,
      ].filter(value && value.trim());
      return addressArray.join(', ');
    }
  }
  return '';
}

async function getArtisanRattingsAndJobs(artisan) {
  let artisanReviews = await Review.findAll({
    where: {
      '$task.artisanService.user.id$': artisan.id,
    },
    include: {
      model: Task,
      include: {
        model: ArtisanService,
        include: {
          model: User,
        },
      },
    },
  });

  let artisanRating = 'No rating yet';

  if (artisanReviews.length > 0) {
    artisanRating = 0;
    for (let i = 0; i < artisanReviews.length; i++) {
      artisanRating = artisanRating + artisanReviews[i]['customerRating'];
    }
    artisanRating = artisanRating / artisanReviews.length;
  }

  let jobs = artisanReviews.map((review) => {
    return {
      taskName: review.task.serviceName,
    };
  });

  return {
    artisanRating,
    jobs,
  };
}

async function getCustomerRattingsAndJobs(customer) {
  let customerReviews = await Review.findAll({
    where: {
      '$task..user.id': customer.id,
    },
    include: {
      model: User,
    },
  });

  let customerRating = 'No rating yet';

  if (customerRating.length > 0) {
    customerRating = 0;
    for (let i = 0; i < customerReviews.length; i++) {
      customerRating = customerRating + customerReviews[i]['artisanRating'];
    }
    customerRating = customerRating / customerRating.length;
  }

  let jobs = customerRating.map((review) => {
    return {
      taskName: review.task.serviceName,
    };
  });

  return {
    customerRating,
    jobs,
  };
}

exports.serviceNegotiationEmail = async function (
  task,
  taskBid,
  artisan,
  customer
) {
  let templateId = 'd-d9d57d11fccb4c3a9016acf31205f245';
  let sender = artisan;
  let recipient = customer;

  let { jobs, artisanRating } = await getArtisanRattingsAndJobs(artisan);

  let templateData = {
    vendorJobs: jobs,
    vendorRatting: artisanRating,
    vendorStatus: artisan.isOnline ? 'online' : 'offline',
    websiteUrl: null,
    vendorName: `${artisan.firstName} ${artisan.lastName}`,
    price: formatAmount(task.price),
    newPrice: formatAmount(taskBid.negotiatedPrice),
    serviceCategory: task.serviceName,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.priceBidAcceptedEmail = async function (task, artisan, customer) {
  let templateId = 'd-695c9a4119d044a79abe7cf2a6f35e5a';
  let sender = artisan;
  let recipient = customer;

  let templateData = {
    fullName: `${sender.firstName} ${sender.lastName}`,
    price: formatAmount(task.price),
    serviceCategory: task.serviceName,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    websiteUrl: null,
    createdAt: formatDate(new Date()),
    vendorNumber: artisan.phoneNumber,
    customerName: `${customer.firstName} ${customer.lastName}`,
  };
  await sendEmail(recipient.email, templateId, templateData);
  await sendEmail(sender.email, templateId, templateData);
};

exports.paymentBankForVendor = async function (task, artisan, customer) {
  try {
    let templateId = 'd-6fbb9ce71e2f4a57a0c53477b3f959cf';
    let sender = customer;
    let recipient = artisan;

    let account = await AccountDetails.findOne({
      where: {
        userId: artisan.id,
      },
    });

    if (!account) {
      account = {
        bankName: 'Unverified',
        accountNumber: 'Unverified',
      };
    }

    let templateData = {
      serviceId: task.serviceId,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      price: formatAmount(task.price),
      serviceCategory: task.serviceName,
      location: `${task.address}, ${task.localGovernment}, ${task.state}`,
      customerName: `${customer.firstName} ${customer.lastName}`,
      fullName: `${artisan.firstName} ${artisan.lastName}`,
      websiteUrl: null,
    };
    await sendEmail(recipient.email, templateId, templateData);
  } catch (error) {
    log.info(error);
  }
};

exports.serviceNegotiationForCustomerEmail = async function (
  task,
  taskBid,
  artisan,
  customer
) {
  try {
    let templateId = 'd-d9d57d11fccb4c3a9016acf31205f245';
    let sender = artisan;
    let recipient = customer;

    let { jobs, artisanRating } = await getArtisanRattingsAndJobs(artisan);

    let templateData = {
      fullName: `${customer.firstName} ${customer.lastName}`,
      websiteUrl: null,
      facebookUrl: null,
      twitterUrl: null,
      instagramUrl: null,
      price: formatAmount(task.price),
      newPrice: formatAmount(taskBid.negotiatedPrice),
      serviceCategory: task.serviceName,
      // vendorJobs:jobs,
      vendorRatting: artisanRating,
      vendorStatus: artisan.isOnline ? 'online' : 'offline',
      vendorName: `${artisan.firstName} ${artisan.lastName}`,
      vendorNumber: artisan.phoneNumber,
      location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    };
    await sendEmail(recipient.email, templateId, templateData);
  } catch (error) {
    log.info('There was an error sending email');
  }
};

exports.serviceReviewForCustomer = async function (task, artisan, customer) {
  let templateId = 'd-8d4d75f6d8f5496ba0c15bc4b1727386';
  let sender = artisan;
  let recipient = customer;

  let templateData = {
    createdAt: formatDate(new Date()),
    fullName: `${customer.firstName} ${customer.lastName}`,
    websiteUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.taskNotAcceptedForCustomer = async function (task, artisan, customer) {
  let templateId = 'd-2044635b97994eaaaf5fcbe8a7190622';
  let sender = artisan;
  let recipient = customer;

  let templateData = {
    fullName: `${customer.firstName} ${customer.lastName}`,
    websiteUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.vendorArrivedForCustomer = async function (task, artisan, customer) {
  let templateId = 'd-18ff0e07dd9345f387bf41957402edb9';
  let sender = artisan;
  let recipient = customer;

  let { jobs, artisanRating } = await getArtisanRattingsAndJobs(artisan);

  let templateData = {
    fullName: `${customer.firstName} ${customer.lastName}`,
    websiteUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
    vendorJobs: jobs,
    vendorRatting: artisanRating,
    vendorStatus: artisan.isOnline ? 'online' : 'offline',
    vendorName: `${artisan.firstName} ${artisan.lastName}`,
    vendorNumber: artisan.phoneNumber,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.paymentWalletForVendor = async function (task, artisan, customer) {
  let templateId = 'd-6aa4a8084b574e7988a68a93f0b026f8';
  let sender = customer;
  let recipient = artisan;

  let walletData = await artisanWallet(artisan.id);

  let templateData = {
    price: formatAmount(task.price),
    serviceCategory: task.serviceName,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
    fullName: `${artisan.firstName} ${artisan.lastName}`,
    websiteUrl: null,
    walletBalance: walletData.withdrawablePayment,
    serviceId: task.serviceId,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.reminderForVendor = async function (task, artisan, customer) {
  let templateId = 'd-9164fda621f0450ab263b36e3d0b8cb1';
  let sender = customer;
  let recipient = artisan;

  let templateData = {
    createdAt: formatDate(new Date()),
    serviceCategory: task.serviceName,
    fullName: `${artisan.firstName} ${artisan.lastName}`,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerNumber: customer.phoneNumber,
    websiteUrl: null,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.serviceCancelledForVendor = async function (task, artisan, customer) {
  let templateId = 'd-841a2e51ea2143d4aa8b654af85c0b91';
  let recipient = artisan;
  let sender = customer;

  let templateData = {
    serviceCategory: task.serviceName,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
    fullName: `${artisan.firstName} ${artisan.lastName}`,
    websiteUrl: null,
    serviceId: task.serviceId,
    createdAt: formatDate(new Date()),
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.serviceDueForVendor = async function (task, artisan, customer) {
  let templateId = 'd-ff029dae0789485198fc1c5c71b4f3f8';
  let recipient = artisan;
  let sender = customer;

  let templateData = {
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerNumber: customer.phoneNumber,
    serviceCategory: task.serviceName,
    createdAt: formatDate(new Date()),
    websiteUrl: null,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.serviceNegotiationForVendor = async function (
  task,
  taskBid,
  artisan,
  customer
) {
  let templateId = 'd-7b76ace4796443ce823b0b049498ad5b';
  let recipient = artisan;
  let sender = customer;

  let templateData = {
    newPrice: formatAmount(taskBid.negotiatedPrice),
    price: formatAmount(task.price),
    serviceCategory: task.serviceName,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    websiteUrl: null,
  };

  await sendEmail(recipient.email, templateId, templateData);
};

exports.vendorApproval = async function (task, artisan, customer) {
  let templateId = 'd-b8ed03324ce34555bbbc1a76a7ae160f';
  let sender = artisan;
  let recipient = customer;

  let templateData = {
    fullName: `${sender.firstName} ${sender.lastName}`,
    websiteUrl: null,
    facebookUrl: null,
    twitterUrl: null,
    instagramUrl: null,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

exports.vendorNewRequest = async function (task, artisan, customer) {
  let templateId = 'd-1964127865e64675a58d832c854f0102';
  let sender = customer;
  let recipient = artisan;

  let templateData = {
    price: formatAmount(task.price),
    serviceCategory: task.serviceName,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    createdAt: formatDate(new Date()),
    fullName: `${sender.firstName} ${sender.lastName}`,
    websiteUrl: null,
  };
  await sendEmail(recipient.email, templateId, templateData);
};

function formatAmount(amount) {
  return `₦${amount}`;
}

exports.jobDisputeEmail = async function (task, reporter, reportee, comment) {
  let templateId = 'd-64529aec4db34d67a1d69ec2171b9ad1';
  let customer = reportee;
  let artisan = reporter;

  if (reporter.userRole === 'customer') {
    templateId = 'd-67eaecdb1ee843c29d60c1378be017d1';
    customer = reporter;
    artisan = reporter;
  }

  let templateData = {
    serviceCategory: task.serviceName,
    createdAt: formatDate(new Date()),
    vendorName: `${reportee.firstName} ${reportee.lastName}`,
    customerName: `${customer.firstName} ${customer.lastName}`,
    location: `${task.address}, ${task.localGovernment}, ${task.state}`,
    comment,
    userId: customer.id,
    fullName: `${reportee.firstName} ${reportee.lastName}`,
    websiteUrl: null,
  };

  await sendEmail(reportee.email, templateId, templateData);
  return;
};

module.exports.serviceDueEmail = serviceDueEmail;
