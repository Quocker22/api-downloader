import { ApiService } from './api.js';
import { ProgressModal, showErrorModal } from './modal.js';

// Download manager for handling downloads with progress
export class DownloadManager {
    constructor() {
        this.apiService = new ApiService();
    }

    async downloadWithProgress(url, filename) {
        const modal = new ProgressModal(filename);
        modal.show();

        try {
            const response = await this.apiService.downloadFile(url);
            const contentLength = response.headers.get('Content-Length');
            const total = parseInt(contentLength, 10);

            const reader = response.body.getReader();
            let receivedLength = 0;
            let chunks = [];
            const startTime = Date.now();

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                chunks.push(value);
                receivedLength += value.length;

                // Update progress
                if (total) {
                    const percentage = (receivedLength / total) * 100;
                    const elapsed = (Date.now() - startTime) / 1000;
                    const speed = receivedLength / elapsed;
                    const remaining = (total - receivedLength) / speed;

                    modal.updateProgress(percentage, speed, remaining);
                }
            }

            // Create blob and show save button
            const blob = new Blob(chunks);
            modal.showComplete(blob);

        } catch (error) {
            console.error('Download error:', error);
            modal.showError(`Lỗi tải xuống: ${error.message}`);
        }
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
