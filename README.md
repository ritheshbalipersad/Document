# Document Management System for Windows

A comprehensive, enterprise-grade document management system built as a Windows desktop application using Electron and Node.js. Features advanced workflow automation, role-based access control, version management, and secure document collaboration.

## ✨ Key Features

### Core Document Management
- **Multi-format Support**: PDF, DOCX, XLSX, JPG, PNG, TXT, JSON, XML
- **Drag & Drop Upload**: Intuitive file upload with progress tracking
- **Folder Organization**: Hierarchical folder structure with color coding
- **Full-Text Search**: Advanced search across document content and metadata
- **Document Preview**: Built-in preview for supported file types
- **Version Control**: Complete document versioning with audit trails
- **Trash Management**: Soft delete with restore functionality
- **OCR Processing**: Automatic text extraction from images and PDFs

### Advanced Workflow Management
- **Document Lifecycle**: Upload → Review → Approved/Rejected → Archived
- **Review Scheduling**: Configurable review cycles (monthly, quarterly, annual)
- **Priority Levels**: Low, Medium, High, Critical priority assignments
- **Status Tracking**: Real-time workflow status with visual indicators
- **Automated Reminders**: Daily and weekly review notifications

### Email Integration & Automation
- **SMTP Configuration**: Custom email server integration
- **Email Import**: Automatic document ingestion from email attachments
- **Notification System**: Multi-party notifications for sharing, downloads, approvals
- **Review Reminders**: Scheduled reminder emails for pending reviews
- **Professional Templates**: Branded email templates

### Security & Access Control
- **Role-Based Access**: Admin, Reviewer, Uploader, Viewer roles
- **Local Authentication**: Secure bcrypt password hashing
- **Session Management**: SQLite-based session storage
- **Password Management**: Admin password reset capabilities
- **Audit Logging**: Complete activity tracking and compliance reporting

### User Roles & Permissions

| Role | Upload | Download | Review | Admin Panel | User Management |
|------|--------|----------|--------|-------------|-----------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reviewer | ✅ | ✅ | ✅ | ❌ | ❌ |
| Uploader | ✅ | ✅ | ❌ | ❌ | ❌ |
| Viewer | ❌ | ✅ | ❌ | ❌ | ❌ |

## 🚀 Quick Start

### Prerequisites

- **Windows 10/11** or **Windows Server 2016+**
- **Node.js 16.0.0+** - [Download here](https://nodejs.org/)
- **npm 8.0.0+** (included with Node.js)

### Installation

1. **Download or Clone the Repository**
   ```bash
   git clone https://github.com/your-org/document-management-system.git
   cd document-management-system
   ```

2. **Run the Windows Installer**
   ```cmd
   install-windows.bat
   ```
   
   Or manually install:
   ```cmd
   npm install
   copy .env.example .env
   ```

3. **Configure Environment Variables**
   Edit the `.env` file to configure your settings:
   ```env
   # Database (SQLite - no setup required)
   DB_TYPE=sqlite
   DB_PATH=./data/document_management.db
   
   # Server Configuration
   PORT=3000
   SESSION_SECRET=your_secure_session_secret_here
   
   # Admin User
   ADMIN_EMAIL=admin@yourcompany.com
   ADMIN_PASSWORD=SecurePassword123
   
   # Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. **Launch the Application**
   ```cmd
   npm start
   ```

### First Time Setup

1. The application will create a default admin user on first run
2. Login with the credentials specified in your `.env` file
3. Configure additional users through the Admin Panel
4. Set up email notifications (optional)
5. Configure branding and site settings

## 🛠️ Development

### Development Mode
```cmd
npm run dev
```

### Building for Distribution
```cmd
# Create Windows installer (.exe, .msi, portable)
npm run dist:win

# Create portable version only
npm run dist:portable
```

### Database Management
```cmd
# Run database migrations
npm run migrate

# Seed sample data
npm run seed
```

## 📁 Project Structure

```
document-management-system/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.js          # Main application entry
│   │   └── preload.js       # Secure IPC bridge
│   ├── backend/             # Node.js backend server
│   │   ├── server.js        # Express server
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utility functions
│   └── renderer/            # Frontend interface
│       └── dist/            # Built frontend files
├── assets/                  # Application assets
├── uploads/                 # Document storage
├── data/                    # Database files
├── logs/                    # Application logs
├── .env.example            # Environment template
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DB_PATH` | SQLite database path | `./data/document_management.db` |
| `SESSION_SECRET` | Session encryption key | Required |
| `ADMIN_EMAIL` | Default admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Default admin password | `admin123` |
| `UPLOAD_PATH` | File upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Maximum file size (bytes) | `50000000` (50MB) |
| `SMTP_HOST` | Email server host | Optional |
| `SMTP_PORT` | Email server port | `587` |
| `TESSERACT_PATH` | OCR engine path | Auto-detected |

### Folder Structure Permissions

The application creates several folders with specific purposes:

- **uploads/documents/** - Stored document files
- **uploads/thumbnails/** - Generated preview thumbnails
- **uploads/branding/** - Company logos and branding assets
- **uploads/temp/** - Temporary files (auto-cleaned)
- **data/** - SQLite database files
- **logs/** - Application and error logs

## 🔐 Security Features

### Authentication & Authorization
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- Session-based authentication
- Password reset functionality

### Data Protection
- SQLite database with transaction support
- File integrity checking with checksums
- Audit logging for compliance
- Soft delete with recovery options

### Access Control
- Granular permissions per role
- Document-level sharing controls
- Folder-based permissions
- Session timeout management

## 📧 Email Configuration

### SMTP Setup
1. Configure SMTP settings in `.env`
2. For Gmail, use App Passwords
3. Test email functionality in Admin Panel

### Notification Types
- Document upload notifications
- Review assignment alerts
- Workflow status updates
- System maintenance notices

## 🔍 Search & OCR

### Full-Text Search
- Search document names and descriptions
- Search within document content (OCR)
- Tag-based filtering
- Advanced search filters

### OCR Configuration
- Automatic text extraction from images
- PDF text extraction
- Configurable OCR languages
- Confidence scoring

## 📊 Administration

### Admin Panel Features
- User management (CRUD operations)
- System configuration
- Email settings
- Branding customization
- Audit log viewing
- Storage statistics

### System Monitoring
- Real-time performance metrics
- Storage usage tracking
- User activity monitoring
- Error log analysis

## 🔄 Backup & Recovery

### Database Backup
```cmd
# Manual backup
copy data\document_management.db backup\
```

### File Backup
- Regular backup of uploads folder recommended
- Consider automated backup solutions
- Test restore procedures regularly

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
- Check Node.js version (16.0.0+)
- Verify port 3000 is available
- Check file permissions

**Database errors**
- Ensure data folder is writable
- Check SQLite installation
- Review error logs

**File upload issues**
- Check upload folder permissions
- Verify file size limits
- Review allowed file types

### Logs Location
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Windows Event Viewer integration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For technical support or feature requests:
1. Check the troubleshooting section
2. Review application logs
3. Create an issue on GitHub
4. Contact system administrator

## 🔄 Updates

### Automatic Updates
- Built-in update checker
- Background download capability
- User-controlled update installation

### Manual Updates
1. Download latest release
2. Backup current installation
3. Run new installer
4. Migrate data if needed

---

**Built with ❤️ using Electron, Node.js, and modern web technologies.**
