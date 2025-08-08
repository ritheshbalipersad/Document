const { validationResult } = require('express-validator');
const { Folder, Document, User, AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');

class FolderController {
  // Get folder tree structure
  async getFolderTree(req, res) {
    try {
      const { maxDepth = 5 } = req.query;
      const userId = req.user.id;
      
      const tree = await Folder.buildTree(null, parseInt(maxDepth));
      
      // Filter based on user permissions
      const filteredTree = await this.filterFoldersByPermission(tree, req.user);
      
      // Log access
      await AuditLog.create({
        userId,
        action: 'VIEW_FOLDER_TREE',
        resourceType: 'Folder',
        details: { maxDepth },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({
        success: true,
        data: filteredTree
      });
    } catch (error) {
      console.error('Error getting folder tree:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve folder tree',
        error: error.message
      });
    }
  }
  
  // Get all folders (flat list with pagination)
  async getAllFolders(req, res) {
    try {
      const { page = 1, limit = 50, search } = req.query;
      const offset = (page - 1) * limit;
      
      const whereConditions = {};
      
      if (search) {
        whereConditions[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } }
        ];
      }
      
      const { count, rows: folders } = await Folder.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset
      });
      
      // Filter based on user permissions
      const accessibleFolders = await this.filterFoldersByPermission(folders, req.user);
      
      res.json({
        success: true,
        data: {
          folders: accessibleFolders,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting folders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve folders',
        error: error.message
      });
    }
  }
  
  // Get folder by ID with details
  async getFolderById(req, res) {
    try {
      const { id } = req.params;
      
      const folder = await Folder.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Folder,
            as: 'parent',
            attributes: ['id', 'name', 'path']
          },
          {
            model: Folder,
            as: 'children',
            attributes: ['id', 'name', 'color', 'documentCount', 'size']
          }
        ]
      });
      
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
      
      // Check permissions
      if (!folder.canUserAccess(req.user, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Get folder statistics
      const stats = await folder.calculateStats();
      
      // Log access
      await AuditLog.create({
        userId: req.user.id,
        action: 'VIEW_FOLDER',
        resourceType: 'Folder',
        resourceId: id,
        details: { folderName: folder.name },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({
        success: true,
        data: {
          ...folder.toJSON(),
          stats
        }
      });
    } catch (error) {
      console.error('Error getting folder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve folder',
        error: error.message
      });
    }
  }
  
  // Get folder contents (documents and subfolders)
  async getFolderContents(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50, sortBy = 'name', sortOrder = 'asc' } = req.query;
      const offset = (page - 1) * limit;
      
      const folder = await Folder.findByPk(id);
      
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
      
      // Check permissions
      if (!folder.canUserAccess(req.user, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      // Get subfolders
      const subfolders = await Folder.findAll({
        where: { parentId: id },
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName']
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]]
      });
      
      // Get documents
      const { count, rows: documents } = await Document.findAndCountAll({
        where: { folderId: id },
        include: [
          {
            model: User,
            as: 'uploader',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });
      
      res.json({
        success: true,
        data: {
          folder: {
            id: folder.id,
            name: folder.name,
            path: folder.path,
            color: folder.color
          },
          subfolders: subfolders.filter(subfolder => 
            subfolder.canUserAccess(req.user, 'read')
          ),
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting folder contents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve folder contents',
        error: error.message
      });
    }
  }
  
  // Create new folder
  async createFolder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { name, description, parentId, color, isPublic, permissions } = req.body;
      
      // Check if parent folder exists and user has access
      if (parentId) {
        const parentFolder = await Folder.findByPk(parentId);
        if (!parentFolder) {
          await transaction.rollback();
          return res.status(404).json({
            success: false,
            message: 'Parent folder not found'
          });
        }
        
        if (!parentFolder.canUserAccess(req.user, 'write')) {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            message: 'Access denied to parent folder'
          });
        }
      }
      
      // Check for duplicate names in the same parent
      const existingFolder = await Folder.findOne({
        where: {
          name,
          parentId: parentId || null
        }
      });
      
      if (existingFolder) {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: 'A folder with this name already exists in this location'
        });
      }
      
      const folder = await Folder.create({
        name,
        description,
        parentId,
        color: color || '#007bff',
        isPublic: isPublic || false,
        permissions: permissions || { read: [], write: [], admin: [] },
        createdBy: req.user.id
      }, { transaction });
      
      // Log creation
      await AuditLog.create({
        userId: req.user.id,
        action: 'CREATE_FOLDER',
        resourceType: 'Folder',
        resourceId: folder.id,
        details: {
          folderName: name,
          parentId,
          path: folder.path
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, { transaction });
      
      await transaction.commit();
      
      // Return created folder with creator info
      const createdFolder = await Folder.findByPk(folder.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });
      
      res.status(201).json({
        success: true,
        message: 'Folder created successfully',
        data: createdFolder
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating folder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create folder',
        error: error.message
      });
    }
  }
  
  // Update folder
  async updateFolder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { id } = req.params;
      const updates = req.body;
      
      const folder = await Folder.findByPk(id);
      
      if (!folder) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
      
      // Check if trying to change parent and validate
      if (updates.parentId !== undefined && updates.parentId !== folder.parentId) {
        if (updates.parentId) {
          const newParent = await Folder.findByPk(updates.parentId);
          if (!newParent) {
            await transaction.rollback();
            return res.status(404).json({
              success: false,
              message: 'New parent folder not found'
            });
          }
          
          // Prevent circular references
          const descendants = await folder.getDescendants();
          if (descendants.some(desc => desc.id === updates.parentId)) {
            await transaction.rollback();
            return res.status(400).json({
              success: false,
              message: 'Cannot move folder to its own descendant'
            });
          }
        }
      }
      
      // Check for duplicate names if name is being changed
      if (updates.name && updates.name !== folder.name) {
        const existingFolder = await Folder.findOne({
          where: {
            name: updates.name,
            parentId: updates.parentId !== undefined ? updates.parentId : folder.parentId,
            id: { [Op.ne]: id }
          }
        });
        
        if (existingFolder) {
          await transaction.rollback();
          return res.status(409).json({
            success: false,
            message: 'A folder with this name already exists in this location'
          });
        }
      }
      
      const oldData = { ...folder.toJSON() };
      await folder.update(updates, { transaction });
      
      // Log update
      await AuditLog.create({
        userId: req.user.id,
        action: 'UPDATE_FOLDER',
        resourceType: 'Folder',
        resourceId: id,
        details: {
          oldData,
          newData: updates,
          folderName: folder.name
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, { transaction });
      
      await transaction.commit();
      
      // Return updated folder
      const updatedFolder = await Folder.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });
      
      res.json({
        success: true,
        message: 'Folder updated successfully',
        data: updatedFolder
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating folder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update folder',
        error: error.message
      });
    }
  }
  
  // Move documents between folders
  async moveDocuments(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { documentIds, targetFolderId } = req.body;
      const sourceFolderId = req.params.id;
      
      // Validate source folder access
      if (sourceFolderId !== 'null') {
        const sourceFolder = await Folder.findByPk(sourceFolderId);
        if (!sourceFolder || !sourceFolder.canUserAccess(req.user, 'write')) {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            message: 'Access denied to source folder'
          });
        }
      }
      
      // Validate target folder access if specified
      if (targetFolderId) {
        const targetFolder = await Folder.findByPk(targetFolderId);
        if (!targetFolder || !targetFolder.canUserAccess(req.user, 'write')) {
          await transaction.rollback();
          return res.status(403).json({
            success: false,
            message: 'Access denied to target folder'
          });
        }
      }
      
      // Get documents to move
      const documents = await Document.findAll({
        where: {
          id: { [Op.in]: documentIds },
          folderId: sourceFolderId === 'null' ? null : sourceFolderId
        }
      });
      
      if (documents.length !== documentIds.length) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Some documents not found in source folder'
        });
      }
      
      // Move documents
      await Document.update(
        { folderId: targetFolderId || null },
        {
          where: { id: { [Op.in]: documentIds } },
          transaction
        }
      );
      
      // Log the move operation
      await AuditLog.create({
        userId: req.user.id,
        action: 'MOVE_DOCUMENTS',
        resourceType: 'Document',
        details: {
          documentIds,
          sourceFolderId,
          targetFolderId,
          documentCount: documents.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, { transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: `${documents.length} document(s) moved successfully`,
        data: {
          movedCount: documents.length,
          sourceFolderId,
          targetFolderId
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error moving documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to move documents',
        error: error.message
      });
    }
  }
  
  // Delete folder (soft delete)
  async deleteFolder(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      const folder = await Folder.findByPk(id);
      
      if (!folder) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
      
      // Check if folder has children
      const hasChildren = await folder.hasChildren();
      if (hasChildren) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Cannot delete folder that contains subfolders. Please move or delete subfolders first.'
        });
      }
      
      // Check if folder has documents
      const documentCount = await Document.count({
        where: { folderId: id }
      });
      
      if (documentCount > 0) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Cannot delete folder that contains ${documentCount} document(s). Please move or delete documents first.`
        });
      }
      
      // Soft delete
      await folder.destroy({ transaction });
      
      // Log deletion
      await AuditLog.create({
        userId: req.user.id,
        action: 'DELETE_FOLDER',
        resourceType: 'Folder',
        resourceId: id,
        details: {
          folderName: folder.name,
          path: folder.path
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }, { transaction });
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Folder deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting folder:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete folder',
        error: error.message
      });
    }
  }
  
  // Get folder statistics
  async getFolderStats(req, res) {
    try {
      const { id } = req.params;
      
      const folder = await Folder.findByPk(id);
      
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }
      
      // Check permissions
      if (!folder.canUserAccess(req.user, 'read')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      const stats = await folder.calculateStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting folder stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve folder statistics',
        error: error.message
      });
    }
  }
  
  // Helper method to filter folders by user permissions
  async filterFoldersByPermission(folders, user) {
    if (!Array.isArray(folders)) return [];
    
    return folders.filter(folder => {
      if (user.role === 'admin') return true;
      return folder.canUserAccess(user, 'read');
    });
  }
}

module.exports = new FolderController();