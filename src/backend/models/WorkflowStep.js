module.exports = (sequelize, DataTypes) => {
  const WorkflowStep = sequelize.define('WorkflowStep', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    workflowInstanceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'WorkflowInstances',
        key: 'id'
      }
    },
    stepType: {
      type: DataTypes.ENUM('review', 'approval', 'notification', 'archive'),
      allowNull: false
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'skipped', 'rejected'),
      defaultValue: 'pending'
    },
    stepOrder: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    decision: {
      type: DataTypes.ENUM('approved', 'rejected', 'needs_revision'),
      allowNull: true
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    tableName: 'WorkflowSteps'
  });

  return WorkflowStep;
};