require('dotenv').config({ path: __dirname + '/../.env' });
const AppError = require('./appError');
const env = process.env.NODE_ENV || 'test';
const logger = require('./logger');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({ region: process.env.AWS_REGION_NAME });

// Create S3 service object
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

async function getFileAsBase64String(key) {
  let params = {
    Key: key,
    Bucket: process.env.AWS_S3_BUCKET,
  };
  try {
    let data = await s3.getObject(params).promise(); //, function(err, data) {
    let base64String = data.Body.toString('base64');
    return base64String;
  } catch (error) {
    logger.error(error.stack);
    return null;
  }
}

async function saveBase64StringAsFile(
  base64String,
  key,
  contentType = 'image/jpeg'
) {
  if (!base64String) {
    logger.info(`Key ${key} does not have file content`);
    return false;
  }

  buf = Buffer.from(base64String, 'base64');
  let params = {
    Key: key,
    Bucket: process.env.AWS_S3_BUCKET,
    Body: buf,
    ContentEncoding: 'base64',
    ContentType: contentType,
  };

  try {
    return new Promise(function (resolve, reject) {
      s3.upload(params, function (err, data) {
        if (err) {
          resolve(null);
        }
        if (data) {
          resolve(data.Location);
        }
      });
    });
  } catch (error) {
    logger.error(error);
    logger.error(`Error uploading data: ${params.Bucket}`);
    return null;
  }
}

//optimize the saving of files to only save when the files are different

async function saveFileAndGetUrl(file, keyPrefix) {
  let randomString = generateRandom();
  let fileKey = `${keyPrefix}${randomString}`;
  let successUrl = await saveBase64StringAsFile(file, fileKey);
  return successUrl;
}

function generateRandom(length = 10) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

function generateRandomWithSeedCharacters(length = 10, seed = '') {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' + seed;
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

const { AWS_S3_BUCKET } = process.env;

exports.uploadFile = async (file, key) => {
  const fileContent = Buffer.from(file.buffer, 'base64');
  const params = {
    Bucket: AWS_S3_BUCKET,
    Key: `${key}/${new Date().getTime()}-${file.originalname}`,
    Body: fileContent,
    ACL: 'public-read',
  };
  const locationUrl = s3.upload(params).promise();
  //s3.deleteObject()

  const url = locationUrl
    .then((data) => {
      return data;
    })
    .catch((err) => {
      return err;
    });

  const data = {
    fieldName: file.fieldname,
    url: await url,
    type: file.mimetype,
    size: file.size,
    name: file.originalname,
  };
  return await data;
};

exports.updateUserFiles = async (user, files) => {
  let imageKeyPrefix = `${user.firstName}-${user.lastName}`;
  for (const key in files) {
    for (const file of files[key]) {
      const data = await this.uploadFile(file, imageKeyPrefix);
      const { fieldName, url } = data;
      user[fieldName] = url.Location;
      await user.save();
    }
  }
  return user;
};

exports.deleteFile = async function (fileUrl) {
  let fileKeyWithoutHTTP = fileUrl.substring(fileUrl.indexOf('/') + 1);
  fileKeyWithoutHTTP = fileKeyWithoutHTTP.substring(
    fileKeyWithoutHTTP.indexOf('/') + 1
  );
  let fileKey = fileKeyWithoutHTTP.substring(
    fileKeyWithoutHTTP.indexOf('/') + 1
  );
  const params = {
    Bucket: AWS_S3_BUCKET,
    Key: fileKey,
  };
  try {
    await s3.headObject(params).promise();
    try {
      await s3.deleteObject(params).promise();
      return true;
    } catch (err) {
      return false;
    }
  } catch (err) {
    throw new AppError().GENERIC_ERROR('There was an error locating the file');
  }
};

module.getFileAsBase64String = getFileAsBase64String;
module.saveFileAndGetUrl = saveFileAndGetUrl;
module.generateRandomWithSeedCharacters = generateRandomWithSeedCharacters;
