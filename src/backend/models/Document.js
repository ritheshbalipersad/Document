module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 255]
      }
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileExtension: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thumbnailPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    checksum: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_review', 'under_review', 'approved', 'rejected', 'archived', 'deleted'),
      defaultValue: 'draft'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    folderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Folders',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    ocrText: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ocrConfidence: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    ocrProcessed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    expirationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewDueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastReviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastDownloadedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lockedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'Documents',
    paranoid: true, // Soft deletes
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['uploadedBy']
      },
      {
        fields: ['folderId']
      },
      {
        fields: ['checksum']
      },
      {
        fields: ['mimeType']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['reviewDueDate']
      }
    ]
  });

  // Instance methods
  Document.prototype.incrementDownloadCount = function() {
    return this.increment('downloadCount');
  };

  Document.prototype.incrementViewCount = function() {
    return this.increment('viewCount');
  };

  Document.prototype.isExpired = function() {
    return this.expirationDate && new Date() > this.expirationDate;
  };

  Document.prototype.isReviewOverdue = function() {
    return this.reviewDueDate && new Date() > this.reviewDueDate;
  };

  Document.prototype.canBeDownloaded = function() {
    return !this.isExpired() && this.status !== 'deleted' && !this.isLocked;
  };

  Document.prototype.canBeEdited = function() {
    return !this.isLocked && ['draft', 'rejected'].includes(this.status);
  };

  Document.prototype.getFileInfo = function() {
    return {
      name: this.name,
      originalName: this.originalName,
      size: this.fileSize,
      mimeType: this.mimeType,
      extension: this.fileExtension,
      version: this.version
    };
  };

  Document.prototype.getWorkflowStatus = function() {
    const statusLabels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      archived: 'Archived',
      deleted: 'Deleted'
    };
    return statusLabels[this.status] || this.status;
  };

  // Class methods
  Document.findByStatus = function(status) {
    return this.findAll({
      where: { status },
      include: ['uploader', 'folder']
    });
  };

  Document.findExpired = function() {
    return this.findAll({
      where: {
        expirationDate: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    });
  };

  Document.findOverdueForReview = function() {
    return this.findAll({
      where: {
        reviewDueDate: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        status: {
          [sequelize.Sequelize.Op.in]: ['pending_review', 'under_review']
        }
      },
      include: ['uploader']
    });
  };

  Document.searchByContent = function(searchTerm) {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          {
            name: {
              [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
            }
          },
          {
            description: {
              [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
            }
          },
          {
            ocrText: {
              [sequelize.Sequelize.Op.like]: `%${searchTerm}%`
            }
          }
        ]
      },
      include: ['uploader', 'folder', 'tags']
    });
  };

  return Document;
};