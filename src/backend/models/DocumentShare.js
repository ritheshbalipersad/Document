module.exports = (sequelize, DataTypes) => {
  const DocumentShare = sequelize.define('DocumentShare', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Documents',
        key: 'id'
      }
    },
    sharedWith: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    sharedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    permission: {
      type: DataTypes.ENUM('read', 'write', 'admin'),
      defaultValue: 'read'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    accessCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastAccessedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'DocumentShares'
  });

  return DocumentShare;
};