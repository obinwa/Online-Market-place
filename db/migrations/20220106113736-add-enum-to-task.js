'use strict';

const replaceEnum = require('../enum-migrate-script');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return replaceEnum({
      tableName: 'Task',
      columnName: "jobStatus",
      enumName: "enum_Task_jobStatus",
      defaultValue: null,
      newValues: ['initiated', 
      'negotiating', 
      'accepted',
      'customerCancelled',
      'artisanRejected',
      'jobDispute',
      'artisanArrived',
      'started',
      'completed',
      'customerConfirmed'],
      queryInterface
    });
  },

  down: (queryInterface, Sequelize) => {
    return replaceEnum({
      tableName: 'Task',
      columnName: "jobStatus",
      enumName: "enum_Task_jobStatus",
      defaultValue: null,
      newValues: ['initiated', 
      'negotiating', 
      'accepted',
      'customerCancelled',
      'artisanRejected',
      'jobDispute',
      'artisanArrived',
      'started',
      'completed',
      'customerConfirmed'],
      queryInterface
    });
  }
};