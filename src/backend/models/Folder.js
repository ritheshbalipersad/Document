module.exports = (sequelize, DataTypes) => {
  const Folder = sequelize.define('Folder', {
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '#007bff',
      validate: {
        is: /^#[0-9A-F]{6}$/i
      }
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Folders',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    permissions: {
      type: DataTypes.JSON,
      defaultValue: {
        read: [],
        write: [],
        admin: []
      }
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    },
    documentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    size: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'Folders',
    paranoid: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['parentId']
      },
      {
        fields: ['createdBy']
      },
      {
        fields: ['path']
      },
      {
        fields: ['level']
      }
    ],
    hooks: {
      beforeCreate: async (folder) => {
        if (folder.parentId) {
          const parent = await Folder.findByPk(folder.parentId);
          if (parent) {
            folder.path = `${parent.path}/${folder.name}`;
            folder.level = parent.level + 1;
          }
        } else {
          folder.path = `/${folder.name}`;
          folder.level = 0;
        }
      },
      beforeUpdate: async (folder) => {
        if (folder.changed('name') || folder.changed('parentId')) {
          if (folder.parentId) {
            const parent = await Folder.findByPk(folder.parentId);
            if (parent) {
              folder.path = `${parent.path}/${folder.name}`;
              folder.level = parent.level + 1;
            }
          } else {
            folder.path = `/${folder.name}`;
            folder.level = 0;
          }
        }
      }
    }
  });

  // Instance methods
  Folder.prototype.getFullPath = function() {
    return this.path;
  };

  Folder.prototype.isRoot = function() {
    return this.parentId === null;
  };

  Folder.prototype.hasChildren = async function() {
    const childCount = await Folder.count({
      where: { parentId: this.id }
    });
    return childCount > 0;
  };

  Folder.prototype.getAncestors = async function() {
    const ancestors = [];
    let currentFolder = this;
    
    while (currentFolder.parentId) {
      const parent = await Folder.findByPk(currentFolder.parentId);
      if (parent) {
        ancestors.unshift(parent);
        currentFolder = parent;
      } else {
        break;
      }
    }
    
    return ancestors;
  };

  Folder.prototype.getDescendants = async function() {
    const descendants = [];
    
    const findChildren = async (folderId) => {
      const children = await Folder.findAll({
        where: { parentId: folderId }
      });
      
      for (const child of children) {
        descendants.push(child);
        await findChildren(child.id);
      }
    };
    
    await findChildren(this.id);
    return descendants;
  };

  Folder.prototype.calculateStats = async function() {
    const Document = sequelize.models.Document;
    
    // Get direct documents in this folder
    const documents = await Document.findAll({
      where: { folderId: this.id },
      attributes: ['fileSize']
    });
    
    let documentCount = documents.length;
    let totalSize = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
    
    // Get stats from child folders
    const children = await Folder.findAll({
      where: { parentId: this.id }
    });
    
    for (const child of children) {
      const childStats = await child.calculateStats();
      documentCount += childStats.documentCount;
      totalSize += childStats.size;
    }
    
    // Update this folder's stats
    await this.update({
      documentCount,
      size: totalSize
    });
    
    return { documentCount, size: totalSize };
  };

  Folder.prototype.canUserAccess = function(user, permission = 'read') {
    // Admin can access everything
    if (user.role === 'admin') return true;
    
    // Check if folder is public
    if (this.isPublic && permission === 'read') return true;
    
    // Check if user is the creator
    if (this.createdBy === user.id) return true;
    
    // Check specific permissions
    if (this.permissions && this.permissions[permission]) {
      return this.permissions[permission].includes(user.id);
    }
    
    return false;
  };

  // Class methods
  Folder.findRootFolders = function() {
    return this.findAll({
      where: { parentId: null },
      include: [{
        model: this,
        as: 'children'
      }]
    });
  };

  Folder.findByPath = function(path) {
    return this.findOne({
      where: { path }
    });
  };

  Folder.buildTree = async function(parentId = null, maxDepth = 5, currentDepth = 0) {
    if (currentDepth >= maxDepth) return [];
    
    const folders = await this.findAll({
      where: { parentId },
      include: ['creator'],
      order: [['name', 'ASC']]
    });
    
    for (const folder of folders) {
      folder.dataValues.children = await this.buildTree(folder.id, maxDepth, currentDepth + 1);
    }
    
    return folders;
  };

  Folder.findUserAccessible = function(userId, permission = 'read') {
    return this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { isPublic: true },
          { createdBy: userId },
          sequelize.literal(`JSON_EXTRACT(permissions, '$.${permission}') LIKE '%${userId}%'`)
        ]
      },
      include: ['creator']
    });
  };

  return Folder;
};