const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    // Get user from database
    const user = await User.findByPk(req.session.userId, {
      attributes: { exclude: ['password', 'resetPasswordToken', 'emailVerificationToken'] }
    });

    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Update last login
    if (user.lastLogin && (Date.now() - user.lastLogin.getTime()) > 5 * 60 * 1000) {
      await user.update({ lastLogin: new Date() });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

module.exports = authMiddleware;