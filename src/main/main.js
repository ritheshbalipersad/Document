const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Initialize electron store for settings
const store = new Store();

// Load environment variables
require('dotenv').config();

class DocumentManagementApp {
    constructor() {
        this.mainWindow = null;
        this.tray = null;
        this.backendProcess = null;
        this.isQuitting = false;
        
        // Development or production mode
        this.isDev = process.env.NODE_ENV === 'development';
        this.serverUrl = `http://localhost:${process.env.PORT || 3000}`;
        
        this.init();
    }
    
    init() {
        // Set app user model ID for Windows notifications
        if (process.platform === 'win32') {
            app.setAppUserModelId('com.company.document-management');
        }
        
        // Single instance check
        const gotTheLock = app.requestSingleInstanceLock();
        if (!gotTheLock) {
            app.quit();
            return;
        }
        
        app.on('second-instance', () => {
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                this.mainWindow.focus();
            }
        });
        
        // App event handlers
        app.whenReady().then(() => this.onReady());
        app.on('window-all-closed', () => this.onWindowAllClosed());
        app.on('activate', () => this.onActivate());
        app.on('before-quit', () => this.onBeforeQuit());
        
        // Auto-updater events
        this.setupAutoUpdater();
        
        // IPC handlers
        this.setupIpcHandlers();
    }
    
    async onReady() {
        // Start backend server
        await this.startBackendServer();
        
        // Create main window
        this.createMainWindow();
        
        // Create system tray
        this.createTray();
        
        // Create application menu
        this.createMenu();
        
        // Check for updates
        if (!this.isDev && store.get('checkForUpdates', true)) {
            autoUpdater.checkForUpdatesAndNotify();
        }
        
        // Set auto-launch preference
        if (store.get('autoLaunch', false)) {
            app.setLoginItemSettings({
                openAtLogin: true,
                path: process.execPath
            });
        }
    }
    
    createMainWindow() {
        // Load window state
        const mainWindowState = windowStateKeeper({
            defaultWidth: parseInt(process.env.WINDOW_WIDTH) || 1200,
            defaultHeight: parseInt(process.env.WINDOW_HEIGHT) || 800
        });
        
        // Create window
        this.mainWindow = new BrowserWindow({
            x: mainWindowState.x,
            y: mainWindowState.y,
            width: mainWindowState.width,
            height: mainWindowState.height,
            minWidth: 800,
            minHeight: 600,
            title: process.env.SITE_NAME || 'Document Management System',
            icon: path.join(__dirname, '../../assets/icon.ico'),
            show: !store.get('startMinimized', false),
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js')
            }
        });
        
        // Manage window state
        mainWindowState.manage(this.mainWindow);
        
        // Load the application
        this.mainWindow.loadURL(this.serverUrl);
        
        // Development tools
        if (this.isDev) {
            this.mainWindow.webContents.openDevTools();
        }
        
        // Window event handlers
        this.mainWindow.on('close', (event) => {
            if (!this.isQuitting && store.get('minimizeToTray', true)) {
                event.preventDefault();
                this.mainWindow.hide();
                
                // Show tray notification on first minimize
                if (!store.get('hasShownTrayNotification', false)) {
                    this.tray.displayBalloon({
                        iconType: 'info',
                        title: 'Document Management System',
                        content: 'Application was minimized to tray'
                    });
                    store.set('hasShownTrayNotification', true);
                }
            }
        });
        
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
        
        // Handle external links
        this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });
        
        // Disable navigation to external sites
        this.mainWindow.webContents.on('will-navigate', (event, url) => {
            if (url !== this.serverUrl && !url.startsWith(this.serverUrl)) {
                event.preventDefault();
                shell.openExternal(url);
            }
        });
    }
    
    createTray() {
        this.tray = new Tray(path.join(__dirname, '../../assets/icon.ico'));
        
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'Open Document Management',
                click: () => {
                    if (this.mainWindow) {
                        this.mainWindow.show();
                        this.mainWindow.focus();
                    } else {
                        this.createMainWindow();
                    }
                }
            },
            { type: 'separator' },
            {
                label: 'Preferences',
                click: () => this.showPreferences()
            },
            {
                label: 'About',
                click: () => this.showAbout()
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    this.isQuitting = true;
                    app.quit();
                }
            }
        ]);
        
        this.tray.setContextMenu(contextMenu);
        this.tray.setToolTip('Document Management System');
        
        // Double click to open
        this.tray.on('double-click', () => {
            if (this.mainWindow) {
                this.mainWindow.show();
                this.mainWindow.focus();
            } else {
                this.createMainWindow();
            }
        });
    }
    
    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Upload Document',
                        accelerator: 'CmdOrCtrl+U',
                        click: () => this.triggerFileUpload()
                    },
                    {
                        label: 'New Folder',
                        accelerator: 'CmdOrCtrl+Shift+N',
                        click: () => this.triggerNewFolder()
                    },
                    { type: 'separator' },
                    {
                        label: 'Preferences',
                        accelerator: 'CmdOrCtrl+,',
                        click: () => this.showPreferences()
                    },
                    { type: 'separator' },
                    {
                        label: 'Exit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            this.isQuitting = true;
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    { role: 'selectall' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'close' }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'Check for Updates',
                        click: () => autoUpdater.checkForUpdatesAndNotify()
                    },
                    {
                        label: 'About',
                        click: () => this.showAbout()
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
    
    async startBackendServer() {
        return new Promise((resolve) => {
            const serverPath = path.join(__dirname, '../backend/server.js');
            
            this.backendProcess = spawn('node', [serverPath], {
                stdio: this.isDev ? 'inherit' : 'ignore',
                cwd: path.join(__dirname, '../..')
            });
            
            this.backendProcess.on('error', (error) => {
                console.error('Backend server error:', error);
            });
            
            // Wait for server to start
            setTimeout(resolve, 2000);
        });
    }
    
    setupAutoUpdater() {
        autoUpdater.checkForUpdatesAndNotify();
        
        autoUpdater.on('update-available', () => {
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Available',
                message: 'A new version is available. It will be downloaded in the background.',
                buttons: ['OK']
            });
        });
        
        autoUpdater.on('update-downloaded', () => {
            dialog.showMessageBox(this.mainWindow, {
                type: 'info',
                title: 'Update Ready',
                message: 'Update downloaded. Application will restart to apply the update.',
                buttons: ['Restart Now', 'Later']
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
    }
    
    setupIpcHandlers() {
        ipcMain.handle('get-app-version', () => app.getVersion());
        
        ipcMain.handle('get-user-data-path', () => app.getPath('userData'));
        
        ipcMain.handle('show-save-dialog', async (event, options) => {
            const result = await dialog.showSaveDialog(this.mainWindow, options);
            return result;
        });
        
        ipcMain.handle('show-open-dialog', async (event, options) => {
            const result = await dialog.showOpenDialog(this.mainWindow, options);
            return result;
        });
        
        ipcMain.handle('show-message-box', async (event, options) => {
            const result = await dialog.showMessageBox(this.mainWindow, options);
            return result;
        });
        
        ipcMain.handle('get-store-value', (event, key, defaultValue) => {
            return store.get(key, defaultValue);
        });
        
        ipcMain.handle('set-store-value', (event, key, value) => {
            store.set(key, value);
        });
        
        ipcMain.handle('restart-app', () => {
            app.relaunch();
            app.exit();
        });
    }
    
    triggerFileUpload() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('trigger-file-upload');
        }
    }
    
    triggerNewFolder() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('trigger-new-folder');
        }
    }
    
    showPreferences() {
        if (this.mainWindow) {
            this.mainWindow.webContents.send('show-preferences');
        }
    }
    
    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Document Management System',
            message: `Document Management System v${app.getVersion()}`,
            detail: 'Enterprise document management with workflow automation.\n\nBuilt with Electron and Node.js',
            buttons: ['OK']
        });
    }
    
    onWindowAllClosed() {
        if (process.platform !== 'darwin' && !store.get('minimizeToTray', true)) {
            app.quit();
        }
    }
    
    onActivate() {
        if (BrowserWindow.getAllWindows().length === 0) {
            this.createMainWindow();
        }
    }
    
    onBeforeQuit() {
        this.isQuitting = true;
        
        // Kill backend server
        if (this.backendProcess) {
            this.backendProcess.kill();
        }
    }
}

// Create and initialize the application
new DocumentManagementApp();