// Folder Manager Application
class FolderManager {
    constructor() {
        this.currentFolderId = null;
        this.selectedItems = new Set();
        this.folders = [];
        this.documents = [];
        this.draggedItem = null;
        this.contextMenuItem = null;
        this.isAdmin = true; // This should be determined from user session
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadFolderTree();
            await this.loadFolderContents(null);
            this.setupEventListeners();
            this.setupDragAndDrop();
            this.showNotification('Folder manager initialized successfully', 'success');
        } catch (error) {
            console.error('Failed to initialize folder manager:', error);
            this.showNotification('Failed to initialize folder manager', 'error');
        }
    }
    
    setupEventListeners() {
        // Color picker for folder creation
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
        
        // Folder form submission
        document.getElementById('folderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFolderSubmit();
        });
        
        // Context menu
        document.addEventListener('contextmenu', (e) => {
            const itemCard = e.target.closest('.item-card');
            const folderItem = e.target.closest('.folder-item');
            
            if (itemCard || folderItem) {
                e.preventDefault();
                this.contextMenuItem = itemCard || folderItem;
                this.showContextMenu(e.clientX, e.clientY);
            }
        });
        
        // Click outside to close context menu
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // Selection handling
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('item-checkbox')) {
                this.handleItemSelection(e.target);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'a':
                        e.preventDefault();
                        this.selectAll();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.showCreateFolderModal();
                        break;
                    case 'u':
                        e.preventDefault();
                        this.showUploadModal();
                        break;
                }
            }
            
            if (e.key === 'Delete') {
                this.deleteSelected();
            }
            
            if (e.key === 'Escape') {
                this.clearSelection();
                this.hideContextMenu();
            }
        });
    }
    
    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        const contentGrid = document.getElementById('contentGrid');
        
        // File drop handling
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            contentGrid.addEventListener(eventName, this.preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            this.handleFileUpload(files);
        });
        
        // Folder item drag and drop
        this.setupFolderDragDrop();
    }
    
    setupFolderDragDrop() {
        // This will be called when folders are rendered
        const folderItems = document.querySelectorAll('.folder-item');
        
        folderItems.forEach(item => {
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                item.classList.add('drag-over');
            });
            
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                
                const targetFolderId = item.dataset.folderId;
                if (this.selectedItems.size > 0) {
                    this.moveSelectedItems(targetFolderId);
                }
            });
        });
    }
    
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    async loadFolderTree() {
        try {
            const response = await fetch('/api/folders/tree');
            const result = await response.json();
            
            if (result.success) {
                this.folders = result.data;
                this.renderFolderTree();
                this.populateFolderSelects();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to load folder tree:', error);
            this.showNotification('Failed to load folders', 'error');
        }
    }
    
    async loadFolderContents(folderId) {
        try {
            this.currentFolderId = folderId;
            
            const url = folderId ? `/api/folders/${folderId}/contents` : '/api/documents?folderId=null';
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                this.documents = result.data.documents || result.data;
                this.renderFolderContents();
                this.updateBreadcrumb();
                this.clearSelection();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to load folder contents:', error);
            this.showNotification('Failed to load folder contents', 'error');
        }
    }
    
    renderFolderTree() {
        const treeContainer = document.getElementById('folderTree');
        
        const renderFolder = (folder, level = 0) => {
            const indent = level * 20;
            return `
                <div class="folder-item" data-folder-id="${folder.id}" style="padding-left: ${indent + 12}px">
                    <i class="folder-icon fas fa-folder" style="color: ${folder.color}"></i>
                    <span class="folder-name">${folder.name}</span>
                    <span class="folder-count">${folder.documentCount || 0}</span>
                    ${this.isAdmin ? `
                        <div class="folder-actions">
                            <button class="action-btn" onclick="folderManager.editFolder(${folder.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn" onclick="folderManager.deleteFolder(${folder.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
                ${folder.children ? folder.children.map(child => renderFolder(child, level + 1)).join('') : ''}
            `;
        };
        
        const rootFolderHtml = `
            <div class="folder-item ${!this.currentFolderId ? 'selected' : ''}" data-folder-id="null">
                <i class="folder-icon fas fa-home"></i>
                <span class="folder-name">All Documents</span>
                <span class="folder-count">${this.documents.length}</span>
            </div>
        `;
        
        treeContainer.innerHTML = rootFolderHtml + this.folders.map(folder => renderFolder(folder)).join('');
        
        // Add click handlers
        treeContainer.querySelectorAll('.folder-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const folderId = item.dataset.folderId === 'null' ? null : parseInt(item.dataset.folderId);
                this.selectFolder(folderId);
            });
        });
        
        this.setupFolderDragDrop();
    }
    
    renderFolderContents() {
        const contentGrid = document.getElementById('contentGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (this.documents.length === 0) {
            contentGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        contentGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        contentGrid.innerHTML = this.documents.map(doc => `
            <div class="item-card" data-item-id="${doc.id}" data-item-type="document">
                <input type="checkbox" class="item-checkbox" data-item-id="${doc.id}">
                <div class="item-icon" style="color: ${this.getFileIconColor(doc.fileExtension)}">
                    <i class="${this.getFileIcon(doc.fileExtension)}"></i>
                </div>
                <div class="item-name">${doc.name}</div>
                <div class="item-meta">
                    ${this.formatFileSize(doc.fileSize)} • ${this.formatDate(doc.createdAt)}
                </div>
            </div>
        `).join('');
        
        // Add click handlers for document cards
        contentGrid.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('item-checkbox')) {
                    this.openDocument(parseInt(card.dataset.itemId));
                }
            });
        });
    }
    
    selectFolder(folderId) {
        // Update visual selection
        document.querySelectorAll('.folder-item').forEach(item => item.classList.remove('selected'));
        const selectedItem = document.querySelector(`[data-folder-id="${folderId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // Load folder contents
        this.loadFolderContents(folderId);
    }
    
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('breadcrumb');
        const contentTitle = document.getElementById('contentTitle');
        
        if (!this.currentFolderId) {
            breadcrumb.innerHTML = '<span class="breadcrumb-item">All Documents</span>';
            contentTitle.textContent = 'All Documents';
            return;
        }
        
        // Build breadcrumb from folder path
        const buildBreadcrumb = async () => {
            try {
                const response = await fetch(`/api/folders/${this.currentFolderId}`);
                const result = await response.json();
                
                if (result.success) {
                    const folder = result.data;
                    const pathParts = folder.path.split('/').filter(part => part);
                    
                    const breadcrumbHtml = [
                        '<span class="breadcrumb-item" onclick="folderManager.selectFolder(null)">All Documents</span>'
                    ];
                    
                    pathParts.forEach((part, index) => {
                        breadcrumbHtml.push('<i class="fas fa-chevron-right"></i>');
                        breadcrumbHtml.push(`<span class="breadcrumb-item">${part}</span>`);
                    });
                    
                    breadcrumb.innerHTML = breadcrumbHtml.join(' ');
                    contentTitle.textContent = folder.name;
                }
            } catch (error) {
                console.error('Failed to build breadcrumb:', error);
            }
        };
        
        buildBreadcrumb();
    }
    
    populateFolderSelects() {
        const folderParent = document.getElementById('folderParent');
        const moveDestination = document.getElementById('moveDestination');
        
        const buildOptions = (folders, level = 0) => {
            let options = '';
            const indent = '&nbsp;'.repeat(level * 4);
            
            folders.forEach(folder => {
                options += `<option value="${folder.id}">${indent}${folder.name}</option>`;
                if (folder.children) {
                    options += buildOptions(folder.children, level + 1);
                }
            });
            
            return options;
        };
        
        const optionsHtml = buildOptions(this.folders);
        folderParent.innerHTML = '<option value="">Root Folder</option>' + optionsHtml;
        moveDestination.innerHTML = '<option value="">Root Folder</option>' + optionsHtml;
    }
    
    // Modal functions
    showCreateFolderModal() {
        const modal = document.getElementById('folderModal');
        const title = document.getElementById('folderModalTitle');
        const form = document.getElementById('folderForm');
        
        title.textContent = 'Create Folder';
        form.reset();
        
        // Set current folder as default parent
        if (this.currentFolderId) {
            document.getElementById('folderParent').value = this.currentFolderId;
        }
        
        modal.classList.add('show');
    }
    
    closeFolderModal() {
        document.getElementById('folderModal').classList.remove('show');
    }
    
    async handleFolderSubmit() {
        const formData = new FormData(document.getElementById('folderForm'));
        const selectedColor = document.querySelector('.color-option.selected').dataset.color;
        
        const folderData = {
            name: document.getElementById('folderName').value,
            description: document.getElementById('folderDescription').value,
            parentId: document.getElementById('folderParent').value || null,
            color: selectedColor
        };
        
        try {
            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(folderData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Folder created successfully', 'success');
                this.closeFolderModal();
                await this.loadFolderTree();
                if (folderData.parentId == this.currentFolderId) {
                    await this.loadFolderContents(this.currentFolderId);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
            this.showNotification('Failed to create folder: ' + error.message, 'error');
        }
    }
    
    showMoveModal() {
        if (this.selectedItems.size === 0) {
            this.showNotification('Please select items to move', 'warning');
            return;
        }
        
        document.getElementById('moveModal').classList.add('show');
    }
    
    closeMoveModal() {
        document.getElementById('moveModal').classList.remove('show');
    }
    
    async executeMove() {
        const targetFolderId = document.getElementById('moveDestination').value || null;
        
        try {
            await this.moveSelectedItems(targetFolderId);
            this.closeMoveModal();
        } catch (error) {
            console.error('Failed to move items:', error);
        }
    }
    
    // Item selection and actions
    handleItemSelection(checkbox) {
        const itemId = parseInt(checkbox.dataset.itemId);
        const itemCard = checkbox.closest('.item-card');
        
        if (checkbox.checked) {
            this.selectedItems.add(itemId);
            itemCard.classList.add('selected');
        } else {
            this.selectedItems.delete(itemId);
            itemCard.classList.remove('selected');
        }
        
        this.updateSelectionBar();
    }
    
    updateSelectionBar() {
        const selectionBar = document.getElementById('selectionBar');
        const selectionInfo = document.getElementById('selectionInfo');
        
        if (this.selectedItems.size > 0) {
            selectionBar.classList.add('show');
            selectionInfo.textContent = `${this.selectedItems.size} item${this.selectedItems.size !== 1 ? 's' : ''} selected`;
        } else {
            selectionBar.classList.remove('show');
        }
    }
    
    selectAll() {
        const checkboxes = document.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            this.handleItemSelection(checkbox);
        });
    }
    
    clearSelection() {
        this.selectedItems.clear();
        document.querySelectorAll('.item-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        document.querySelectorAll('.item-card').forEach(card => {
            card.classList.remove('selected');
        });
        this.updateSelectionBar();
    }
    
    async moveSelectedItems(targetFolderId) {
        if (this.selectedItems.size === 0) return;
        
        const documentIds = Array.from(this.selectedItems);
        const sourceFolderId = this.currentFolderId || 'null';
        
        try {
            const response = await fetch(`/api/folders/${sourceFolderId}/documents/move`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documentIds,
                    targetFolderId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`${result.data.movedCount} item(s) moved successfully`, 'success');
                await this.loadFolderContents(this.currentFolderId);
                await this.loadFolderTree();
                this.clearSelection();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to move items:', error);
            this.showNotification('Failed to move items: ' + error.message, 'error');
        }
    }
    
    async deleteSelected() {
        if (this.selectedItems.size === 0) {
            this.showNotification('Please select items to delete', 'warning');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${this.selectedItems.size} selected item(s)?`)) {
            return;
        }
        
        // Implementation for deleting documents
        this.showNotification('Delete functionality will be implemented', 'info');
    }
    
    // Context menu functions
    showContextMenu(x, y) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';
    }
    
    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }
    
    // Utility functions
    getFileIcon(extension) {
        const iconMap = {
            pdf: 'fas fa-file-pdf',
            doc: 'fas fa-file-word',
            docx: 'fas fa-file-word',
            xls: 'fas fa-file-excel',
            xlsx: 'fas fa-file-excel',
            ppt: 'fas fa-file-powerpoint',
            pptx: 'fas fa-file-powerpoint',
            jpg: 'fas fa-file-image',
            jpeg: 'fas fa-file-image',
            png: 'fas fa-file-image',
            gif: 'fas fa-file-image',
            txt: 'fas fa-file-alt',
            json: 'fas fa-file-code',
            xml: 'fas fa-file-code'
        };
        
        return iconMap[extension?.toLowerCase()] || 'fas fa-file';
    }
    
    getFileIconColor(extension) {
        const colorMap = {
            pdf: '#dc2626',
            doc: '#2563eb',
            docx: '#2563eb',
            xls: '#16a34a',
            xlsx: '#16a34a',
            ppt: '#ea580c',
            pptx: '#ea580c',
            jpg: '#7c3aed',
            jpeg: '#7c3aed',
            png: '#7c3aed',
            gif: '#7c3aed',
            txt: '#6b7280',
            json: '#059669',
            xml: '#059669'
        };
        
        return colorMap[extension?.toLowerCase()] || '#6b7280';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
    
    // Placeholder functions for features to be implemented
    async refreshContent() {
        await this.loadFolderContents(this.currentFolderId);
        this.showNotification('Content refreshed', 'success');
    }
    
    showUploadModal() {
        this.showNotification('Upload functionality will be implemented', 'info');
    }
    
    toggleView() {
        this.showNotification('View toggle functionality will be implemented', 'info');
    }
    
    openDocument(documentId) {
        this.showNotification(`Opening document ${documentId}`, 'info');
    }
    
    editFolder(folderId) {
        this.showNotification(`Edit folder ${folderId} functionality will be implemented`, 'info');
    }
    
    async deleteFolder(folderId) {
        if (!confirm('Are you sure you want to delete this folder?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/folders/${folderId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Folder deleted successfully', 'success');
                await this.loadFolderTree();
                if (this.currentFolderId === folderId) {
                    this.selectFolder(null);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Failed to delete folder:', error);
            this.showNotification('Failed to delete folder: ' + error.message, 'error');
        }
    }
    
    handleFileUpload(files) {
        this.showNotification(`${files.length} file(s) dropped. Upload functionality will be implemented`, 'info');
    }
    
    downloadSelected() {
        this.showNotification('Download functionality will be implemented', 'info');
    }
    
    openItem() {
        this.showNotification('Open functionality will be implemented', 'info');
    }
    
    editItem() {
        this.showNotification('Edit functionality will be implemented', 'info');
    }
    
    shareItem() {
        this.showNotification('Share functionality will be implemented', 'info');
    }
    
    downloadItem() {
        this.showNotification('Download functionality will be implemented', 'info');
    }
    
    deleteItem() {
        this.showNotification('Delete functionality will be implemented', 'info');
    }
}

// Global functions for onclick handlers
let folderManager;

function showCreateFolderModal() {
    folderManager.showCreateFolderModal();
}

function closeFolderModal() {
    folderManager.closeFolderModal();
}

function showMoveModal() {
    folderManager.showMoveModal();
}

function closeMoveModal() {
    folderManager.closeMoveModal();
}

function executeMove() {
    folderManager.executeMove();
}

function refreshContent() {
    folderManager.refreshContent();
}

function showUploadModal() {
    folderManager.showUploadModal();
}

function toggleView() {
    folderManager.toggleView();
}

function downloadSelected() {
    folderManager.downloadSelected();
}

function deleteSelected() {
    folderManager.deleteSelected();
}

function openItem() {
    folderManager.openItem();
}

function editItem() {
    folderManager.editItem();
}

function shareItem() {
    folderManager.shareItem();
}

function downloadItem() {
    folderManager.downloadItem();
}

function deleteItem() {
    folderManager.deleteItem();
}

// Initialize the folder manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    folderManager = new FolderManager();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .notification.success { background: #10b981; }
    .notification.error { background: #ef4444; }
    .notification.warning { background: #f59e0b; }
    .notification.info { background: #3b82f6; }

    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;

// Add styles to head
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);