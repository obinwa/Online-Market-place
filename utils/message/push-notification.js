require('dotenv').config();
var admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

let sampleMessage = {
  notification: {
    title: 'Book service',
    body: 'I need a carpenter',
  },
};

const registrationToken = 'YOUR_REGISTRATION_TOKEN';

async function sendNotification(
  token = [registrationToken],
  notificationObject
) {
  if (token.length < 1) {
    return;
  }
  try {
    const { failureCount, successCount } = await admin
      .messaging()
      .sendToDevice(token, notificationObject, { priority: 'high' });
  } catch (err) {}
}

module.exports.sendNotification = sendNotification;
