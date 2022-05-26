const { IssueReport, User,Task } = require("../../db/models");
const { AppSuccess,AppError } = require("../../utils/");
const { Op } = require("sequelize");

exports.resolveIssue = async function(issueId){
  if(!issueId) throw new AppError().GENERIC_ERROR("Invalid input parameter");
  let issue = await IssueReport.findByPk(issueId);
  if(!issue) throw new AppError().GENERIC_ERROR("No issue found");

  issue.isResolved = true;
  await issue.save();
  return;
} 

exports.getAllReports = async function(){
  let issues = await IssueReport.findAll({
    include:[
      {model:User, as: 'reporter' },
      {model:User, as: 'reportee' },
      {model:Task}
    ]
  });

  return issues;
}

exports.getAllUnresolvedReports = async function(){
  let unresolvedIssues = await IssueReport.findAll({
    where: {
      [Op.not]:{
        isResolved: true
      }
    },
    include:[
      {model:User, as: 'reporter' },
      {model:User, as: 'reportee' },
      {model:Task}
    ]
  });

  return unresolvedIssues;
}