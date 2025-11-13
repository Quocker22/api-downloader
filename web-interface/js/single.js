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
            console.log('=== API RESPONSE DEBUG ===');
            console.log('Full response data:', JSON.stringify(data, null, 2));
            console.log('Response status:', data?.status);
            console.log('Response URL:', data?.url);
            console.log('Response filename:', data?.filename);
            console.log('Response picker:', data?.picker);
            console.log('========================');

            this.hideLoading();

            if (!data) {
                this.showError('Không nhận được dữ liệu từ API');
                return;
            }

            // Handle different response types
            this.handleApiResponse(data);
        } catch (error) {
            this.hideLoading();
            this.showError(`Không thể kết nối : ${error.message}. đường dẫn không hợp lệ hoặc không hỗ trợ`);
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
                        <i class="fas fa-download mr-2"></i> Tải xuống
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
        console.log('Picker response with', data.picker?.length, 'options');
        
        if (!data.picker || data.picker.length === 0) {
            this.showError('Không có option nào để tải xuống');
            return;
        }

        // If only one option, auto-select it
        if (data.picker.length === 1) {
            console.log('Only one option, auto-selecting:', data.picker[0]);
            this.handleDownloadLink(data.picker[0]);
            return;
        }

        // Multiple options - check if user wants auto-select best quality
        const bestQuality = this.findBestQuality(data.picker);
        if (bestQuality) {
            console.log('Auto-selecting best quality:', bestQuality);
            
            // Show options but highlight the best one
            this.showPickerWithBestOption(data, bestQuality);
        } else {
            // Show picker modal for multiple items
            this.pickerModal.show(data);
        }
    }

    findBestQuality(options) {
        // Try to find the best quality option based on common patterns
        if (!options || options.length === 0) return null;
        
        // Sort by likely quality indicators
        const sorted = options.slice().sort((a, b) => {
            // Prefer options with higher numbers in filename/url
            const aNumbers = (a.filename || a.url || '').match(/\d+/g) || [];
            const bNumbers = (b.filename || b.url || '').match(/\d+/g) || [];
            
            const aMax = aNumbers.length > 0 ? Math.max(...aNumbers.map(n => parseInt(n))) : 0;
            const bMax = bNumbers.length > 0 ? Math.max(...bNumbers.map(n => parseInt(n))) : 0;
            
            return bMax - aMax;
        });
        
        return sorted[0];
    }

    showPickerWithBestOption(data, bestOption) {
        const downloadResult = document.getElementById('download-result');
        downloadResult.classList.remove('hidden');
        
        downloadResult.innerHTML = `
            <div class="bg-[#FFF8E7] p-4 rounded-xl border border-[#8B5A2B] mb-4">
                <div class="flex items-center mb-3">
                    <i class="fas fa-video text-[#4A7043] mr-2 text-xl"></i>
                    <h3 class="font-bold text-[#4A7043]">Chọn chất lượng tải xuống</h3>
                </div>
                
                <div class="mb-4">
                    <p class="text-sm text-[#8B5A2B] mb-2">Đề xuất (chất lượng tốt nhất):</p>
                    <div class="bg-[#E5D5C8] p-3 rounded-lg border-2 border-[#8B5A2B]">
                        <div class="flex items-center justify-between">
                            <span class="font-medium text-[#4A7043]">${bestOption.filename || 'Video chất lượng cao'}</span>
                            <button class="btn btn-sm bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-lg border-none" 
                                    onclick="window.singleProcessor.handleDownloadLink(${JSON.stringify(bestOption).replace(/"/g, '&quot;')})">
                                <i class="fas fa-download mr-1"></i> Tải xuống
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="border-t border-[#8B5A2B] border-opacity-30 pt-3">
                    <p class="text-sm text-[#8B5A2B] mb-2">Tất cả các tùy chọn:</p>
                    <button class="btn btn-sm bg-[#4A7043] text-white hover:bg-[#3A5734] rounded-lg border-none" 
                            onclick="window.pickerModal.show(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                        <i class="fas fa-list mr-1"></i> Xem tất cả (${data.picker.length} tùy chọn)
                    </button>
                </div>
            </div>
        `;

        // Make sure the picker modal and single processor are globally accessible
        window.pickerModal = this.pickerModal;
        window.singleProcessor = this;
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
