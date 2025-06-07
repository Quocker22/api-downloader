import { ApiService } from './api.js';
import { DownloadManager } from './download.js';
import { CONFIG, ERROR_MESSAGES } from './config.js';
import { sleep } from './utils.js';

// Batch processing manager
export class BatchProcessor {
    constructor() {
        this.apiService = new ApiService();
        this.downloadManager = new DownloadManager();
        this.isProcessing = false;
        this.results = [];
    }

    async processBatch(urls) {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.results = [];

        // Initialize batch UI
        this.initBatchUI(urls);

        // Process each URL with delay
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const itemId = `batch-item-${i}`;

            try {
                this.updateItemStatus(itemId, 'loading', 'Đang xử lý...');

                const result = await this.apiService.processUrl(url);
                this.results.push({ url, result, status: 'success' });

                if (result.status === 'error') {
                    this.updateItemStatus(itemId, 'error', this.getErrorMessage(result.error));
                } else {
                    this.updateItemStatus(itemId, 'success', 'Thành công');
                    this.addDownloadButtons(itemId, result);
                }

            } catch (error) {
                console.error(`Lỗi xử lý URL ${url}:`, error);
                this.results.push({ url, error: error.message, status: 'error' });
                this.updateItemStatus(itemId, 'error', `Lỗi: ${error.message}`);
            }

            // Delay between requests
            if (i < urls.length - 1) {
                await sleep(CONFIG.BATCH_DELAY);
            }
        }

        this.isProcessing = false;
        this.updateSummary();
    }

    initBatchUI(urls) {
        const downloadResult = document.getElementById('download-result');
        
        let batchHTML = `
            <div class="bg-[#FFF8E7] p-4 rounded-xl border border-[#8B5A2B] mb-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-[#4A7043] text-lg">
                        <i class="fas fa-list mr-2"></i>Xử lý hàng loạt (${urls.length} video)
                    </h3>
                    <div id="batch-summary" class="text-sm text-[#8B5A2B]">
                        Đang xử lý...
                    </div>
                </div>
                <div class="space-y-3">
        `;

        urls.forEach((url, index) => {
            batchHTML += `
                <div id="batch-item-${index}" class="bg-white p-3 rounded-lg border border-[#8B5A2B] border-opacity-30">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center">
                            <div class="batch-status-icon mr-2">
                                <i class="fas fa-clock text-[#8B5A2B]"></i>
                            </div>
                            <span class="font-medium text-[#4A7043] text-sm">Video ${index + 1}</span>
                        </div>
                        <div class="batch-status-text text-sm text-[#8B5A2B]">
                            Chờ xử lý...
                        </div>
                    </div>
                    <div class="text-xs text-gray-600 mb-2 truncate">${url}</div>
                    <div class="batch-download-buttons hidden">
                        <!-- Buttons sẽ được thêm sau khi xử lý thành công -->
                    </div>
                </div>
            `;
        });

        batchHTML += `
                </div>
            </div>
        `;

        downloadResult.innerHTML = batchHTML;
    }

    updateItemStatus(itemId, status, message) {
        const item = document.getElementById(itemId);
        if (!item) return;

        const statusIcon = item.querySelector('.batch-status-icon i');
        const statusText = item.querySelector('.batch-status-text');

        // Update icon
        statusIcon.className = '';
        switch (status) {
            case 'loading':
                statusIcon.className = 'fas fa-spinner fa-spin text-[#F4A261]';
                break;
            case 'success':
                statusIcon.className = 'fas fa-check-circle text-green-600';
                break;
            case 'error':
                statusIcon.className = 'fas fa-exclamation-circle text-red-600';
                break;
        }

        // Update text
        statusText.textContent = message;
        statusText.className = `batch-status-text text-sm ${
            status === 'error' ? 'text-red-600' :
            status === 'success' ? 'text-green-600' : 'text-[#8B5A2B]'
        }`;
    }

    addDownloadButtons(itemId, data) {
        const item = document.getElementById(itemId);
        if (!item) return;

        const buttonsContainer = item.querySelector('.batch-download-buttons');
        if (!buttonsContainer) return;

        let downloadData = data;

        // Handle different response types
        if (data.status === 'picker' && data.picker && data.picker.length > 0) {
            downloadData = data.picker[0];
        }

        const { url, filename } = downloadData;
        if (!url) return;

        buttonsContainer.innerHTML = `
            <div class="flex flex-col space-y-2 mt-2">
                <div class="text-xs font-medium text-[#4A7043] truncate">
                    ${filename || 'video'}
                </div>
                <div class="flex space-x-2">
                    <button class="progress-download-btn btn btn-sm bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-lg border-none flex-1">
                        <i class="fas fa-download mr-1"></i> Tải xuống
                    </button>
                    <button class="open-tab-btn btn btn-sm bg-[#4A7043] text-white hover:bg-[#3A5734] rounded-lg border-none flex-1">
                        <i class="fas fa-external-link-alt mr-1"></i> Mở tab mới
                    </button>
                </div>
            </div>
        `;

        buttonsContainer.classList.remove('hidden');

        // Add event listeners
        const downloadBtn = buttonsContainer.querySelector('.progress-download-btn');
        downloadBtn.addEventListener('click', () => {
            this.downloadManager.downloadWithProgress(url, filename);
        });

        const openTabBtn = buttonsContainer.querySelector('.open-tab-btn');
        openTabBtn.addEventListener('click', () => {
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    }

    updateSummary() {
        const summaryElement = document.getElementById('batch-summary');
        if (!summaryElement) return;

        const total = this.results.length;
        const success = this.results.filter(r => 
            r.status === 'success' && (!r.result || r.result.status !== 'error')
        ).length;
        const errors = total - success;

        summaryElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-green-600"><i class="fas fa-check mr-1"></i>${success}</span>
                <span class="text-red-600"><i class="fas fa-times mr-1"></i>${errors}</span>
                <span class="text-[#8B5A2B]">Hoàn thành</span>
            </div>
        `;
    }

    getErrorMessage(error) {
        if (!error || !error.code) {
            return ERROR_MESSAGES.default;
        }

        return ERROR_MESSAGES[error.code] || `Lỗi: ${error.code}`;
    }

    reset() {
        this.isProcessing = false;
        this.results = [];
    }
}
