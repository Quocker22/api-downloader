import { formatBytes, formatTime } from './utils.js';

// Progress modal management
export class ProgressModal {
    constructor(filename) {
        this.filename = filename;
        this.modal = this.createModal();
        this.setupElements();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.className = 'download-progress-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Đang tải xuống</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="file-info">
                        <i class="fas fa-file-video"></i>
                        <span class="filename">${this.filename || 'video.mp4'}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-bar-fill"></div>
                        </div>
                        <div class="progress-info">
                            <span class="progress-text">0%</span>
                            <span class="speed-text">Đang kết nối...</span>
                        </div>
                        <div class="time-text">Đang tính toán...</div>
                    </div>
                    <div class="action-buttons" style="display: none;">
                        <button class="save-btn">
                            <i class="fas fa-save"></i> Lưu file
                        </button>
                        <button class="cancel-btn">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    setupElements() {
        this.progressBar = this.modal.querySelector('.progress-bar-fill');
        this.progressText = this.modal.querySelector('.progress-text');
        this.speedText = this.modal.querySelector('.speed-text');
        this.timeText = this.modal.querySelector('.time-text');
        this.actionButtons = this.modal.querySelector('.action-buttons');
        this.saveBtn = this.modal.querySelector('.save-btn');
        this.cancelBtn = this.modal.querySelector('.cancel-btn');
        this.closeBtn = this.modal.querySelector('.close-btn');

        // Bind events
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
    }

    show() {
        document.body.appendChild(this.modal);
        this.modal.style.display = 'flex';
    }

    updateProgress(percentage, speed, remaining) {
        this.progressBar.style.width = percentage + '%';
        this.progressText.textContent = `${Math.round(percentage)}%`;
        
        if (speed !== undefined) {
            this.speedText.textContent = `${formatBytes(speed)}/s`;
        }
        
        if (remaining !== undefined) {
            this.timeText.textContent = `${formatTime(remaining)} còn lại`;
        }
    }

    showComplete(blob) {
        this.progressBar.style.width = '100%';
        this.progressText.textContent = '100%';
        this.speedText.textContent = 'Hoàn thành';
        this.timeText.textContent = '';
        
        this.actionButtons.style.display = 'flex';
        
        // Setup save button
        this.saveBtn.addEventListener('click', () => {
            this.saveFile(blob);
        });
    }

    showError(message) {
        this.modal.querySelector('.modal-body').innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
            <div class="action-buttons">
                <button class="cancel-btn">Đóng</button>
            </div>
        `;
        
        const cancelBtn = this.modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => this.close());
    }

    saveFile(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.filename || 'video.mp4';
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
        this.close();
    }

    close() {
        if (this.modal && this.modal.parentNode) {
            this.modal.remove();
        }
    }
}

// Create error modal
export function showErrorModal(message) {
    const errorModal = new ProgressModal('');
    errorModal.show();
    errorModal.showError(message);
}
