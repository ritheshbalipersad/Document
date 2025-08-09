/**
 * Permission middleware factory
 * Creates middleware that checks if user has one of the specified roles
 * @param {...string} allowedRoles - Roles that are allowed to access the resource
 * @returns {Function} Express middleware function
 */
const permissionMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // User should be attached by auth middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED'
        });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          details: {
            userRole: req.user.role,
            requiredRoles: allowedRoles
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check error',
        error: error.message
      });
    }
  };
};

/**
 * Admin only middleware
 */
const adminOnly = permissionMiddleware('admin');

/**
 * Admin or Reviewer middleware
 */
const adminOrReviewer = permissionMiddleware('admin', 'reviewer');

/**
 * Upload permission middleware (admin, reviewer, uploader)
 */
const canUpload = permissionMiddleware('admin', 'reviewer', 'uploader');

/**
 * Download permission middleware (all roles)
 */
const canDownload = permissionMiddleware('admin', 'reviewer', 'uploader', 'viewer');

/**
 * Review permission middleware (admin, reviewer)
 */
const canReview = permissionMiddleware('admin', 'reviewer');

module.exports = {
  permissionMiddleware,
  adminOnly,
  adminOrReviewer,
  canUpload,
  canDownload,
  canReview
};