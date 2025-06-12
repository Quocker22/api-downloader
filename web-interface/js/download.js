// Download manager for handling downloads with progress
export class DownloadManager {
    constructor() {
        this.activeDownloads = new Map();
        this.downloadInfo = new Map(); // Store info for retry
    }

    async downloadWithProgress(url, filename) {
        try {
            console.log('Bắt đầu tải xuống với progress:', url);
            
            // Create progress UI
            const progressId = this.createProgressUI(url, filename);
            
            // Try streaming download first, fallback to simple download
            try {
                await this.downloadFileWithProgress(url, filename, progressId);
            } catch (streamError) {
                console.warn('Streaming download failed, trying fallback:', streamError.message);
                
                if (streamError.message === 'FALLBACK_NEEDED') {
                    this.updateProgressUI(progressId, {
                        status: 'Chuyển sang chế độ đơn giản...',
                    });
                    await this.downloadFileSimple(url, filename, progressId);
                } else {
                    throw streamError;
                }
            }
            
        } catch (error) {
            console.error('Lỗi tải xuống:', error);
            this.showDownloadError(error.message);
        }
    }

    createProgressUI(url, filename) {
        const progressId = 'progress-' + Date.now();
        const downloadResult = document.getElementById('download-result');
        
        const progressHTML = `
            <div id="${progressId}" class="bg-[#FFF8E7] p-4 rounded-xl border border-[#8B5A2B] mb-4">
                <div class="flex items-center mb-3">
                    <i class="fas fa-download text-[#4A7043] mr-2"></i>
                    <span class="font-bold text-[#4A7043] truncate">${filename || 'download'}</span>
                </div>
                
                <div class="mb-3">
                    <div class="flex justify-between text-sm text-[#8B5A2B] mb-1">
                        <span id="${progressId}-status">Đang chuẩn bị...</span>
                        <span id="${progressId}-percent">0%</span>
                    </div>
                    <div class="w-full bg-[#E5D5C8] rounded-full h-2">
                        <div id="${progressId}-bar" class="bg-[#8B5A2B] h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="flex justify-between text-xs text-[#8B5A2B]">
                    <span id="${progressId}-downloaded">0 kB</span>
                    <span id="${progressId}-total">-- kB</span>
                    <span id="${progressId}-speed">-- kB/s</span>
                </div>
                
                <button id="${progressId}-cancel" class="btn btn-sm bg-[#C94C4C] text-white hover:bg-[#A73D3D] rounded-lg border-none mt-2">
                    <i class="fas fa-times mr-1"></i> Hủy
                </button>
                
                <button id="${progressId}-retry" class="btn btn-sm bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-lg border-none mt-2 ml-2 hidden">
                    <i class="fas fa-redo mr-1"></i> Tải lại
                </button>
            </div>
        `;
        
        downloadResult.innerHTML = progressHTML;
        
        // Store original download info for retry
        this.downloadInfo = this.downloadInfo || new Map();
        this.downloadInfo.set(progressId, { url, filename });
        
        // Add cancel functionality
        document.getElementById(`${progressId}-cancel`).addEventListener('click', () => {
            this.cancelDownload(progressId);
        });
        
        // Add retry functionality
        document.getElementById(`${progressId}-retry`).addEventListener('click', () => {
            this.retryDownload(progressId);
        });
        
        return progressId;
    }

    async downloadFileWithProgress(url, filename, progressId) {
        try {
            console.log('Starting download:', url);
            
            // Add CORS headers for cross-origin requests
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: {
                    'Accept': '*/*',
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            
            console.log('Content-Length:', contentLength, 'Total bytes:', total);
            
            this.updateProgressUI(progressId, {
                status: 'Đang tải xuống...',
                total: total
            });

            // Check if response has body and supports streaming
            if (!response.body) {
                console.warn('Response body is null, falling back to simple download');
                throw new Error('STREAM_NOT_SUPPORTED');
            }

            const reader = response.body.getReader();
            const chunks = [];
            let downloaded = 0;
            let startTime = Date.now();
            let lastUpdateTime = startTime;

            // Store download info for cancellation
            this.activeDownloads.set(progressId, {
                reader,
                cancelled: false
            });

            while (true) {
                const { done, value } = await reader.read();
                
                // Check if cancelled
                const downloadInfo = this.activeDownloads.get(progressId);
                if (downloadInfo?.cancelled) {
                    throw new Error('Tải xuống đã bị hủy');
                }
                
                if (done) break;
                
                if (value && value.length > 0) {
                    chunks.push(value);
                    downloaded += value.length;
                    
                    // Update progress every 200ms to avoid too many updates
                    const currentTime = Date.now();
                    if (currentTime - lastUpdateTime > 200) {
                        const elapsedTime = (currentTime - startTime) / 1000;
                        const speed = downloaded / elapsedTime;
                        
                        this.updateProgressUI(progressId, {
                            downloaded,
                            total,
                            speed,
                            percent: total > 0 ? (downloaded / total * 100) : 0
                        });
                        
                        lastUpdateTime = currentTime;
                    }
                }
            }

            console.log('Download complete. Total chunks:', chunks.length, 'Total downloaded:', downloaded);

            if (downloaded === 0) {
                throw new Error('EMPTY_DOWNLOAD');
            }

            // Complete download
            const blob = new Blob(chunks);
            console.log('Created blob size:', blob.size);
            
            if (blob.size === 0) {
                throw new Error('Downloaded file is empty (0 bytes)');
            }
            
            const downloadUrl = window.URL.createObjectURL(blob);
            
            this.updateProgressUI(progressId, {
                status: 'Hoàn thành!',
                downloaded: blob.size,
                total: blob.size,
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
            this.activeDownloads.delete(progressId);
            
            // Show success message
            setTimeout(() => {
                this.updateProgressUI(progressId, {
                    status: '✅ Tải xuống thành công!',
                    showSuccess: true
                });
            }, 500);

        } catch (error) {
            console.error('Download error:', error);
            
            // If streaming fails, try fallback
            if (error.message === 'STREAM_NOT_SUPPORTED' || error.message === 'EMPTY_DOWNLOAD') {
                console.log('Falling back to simple download method');
                throw new Error('FALLBACK_NEEDED');
            }
            
            this.updateProgressUI(progressId, {
                status: '❌ Lỗi: ' + error.message,
                showError: true
            });
            this.activeDownloads.delete(progressId);
            throw error;
        }
    }

    async downloadFileSimple(url, filename, progressId) {
        try {
            console.log('Starting simple download (fallback):', url);
            
            this.updateProgressUI(progressId, {
                status: 'Đang tải xuống (chế độ đơn giản)...',
                total: 0
            });
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            console.log('Response received, converting to blob...');
            const blob = await response.blob();
            console.log('Blob created, size:', blob.size);
            
            const downloadUrl = window.URL.createObjectURL(blob);
            
            this.updateProgressUI(progressId, {
                status: 'Hoàn thành!',
                downloaded: blob.size,
                total: blob.size,
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
                this.updateProgressUI(progressId, {
                    status: '✅ Tải xuống thành công!',
                    showSuccess: true
                });
            }, 500);
            
        } catch (error) {
            console.error('Simple download error:', error);
            throw error;
        }
    }

    updateProgressUI(progressId, data) {
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
            downloadedEl.textContent = this.formatBytes(data.downloaded);
        }

        if (data.total !== undefined && totalEl) {
            totalEl.textContent = data.total > 0 ? this.formatBytes(data.total) : '-- kB';
        }

        if (data.speed !== undefined && speedEl) {
            speedEl.textContent = `${this.formatBytes(data.speed)}/s`;
        }

        if (data.showSuccess && cancelBtn && retryBtn) {
            cancelBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Hoàn thành';
            cancelBtn.className = 'btn btn-sm bg-[#4A7043] text-white rounded-lg border-none mt-2';
            cancelBtn.disabled = true;
            
            // Show retry button as link-style
            retryBtn.innerHTML = '<i class="fas fa-redo mr-1"></i> Tải lại';
            retryBtn.className = 'retry-button mt-2 ml-2';
            retryBtn.classList.remove('hidden');
        }

        if (data.showError && cancelBtn && retryBtn) {
            cancelBtn.innerHTML = '<i class="fas fa-times mr-1"></i> Đóng';
            cancelBtn.className = 'btn btn-sm bg-[#C94C4C] text-white rounded-lg border-none mt-2';
            
            // Show retry button as link-style
            retryBtn.innerHTML = '<i class="fas fa-redo mr-1"></i> Thử lại';
            retryBtn.className = 'retry-button mt-2 ml-2';
            retryBtn.classList.remove('hidden');
        }
    }

    retryDownload(progressId) {
        const downloadData = this.downloadInfo.get(progressId);
        if (downloadData) {
            // Reset progress UI
            this.updateProgressUI(progressId, {
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
                cancelBtn.className = 'btn btn-sm bg-[#C94C4C] text-white hover:bg-[#A73D3D] rounded-lg border-none mt-2';
                cancelBtn.disabled = false;
            }
            
            if (retryBtn) {
                retryBtn.classList.add('hidden');
            }
            
            // Restart download
            this.downloadFileWithProgress(downloadData.url, downloadData.filename, progressId);
        }
    }

    cancelDownload(progressId) {
        const downloadInfo = this.activeDownloads.get(progressId);
        if (downloadInfo) {
            downloadInfo.cancelled = true;
            downloadInfo.reader?.cancel();
            this.activeDownloads.delete(progressId);
            
            this.updateProgressUI(progressId, {
                status: '❌ Đã hủy',
                showError: true
            });
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'kB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showDownloadError(message) {
        const downloadResult = document.getElementById('download-result');
        downloadResult.innerHTML = `
            <div class="bg-[#FFF8E7] p-4 rounded-xl border border-[#C94C4C] mb-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-exclamation-triangle text-[#C94C4C] mr-2"></i>
                    <span class="font-bold text-[#C94C4C]">Lỗi tải xuống</span>
                </div>
                <p class="text-sm text-[#8B5A2B]">${message}</p>
            </div>
        `;
    }

    downloadDirect(url, filename) {
        const downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename || 'video.mp4';
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
}
