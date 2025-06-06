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
        const url = urlInput.value.trim();

        if (!url) {
            showError('Vui lòng nhập URL để tải xuống');
            return;
        }

        processDownload(url);
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

    // Hàm xử lý tải xuống
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
            
            // Kiểm tra nếu response không thành công
            if (!response.ok) {
                hideLoading();
                showError(`Lỗi API: ${response.status} ${response.statusText}`);
                return;
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            hideLoading();
            
            // Kiểm tra nếu không có dữ liệu trả về
            if (!data) {
                showError('Không nhận được dữ liệu từ API');
                return;
            }

            // Xử lý lỗi
            if (data.status === 'error') {
                console.error('API error:', data.error);
                if (!data.error || !data.error.code) {
                    showError('Lỗi không xác định từ API');
                    return;
                }
                
                let errorMsg = `Lỗi: ${data.error.code}`;
                
                // Xử lý các lỗi cụ thể
                if (data.error.code === 'error.api.youtube.login') {
                    errorMsg = 'Video yêu cầu đăng nhập YouTube (có thể bị giới hạn độ tuổi hoặc riêng tư). Hãy thử với video công khai.';
                } else if (data.error.code === 'error.api.invalid_body') {
                    errorMsg = 'Lỗi cấu trúc dữ liệu gửi đi. Vui lòng chỉ nhập URL và thử lại.';
                }
                
                showError(errorMsg);
                return;
            }

            // Xử lý kết quả thành công
            handleResponse(data);
        } catch (error) {
            hideLoading();
            showError(`Không thể kết nối đến API Cobalt: ${error.message}. Vui lòng đảm bảo API đang chạy.`);
            console.error('Fetch error:', error);
        }
    }

    // Xử lý phản hồi từ API
    function handleResponse(data) {
        resultContainer.classList.remove('hidden');
        console.log('Xử lý phản hồi:', data);

        // Kiểm tra dữ liệu trả về có hợp lệ không
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
                    // Nếu có nhiều lựa chọn, chọn cái đầu tiên
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

    // Xử lý link tải xuống trực tiếp
    function handleDownloadLink(data) {
        const { url, filename } = data;
        console.log('URL tải xuống:', url);
        console.log('Tên file:', filename);
        
        // Đảm bảo URL và filename hợp lệ
        if (!url) {
            showError('URL tải xuống không hợp lệ');
            return;
        }

        // Hiển thị kết quả tải xuống
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
                    
                    <a href="${url}" class="btn bg-[#4A7043] text-white hover:bg-[#3A5734] rounded-xl border-none transition transform hover:scale-105" target="_blank">
                        <i class="fas fa-external-link-alt mr-2"></i> Mở trong tab mới
                    </a>
                </div>
            </div>
            
        `;

        // Thêm sự kiện cho nút tải xuống trực tiếp
        document.getElementById('direct-download').addEventListener('click', () => {
            // Tạo thẻ a để tải file trực tiếp
            const downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = filename || 'video.mp4';
            downloadLink.style.display = 'none';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Log để debug
            console.log('Bắt đầu tải xuống:', url, 'Tên file:', filename || 'video.mp4');
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