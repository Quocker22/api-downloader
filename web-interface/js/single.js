import { ApiService } from './api.js';
import { DownloadManager } from './download.js';
import { ERROR_MESSAGES } from './config.js';

// Single download processor
export class SingleProcessor {
    constructor() {
        this.apiService = new ApiService();
        this.downloadManager = new DownloadManager();
    }

    async process(url) {
        this.showLoading();
        this.hideError();
        this.clearResult();

        try {
            console.log('Gửi request với URL:', url);
            
            const data = await this.apiService.processUrl(url);
            console.log('Response data:', data);
            
            this.hideLoading();

            if (!data) {
                this.showError('Không nhận được dữ liệu từ API');
                return;
            }

            if (data.status === 'error') {
                console.error('API error:', data.error);
                let errorMsg = this.getErrorMessage(data.error);
                
                if (data.error.code === 'error.api.youtube.login') {
                    errorMsg = 'Video yêu cầu đăng nhập YouTube (có thể bị giới hạn độ tuổi hoặc riêng tư). Hãy thử với video công khai.';
                } else if (data.error.code === 'error.api.invalid_body') {
                    errorMsg = 'Lỗi cấu trúc dữ liệu gửi đi. Vui lòng chỉ nhập URL và thử lại.';
                }

                this.showError(errorMsg);
                return;
            }

            this.handleResponse(data);
        } catch (error) {
            this.hideLoading();
            this.showError(`Không thể kết nối đến API Cobalt: ${error.message}. Vui lòng đảm bảo API đang chạy.`);
            console.error('Fetch error:', error);
        }
    }

    handleResponse(data) {
        const resultContainer = document.getElementById('result-container');
        resultContainer.classList.remove('hidden');

        console.log('Xử lý phản hồi:', data);

        if (!data || !data.status) {
            this.showError('Phản hồi không hợp lệ từ API');
            return;
        }

        switch (data.status) {
            case 'tunnel':
            case 'redirect':
                console.log('Phát hiện URL:', data.url);
                this.handleDownloadLink(data);
                break;
            case 'picker':
                console.log('Phát hiện picker với', data.picker ? data.picker.length : 0, 'lựa chọn');
                if (data.picker && data.picker.length > 0) {
                    this.handleDownloadLink(data.picker[0]);
                } else {
                    this.showError('Không tìm thấy lựa chọn tải xuống');
                }
                break;
            case 'error':
                let errorMsg = this.getErrorMessage(data.error);
                this.showError(errorMsg);
                break;
            default:
                this.showError(`Phản hồi không xác định từ API: ${data.status}`);
        }
    }

    handleDownloadLink(data) {
        const { url, filename } = data;
        console.log('URL tải xuống:', url);
        console.log('Tên file:', filename);

        if (!url) {
            this.showError('URL tải xuống không hợp lệ');
            return;
        }

        const downloadResult = document.getElementById('download-result');
        downloadResult.classList.remove('hidden');
        downloadResult.innerHTML = `
            <div class="bg-[#FFF8E7] p-4 rounded-xl border border-[#8B5A2B] mb-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-file-video text-[#4A7043] mr-2 text-xl"></i>
                    <p class="font-bold text-[#4A7043] truncate">${filename || 'video'}</p>
                </div>
                
                <div class="flex flex-col space-y-2">
                    <button id="progress-download" class="btn bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-xl border-none transition transform hover:scale-105">
                        <i class="fas fa-download mr-2"></i> Tải xuống
                    </button>
                    
                    <button id="direct-download" class="btn bg-[#4A7043] text-white hover:bg-[#3A5734] rounded-xl border-none transition transform hover:scale-105">
                        <i class="fas fa-external-link-alt mr-2"></i> Tải xuống trực tiếp
                    </button>
                </div>
            </div>
        `;

        // Bind events
        document.getElementById('progress-download').addEventListener('click', () => {
            this.downloadManager.downloadWithProgress(url, filename);
        });

        document.getElementById('direct-download').addEventListener('click', () => {
            this.downloadManager.downloadDirect(url, filename);
        });
    }

    getErrorMessage(error) {
        if (!error || !error.code) {
            return ERROR_MESSAGES.default;
        }

        return ERROR_MESSAGES[error.code] || `Lỗi: ${error.code}`;
    }

    showLoading() {
        const resultContainer = document.getElementById('result-container');
        const loading = document.getElementById('loading');
        
        resultContainer.classList.remove('hidden');
        loading.classList.remove('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.classList.add('hidden');
    }

    showError(message) {
        const errorContainer = document.getElementById('error-container');
        const errorMessage = document.getElementById('error-message');
        
        errorContainer.classList.remove('hidden');
        errorMessage.textContent = message;
    }

    hideError() {
        const errorContainer = document.getElementById('error-container');
        errorContainer.classList.add('hidden');
    }

    clearResult() {
        const downloadResult = document.getElementById('download-result');
        downloadResult.innerHTML = '';
    }
}
