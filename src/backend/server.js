const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const cron = require('node-cron');

// Load environment variables
require('dotenv').config();

// Import database and models
const db = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const folderRoutes = require('./routes/folders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const workflowRoutes = require('./routes/workflow');
const searchRoutes = require('./routes/search');
const settingsRoutes = require('./routes/settings');

// Import services
const emailService = require('./services/emailService');
const ocrService = require('./services/ocrService');
const notificationService = require('./services/notificationService');

class DocumentManagementServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.logger = this.setupLogger();
        
        this.init();
    }
    
    setupLogger() {
        return winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'document-management' },
            transports: [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }
    
    async init() {
        try {
            // Create necessary directories
            this.createDirectories();
            
            // Initialize database
            await this.initDatabase();
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Setup cron jobs
            this.setupCronJobs();
            
            // Start server
            this.start();
            
        } catch (error) {
            this.logger.error('Failed to initialize server:', error);
            process.exit(1);
        }
    }
    
    createDirectories() {
        const directories = [
            'data',
            'logs',
            'uploads/documents',
            'uploads/thumbnails',
            'uploads/branding',
            'uploads/temp'
        ];
        
        directories.forEach(dir => {
            const fullPath = path.join(process.cwd(), dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                this.logger.info(`Created directory: ${fullPath}`);
            }
        });
    }
    
    async initDatabase() {
        try {
            // Test database connection
            await db.sequelize.authenticate();
            this.logger.info('Database connection established successfully.');
            
            // Sync database models
            await db.sequelize.sync({ alter: true });
            this.logger.info('Database models synchronized.');
            
            // Create default admin user if none exists
            await this.createDefaultAdmin();
            
        } catch (error) {
            this.logger.error('Unable to connect to the database:', error);
            throw error;
        }
    }
    
    async createDefaultAdmin() {
        try {
            const adminCount = await db.User.count({ where: { role: 'admin' } });
            
            if (adminCount === 0) {
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(
                    process.env.ADMIN_PASSWORD || 'admin123',
                    parseInt(process.env.BCRYPT_ROUNDS) || 12
                );
                
                await db.User.create({
                    email: process.env.ADMIN_EMAIL || 'admin@example.com',
                    password: hashedPassword,
                    firstName: process.env.ADMIN_FIRST_NAME || 'System',
                    lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
                    role: 'admin',
                    isActive: true,
                    emailVerified: true
                });
                
                this.logger.info('Default admin user created successfully.');
            }
        } catch (error) {
            this.logger.error('Error creating default admin user:', error);
        }
    }
    
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "blob:"],
                    connectSrc: ["'self'"]
                }
            }
        }));
        
        // CORS configuration
        this.app.use(cors({
            origin: [`http://localhost:${this.port}`, 'http://127.0.0.1:' + this.port],
            credentials: true
        }));
        
        // Body parsing middleware
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // Session configuration
        this.app.use(session({
            store: new SQLiteStore({
                db: 'sessions.db',
                dir: './data'
            }),
            secret: process.env.SESSION_SECRET || 'your-secret-key',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false, // Set to true if using HTTPS
                httpOnly: true,
                maxAge: parseInt(process.env.SESSION_TIMEOUT) || 3600000 // 1 hour
            }
        }));
        
        // Logging middleware
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });
        
        // Static file serving
        this.app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
        this.app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
        this.app.use(express.static(path.join(__dirname, '../renderer/dist')));
    }
    
    setupRoutes() {
        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/documents', documentRoutes);
        this.app.use('/api/folders', folderRoutes);
        this.app.use('/api/users', userRoutes);
        this.app.use('/api/admin', adminRoutes);
        this.app.use('/api/workflow', workflowRoutes);
        this.app.use('/api/search', searchRoutes);
        this.app.use('/api/settings', settingsRoutes);
        
        // Health check endpoint
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            });
        });
        
        // Serve frontend for all other routes
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../renderer/dist/index.html'));
        });
    }
    
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: 'The requested resource was not found'
            });
        });
        
        // Global error handler
        this.app.use((err, req, res, next) => {
            this.logger.error('Unhandled error:', err);
            
            const statusCode = err.statusCode || 500;
            const message = process.env.NODE_ENV === 'production' 
                ? 'Internal Server Error' 
                : err.message;
            
            res.status(statusCode).json({
                error: 'Server Error',
                message: message,
                ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
            });
        });
        
        // Graceful shutdown handling
        process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
        
        process.on('uncaughtException', (error) => {
            this.logger.error('Uncaught Exception:', error);
            this.gracefulShutdown('uncaughtException');
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }
    
    setupCronJobs() {
        // Daily cleanup of temporary files
        cron.schedule('0 2 * * *', () => {
            this.logger.info('Running daily cleanup job');
            this.cleanupTempFiles();
        });
        
        // Weekly reminder emails for pending reviews
        cron.schedule('0 9 * * 1', async () => {
            this.logger.info('Running weekly reminder job');
            await notificationService.sendWeeklyReminders();
        });
        
        // Daily reminder emails for overdue reviews
        cron.schedule('0 9 * * *', async () => {
            this.logger.info('Running daily reminder job');
            await notificationService.sendDailyReminders();
        });
        
        // Monthly database cleanup
        cron.schedule('0 3 1 * *', async () => {
            this.logger.info('Running monthly database cleanup');
            await this.cleanupDatabase();
        });
    }
    
    cleanupTempFiles() {
        const tempDir = path.join(process.cwd(), 'uploads/temp');
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        fs.readdir(tempDir, (err, files) => {
            if (err) return;
            
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                fs.stat(filePath, (err, stats) => {
                    if (err) return;
                    
                    const age = Date.now() - stats.mtime.getTime();
                    if (age > maxAge) {
                        fs.unlink(filePath, (err) => {
                            if (!err) {
                                this.logger.info(`Cleaned up temp file: ${file}`);
                            }
                        });
                    }
                });
            });
        });
    }
    
    async cleanupDatabase() {
        try {
            // Clean up old audit logs (keep last 6 months)
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            await db.AuditLog.destroy({
                where: {
                    createdAt: {
                        [db.Sequelize.Op.lt]: sixMonthsAgo
                    }
                }
            });
            
            // Clean up old sessions
            const sessionCleanupQuery = `
                DELETE FROM sessions 
                WHERE datetime(expired, '+1 day') < datetime('now')
            `;
            await db.sequelize.query(sessionCleanupQuery);
            
            this.logger.info('Database cleanup completed successfully');
        } catch (error) {
            this.logger.error('Database cleanup failed:', error);
        }
    }
    
    async gracefulShutdown(signal) {
        this.logger.info(`Received ${signal}. Starting graceful shutdown...`);
        
        // Stop accepting new connections
        if (this.server) {
            this.server.close(async () => {
                this.logger.info('HTTP server closed.');
                
                // Close database connections
                await db.sequelize.close();
                this.logger.info('Database connections closed.');
                
                process.exit(0);
            });
        }
        
        // Force shutdown after 10 seconds
        setTimeout(() => {
            this.logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
    
    start() {
        this.server = this.app.listen(this.port, '127.0.0.1', () => {
            this.logger.info(`Document Management Server running on port ${this.port}`);
            this.logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            this.logger.info(`Database: ${process.env.DB_TYPE || 'sqlite'}`);
        });
        
        // Handle server errors
        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                this.logger.error(`Port ${this.port} is already in use`);
            } else {
                this.logger.error('Server error:', error);
            }
            process.exit(1);
        });
    }
}

// Create and start the server
new DocumentManagementServer();