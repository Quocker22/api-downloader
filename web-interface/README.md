# FROM DOWNLOADER - Cấu trúc dự án

## Cấu trúc thư mục

```
js/
├── app.js          # File chính khởi tạo ứng dụng
├── config.js       # Cấu hình và hằng số
├── utils.js        # Các hàm tiện ích
├── theme.js        # Quản lý theme
├── api.js          # Xử lý API requests
├── modal.js        # Quản lý modal progress
├── download.js     # Quản lý download
├── single.js       # Xử lý download đơn lẻ
└── batch.js        # Xử lý download hàng loạt
```

## Mô tả các file

### `app.js`
- File chính khởi tạo ứng dụng
- Quản lý các events chính của UI
- Điều phối giữa single và batch processing

### `config.js`
- Chứa các cấu hình và hằng số
- API URL, thời gian delay, danh sách platform
- Thông báo lỗi

### `utils.js`
- Các hàm tiện ích chung
- Format bytes, time, sleep, parse URLs
- Validation functions

### `theme.js`
- Quản lý theme (light/dark mode)
- Lưu trữ preferences trong localStorage
- Switch theme UI

### `api.js`
- Xử lý tất cả API calls
- Fetch data từ Cobalt API
- Download file requests

### `modal.js`
- Quản lý progress modal
- Hiển thị progress bar
- Error modal

### `download.js`
- Quản lý download với progress bar
- Direct download
- File saving logic

### `single.js`
- Xử lý download URL đơn lẻ
- UI cho single download
- Error handling cho single process

### `batch.js`
- Xử lý download hàng loạt
- Batch UI management
- Progress tracking cho multiple URLs

## Lợi ích của cấu trúc mới

1. **Dễ bảo trì**: Mỗi file có trách nhiệm riêng biệt
2. **Dễ mở rộng**: Có thể thêm tính năng mới mà không ảnh hưởng các file khác
3. **Dễ debug**: Lỗi dễ dàng xác định trong file cụ thể
4. **Tái sử dụng**: Các class và function có thể tái sử dụng
5. **ES6 Modules**: Sử dụng import/export hiện đại
6. **Class-based**: Dễ hiểu và quản lý state

## Cách thêm tính năng mới

1. **Thêm config mới**: Cập nhật `config.js`
2. **Thêm API endpoint**: Cập nhật `api.js`
3. **Thêm UI component**: Tạo file mới hoặc cập nhật file liên quan
4. **Import vào app.js**: Kết nối với ứng dụng chính

## Development

Để phát triển ứng dụng, bạn cần:

1. Chạy local server (do sử dụng ES6 modules)
2. Mở browser dev tools để debug
3. Sửa file tương ứng với tính năng cần thay đổi
4. Test từng module độc lập
