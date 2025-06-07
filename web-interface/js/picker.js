// Picker component for handling multiple download options
export class PickerModal {
    constructor() {
        this.isVisible = false;
        this.currentData = null;
    }

    // Show picker modal with data
    show(data) {
        this.currentData = data;
        this.createPickerUI();
        const modal = document.getElementById('picker-modal');
        modal.style.display = 'flex';
        this.isVisible = true;
    }

    // Hide picker modal
    hide() {
        const modal = document.getElementById('picker-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.isVisible = false;
        this.currentData = null;
    }

    // Create picker UI
    createPickerUI() {
        const pickerHTML = `
            <div id="picker-modal" class="download-progress-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-content" style="max-width: 800px; max-height: 80vh;">
                    <div class="modal-header">
                        <h3><i class="fas fa-images mr-2"></i>Chọn file để tải</h3>
                        <button class="close-btn" id="close-picker">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                        ${this.createPickerContent()}
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existing = document.getElementById('picker-modal');
        if (existing) {
            existing.remove();
        }

        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', pickerHTML);

        // Bind events
        this.bindPickerEvents();
    }

    // Create picker content based on data
    createPickerContent() {
        if (!this.currentData || !this.currentData.picker) {
            return '<p>Không có dữ liệu để hiển thị.</p>';
        }

        let content = '';

        // Show general audio if available
        if (this.currentData.audio) {
            content += `
                <div class="picker-section">
                    <h4 class="picker-section-title">
                        <i class="fas fa-music mr-2"></i>Âm thanh chung
                    </h4>
                    <div class="picker-item audio-item">
                        <div class="picker-item-info">
                            <i class="fas fa-music text-2xl"></i>
                            <div class="picker-item-details">
                                <div class="picker-item-title">${this.currentData.audioFilename || 'Audio Background'}</div>
                                <div class="picker-item-type">Âm thanh</div>
                            </div>
                        </div>
                        <button class="download-picker-btn" data-url="${this.currentData.audio}" data-filename="${this.currentData.audioFilename || 'audio'}">
                            <i class="fas fa-download mr-2"></i>Tải xuống
                        </button>
                    </div>
                </div>
            `;
        }

        // Group items by type
        const groupedItems = this.groupItemsByType(this.currentData.picker);

        // Create sections for each type
        Object.entries(groupedItems).forEach(([type, items]) => {
            const typeInfo = this.getTypeInfo(type);
            
            content += `
                <div class="picker-section">
                    <h4 class="picker-section-title">
                        <i class="${typeInfo.icon} mr-2"></i>${typeInfo.label} (${items.length})
                    </h4>
                    <div class="picker-grid">
                        ${items.map((item, index) => this.createPickerItem(item, index, type)).join('')}
                    </div>
                </div>
            `;
        });

        // Add bulk download options
        content += this.createBulkDownloadSection();

        return content;
    }

    // Group picker items by type
    groupItemsByType(items) {
        const grouped = {};
        
        items.forEach(item => {
            const type = item.type || 'unknown';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(item);
        });

        return grouped;
    }

    // Get type information
    getTypeInfo(type) {
        const typeMap = {
            'photo': { icon: 'fas fa-image', label: 'Hình ảnh' },
            'video': { icon: 'fas fa-video', label: 'Video' },
            'gif': { icon: 'fas fa-file-image', label: 'GIF' },
            'unknown': { icon: 'fas fa-file', label: 'Khác' }
        };

        return typeMap[type] || typeMap['unknown'];
    }

    // Create individual picker item
    createPickerItem(item, index, type) {
        const typeInfo = this.getTypeInfo(type);
        const filename = this.generateFilename(item, index, type);
        
        return `
            <div class="picker-item">
                <div class="picker-preview">
                    ${item.thumb ? 
                        `<img src="${item.thumb}" alt="Preview" class="picker-thumbnail" loading="lazy">` :
                        `<div class="picker-placeholder">
                            <i class="${typeInfo.icon} text-2xl"></i>
                        </div>`
                    }
                    <div class="picker-overlay">
                        <button class="picker-preview-btn" data-url="${item.url}" title="Xem trước">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="picker-item-info">
                    <div class="picker-item-title">${filename}</div>
                    <div class="picker-item-type">${typeInfo.label}</div>
                </div>
                <button class="download-picker-btn" data-url="${item.url}" data-filename="${filename}">
                    <i class="fas fa-download mr-1"></i>Tải
                </button>
            </div>
        `;
    }

    // Generate filename for item
    generateFilename(item, index, type) {
        const ext = this.getFileExtension(type);
        const timestamp = new Date().getTime();
        return `${type}_${index + 1}_${timestamp}.${ext}`;
    }

    // Get file extension by type
    getFileExtension(type) {
        const extMap = {
            'photo': 'jpg',
            'video': 'mp4',
            'gif': 'gif'
        };
        return extMap[type] || 'bin';
    }

    // Create bulk download section
    createBulkDownloadSection() {
        if (!this.currentData.picker || this.currentData.picker.length <= 1) {
            return '';
        }

        return `
            <div class="picker-section">
                <h4 class="picker-section-title">
                    <i class="fas fa-download mr-2"></i>Tải hàng loạt
                </h4>
                <div class="bulk-download-options">
                    <button class="bulk-download-btn" id="download-all-photos">
                        <i class="fas fa-images mr-2"></i>Tải tất cả hình ảnh
                    </button>
                    <button class="bulk-download-btn" id="download-all-videos">
                        <i class="fas fa-video mr-2"></i>Tải tất cả video
                    </button>
                    <button class="bulk-download-btn" id="download-all-items">
                        <i class="fas fa-download mr-2"></i>Tải tất cả
                    </button>
                </div>
            </div>
        `;
    }

    // Bind picker events
    bindPickerEvents() {
        const modal = document.getElementById('picker-modal');
        const closeBtn = document.getElementById('close-picker');
        const backdrop = modal.querySelector('.modal-backdrop');

        // Close events
        [closeBtn, backdrop].forEach(el => {
            el.addEventListener('click', () => this.hide());
        });

        // Individual download buttons
        modal.querySelectorAll('.download-picker-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.closest('.download-picker-btn').dataset.url;
                const filename = e.target.closest('.download-picker-btn').dataset.filename;
                this.downloadFile(url, filename);
            });
        });

        // Preview buttons
        modal.querySelectorAll('.picker-preview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.closest('.picker-preview-btn').dataset.url;
                this.previewFile(url);
            });
        });

        // Bulk download buttons
        const downloadAllPhotos = document.getElementById('download-all-photos');
        const downloadAllVideos = document.getElementById('download-all-videos');
        const downloadAllItems = document.getElementById('download-all-items');

        if (downloadAllPhotos) {
            downloadAllPhotos.addEventListener('click', () => {
                this.bulkDownload('photo');
            });
        }

        if (downloadAllVideos) {
            downloadAllVideos.addEventListener('click', () => {
                this.bulkDownload('video');
            });
        }

        if (downloadAllItems) {
            downloadAllItems.addEventListener('click', () => {
                this.bulkDownload('all');
            });
        }
    }

    // Download individual file
    async downloadFile(url, filename) {
        try {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Lỗi khi tải file: ' + error.message);
        }
    }

    // Preview file
    previewFile(url) {
        window.open(url, '_blank');
    }

    // Bulk download
    async bulkDownload(type) {
        if (!this.currentData.picker) return;

        let itemsToDownload = this.currentData.picker;

        // Filter by type if specified
        if (type !== 'all') {
            itemsToDownload = this.currentData.picker.filter(item => item.type === type);
        }

        if (itemsToDownload.length === 0) {
            alert('Không có file nào để tải.');
            return;
        }

        // Confirm bulk download
        const confirmed = confirm(`Bạn có muốn tải ${itemsToDownload.length} file?`);
        if (!confirmed) return;

        // Download with delay to avoid overwhelming the browser
        for (let i = 0; i < itemsToDownload.length; i++) {
            const item = itemsToDownload[i];
            const filename = this.generateFilename(item, i, item.type);
            
            setTimeout(() => {
                this.downloadFile(item.url, filename);
            }, i * 500); // 500ms delay between downloads
        }
    }
}
