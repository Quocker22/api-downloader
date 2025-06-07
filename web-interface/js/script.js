document.addEventListener('DOMContentLoaded', () => {
    // Các phần tử DOM
    const urlInput = document.getElementById('url-input');
    const downloadBtn = document.getElementById('download-btn');
    const resultContainer = document.getElementById('result-container');
    const loading = document.getElementById('loading');
    const downloadResult = document.getElementById('download-result');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const clearInputBtn = document.getElementById('clear-input');
    const themeToggle = document.getElementById('theme-toggle');
    const resetBtn = document.getElementById('reset-btn');

    // API URL
    const API_URL = 'http://localhost:9000/';

    // Biến để theo dõi trạng thái xử lý hàng loạt
    let isBatchProcessing = false;
    let batchResults = [];

    // Khởi tạo theme
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    
    // Gọi hàm khởi tạo theme
    initTheme();
    
    // Xử lý sự kiện click vào nút toggle theme
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
    
    // Xử lý sự kiện click nút tải xuống
    downloadBtn.addEventListener('click', () => {
        const input = urlInput.value.trim();

        if (!input) {
            showError('Vui lòng nhập URL để tải xuống');
            return;
        }

        // Tách URLs bằng dấu phẩy
        const urls = input.split(',').map(url => url.trim()).filter(url => url);
        
        if (urls.length === 0) {
            showError('Vui lòng nhập ít nhất một URL hợp lệ');
            return;
        }

        if (urls.length === 1) {
            // Xử lý đơn lẻ như cũ
            processDownload(urls[0]);
        } else {
            // Xử lý hàng loạt
            processBatchDownload(urls);
        }
    });

    // Xử lý sự kiện nhấn Enter trong input
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            downloadBtn.click();
        }
    });
    
    // Xử lý hiển thị nút clear input
    urlInput.addEventListener('input', () => {
        if (urlInput.value.trim() !== '') {
            clearInputBtn.style.opacity = '1';
        } else {
            clearInputBtn.style.opacity = '0';
        }
    });
    
    // Xử lý sự kiện click nút clear
    clearInputBtn.addEventListener('click', () => {
        urlInput.value = '';
        clearInputBtn.style.opacity = '0';
        urlInput.focus();
    });

    // Hàm xử lý tải xuống hàng loạt
    async function processBatchDownload(urls) {
        if (isBatchProcessing) return;
        
        isBatchProcessing = true;
        batchResults = [];
        
        // Hiển thị container và khởi tạo giao diện batch
        resultContainer.classList.remove('hidden');
        hideError();
        downloadResult.classList.remove('hidden');
        
        // Tạo giao diện cho batch processing
        initBatchUI(urls);
        
        // Xử lý từng URL với delay
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const itemId = `batch-item-${i}`;
            
            try {
                updateBatchItemStatus(itemId, 'loading', 'Đang xử lý...');
                
                const result = await processSingleUrl(url);
                batchResults.push({ url, result, status: 'success' });
                
                if (result.status === 'error') {
                    updateBatchItemStatus(itemId, 'error', getErrorMessage(result.error));
                } else {
                    updateBatchItemStatus(itemId, 'success', 'Thành công');
                    addDownloadButtons(itemId, result);
                }
                
            } catch (error) {
                console.error(`Lỗi xử lý URL ${url}:`, error);
                batchResults.push({ url, error: error.message, status: 'error' });
                updateBatchItemStatus(itemId, 'error', `Lỗi: ${error.message}`);
            }
            
            // Delay giữa các request (1 giây)
            if (i < urls.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        isBatchProcessing = false;
        updateBatchSummary();
    }

    // Khởi tạo giao diện batch
    function initBatchUI(urls) {
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

    // Cập nhật trạng thái từng item
    function updateBatchItemStatus(itemId, status, message) {
        const item = document.getElementById(itemId);
        if (!item) return;
        
        const statusIcon = item.querySelector('.batch-status-icon i');
        const statusText = item.querySelector('.batch-status-text');
        
        // Cập nhật icon
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
        
        // Cập nhật text
        statusText.textContent = message;
        statusText.className = `batch-status-text text-sm ${
            status === 'error' ? 'text-red-600' : 
            status === 'success' ? 'text-green-600' : 'text-[#8B5A2B]'
        }`;
    }

    // Thêm nút download cho item thành công
    function addDownloadButtons(itemId, data) {
        const item = document.getElementById(itemId);
        if (!item) return;
        
        const buttonsContainer = item.querySelector('.batch-download-buttons');
        if (!buttonsContainer) return;
        
        let downloadData = data;
        
        // Xử lý dữ liệu tùy theo loại response
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
                    <button class="direct-download-btn btn btn-sm bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-lg border-none flex-1">
                        <i class="fas fa-download mr-1"></i> Tải xuống
                    </button>
                    <button class="open-tab-btn btn btn-sm bg-[#4A7043] text-white hover:bg-[#3A5734] rounded-lg border-none flex-1">
                        <i class="fas fa-external-link-alt mr-1"></i> Mở tab mới
                    </button>
                </div>
            </div>
        `;
        
        buttonsContainer.classList.remove('hidden');
        
        // Thêm sự kiện cho nút tải xuống
        const downloadBtn = buttonsContainer.querySelector('.direct-download-btn');
        downloadBtn.addEventListener('click', () => {
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename || 'video.mp4';
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        });

        // Thêm sự kiện cho nút mở tab mới
        const openTabBtn = buttonsContainer.querySelector('.open-tab-btn');
        openTabBtn.addEventListener('click', () => {
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    }

    // Cập nhật tóm tắt batch
    function updateBatchSummary() {
        const summaryElement = document.getElementById('batch-summary');
        if (!summaryElement) return;
        
        const total = batchResults.length;
        const success = batchResults.filter(r => r.status === 'success' && (!r.result || r.result.status !== 'error')).length;
        const errors = total - success;
        
        summaryElement.innerHTML = `
            <div class="flex items-center space-x-3">
                <span class="text-green-600"><i class="fas fa-check mr-1"></i>${success}</span>
                <span class="text-red-600"><i class="fas fa-times mr-1"></i>${errors}</span>
                <span class="text-[#8B5A2B]">Hoàn thành</span>
            </div>
        `;
    }

    // Xử lý một URL đơn lẻ
    async function processSingleUrl(url) {
        const requestData = { url };
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': window.location.origin
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    }

    // Lấy thông báo lỗi phù hợp
    function getErrorMessage(error) {
        if (!error || !error.code) {
            return 'Lỗi không xác định';
        }
        
        switch (error.code) {
            case 'error.api.youtube.login':
                return 'Video yêu cầu đăng nhập YouTube';
            case 'error.api.invalid_body':
                return 'URL không hợp lệ';
            case 'error.api.fetch.empty_response':
                return 'Không thể lấy dữ liệu video';
            case 'error.api.content.too_long':
                return 'Video quá dài';
            default:
                return `Lỗi: ${error.code}`;
        }
    }

    // Hàm xử lý tải xuống đơn lẻ (giữ nguyên logic cũ)
    async function processDownload(url) {
        showLoading();
        hideError();
        downloadResult.innerHTML = '';

        const requestData = { url };
        console.log('Gửi request với dữ liệu:', JSON.stringify(requestData));

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', [...response.headers.entries()]);
            
            if (!response.ok) {
                hideLoading();
                showError(`Lỗi API: ${response.status} ${response.statusText}`);
                return;
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            hideLoading();
            
            if (!data) {
                showError('Không nhận được dữ liệu từ API');
                return;
            }

            if (data.status === 'error') {
                console.error('API error:', data.error);
                if (!data.error || !data.error.code) {
                    showError('Lỗi không xác định từ API');
                    return;
                }
                
                let errorMsg = `Lỗi: ${data.error.code}`;
                
                if (data.error.code === 'error.api.youtube.login') {
                    errorMsg = 'Video yêu cầu đăng nhập YouTube (có thể bị giới hạn độ tuổi hoặc riêng tư). Hãy thử với video công khai.';
                } else if (data.error.code === 'error.api.invalid_body') {
                    errorMsg = 'Lỗi cấu trúc dữ liệu gửi đi. Vui lòng chỉ nhập URL và thử lại.';
                }
                
                showError(errorMsg);
                return;
            }

            handleResponse(data);
        } catch (error) {
            hideLoading();
            showError(`Không thể kết nối đến API Cobalt: ${error.message}. Vui lòng đảm bảo API đang chạy.`);
            console.error('Fetch error:', error);
        }
    }

    // Xử lý phản hồi từ API (giữ nguyên)
    function handleResponse(data) {
        resultContainer.classList.remove('hidden');
        console.log('Xử lý phản hồi:', data);

        if (!data || !data.status) {
            showError('Phản hồi không hợp lệ từ API');
            return;
        }

        switch (data.status) {
            case 'tunnel':
                console.log('Phát hiện tunnel URL:', data.url);
                handleDownloadLink(data);
                break;
            case 'redirect':
                console.log('Phát hiện redirect URL:', data.url);
                handleDownloadLink(data);
                break;
            case 'picker':
                console.log('Phát hiện picker với', data.picker ? data.picker.length : 0, 'lựa chọn');
                if (data.picker && data.picker.length > 0) {
                    handleDownloadLink(data.picker[0]);
                } else {
                    showError('Không tìm thấy lựa chọn tải xuống');
                }
                break;
            case 'error':
                let errorMsg = data.error && data.error.code ? `Lỗi: ${data.error.code}` : 'Lỗi không xác định';
                showError(errorMsg);
                break;
            default:
                showError(`Phản hồi không xác định từ API: ${data.status}`);
        }
    }

    // Xử lý link tải xuống trực tiếp (giữ nguyên)
    function handleDownloadLink(data) {
        const { url, filename } = data;
        console.log('URL tải xuống:', url);
        console.log('Tên file:', filename);
        
        if (!url) {
            showError('URL tải xuống không hợp lệ');
            return;
        }

        downloadResult.classList.remove('hidden');
        downloadResult.innerHTML = `
            <div class="bg-[#FFF8E7] p-4 rounded-xl border border-[#8B5A2B] mb-4">
                <div class="flex items-center mb-2">
                    <i class="fas fa-file-video text-[#4A7043] mr-2 text-xl"></i>
                    <p class="font-bold text-[#4A7043] truncate">${filename || 'video'}</p>
                </div>
                
                <div class="flex flex-col space-y-2">
                    <button id="direct-download" class="btn bg-[#8B5A2B] text-white hover:bg-[#6F4A22] rounded-xl border-none transition transform hover:scale-105">
                        <i class="fas fa-download mr-2"></i> Tải xuống ngay
                    </button>
                    
                    <button class="open-new-tab-btn btn bg-[#4A7043] text-white hover:bg-[#3A5734] rounded-xl border-none transition transform hover:scale-105">
                        <i class="fas fa-external-link-alt mr-2"></i> Mở trong tab mới
                    </button>
                </div>
            </div>
        `;

        document.getElementById('direct-download').addEventListener('click', () => {
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename || 'video.mp4';
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            console.log('Bắt đầu tải xuống:', url, 'Tên file:', filename || 'video.mp4');
        });

        // Thêm sự kiện cho nút mở tab mới
        document.querySelector('.open-new-tab-btn').addEventListener('click', () => {
            window.open(url, '_blank', 'noopener,noreferrer');
        });
    }

    // Hiển thị loading
    function showLoading() {
        resultContainer.classList.remove('hidden');
        loading.classList.remove('hidden');
    }

    // Ẩn loading
    function hideLoading() {
        loading.classList.add('hidden');
    }

    // Hiển thị lỗi
    function showError(message) {
        errorContainer.classList.remove('hidden');
        errorMessage.textContent = message;
    }

    // Ẩn lỗi
    function hideError() {
        errorContainer.classList.add('hidden');
    }
    
    // Reset ứng dụng về trạng thái ban đầu
    function resetApp() {
        // Dừng batch processing nếu đang chạy
        isBatchProcessing = false;
        batchResults = [];
        
        // Xóa nội dung input
        urlInput.value = '';
        clearInputBtn.style.opacity = '0';
        
        // Ẩn các container
        resultContainer.classList.add('hidden');
        downloadResult.classList.add('hidden');
        errorContainer.classList.add('hidden');
        
        // Xóa nội dung
        downloadResult.innerHTML = '';
        errorMessage.textContent = '';
        
        // Focus vào input
        urlInput.focus();
    }
    
    // Xử lý sự kiện click nút reset
    resetBtn.addEventListener('click', resetApp);
});