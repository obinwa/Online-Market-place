const Sequelize = require("sequelize");
const Op = Sequelize.Op;

module.exports = function (sequelize, DataTypes) {
  const IssueReport = sequelize.define(
    "IssueReport",
    {
      id:{
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      dateTime: {
        type: DataTypes.DATE
      },
      reporterId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: "id",
        }
      },
      reporteeId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'User',
          key: "id",
        }
      },
      description:{
        type: DataTypes.TEXT,
      },     
      taskId:{
        type: DataTypes.INTEGER,
        references: {
          model: 'Task',
          key: "id",
        },
        onDelete:"SET NULL"
      },

      isResolved:{
        type: DataTypes.BOOLEAN,
      }
    },
    {
      sequelize,
      name: {
        singular: "issueReport",
        plural: "issueReport",
      },
      tableName: "IssueReport",
      timestamps: false,
    }
  );

  IssueReport.associate = function (models) {
    IssueReport.belongsTo(models.Task, { foreignKey: "taskId" });
    IssueReport.belongsTo(models.User,{ as: 'reporter', constraints: false }, { foreignKey: "reporterId" });
    IssueReport.belongsTo(models.User,{ as: 'reportee', constraints: false }, { foreignKey: "reporteeId" });
  };

  return IssueReport;
}