import { ThemeManager } from './theme.js';
import { SingleProcessor } from './single.js';
import { BatchProcessor } from './batch.js';
import { parseUrls } from './utils.js';

// Main application class
export class App {
    constructor() {
        this.initElements();
        this.themeManager = new ThemeManager();
        this.singleProcessor = new SingleProcessor();
        this.batchProcessor = new BatchProcessor();
        this.bindEvents();
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

        if (urls.length === 1) {
            // Single URL processing
            this.singleProcessor.process(urls[0]);
        } else {
            // Batch processing
            this.resultContainer.classList.remove('hidden');
            this.singleProcessor.hideError();
            this.downloadResult.classList.remove('hidden');
            this.batchProcessor.processBatch(urls);
        }
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
