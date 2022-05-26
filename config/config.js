require("dotenv").config();
module.exports = {
  production: {
    database: process.env.DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
          require: true,
          rejectUnauthorized: false
      }
   },
    logging: "",
    pool: {
      max: 5,
      min: 0,
      acquire: 360000,
      idle: 0,
    },
    settlementHours : 36,
    settlementPercentage: 40,
    paymentRatio: 0.6,
    paymentRedirectUrl: "/payment/verify",
  },
  development: {
    database: process.env.DATABASE,
    username: process.env.DB_USERNAME,
    password: process.env.PASSWORD,
    host: process.env.HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    dialectOptions: {
      ssl: {
          require: true,
          rejectUnauthorized: false
      }
   },
    logging: "",
    pool: {
      max: 5,
      min: 0,
      acquire: 360000,
      idle: 0,
    },
    redis: {
      host: "ec2-52-50-41-122.eu-west-1.compute.amazonaws.com",
      port: "28459",
      url: process.env.REDIS_URL,
      password: "",
    },
    settlementHours : 36,
    settlementPercentage: 40,
    paymentRatio: 0.6,
    paymentRedirectUrl: "/payment/verify",
  },
  test: {
    database: "afriserve",
    username: "root",
    password: "Password12",
    host: "localhost",
    port: 3306,
    logging: false,
    dialect: "mysql",
    pool: {
      max: 5,
      min: 0,
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 0,
      acquire: 360000,
      idle: 0,
    },

    redis: {
      host: "127.0.0.1",
      port: "6379",
      url: "redis://@127.0.0.1:6379",
      password: "",
    },
    settlementHours : 36,
    settlementPercentage: 40,
    paymentRatio: 0.6,
    paymentRedirectUrl: "/payment/verify",
  },
};
