const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  dialect: 'sqlite',
  storage: path.join(process.cwd(), 'data', 'document_management.db'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Initialize Sequelize
const sequelize = new Sequelize(dbConfig);

// Import models
const User = require('./User')(sequelize, DataTypes);
const Folder = require('./Folder')(sequelize, DataTypes);
const Document = require('./Document')(sequelize, DataTypes);
const DocumentVersion = require('./DocumentVersion')(sequelize, DataTypes);
const DocumentShare = require('./DocumentShare')(sequelize, DataTypes);
const WorkflowInstance = require('./WorkflowInstance')(sequelize, DataTypes);
const WorkflowStep = require('./WorkflowStep')(sequelize, DataTypes);
const Review = require('./Review')(sequelize, DataTypes);
const AuditLog = require('./AuditLog')(sequelize, DataTypes);
const SystemSetting = require('./SystemSetting')(sequelize, DataTypes);
const Notification = require('./Notification')(sequelize, DataTypes);
const Tag = require('./Tag')(sequelize, DataTypes);
const DocumentTag = require('./DocumentTag')(sequelize, DataTypes);

// Define associations
const setupAssociations = () => {
  // User associations
  User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });
  User.hasMany(Folder, { foreignKey: 'createdBy', as: 'createdFolders' });
  User.hasMany(Review, { foreignKey: 'reviewerId', as: 'reviews' });
  User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
  User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });

  // Folder associations
  Folder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
  Folder.belongsTo(Folder, { foreignKey: 'parentId', as: 'parent' });
  Folder.hasMany(Folder, { foreignKey: 'parentId', as: 'children' });
  Folder.hasMany(Document, { foreignKey: 'folderId', as: 'documents' });

  // Document associations
  Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
  Document.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });
  Document.hasMany(DocumentVersion, { foreignKey: 'documentId', as: 'versions' });
  Document.hasMany(DocumentShare, { foreignKey: 'documentId', as: 'shares' });
  Document.hasOne(WorkflowInstance, { foreignKey: 'documentId', as: 'workflow' });
  Document.belongsToMany(Tag, { through: DocumentTag, foreignKey: 'documentId', as: 'tags' });

  // Document Version associations
  DocumentVersion.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });
  DocumentVersion.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

  // Document Share associations
  DocumentShare.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });
  DocumentShare.belongsTo(User, { foreignKey: 'sharedWith', as: 'recipient' });
  DocumentShare.belongsTo(User, { foreignKey: 'sharedBy', as: 'sharer' });

  // Workflow associations
  WorkflowInstance.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });
  WorkflowInstance.belongsTo(User, { foreignKey: 'initiatedBy', as: 'initiator' });
  WorkflowInstance.hasMany(WorkflowStep, { foreignKey: 'workflowInstanceId', as: 'steps' });

  // Workflow Step associations
  WorkflowStep.belongsTo(WorkflowInstance, { foreignKey: 'workflowInstanceId', as: 'workflow' });
  WorkflowStep.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
  WorkflowStep.hasMany(Review, { foreignKey: 'workflowStepId', as: 'reviews' });

  // Review associations
  Review.belongsTo(WorkflowStep, { foreignKey: 'workflowStepId', as: 'workflowStep' });
  Review.belongsTo(User, { foreignKey: 'reviewerId', as: 'reviewer' });

  // Audit Log associations
  AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

  // Tag associations
  Tag.belongsToMany(Document, { through: DocumentTag, foreignKey: 'tagId', as: 'documents' });
};

// Setup associations
setupAssociations();

// Export database instance and models
module.exports = {
  sequelize,
  Sequelize,
  User,
  Folder,
  Document,
  DocumentVersion,
  DocumentShare,
  WorkflowInstance,
  WorkflowStep,
  Review,
  AuditLog,
  SystemSetting,
  Notification,
  Tag,
  DocumentTag
};