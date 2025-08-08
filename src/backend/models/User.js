module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [1, 50]
      }
    },
    role: {
      type: DataTypes.ENUM('admin', 'reviewer', 'uploader', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 20]
      }
    },
    department: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 100]
      }
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        emailNotifications: true,
        desktopNotifications: true,
        theme: 'light',
        language: 'en',
        timezone: 'UTC'
      }
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'Users',
    indexes: [
      {
        unique: true,
        fields: ['email']
      },
      {
        fields: ['role']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['resetPasswordToken']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        // Hash password before creating user (handled in service layer)
      },
      beforeUpdate: async (user) => {
        // Hash password before updating if changed (handled in service layer)
      }
    }
  });

  // Instance methods
  User.prototype.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
  };

  User.prototype.canUpload = function() {
    return ['admin', 'reviewer', 'uploader'].includes(this.role);
  };

  User.prototype.canDownload = function() {
    return ['admin', 'reviewer', 'uploader', 'viewer'].includes(this.role);
  };

  User.prototype.canReview = function() {
    return ['admin', 'reviewer'].includes(this.role);
  };

  User.prototype.canAdministrate = function() {
    return this.role === 'admin';
  };

  User.prototype.canManageUsers = function() {
    return this.role === 'admin';
  };

  User.prototype.hasPermission = function(permission) {
    const permissions = {
      admin: ['upload', 'download', 'review', 'admin', 'user_management', 'system_settings'],
      reviewer: ['upload', 'download', 'review'],
      uploader: ['upload', 'download'],
      viewer: ['download']
    };

    return permissions[this.role]?.includes(permission) || false;
  };

  User.prototype.toSafeJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.resetPasswordToken;
    delete values.emailVerificationToken;
    return values;
  };

  // Class methods
  User.findByEmail = function(email) {
    return this.findOne({
      where: { email: email.toLowerCase() }
    });
  };

  User.findActiveUsers = function() {
    return this.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password', 'resetPasswordToken', 'emailVerificationToken'] }
    });
  };

  User.findByRole = function(role) {
    return this.findAll({
      where: { role },
      attributes: { exclude: ['password', 'resetPasswordToken', 'emailVerificationToken'] }
    });
  };

  return User;
};