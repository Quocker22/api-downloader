import { ApiService } from './api.js';
import { DownloadManager } from './download.js';
import { CONFIG, ERROR_MESSAGES } from './config.js';
import { sleep, formatBytes } from './utils.js';
import { SettingsManager } from './settings.js';

// Batch processing manager
export class BatchProcessor {
    constructor() {
        this.apiService = new ApiService();
        this.downloadManager = new DownloadManager();
        this.settingsManager = new SettingsManager();
        this.isProcessing = false;
        this.results = [];
        this.batchDownloadInfo = new Map(); // Store info for retry
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

                // Get current settings as options
                const currentSettings = this.settingsManager.getSettings();
                const result = await this.apiService.processUrl(url, currentSettings);
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
                    <div class="flex items-center space-x-3">
                        <div id="batch-summary" class="text-sm text-[#8B5A2B]">
                            Đang xử lý...
                        </div>
                        <button id="download-all-btn" class="btn btn-sm bg-[#4A7043] text-white hover:bg-[#3A5A35] rounded-lg border-none hidden">
                            <i class="fas fa-download mr-1"></i>Tải tất cả
                        </button>
                    </div>
                </div>
                <div class="space-y-3">
        `;

        urls.forEach((url, index) => {
            batchHTML += `
                <div id="batch-item-${index}" class="bg-[#EDE4E0] p-3 rounded-lg border border-[#8B5A2B] border-opacity-30">
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
        
        // Add download all functionality
        this.setupDownloadAllButton();
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
                <div class="text-xs font-medium text-[#4A7043] truncate overflow-hidden" title="${filename || 'video'}">
                    ${filename || 'video'}
                </div>
                <div class="flex space-x-2">
                    <button class="progress-download-btn btn md:btn-sm bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-lg border-none flex-1">
                        <i class="fas fa-download mr-1"></i> Tải xuống
                    </button>
                </div>
            </div>
        `;

        buttonsContainer.classList.remove('hidden');

        // Add event listeners
        const downloadBtn = buttonsContainer.querySelector('.progress-download-btn');
        downloadBtn.addEventListener('click', () => {
            // Replace the entire item with progress UI
            this.showProgressInBatchItem(itemId, url, filename);
        });
    }

    updateSummary() {
        const summaryElement = document.getElementById('batch-summary');
        const downloadAllBtn = document.getElementById('download-all-btn');
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

        // Show download all button if there are successful results
        if (downloadAllBtn && success > 0) {
            downloadAllBtn.classList.remove('hidden');
            downloadAllBtn.textContent = `Tải tất cả (${success})`;
            downloadAllBtn.innerHTML = `<i class="fas fa-download mr-1"></i>Tải tất cả (${success})`;
        }
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

    showProgressInBatchItem(itemId, url, filename) {
        const item = document.getElementById(itemId);
        if (!item) return;

        // Generate unique progress ID for this batch item
        const progressId = `batch-progress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Replace item content with progress UI
        item.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center min-w-0 flex-1 text-overflow-container">
                    <div class="mr-2 flex-shrink-0">
                        <i class="fas fa-download text-[#8B5A2B]"></i>
                    </div>
                    <span class="font-medium text-[#4A7043] text-sm progress-filename" title="${filename || 'video'}">${filename || 'video'}</span>
                </div>
                <span id="${progressId}-percent" class="text-sm text-[#8B5A2B] flex-shrink-0 ml-2">0%</span>
            </div>
            
            <div class="mb-2">
                <div class="flex justify-between text-xs text-[#8B5A2B] mb-1">
                    <span id="${progressId}-status">Đang chuẩn bị...</span>
                    <span id="${progressId}-speed">-- kB/s</span>
                </div>
                <div class="w-full bg-[#E5D5C8] rounded-full h-2">
                    <div id="${progressId}-bar" class="bg-[#8B5A2B] h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="flex justify-between text-xs text-[#8B5A2B] mb-2">
                <span id="${progressId}-downloaded">0 kB</span>
                <span id="${progressId}-total">-- kB</span>
            </div>
            
            <button id="${progressId}-cancel" class="btn btn-xs bg-[#C94C4C] text-white hover:bg-[#A73D3D] rounded border-none">
                <i class="fas fa-times mr-1"></i> Hủy
            </button>
            
            <button id="${progressId}-retry" class="retry-button ml-2 hidden">
                <i class="fas fa-redo mr-1"></i> Tải lại
            </button>
        `;

        // Store download info for retry
        this.batchDownloadInfo.set(progressId, { url, filename });

        // Start download with progress tracking
        this.downloadWithProgressInBatch(url, filename, progressId);
    }

    async downloadWithProgressInBatch(url, filename, progressId) {
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            
            this.updateBatchProgressUI(progressId, {
                status: 'Đang tải xuống...',
                total: total
            });

            const reader = response.body.getReader();
            const chunks = [];
            let downloaded = 0;
            let startTime = Date.now();
            let lastUpdateTime = startTime;

            // Store download info for cancellation
            const downloadInfo = {
                reader,
                cancelled: false
            };

            // Add cancel functionality
            const cancelBtn = document.getElementById(`${progressId}-cancel`);
            const retryBtn = document.getElementById(`${progressId}-retry`);
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    downloadInfo.cancelled = true;
                    downloadInfo.reader?.cancel();
                    this.updateBatchProgressUI(progressId, {
                        status: '❌ Đã hủy',
                        showError: true
                    });
                });
            }
            
            if (retryBtn) {
                retryBtn.addEventListener('click', () => {
                    this.retryBatchDownload(progressId);
                });
            }

            while (true) {
                const { done, value } = await reader.read();
                
                // Check if cancelled
                if (downloadInfo.cancelled) {
                    throw new Error('Tải xuống đã bị hủy');
                }
                
                if (done) break;
                
                chunks.push(value);
                downloaded += value.length;
                
                // Update progress every 200ms for batch (less frequent than single)
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime > 200) {
                    const elapsedTime = (currentTime - startTime) / 1000;
                    const speed = downloaded / elapsedTime;
                    
                    this.updateBatchProgressUI(progressId, {
                        downloaded,
                        total,
                        speed,
                        percent: total > 0 ? (downloaded / total * 100) : 0
                    });
                    
                    lastUpdateTime = currentTime;
                }
            }

            // Complete download
            const blob = new Blob(chunks);
            const downloadUrl = window.URL.createObjectURL(blob);
            
            this.updateBatchProgressUI(progressId, {
                status: 'Hoàn thành!',
                downloaded,
                total: downloaded,
                percent: 100
            });

            // Auto download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename || 'download';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);
            
            // Show success message
            setTimeout(() => {
                this.updateBatchProgressUI(progressId, {
                    status: '✅ Tải xuống thành công!',
                    showSuccess: true
                });
            }, 500);

        } catch (error) {
            this.updateBatchProgressUI(progressId, {
                status: '❌ Lỗi: ' + error.message,
                showError: true
            });
        }
    }

    updateBatchProgressUI(progressId, data) {
        const statusEl = document.getElementById(`${progressId}-status`);
        const percentEl = document.getElementById(`${progressId}-percent`);
        const barEl = document.getElementById(`${progressId}-bar`);
        const downloadedEl = document.getElementById(`${progressId}-downloaded`);
        const totalEl = document.getElementById(`${progressId}-total`);
        const speedEl = document.getElementById(`${progressId}-speed`);
        const cancelBtn = document.getElementById(`${progressId}-cancel`);
        const retryBtn = document.getElementById(`${progressId}-retry`);

        if (data.status && statusEl) {
            statusEl.textContent = data.status;
        }

        if (data.percent !== undefined && percentEl && barEl) {
            const percent = Math.round(data.percent);
            percentEl.textContent = `${percent}%`;
            barEl.style.width = `${percent}%`;
        }

        if (data.downloaded !== undefined && downloadedEl) {
            downloadedEl.textContent = formatBytes(data.downloaded);
        }

        if (data.total !== undefined && totalEl) {
            totalEl.textContent = data.total > 0 ? formatBytes(data.total) : '-- kB';
        }

        if (data.speed !== undefined && speedEl) {
            speedEl.textContent = `${formatBytes(data.speed)}/s`;
        }

        if (data.showSuccess && cancelBtn && retryBtn) {
            cancelBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Hoàn thành';
            cancelBtn.className = 'btn btn-xs bg-[#4A7043] text-white rounded border-none';
            cancelBtn.disabled = true;
            
            // Show retry button as link-style
            retryBtn.innerHTML = '<i class="fas fa-redo mr-1"></i> Tải lại';
            retryBtn.className = 'retry-button ml-2';
            retryBtn.classList.remove('hidden');
        }

        if (data.showError && cancelBtn && retryBtn) {
            cancelBtn.innerHTML = '<i class="fas fa-times mr-1"></i> Đóng';
            cancelBtn.className = 'btn btn-xs bg-[#C94C4C] text-white rounded border-none';
            
            // Show retry button as link-style
            retryBtn.innerHTML = '<i class="fas fa-redo mr-1"></i> Thử lại';
            retryBtn.className = 'retry-button ml-2';
            retryBtn.classList.remove('hidden');
        }
    }

    retryBatchDownload(progressId) {
        const downloadData = this.batchDownloadInfo.get(progressId);
        if (downloadData) {
            // Reset progress UI
            this.updateBatchProgressUI(progressId, {
                status: 'Đang chuẩn bị...',
                percent: 0,
                downloaded: 0,
                total: 0,
                speed: 0
            });
            
            // Hide retry button and restore cancel button
            const cancelBtn = document.getElementById(`${progressId}-cancel`);
            const retryBtn = document.getElementById(`${progressId}-retry`);
            
            if (cancelBtn) {
                cancelBtn.innerHTML = '<i class="fas fa-times mr-1"></i> Hủy';
                cancelBtn.className = 'btn btn-xs bg-[#C94C4C] text-white hover:bg-[#A73D3D] rounded border-none';
                cancelBtn.disabled = false;
            }
            
            if (retryBtn) {
                retryBtn.classList.add('hidden');
            }
            
            // Restart download
            this.downloadWithProgressInBatch(downloadData.url, downloadData.filename, progressId);
        }
    }

    setupDownloadAllButton() {
        const downloadAllBtn = document.getElementById('download-all-btn');
        if (!downloadAllBtn) return;

        downloadAllBtn.addEventListener('click', () => {
            this.downloadAll();
        });
    }

    async downloadAll() {
        const successfulResults = this.results.filter(r => 
            r.status === 'success' && r.result && r.result.status !== 'error'
        );

        if (successfulResults.length === 0) {
            alert('Không có video nào để tải xuống!');
            return;
        }

        const downloadAllBtn = document.getElementById('download-all-btn');
        if (downloadAllBtn) {
            downloadAllBtn.disabled = true;
            downloadAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Đang tải...';
        }

        // Create a container for all download progress
        this.createDownloadAllUI(successfulResults);

        // Start downloading all files with a small delay between each
        for (let i = 0; i < successfulResults.length; i++) {
            const result = successfulResults[i];
            let downloadData = result.result;

            // Handle picker results
            if (downloadData.status === 'picker' && downloadData.picker && downloadData.picker.length > 0) {
                downloadData = downloadData.picker[0];
            }

            if (downloadData.url) {
                const progressId = `download-all-${i}`;
                this.startDownloadAllItem(downloadData.url, downloadData.filename, progressId, i + 1);
                
                // Small delay between downloads to avoid overwhelming the server
                if (i < successfulResults.length - 1) {
                    await sleep(500);
                }
            }
        }

        // Re-enable button after all downloads started
        if (downloadAllBtn) {
            downloadAllBtn.disabled = false;
            downloadAllBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Đã bắt đầu tải';
            setTimeout(() => {
                downloadAllBtn.innerHTML = '<i class="fas fa-download mr-1"></i>Tải tất cả';
            }, 3000);
        }
    }

    createDownloadAllUI(successfulResults) {
        const downloadResult = document.getElementById('download-result');
        
        let downloadAllHTML = `
            <div class="bg-[#EDE4E0] p-4 rounded-xl border border-[#8B5A2B] mb-4">
                <div class="flex items-center mb-4">
                    <h3 class="font-bold text-[#4A7043] text-lg">
                        <i class="fas fa-cloud-download-alt mr-2"></i>Tải xuống tất cả (${successfulResults.length} file)
                    </h3>
                </div>
                <div class="space-y-2" id="download-all-container">
        `;

        successfulResults.forEach((result, index) => {
            let downloadData = result.result;
            if (downloadData.status === 'picker' && downloadData.picker && downloadData.picker.length > 0) {
                downloadData = downloadData.picker[0];
            }

            downloadAllHTML += `
                <div id="download-all-${index}" class="bg-[#FFF8E7] p-3 rounded-lg border border-[#8B5A2B] border-opacity-30">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center min-w-0 flex-1">
                            <div class="mr-2 flex-shrink-0">
                                <i class="fas fa-clock text-[#8B5A2B]"></i>
                            </div>
                            <span class="font-medium text-[#4A7043] text-sm truncate" title="${downloadData.filename || `Video ${index + 1}`}">${downloadData.filename || `Video ${index + 1}`}</span>
                        </div>
                        <span id="download-all-${index}-percent" class="text-sm text-[#8B5A2B] flex-shrink-0 ml-2">0%</span>
                    </div>
                    
                    <div class="mb-2">
                        <div class="flex justify-between text-xs text-[#8B5A2B] mb-1">
                            <span id="download-all-${index}-status">Chờ tải...</span>
                            <span id="download-all-${index}-speed">-- kB/s</span>
                        </div>
                        <div class="w-full bg-[#E5D5C8] rounded-full h-1.5">
                            <div id="download-all-${index}-bar" class="bg-[#8B5A2B] h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>
                    
                    <div class="flex justify-between text-xs text-[#8B5A2B]">
                        <span id="download-all-${index}-downloaded">0 kB</span>
                        <span id="download-all-${index}-total">-- kB</span>
                    </div>
                </div>
            `;
        });

        downloadAllHTML += `
                </div>
            </div>
        `;

        // Insert before existing batch UI
        const existingBatch = downloadResult.querySelector('.bg-\\[\\#FFF8E7\\]');
        if (existingBatch) {
            existingBatch.insertAdjacentHTML('beforebegin', downloadAllHTML);
        } else {
            downloadResult.innerHTML = downloadAllHTML + downloadResult.innerHTML;
        }
    }

    async startDownloadAllItem(url, filename, progressId, itemNumber) {
        try {
            // Update status icon
            const statusIcon = document.querySelector(`#${progressId} .fas`);
            if (statusIcon) {
                statusIcon.className = 'fas fa-spinner fa-spin text-[#F4A261]';
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            
            this.updateDownloadAllProgressUI(progressId, {
                status: 'Đang tải xuống...',
                total: total
            });

            const reader = response.body.getReader();
            const chunks = [];
            let downloaded = 0;
            let startTime = Date.now();
            let lastUpdateTime = startTime;

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                chunks.push(value);
                downloaded += value.length;
                
                // Update progress every 300ms for download all (less frequent)
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime > 300) {
                    const elapsedTime = (currentTime - startTime) / 1000;
                    const speed = downloaded / elapsedTime;
                    
                    this.updateDownloadAllProgressUI(progressId, {
                        downloaded,
                        total,
                        speed,
                        percent: total > 0 ? (downloaded / total * 100) : 0
                    });
                    
                    lastUpdateTime = currentTime;
                }
            }

            // Complete download
            const blob = new Blob(chunks);
            const downloadUrl = window.URL.createObjectURL(blob);
            
            this.updateDownloadAllProgressUI(progressId, {
                status: 'Hoàn thành!',
                downloaded,
                total: downloaded,
                percent: 100
            });

            // Auto download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename || `video-${itemNumber}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);
            
            // Show success message
            setTimeout(() => {
                this.updateDownloadAllProgressUI(progressId, {
                    status: '✅ Thành công!',
                    showSuccess: true
                });
            }, 500);

        } catch (error) {
            this.updateDownloadAllProgressUI(progressId, {
                status: '❌ Lỗi: ' + error.message,
                showError: true
            });
        }
    }

    updateDownloadAllProgressUI(progressId, data) {
        const statusEl = document.getElementById(`${progressId}-status`);
        const percentEl = document.getElementById(`${progressId}-percent`);
        const barEl = document.getElementById(`${progressId}-bar`);
        const downloadedEl = document.getElementById(`${progressId}-downloaded`);
        const totalEl = document.getElementById(`${progressId}-total`);
        const speedEl = document.getElementById(`${progressId}-speed`);

        if (data.status && statusEl) {
            statusEl.textContent = data.status;
        }

        if (data.percent !== undefined && percentEl && barEl) {
            const percent = Math.round(data.percent);
            percentEl.textContent = `${percent}%`;
            barEl.style.width = `${percent}%`;
        }

        if (data.downloaded !== undefined && downloadedEl) {
            downloadedEl.textContent = formatBytes(data.downloaded);
        }

        if (data.total !== undefined && totalEl) {
            totalEl.textContent = data.total > 0 ? formatBytes(data.total) : '-- kB';
        }

        if (data.speed !== undefined && speedEl) {
            speedEl.textContent = `${formatBytes(data.speed)}/s`;
        }

        if (data.showSuccess) {
            const statusIcon = document.querySelector(`#${progressId} .fas`);
            if (statusIcon) {
                statusIcon.className = 'fas fa-check-circle text-green-600';
            }
        }

        if (data.showError) {
            const statusIcon = document.querySelector(`#${progressId} .fas`);
            if (statusIcon) {
                statusIcon.className = 'fas fa-exclamation-circle text-red-600';
            }
        }
    }
}
