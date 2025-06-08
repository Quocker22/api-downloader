import { ApiService } from './api.js';
import { DownloadManager } from './download.js';
import { PickerModal } from './picker.js';
import { ERROR_MESSAGES } from './config.js';

// Single download processor
export class SingleProcessor {
    constructor() {
        this.apiService = new ApiService();
        this.downloadManager = new DownloadManager();
        this.pickerModal = new PickerModal();
    }

    async process(url, settings = {}) {
        this.showLoading();
        this.hideError();
        this.clearResult();

        try {
            console.log('Gửi request với URL:', url);
            console.log('Settings:', settings);

            const data = await this.apiService.processUrl(url, { ...settings });
            console.log('Response data:', data);

            this.hideLoading();

            if (!data) {
                this.showError('Không nhận được dữ liệu từ API');
                return;
            }

            // Handle different response types
            this.handleApiResponse(data);
        } catch (error) {
            this.hideLoading();
            this.showError(`Không thể kết nối đến API Cobalt: ${error.message}. Vui lòng đảm bảo API đang chạy.`);
            console.error('Fetch error:', error);
        }
    }

    handleApiResponse(data) {
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

            case 'local-processing':
                console.log('Local processing response:', data);
                this.handleLocalProcessing(data);
                break;

            case 'picker':
                console.log('Phát hiện picker với', data.picker ? data.picker.length : 0, 'lựa chọn');
                this.handlePickerResponse(data);
                break;

            case 'error':
                console.error('API error:', data.error);
                this.handleErrorResponse(data);
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
                    <p class="font-bold text-[#4A7043] truncate">${filename || 'download'}</p>
                </div>
                
                <div class="flex flex-col space-y-2">
                    <button id="progress-download" class="btn bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-xl border-none transition transform hover:scale-105">
                        <i class="fas fa-download mr-2"></i> Tải xuống với tiến trình
                    </button>
                </div>
            </div>
        `;

        // Bind events với closure để capture url và filename
        document.getElementById('progress-download').addEventListener('click', () => {
            console.log('Clicking download with url:', url, 'filename:', filename);
            this.downloadManager.downloadWithProgress(url, filename);
        });
    }

    handleLocalProcessing(data) {
        // Handle local processing response
        const downloadResult = document.getElementById('download-result');
        downloadResult.classList.remove('hidden');
        downloadResult.innerHTML = `
            <div class="bg-[#FFF8E7] p-4 rounded-xl border border-[#8B5A2B] mb-4">
                <div class="flex items-center mb-3">
                    <i class="fas fa-cogs text-[#4A7043] mr-2 text-xl"></i>
                    <p class="font-bold text-[#4A7043]">Xử lý Local được yêu cầu</p>
                </div>
                
                <div class="text-sm text-[#8B5A2B] mb-3">
                    <p><strong>Loại xử lý:</strong> ${data.type}</p>
                    <p><strong>Dịch vụ:</strong> ${data.service}</p>
                    ${data.isHLS ? '<p><strong>Định dạng:</strong> HLS</p>' : ''}
                </div>
                
                <div class="bg-[#C94C4C] text-white p-3 rounded-lg text-sm">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Tính năng xử lý local chưa được hỗ trợ trong phiên bản web này. 
                    Bạn cần sử dụng client desktop hoặc CLI của Cobalt.
                </div>
            </div>
        `;
    }

    handlePickerResponse(data) {
        // Show picker modal for multiple items
        this.pickerModal.show(data);
    }

    handleErrorResponse(data) {
        let errorMsg = this.getErrorMessage(data.error);

        if (data.error && data.error.code === 'error.api.youtube.login') {
            errorMsg = 'Video yêu cầu đăng nhập YouTube (có thể bị giới hạn độ tuổi hoặc riêng tư). Hãy thử với video công khai.';
        } else if (data.error && data.error.code === 'error.api.invalid_body') {
            errorMsg = 'Lỗi cấu trúc dữ liệu gửi đi. Vui lòng chỉ nhập URL và thử lại.';
        }

        this.showError(errorMsg);
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
