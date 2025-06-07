import { ThemeManager } from './theme.js';
import { SingleProcessor } from './single.js';
import { BatchProcessor } from './batch.js';
import { SettingsManager } from './settings.js';
import { PickerModal } from './picker.js';
import { ApiService } from './api.js';
import { parseUrls } from './utils.js';

// Main application class
export class App {
    constructor() {
        this.initElements();
        this.themeManager = new ThemeManager();
        this.settingsManager = new SettingsManager();
        this.pickerModal = new PickerModal();
        this.apiService = new ApiService();
        this.singleProcessor = new SingleProcessor();
        this.batchProcessor = new BatchProcessor();
        this.bindEvents();
        this.initializeApp();
    }

    initElements() {
        this.urlInput = document.getElementById('url-input');
        this.downloadBtn = document.getElementById('download-btn');
        this.clearInputBtn = document.getElementById('clear-input');
        this.resetBtn = document.getElementById('reset-btn');
        this.resultContainer = document.getElementById('result-container');
        this.downloadResult = document.getElementById('download-result');
        this.errorContainer = document.getElementById('error-container');
        this.errorMessage = document.getElementById('error-message');
    }

    async initializeApp() {
        try {
            // Try to get instance info
            const instanceInfo = await this.apiService.getInstanceInfo();
            console.log('Connected to Cobalt instance:', instanceInfo);
            
            // Update supported services if available
            if (instanceInfo.cobalt && instanceInfo.cobalt.services) {
                this.updateSupportedServices(instanceInfo.cobalt.services);
            }

            // Show turnstile widget if required
            if (instanceInfo.cobalt && instanceInfo.cobalt.turnstileSitekey) {
                this.setupTurnstile(instanceInfo.cobalt.turnstileSitekey);
            }

        } catch (error) {
            console.warn('Could not connect to instance or get info:', error.message);
        }
    }

    bindEvents() {
        // Download button
        this.downloadBtn.addEventListener('click', () => {
            this.handleDownload();
        });

        // Enter key in input
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.downloadBtn.click();
            }
        });

        // Clear input button visibility
        this.urlInput.addEventListener('input', () => {
            if (this.urlInput.value.trim() !== '') {
                this.clearInputBtn.style.opacity = '1';
            } else {
                this.clearInputBtn.style.opacity = '0';
            }
        });

        // Clear input button
        this.clearInputBtn.addEventListener('click', () => {
            this.urlInput.value = '';
            this.clearInputBtn.style.opacity = '0';
            this.urlInput.focus();
        });

        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.reset();
        });

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.settingsManager.toggleSettings();
            });
        }
    }

    updateSupportedServices(services) {
        // Update the supported platforms list based on API response
        console.log('Supported services from API:', services);
        // Could update the tooltip content here if needed
    }

    setupTurnstile(sitekey) {
        // Setup turnstile widget for authentication if required
        console.log('Turnstile authentication required, sitekey:', sitekey);
        // Implementation would depend on Cloudflare Turnstile integration
    }

    handleDownload() {
        const input = this.urlInput.value.trim();

        if (!input) {
            this.singleProcessor.showError('Vui lòng nhập URL để tải xuống');
            return;
        }

        const urls = parseUrls(input);

        if (urls.length === 0) {
            this.singleProcessor.showError('Vui lòng nhập ít nhất một URL hợp lệ');
            return;
        }

        // Get current settings
        const settings = this.settingsManager.getSettings();

        if (urls.length === 1) {
            // Single URL processing with settings
            this.singleProcessor.process(urls[0], settings);
        } else {
            // Batch processing with settings
            this.resultContainer.classList.remove('hidden');
            this.singleProcessor.hideError();
            this.downloadResult.classList.remove('hidden');
            this.batchProcessor.processBatch(urls);
        }
    }

    // Handle API responses based on status
    handleApiResponse(data, url, settings = {}) {
        switch (data.status) {
            case 'tunnel':
            case 'redirect':
                this.handleDirectDownload(data);
                break;
                
            case 'local-processing':
                this.handleLocalProcessing(data);
                break;
                
            case 'picker':
                this.handlePickerResponse(data);
                break;
                
            case 'error':
                this.handleErrorResponse(data);
                break;
                
            default:
                this.singleProcessor.showError('Phản hồi không xác định từ API');
        }
    }

    handleDirectDownload(data) {
        // Handle direct download (tunnel/redirect)
        const link = document.createElement('a');
        link.href = data.url;
        link.download = data.filename || 'download';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    handleLocalProcessing(data) {
        // Handle local processing response
        this.singleProcessor.showError(
            'Local processing được yêu cầu. Tính năng này chưa được hỗ trợ trong phiên bản web.'
        );
    }

    handlePickerResponse(data) {
        // Show picker modal for multiple items
        this.pickerModal.show(data);
    }

    handleErrorResponse(data) {
        // Handle error response
        const errorCode = data.error?.code || 'unknown';
        const context = data.error?.context;
        
        let errorMessage = `Lỗi: ${errorCode}`;
        
        if (context) {
            if (context.service) {
                errorMessage += ` (${context.service})`;
            }
            if (context.limit) {
                errorMessage += ` - Giới hạn: ${context.limit}`;
            }
        }
        
        this.singleProcessor.showError(errorMessage);
    }

    reset() {
        // Stop batch processing if running
        this.batchProcessor.reset();

        // Clear input
        this.urlInput.value = '';
        this.clearInputBtn.style.opacity = '0';

        // Hide containers
        this.resultContainer.classList.add('hidden');
        this.downloadResult.classList.add('hidden');
        this.errorContainer.classList.add('hidden');

        // Clear content
        this.downloadResult.innerHTML = '';
        this.errorMessage.textContent = '';

        // Focus input
        this.urlInput.focus();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
