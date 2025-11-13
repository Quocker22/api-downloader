# Hướng dẫn Fix YouTube Download - Option A: yt-session-generator

## Tổng quan

**Vấn đề:** YouTube hiện đang block bot requests với HTTP 403 Forbidden
**Giải pháp:** Dùng yt-session-generator để tự động tạo PO tokens cho Cobalt API

## Cách hoạt động

```
┌─────────────────┐
│ User Request    │
│ YouTube video   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐        Request PO token       ┌──────────────────────┐
│ Cobalt API      │──────────────────────────────>│ yt-session-generator │
│                 │                                │                      │
│ Uses PO token   │<──────────────────────────────│ 1. Launch Chromium   │
│ in YouTube req  │    Return poToken & visitor   │ 2. Solve challenges  │
└────────┬────────┘                                │ 3. Extract tokens    │
         │                                         │ 4. Cache 12 hours    │
         ▼                                         └──────────────────────┘
┌─────────────────┐
│ YouTube API     │
│ ✅ Accept req   │
└─────────────────┘
```

## Yêu cầu chuẩn bị

### ✅ Đã có sẵn:
- Docker và Docker Compose
- Cobalt API đang chạy
- Apache reverse proxy setup

### ⚙️ Cần thêm:
- ~500MB RAM cho yt-session-generator container (Chromium)
- ~200MB disk space cho image
- Network kết nối với Cobalt API container

### ⏱️ Thời gian:
- Setup: 5 phút
- Deploy: 2-3 phút
- Khởi động lần đầu: 1-2 phút (load Chromium)

## Cấu hình đã được setup

### 1. Docker Compose Configuration

File `docker-compose.production.yml` đã được cập nhật với:

**Cobalt API environment:**
```yaml
environment:
  YOUTUBE_SESSION_SERVER: http://yt-session:8080/
```

**yt-session-generator service:**
```yaml
yt-session:
  image: ghcr.io/imputnet/yt-session-generator:latest
  container_name: yt-session-generator
  init: true
  restart: unless-stopped
  networks:
    - cobalt-network
```

**Dependency chain:**
```yaml
cobalt-api:
  depends_on:
    yt-session:
      condition: service_healthy
```

### 2. Network Setup

Cả 3 services đều trong cùng Docker network `cobalt-network`:
- yt-session-generator (internal only, port 8080)
- cobalt-api (exposed to 127.0.0.1:5001)
- cobalt-web (exposed to 127.0.0.1:5002)

## Cách Deploy

### Bước 1: Pull images mới

```bash
cd /root/api-downloader

# Pull yt-session-generator image
docker pull ghcr.io/imputnet/yt-session-generator:latest
```

### Bước 2: Deploy với deploy.sh

```bash
# Deploy toàn bộ stack (bao gồm yt-session-generator)
sudo ./deploy.sh
```

Script sẽ tự động:
1. ✅ Detect docker compose command
2. ✅ Pull latest images
3. ✅ Build web interface
4. ✅ Start yt-session-generator trước
5. ✅ Wait cho yt-session-generator healthy
6. ✅ Start cobalt-api (với YOUTUBE_SESSION_SERVER)
7. ✅ Start cobalt-web

### Bước 3: Verify deployment

**Kiểm tra containers:**
```bash
docker ps | grep -E "(cobalt-api|yt-session|cobalt-web)"
```

Expected output:
```
CONTAINER ID   IMAGE                                      STATUS
abc123...      yt-session-generator:latest               Up 2 minutes (healthy)
def456...      cobalt:latest                             Up 1 minute (healthy)
ghi789...      api-downloader-cobalt-web                 Up 1 minute (healthy)
```

**Kiểm tra yt-session-generator logs:**
```bash
docker logs yt-session-generator --tail 50
```

Expected output khi khởi động lần đầu:
```
[INFO] Starting yt-session-generator...
[INFO] Launching Chromium browser...
[INFO] Loading YouTube...
[INFO] Solving botguard challenge...
[INFO] Extracted poToken: 4o...
[INFO] Extracted visitor_data: Cgt...
[INFO] Session cached for 12 hours
[INFO] Server listening on :8080
```

**Kiểm tra Cobalt API có connect được không:**
```bash
docker logs cobalt-api --tail 50 | grep -i youtube
```

Expected output:
```
[INFO] YouTube session server configured: http://yt-session:8080/
[INFO] YouTube session loaded successfully
```

### Bước 4: Test YouTube download

**Test qua curl:**
```bash
curl -X POST https://taivideo.websites.com.vn/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "videoQuality": "1080"
  }'
```

**Expected:** Trả về response với download URLs (không còn 403 error)

**Test qua web interface:**
1. Mở https://download.websites.com.vn
2. Paste YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click Download
4. ✅ Phải download được video

## Troubleshooting

### Issue 1: yt-session-generator không khởi động

**Kiểm tra logs:**
```bash
docker logs yt-session-generator
```

**Possible causes:**
- RAM không đủ (cần ít nhất 512MB)
- Network issue khi pull Chromium

**Fix:**
```bash
# Restart container
docker restart yt-session-generator

# Nếu vẫn lỗi, rebuild
docker compose -f docker-compose.production.yml up -d --force-recreate yt-session
```

### Issue 2: Cobalt API không connect được yt-session

**Kiểm tra network:**
```bash
docker network inspect cobalt-network
```

**Verify cả 2 containers đều trong cùng network:**
```bash
docker inspect cobalt-api | grep -A 10 Networks
docker inspect yt-session-generator | grep -A 10 Networks
```

**Test connectivity từ cobalt-api:**
```bash
docker exec cobalt-api wget -O- http://yt-session:8080/health
```

Expected: `{"status":"ok","has_session":true}`

### Issue 3: Vẫn bị 403 khi download YouTube

**Kiểm tra token có valid không:**
```bash
docker exec yt-session-generator curl http://localhost:8080/session
```

Expected:
```json
{
  "poToken": "4o...",
  "visitor_data": "Cgt...",
  "cached_at": "2025-11-13T10:30:00Z"
}
```

**Nếu token expired, force refresh:**
```bash
# Restart yt-session để generate token mới
docker restart yt-session-generator

# Wait 1-2 phút cho token generation
sleep 120

# Test lại
```

### Issue 4: yt-session-generator tốn quá nhiều RAM

**Giảm memory usage:**

Thêm vào docker-compose.production.yml:
```yaml
yt-session:
  # ... existing config
  deploy:
    resources:
      limits:
        memory: 512M
      reservations:
        memory: 256M
```

**Apply changes:**
```bash
docker compose -f docker-compose.production.yml up -d yt-session
```

## Performance & Maintenance

### Token Caching
- yt-session-generator cache tokens trong **12 giờ**
- Tự động refresh khi hết hạn
- Không cần manual intervention

### Resource Usage
- **RAM:** ~300-400MB (Chromium + Node.js)
- **CPU:** ~5-10% idle, spike khi generate token
- **Disk:** ~200MB image

### Auto-update
Watchtower sẽ tự động update yt-session-generator:
- Check every 15 phút
- Pull latest image
- Restart container
- Zero downtime (cobalt-api cache tokens trong RAM)

### Monitoring

**Health check endpoint:**
```bash
curl http://localhost:8080/health
```

**Session info:**
```bash
curl http://localhost:8080/session
```

**Check logs for errors:**
```bash
docker logs yt-session-generator --tail 100 --follow
```

## So sánh với các Options khác

| Feature | Option A (yt-session) | Option B (yt-dlp + PO) | Option C (cookies) |
|---------|----------------------|----------------------|-------------------|
| Setup time | 5 phút | 1-2 giờ | 10 phút |
| Maintenance | Zero (auto) | Manual update | Manual refresh |
| RAM usage | 300-400MB | 50MB | 0MB |
| Stability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Production ready | ✅ Yes | ⚠️ Complex | ❌ No (cookies expire) |

## Kết luận

✅ **Option A (yt-session-generator) được khuyến nghị vì:**
- Tự động generate tokens
- Không cần maintain
- Production-ready
- Được Cobalt officially support
- Zero maintenance overhead

🎯 **Next steps sau khi deploy:**
1. Monitor logs trong 24 giờ đầu
2. Test với nhiều videos khác nhau
3. Verify token auto-refresh works
4. Setup monitoring alerts nếu cần

---

**Tài liệu tham khảo:**
- [yt-session-generator GitHub](https://github.com/imputnet/yt-session-generator)
- [Cobalt API Environment Variables](https://github.com/imputnet/cobalt/blob/main/docs/api-env-variables.md)
