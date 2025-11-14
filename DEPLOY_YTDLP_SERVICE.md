# 🚀 Deploy yt-dlp Service

## Tóm tắt các thay đổi cần deploy:

1. ✅ **ytdlp-service** - Improved error handling, Android client
2. ✅ **Web interface** - YouTube URL detection và routing
3. ✅ **URL cleaning** - Loại bỏ playlist/radio parameters

## 📋 Deploy Commands (Copy-paste vào server)

```bash
# SSH vào server
ssh root@103.75.187.172 -p 24700

# Di chuyển vào thư mục project
cd /root/api-downloader

# Pull code mới nhất
git pull origin main

# Rebuild ytdlp-service (có code mới)
docker-compose -f docker-compose.production.yml build ytdlp-service --no-cache

# Rebuild web interface (có thay đổi api.js)
docker-compose -f docker-compose.production.yml build cobalt-web --no-cache

# Restart tất cả services
docker-compose -f docker-compose.production.yml up -d

# Đợi services khởi động
sleep 10

# Kiểm tra status
docker ps | grep -E 'cobalt|ytdlp'
```

## ✅ Verify Deployment

### 1. Check service health:
```bash
# ytdlp-service health check
curl http://localhost:5003/health

# Expected: {"status":"ok","service":"yt-dlp-handler","cookies":true}
```

### 2. Check logs:
```bash
# ytdlp-service logs
docker logs ytdlp-youtube-handler --tail 30

# Should see: [INFO] Booting worker with pid: XX (no crashes)
```

### 3. Test YouTube download:
```bash
# Test qua API
curl -X POST http://localhost:5003/api/youtube \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","quality":"720"}'

# Expected: {"status":"tunnel","url":"https://...","audio":"https://..."}
```

## 🧪 Test từ Browser

1. Mở: **https://download.websites.com.vn**
2. Paste URL có playlist: `https://www.youtube.com/watch?v=ILsA2VFJ150&list=RDxxx&start_radio=1`
3. Nhấn F12 (DevTools Console)
4. Click "PHÂN TÍCH"

**Expected console logs:**
```
🎬 YouTube URL detected, routing to yt-dlp service
🧹 Original URL: https://www.youtube.com/watch?v=ILsA2VFJ150&list=RDxxx&start_radio=1
✨ Cleaned URL: https://www.youtube.com/watch?v=ILsA2VFJ150
📤 Sending request to: /api/youtube
📦 Request data: {url: "https://www.youtube.com/watch?v=ILsA2VFJ150", quality: "720"}
📥 Response data: {status: "tunnel", url: "...", ...}
```

5. Click "Tải xuống" - video should download successfully ✅

## 🎯 Các cải tiến đã deploy:

### ytdlp-service (app.py):
- ✅ Sử dụng Android client để tránh JavaScript runtime warnings
- ✅ Skip unavailable fragments
- ✅ Filter formats không có URL
- ✅ Better error handling với try-catch
- ✅ Detailed logging cho debugging

### Web Interface (api.js):
- ✅ `isYouTubeUrl()` - Detect YouTube URLs
- ✅ `cleanYouTubeUrl()` - Remove playlist parameters
- ✅ Auto routing: YouTube → `/api/youtube`, Others → `/api/`
- ✅ Console logs để debug flow

### Nginx (nginx.conf):
- ✅ `/api/youtube` → proxy to ytdlp-service:5003
- ✅ `/api/` → proxy to cobalt-api:9000
- ✅ Timeout 300s cho video processing

## 🔧 Nếu có lỗi:

### Lỗi 1: ytdlp-service worker crashes
```bash
# Check logs
docker logs ytdlp-youtube-handler --tail 50

# Restart service
docker-compose -f docker-compose.production.yml restart ytdlp-service
```

### Lỗi 2: Nginx 502 Bad Gateway
```bash
# Check network connectivity
docker exec cobalt-web curl http://ytdlp-service:5003/health

# Restart nginx
docker-compose -f docker-compose.production.yml restart cobalt-web
```

### Lỗi 3: Cookies không hoạt động
```bash
# Re-generate cookies.txt
cd ytdlp-service
./convert-cookies-to-txt.sh

# Restart ytdlp-service
cd ..
docker-compose -f docker-compose.production.yml restart ytdlp-service
```

### Lỗi 4: Web interface không update
- Clear browser cache: **Ctrl + Shift + R** (hard refresh)
- Hoặc F12 → Network tab → Disable cache

## 📊 Architecture Flow

```
User Input: https://www.youtube.com/watch?v=abc&list=xxx&start_radio=1
     ↓
Web Interface (api.js)
     ↓
1. Detect YouTube ✓
2. Clean URL → https://www.youtube.com/watch?v=abc
3. Send to /api/youtube
     ↓
Nginx (cobalt-web:80)
     ↓
Route to ytdlp-service:5003
     ↓
yt-dlp extracts video
     ↓
Return: {status: "tunnel", url: "...", audio: "..."}
     ↓
User downloads video ✅
```

## ✅ Success Criteria

Sau khi deploy, bạn phải thấy:

1. ✅ All containers running và healthy
2. ✅ YouTube URLs được detect và route đến ytdlp-service
3. ✅ Playlist parameters bị loại bỏ
4. ✅ Video downloads thành công
5. ✅ Không còn worker crashes trong logs
6. ✅ Console logs hiển thị routing flow rõ ràng

---

**Deploy date:** 2025-11-14
**Version:** YouTube yt-dlp handler v1.0
**Status:** Ready to deploy 🚀
