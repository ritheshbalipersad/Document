const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const folderController = require('../controllers/folderController');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// Apply authentication to all routes
router.use(authMiddleware);

// Get folder tree structure
router.get('/tree', 
  query('maxDepth').optional().isInt({ min: 1, max: 10 }),
  folderController.getFolderTree
);

// Get all folders (flat list)
router.get('/', 
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  folderController.getAllFolders
);

// Get folder by ID with contents
router.get('/:id',
  param('id').isInt(),
  folderController.getFolderById
);

// Get folder contents (documents and subfolders)
router.get('/:id/contents',
  param('id').isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['name', 'createdAt', 'updatedAt', 'size']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  folderController.getFolderContents
);

// Get folder statistics
router.get('/:id/stats',
  param('id').isInt(),
  folderController.getFolderStats
);

// Create new folder
router.post('/',
  permissionMiddleware('admin', 'reviewer', 'uploader'),
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Folder name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('parentId')
      .optional()
      .isInt()
      .withMessage('Parent ID must be a valid integer'),
    body('color')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Color must be a valid hex color'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean'),
    body('permissions')
      .optional()
      .isObject()
      .withMessage('Permissions must be an object')
  ],
  folderController.createFolder
);

// Update folder
router.put('/:id',
  permissionMiddleware('admin'),
  [
    param('id').isInt(),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Folder name must be between 1 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters'),
    body('parentId')
      .optional()
      .isInt()
      .withMessage('Parent ID must be a valid integer'),
    body('color')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Color must be a valid hex color'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean'),
    body('permissions')
      .optional()
      .isObject()
      .withMessage('Permissions must be an object')
  ],
  folderController.updateFolder
);

// Move folder to different parent
router.patch('/:id/move',
  permissionMiddleware('admin'),
  [
    param('id').isInt(),
    body('parentId')
      .optional()
      .isInt()
      .withMessage('Parent ID must be a valid integer')
  ],
  folderController.moveFolder
);

// Delete folder (soft delete)
router.delete('/:id',
  permissionMiddleware('admin'),
  param('id').isInt(),
  folderController.deleteFolder
);

// Restore folder from trash
router.patch('/:id/restore',
  permissionMiddleware('admin'),
  param('id').isInt(),
  folderController.restoreFolder
);

// Permanently delete folder
router.delete('/:id/permanent',
  permissionMiddleware('admin'),
  param('id').isInt(),
  folderController.permanentDeleteFolder
);

// Move documents between folders
router.patch('/:id/documents/move',
  permissionMiddleware('admin', 'reviewer', 'uploader'),
  [
    param('id').isInt(),
    body('documentIds')
      .isArray({ min: 1 })
      .withMessage('Document IDs must be a non-empty array'),
    body('documentIds.*')
      .isInt()
      .withMessage('Each document ID must be an integer'),
    body('targetFolderId')
      .optional()
      .isInt()
      .withMessage('Target folder ID must be an integer')
  ],
  folderController.moveDocuments
);

// Copy documents between folders
router.patch('/:id/documents/copy',
  permissionMiddleware('admin', 'reviewer', 'uploader'),
  [
    param('id').isInt(),
    body('documentIds')
      .isArray({ min: 1 })
      .withMessage('Document IDs must be a non-empty array'),
    body('documentIds.*')
      .isInt()
      .withMessage('Each document ID must be an integer'),
    body('targetFolderId')
      .isInt()
      .withMessage('Target folder ID must be an integer')
  ],
  folderController.copyDocuments
);

// Update folder permissions
router.patch('/:id/permissions',
  permissionMiddleware('admin'),
  [
    param('id').isInt(),
    body('permissions')
      .isObject()
      .withMessage('Permissions must be an object'),
    body('permissions.read')
      .optional()
      .isArray()
      .withMessage('Read permissions must be an array'),
    body('permissions.write')
      .optional()
      .isArray()
      .withMessage('Write permissions must be an array'),
    body('permissions.admin')
      .optional()
      .isArray()
      .withMessage('Admin permissions must be an array')
  ],
  folderController.updateFolderPermissions
);

// Get folder access logs
router.get('/:id/access-logs',
  permissionMiddleware('admin'),
  [
    param('id').isInt(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  folderController.getFolderAccessLogs
);

// Search folders
router.get('/search',
  [
    query('q')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  folderController.searchFolders
);

module.exports = router;