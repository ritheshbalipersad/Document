const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App information
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
    
    // File dialogs
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
    
    // Settings store
    getStoreValue: (key, defaultValue) => ipcRenderer.invoke('get-store-value', key, defaultValue),
    setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
    
    // App controls
    restartApp: () => ipcRenderer.invoke('restart-app'),
    
    // Event listeners for main process events
    onTriggerFileUpload: (callback) => ipcRenderer.on('trigger-file-upload', callback),
    onTriggerNewFolder: (callback) => ipcRenderer.on('trigger-new-folder', callback),
    onShowPreferences: (callback) => ipcRenderer.on('show-preferences', callback),
    
    // Remove event listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    
    // Platform information
    platform: process.platform,
    isWindows: process.platform === 'win32',
    isMac: process.platform === 'darwin',
    isLinux: process.platform === 'linux'
});

// Expose node process information
contextBridge.exposeInMainWorld('nodeAPI', {
    versions: process.versions,
    platform: process.platform,
    arch: process.arch
});