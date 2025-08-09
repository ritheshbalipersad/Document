# Document Management System - Usage Guide

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [User Roles & Permissions](#user-roles--permissions)
- [Admin Features](#admin-features)
- [Folder Management](#folder-management)
- [Document Management](#document-management)
- [Workflow Management](#workflow-management)
- [System Administration](#system-administration)
- [Troubleshooting](#troubleshooting)

## 🚀 Getting Started

### First Time Setup
1. **Launch the Application**: Double-click the desktop shortcut or find it in Start Menu
2. **Login**: Use the default admin credentials:
   - Email: `admin@example.com`
   - Password: `admin123`
   - **⚠️ Important**: Change these credentials immediately after first login

3. **Initial Configuration**:
   - Go to Settings → System Configuration
   - Update company information and branding
   - Configure email settings (optional)
   - Create additional user accounts

### Navigation
- **Dashboard**: Overview of system statistics and recent activity
- **Documents**: Browse and manage all documents
- **Folders**: Organize documents in hierarchical folder structure
- **Workflow**: Manage document review and approval processes
- **Search**: Advanced search across document content and metadata
- **Settings**: System configuration and user preferences

## 👥 User Roles & Permissions

### Admin (Full Access)
- ✅ Upload, download, and review documents
- ✅ Create, edit, and delete folders
- ✅ Manage users and system settings
- ✅ Access admin panel and audit logs
- ✅ Configure workflows and email settings

### Reviewer
- ✅ Upload and download documents
- ✅ Review and approve/reject documents
- ✅ Create folders (limited)
- ❌ Cannot access admin panel or manage users

### Uploader
- ✅ Upload and download documents
- ✅ Create folders (limited)
- ❌ Cannot review documents or access admin features

### Viewer
- ✅ Download and view documents only
- ❌ Cannot upload, edit, or manage anything

## 🔧 Admin Features

### User Management
1. **Navigate**: Go to Settings → User Management
2. **Create User**:
   - Click "Add User" button
   - Fill in user details (name, email, role)
   - Set initial password
   - Assign role based on user needs
3. **Edit User**:
   - Click edit icon next to user
   - Modify role, active status, or personal information
   - Reset password if needed
4. **Deactivate User**: Toggle active status to disable access

### System Configuration
1. **Branding**:
   - Upload company logo
   - Set primary and secondary colors
   - Configure site name and URL
2. **Email Settings**:
   - Configure SMTP server details
   - Test email functionality
   - Set up notification templates
3. **Security Settings**:
   - Configure password policies
   - Set session timeout
   - Review audit logs

## 📁 Folder Management

### Accessing Folder Manager
1. Click **"Folders"** in the main navigation
2. The folder manager opens with:
   - **Left Panel**: Hierarchical folder tree
   - **Right Panel**: Current folder contents
   - **Toolbar**: Action buttons and breadcrumb navigation

### Creating Folders
1. **Method 1 - New Button**:
   - Click "New" button in folder tree panel
   - Enter folder name and description
   - Select parent folder (optional)
   - Choose folder color for visual organization
   - Click "Create Folder"

2. **Method 2 - Keyboard Shortcut**:
   - Press `Ctrl+N` anywhere in folder manager
   - Follow the same steps as above

3. **Method 3 - Context Menu**:
   - Right-click on any folder in the tree
   - Select "Create Subfolder"

### Organizing Documents
1. **Upload to Specific Folder**:
   - Navigate to desired folder
   - Click "Upload" button or drag files to drop zone
   - Files will be uploaded to current folder

2. **Move Documents Between Folders**:
   - **Drag & Drop**: Drag documents from content area to folder tree
   - **Bulk Move**: 
     - Select multiple documents using checkboxes
     - Click "Move" button in selection bar
     - Choose destination folder
     - Click "Move Items"

3. **Visual Organization**:
   - Folders show document count badges
   - Color-coded folders for easy identification
   - Hierarchical indentation shows folder levels

### Folder Operations
1. **Edit Folder**:
   - Right-click folder → "Edit"
   - Or click edit icon when hovering over folder
   - Modify name, description, color, or parent

2. **Delete Folder**:
   - Right-click folder → "Delete"
   - **Note**: Folder must be empty (no documents or subfolders)
   - Move contents first before deletion

3. **Move Folder**:
   - Edit folder and change parent
   - Or drag folder to new parent in tree

### Navigation Tips
- **Breadcrumb**: Click any folder in breadcrumb to navigate directly
- **Tree Navigation**: Click folders in left panel to browse
- **Home Button**: Click "All Documents" to return to root
- **Search**: Use search bar to find folders by name

## 📄 Document Management

### Uploading Documents
1. **Drag & Drop**:
   - Drag files from Windows Explorer to drop zone
   - Multiple files supported
   - Progress tracking for large files

2. **Upload Button**:
   - Click "Upload" button
   - Select files from file dialog
   - Choose destination folder

3. **Supported Formats**:
   - Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
   - Images: JPG, JPEG, PNG, GIF
   - Text: TXT, JSON, XML
   - Maximum file size: 50MB per file

### Document Operations
1. **View Document**:
   - Click document thumbnail to open preview
   - Built-in viewers for supported formats

2. **Download Document**:
   - Single: Click download icon or right-click → "Download"
   - Multiple: Select documents → "Download" button

3. **Move Document**:
   - Drag to folder in tree
   - Or use bulk move functionality

4. **Document Information**:
   - Hover over document for quick info
   - Click info icon for detailed metadata
   - View version history and audit trail

### Document Search
1. **Quick Search**: Use search bar in header
2. **Advanced Search**:
   - Go to Search page
   - Filter by file type, date range, size
   - Search within document content (OCR enabled)
   - Search by tags and metadata

## 🔄 Workflow Management

### Document Lifecycle
Documents follow this workflow:
1. **Draft** → Upload complete, ready for review
2. **Pending Review** → Assigned to reviewer
3. **Under Review** → Being actively reviewed
4. **Approved** → Review completed successfully
5. **Rejected** → Requires changes
6. **Archived** → Final approved state

### Review Process
1. **Assign for Review**:
   - Select document(s)
   - Click "Send for Review"
   - Choose reviewer and due date
   - Add review instructions

2. **Reviewing Documents** (Reviewers):
   - Go to Workflow page
   - See pending reviews
   - Open document for review
   - Add comments and decision
   - Approve, reject, or request changes

3. **Review Notifications**:
   - Email notifications for new assignments
   - Reminder emails for overdue reviews
   - Status updates to document owners

### Priority Levels
- **Critical**: Immediate attention required
- **High**: Review within 24 hours
- **Medium**: Standard review timeline
- **Low**: Review when available

## ⚙️ System Administration

### Monitoring & Maintenance
1. **Dashboard Statistics**:
   - Total documents and folders
   - Storage usage
   - Active users and recent activity

2. **Audit Logs**:
   - Complete activity tracking
   - User actions and system events
   - Compliance reporting
   - Export capabilities

3. **System Health**:
   - Check server status
   - Monitor disk space
   - Review error logs
   - Performance metrics

### Backup & Recovery
1. **Database Backup**:
   - Located in `data/document_management.db`
   - Copy file to backup location regularly
   - Test restore procedures

2. **File Backup**:
   - Back up entire `uploads/` folder
   - Include all subdirectories
   - Maintain file permissions

3. **Automated Backups**:
   - Set up scheduled backups using Windows Task Scheduler
   - Configure backup retention policies
   - Test recovery procedures regularly

## 🔍 Troubleshooting

### Common Issues

**Application Won't Start**
- Check Windows Event Viewer for errors
- Ensure port 3000 is available
- Verify Node.js installation (version 16+)
- Check file permissions in installation directory

**Cannot Upload Files**
- Verify file size is under 50MB limit
- Check available disk space
- Ensure supported file format
- Review uploads folder permissions

**Database Errors**
- Check if `data/` folder exists and is writable
- Verify SQLite database file integrity
- Review application logs in `logs/` folder
- Restart application to reset connections

**Email Notifications Not Working**
- Verify SMTP settings in System Configuration
- Test email configuration using "Send Test Email"
- Check firewall settings for SMTP ports
- Review email server authentication

**Performance Issues**
- Check available system memory
- Review disk space on system drive
- Close other resource-intensive applications
- Consider increasing maximum file size limits

**Login Problems**
- Verify username/password combination
- Check if user account is active
- Review session timeout settings
- Clear application data and restart

### Getting Help
1. **Application Logs**: Check `logs/error.log` for detailed error messages
2. **System Requirements**: Ensure Windows 10/11 with sufficient resources
3. **Updates**: Check for application updates via Help → Check for Updates
4. **Documentation**: Refer to this guide and README.md for detailed information

### Performance Optimization
1. **Regular Maintenance**:
   - Restart application weekly
   - Clean up temporary files
   - Archive old documents periodically
   - Monitor disk space usage

2. **Database Optimization**:
   - Keep database file size reasonable
   - Archive old audit logs
   - Clean up deleted items permanently
   - Rebuild database indexes if needed

## 🎯 Best Practices

### For Administrators
- Change default passwords immediately
- Create logical folder hierarchy before mass uploads
- Set up email notifications for important workflows
- Regularly review audit logs for security
- Maintain current backups
- Train users on proper document organization

### For Users
- Use descriptive document names
- Organize documents in appropriate folders
- Add descriptions and tags to documents
- Follow established naming conventions
- Complete reviews promptly
- Report issues to administrator quickly

### Security Recommendations
- Use strong passwords for all accounts
- Enable email notifications for security events
- Review user permissions regularly
- Monitor file access patterns
- Keep application updated
- Implement regular backup verification

---

**💡 Tip**: Bookmark this guide for quick reference. Most features include tooltips and help text for additional guidance.

**📞 Support**: For technical issues, check the logs first, then contact your system administrator with specific error messages and steps to reproduce the issue.