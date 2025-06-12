# FROM DOWNLOADER - Enhanced Cobalt Web Interface

## Tổng quan

Giao diện web nâng cao cho Cobalt API với đầy đủ tính năng hỗ trợ tất cả các tùy chọn và kiểu phản hồi từ API. Giao diện được thiết kế với phong cách vintage hiện đại và hỗ trợ đa ngôn ngữ (Tiếng Việt).

## 🚀 Build và Development

Dự án này sử dụng **Vite** để bundle và tối ưu hóa:

### Development
```bash
# Cài đặt dependencies
npm install

# Chạy development server (hot reload)
npm run dev
# Mở http://localhost:3000
```

### Production Build
```bash
# Build cho production (tối ưu hóa, minify)
npm run build

# Preview production build
npm run preview
# Mở http://localhost:4173

# Build với clean
npm run build:clean
```

### Deployment
Sau khi build, thư mục `dist/` chứa:
- ✅ HTML, CSS, JS đã được minify và tối ưu
- ✅ Assets với hash để cache busting
- ✅ Sẵn sàng deploy lên bất kỳ static hosting nào

## Tính năng chính

### 🎛️ Hệ thống cài đặt nâng cao
- **Cài đặt tổng quát**: Chất lượng video/audio, định dạng file, xử lý metadata
- **Cài đặt YouTube**: Chế độ Dublin, codec video/audio tùy chỉnh
- **Cài đặt TikTok**: Loại bỏ watermark, chất lượng video đầy đủ
- **Cài đặt nâng cao**: Xác thực API, thời gian chờ, bypass Twitter
- **Lưu trữ cài đặt**: Tự động lưu vào localStorage với khả năng reset

### 🔐 Hỗ trợ xác thực
- **API Key authentication**: Hỗ trợ khóa API cho rate limiting cao hơn
- **Bearer token**: Hỗ trợ token xác thực Bearer
- **Turnstile integration**: Sẵn sàng tích hợp Cloudflare Turnstile khi cần

### 📦 Xử lý đa dạng kiểu phản hồi
- **Stream/Tunnel**: Tải xuống trực tiếp với progress bar
- **Redirect**: Chuyển hướng đến URL tải xuống
- **Picker**: Giao diện chọn lựa cho nhiều file (ảnh, video, GIF)
- **Local processing**: Hiển thị nội dung xử lý cục bộ
- **Error handling**: Xử lý lỗi chi tiết với thông báo tiếng Việt

### 🎨 Giao diện người dùng nâng cao
- **Picker Modal**: Lưới hiển thị với preview, filter theo loại file
- **Settings Modal**: Giao diện cài đặt đầy đủ với tabs và nhóm tùy chọn
- **Progress Tracking**: Thanh tiến độ chi tiết cho downloads
- **Dark/Light Theme**: Chuyển đổi theme với lưu trữ preference
- **Responsive Design**: Tối ưu cho mobile và desktop

### 🚀 Xử lý hàng loạt nâng cao
- **Batch Processing**: Xử lý nhiều URL với settings áp dụng
- **Rate Limiting**: Delay thông minh giữa các request
- **Progress Tracking**: Theo dõi tiến độ từng item trong batch
- **Error Recovery**: Tiếp tục xử lý khi có lỗi individual items

## Cấu trúc dự án

```
├── index.html              # Giao diện chính
├── css/
│   ├── styles.css         # Styles chính với components mới
│   ├── variables.css      # CSS variables cho theming
│   ├── components.css     # Component-specific styles
│   ├── modal.css         # Modal styles
│   ├── tooltip.css       # Tooltip styles
│   └── animations.css    # CSS animations
└── js/
    ├── app.js            # Ứng dụng chính với integration
    ├── config.js         # Cấu hình API đầy đủ
    ├── api.js            # API service với authentication
    ├── settings.js       # Hệ thống quản lý cài đặt
    ├── picker.js         # Modal picker cho multi-selection
    ├── single.js         # Xử lý URL đơn với settings
    ├── batch.js          # Xử lý batch với settings
    ├── download.js       # Download manager với progress
    ├── modal.js          # Modal management
    ├── theme.js          # Theme management
    └── utils.js          # Utility functions
```

## Mô tả chi tiết các components

### `config.js` - Cấu hình API toàn diện
- **DEFAULT_OPTIONS**: Tất cả tham số API từ Cobalt schema
- **SERVICE_SPECIFIC_OPTIONS**: Tùy chọn riêng cho từng platform
- **UI_LABELS**: Nhãn giao diện người dùng (Tiếng Việt)
- **ERROR_MESSAGES**: Thông báo lỗi chi tiết
- **API configuration**: URL, delays, rate limiting

### `api.js` - Service API nâng cao
- **Authentication support**: API Key và Bearer token
- **Options parameter**: Truyền tất cả settings vào API calls
- **Instance info**: Lấy thông tin instance và services
- **Session management**: Tạo session cho Turnstile auth
- **Error handling**: Xử lý response types và errors

### `settings.js` - Hệ thống cài đặt
- **SettingsManager class**: Quản lý toàn bộ lifecycle
- **Tab-based UI**: Phân nhóm settings theo categories
- **Real-time updates**: Cập nhật settings ngay lập tức
- **localStorage persistence**: Lưu trữ bền vững
- **Reset functionality**: Khôi phục về mặc định

### `picker.js` - Multi-selection interface
- **PickerModal class**: Giao diện chọn lựa files
- **Grid display**: Hiển thị dạng lưới với preview
- **Type filtering**: Filter theo loại file (image, video, gif)
- **Bulk operations**: Download individual hoặc tất cả
- **Selection management**: Theo dõi items đã chọn

### `single.js` - Enhanced single processing
- **Settings integration**: Sử dụng settings từ SettingsManager
- **Response type handling**: Xử lý tất cả kiểu phản hồi
- **Local processing display**: Hiển thị content cho local-processing
- **Picker integration**: Mở picker modal khi cần
- **Error formatting**: Thông báo lỗi user-friendly

### `batch.js` - Enhanced batch processing
- **Settings support**: Áp dụng settings cho tất cả URLs
- **Progress tracking**: Theo dõi từng item riêng biệt
- **Error resilience**: Tiếp tục khi có lỗi individual
- **UI management**: Cập nhật status và results realtime

## API Support Matrix

| Feature | Support Level | Implementation |
|---------|---------------|----------------|
| **Core Downloads** | ✅ Full | All response types handled |
| **Quality Options** | ✅ Full | Video/Audio quality selection |
| **Codec Options** | ✅ Full | H264/AV1/VP9 support |
| **Service Options** | ✅ Full | YouTube, TikTok specific settings |
| **Authentication** | ✅ Full | API Key + Bearer token |
| **Turnstile** | 🔄 Ready | UI ready, needs implementation |
| **Metadata** | ✅ Full | Filename, metadata handling |
| **Watermark Removal** | ✅ Full | TikTok watermark options |
| **Audio-only** | ✅ Full | Audio extraction options |

## Cách sử dụng

### 1. Cài đặt cơ bản
1. Clone repository
2. Cập nhật `CONFIG.API_URL` trong `config.js`
3. Chạy với local server (CORS requirements)

### 2. Cấu hình nâng cao
- **API Authentication**: Thêm API key vào settings
- **Custom endpoints**: Cập nhật URL trong config
- **Service options**: Tùy chỉnh cho từng platform

### 3. Sử dụng giao diện
- **Single URL**: Paste URL và nhấn "PHÂN TÍCH"
- **Batch URLs**: Paste nhiều URLs (cách nhau bằng dấu phẩy)
- **Settings**: Click nút "Cài đặt" để tùy chỉnh
- **Picker**: Chọn files khi có nhiều options

## Tính năng đặc biệt

### 🎯 Smart Response Handling
```javascript
// Tự động xử lý các kiểu response khác nhau
switch (response.status) {
    case 'stream': // Direct download
    case 'redirect': // Redirect to URL
    case 'picker': // Show picker modal
    case 'local-processing': // Show content
    case 'error': // Display error
}
```

### ⚙️ Comprehensive Settings
- 25+ API parameters được hỗ trợ
- Giao diện dễ sử dụng với tooltips
- Auto-save vào localStorage
- Validation cho từng field

### 🔄 Batch Processing với Settings
- Áp dụng cài đặt cho tất cả URLs trong batch
- Rate limiting thông minh
- Progress tracking chi tiết
- Error recovery và reporting

### 🎨 Enhanced UI/UX
- Vintage aesthetic với modern functionality
- Dark/Light mode toggle
- Responsive design cho mobile
- Accessibility features

## Development và Extension

### Thêm tính năng mới

1. **New API Parameter**:
   ```javascript
   // Thêm vào config.js
   DEFAULT_OPTIONS: {
       newParameter: defaultValue
   }
   
   // Thêm UI label
   UI_LABELS: {
       newParameter: 'Mô tả tính năng'
   }
   ```

2. **New Service Support**:
   ```javascript
   // Cập nhật SERVICE_SPECIFIC_OPTIONS
   newService: {
       supportedOptions: ['param1', 'param2']
   }
   ```

3. **Custom Response Handler**:
   ```javascript
   // Thêm vào single.js hoặc batch.js
   handleCustomResponse(response) {
       // Implementation
   }
   ```

### Testing và Debugging

1. **Local Development**:
   ```bash
   # Chạy simple HTTP server
   python -m http.server 8000
   # hoặc
   npx serve .
   ```

2. **Browser DevTools**:
   - Network tab: Kiểm tra API calls
   - Console: Debug logs và errors
   - Application: localStorage settings

3. **Error Handling**:
   - Mở console để xem chi tiết errors
   - Check network requests cho API issues
   - Verify settings trong localStorage

## Security và Performance

### Security Considerations
- **CORS**: Cần proper CORS setup cho production
- **API Keys**: Stored locally, không gửi qua insecure channels
- **Input Validation**: URLs được validate trước khi gửi API
- **XSS Protection**: Proper escaping cho user inputs

### Performance Optimizations
- **Lazy Loading**: Components chỉ load khi cần
- **Debouncing**: Input validation với delay
- **Caching**: Settings cached trong localStorage
- **Batch Optimization**: Smart delays giữa requests

## Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+
- **ES6 Modules**: Required for imports
- **Local Storage**: For settings persistence
- **Fetch API**: For HTTP requests

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Solution: Run từ HTTP server, không phải file://
   - Check API server CORS configuration

2. **Settings không lưu**:
   - Solution: Check localStorage permissions
   - Clear browser data nếu cần

3. **API Connection Failed**:
   - Solution: Verify API_URL trong config.js
   - Check network connectivity

4. **Picker không hiện**:
   - Solution: Check console cho JavaScript errors
   - Verify response format từ API

### Debug Commands

```javascript
// Check current settings
console.log(app.settingsManager.getSettings());

// Check API connection
app.apiService.getInstanceInfo().then(console.log);

// Reset all settings
app.settingsManager.resetToDefaults();
```

## Contributing

1. Fork repository
2. Create feature branch
3. Follow coding standards (ES6, proper commenting)
4. Test thoroughly với different response types
5. Update documentation
6. Submit pull request

---

**FROM DOWNLOADER** - Enhanced Cobalt Web Interface  
Version 2.0 with full API support and modern UI/UX
# down-easy
