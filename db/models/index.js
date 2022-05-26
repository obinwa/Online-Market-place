"use strict";
require("dotenv").config();
const Sequelize = require("sequelize");
//const env = "production";
const env = process.env.NODE_ENV || "development";
const config = require("../../config/config")[env];
const fs = require("fs");
const path = require("path");
const basename = path.basename(__filename);
const db = {};

let sequelize;
console.log(`Environment is ${env}`);
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );
}

let files = [];
const sortDir = (maniDir) => {
  let folders = [];
  const CheckFile = (filePath) => fs.statSync(filePath).isFile();
  const sortPath = (dir) => {
    fs.readdirSync(dir)
      .filter((file) => file.indexOf(".") !== 0 && file !== "index.js")
      .forEach((res) => {
        const filePath = path.join(dir, res);
        if (CheckFile(filePath)) {
          files.push(filePath);
        } else {
          folders.push(filePath);
        }
      });
  };
  folders.push(maniDir);
  let i = 0;
  do {
    sortPath(folders[i]);
    i += 1;
  } while (i < folders.length);
};
sortDir(__dirname);

files.forEach((file) => {
  const model = require(file)(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].addScopes) {
    db[modelName].addScopes(db);
  }
});

Object.keys(db).forEach((modelName) => {
  if (db[modelName].addMethods) {
    db[modelName].addMethods(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;
module.exports = db;
