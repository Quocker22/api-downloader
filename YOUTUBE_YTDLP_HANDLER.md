# YouTube Custom Handler với yt-dlp

## 🎯 Tổng quan

Do Cobalt hiện tại không handle được YouTube (signature decipher issue), chúng ta tạo một **custom YouTube handler** độc lập sử dụng **yt-dlp** + cookies.

### Architecture

```
Client Request (YouTube URL)
         ↓
    Web Interface
         ↓
   Detect YouTube?
    ↙          ↘
  YES          NO
   ↓            ↓
yt-dlp      Cobalt API
Service     (Other services)
Port 5003    Port 5001
   ↓            ↓
Return download URLs
```

## 📦 Components

### 1. yt-dlp Service (Python + Flask)
- **Location:** `ytdlp-service/`
- **Port:** 5003
- **Framework:** Flask + Gunicorn
- **Features:**
  - Extract video info with yt-dlp
  - Use YouTube cookies for authentication
  - Return Cobalt-compatible response
  - Health check endpoint

### 2. Docker Service
- **Image:** Custom build (Python 3.11 + yt-dlp + ffmpeg)
- **Container:** `ytdlp-youtube-handler`
- **Network:** `cobalt-network` (internal)
- **Exposed:** `127.0.0.1:5003` (localhost only)

## 🚀 Setup & Deploy

### Bước 1: Prepare Cookies

```bash
cd /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader/ytdlp-service

# Convert cookies.json to cookies.txt (Netscape format)
chmod +x convert-cookies-to-txt.sh
./convert-cookies-to-txt.sh

# Verify cookies.txt created
cat cookies.txt | head -5
```

Expected output:
```
# Netscape HTTP Cookie File
# This is a generated file! Do not edit.

.youtube.com	TRUE	/	TRUE	0	VISITOR_PRIVACY_METADATA	CgJWThIEGgAgWg%3D%3D
.youtube.com	TRUE	/	TRUE	0	LOGIN_INFO	AFmmF2s...
```

### Bước 2: Commit và Push

```bash
cd /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader

# Add all files
git add ytdlp-service/
git add docker-compose.production.yml
git add YOUTUBE_YTDLP_HANDLER.md

# Commit
git commit -m "Add custom yt-dlp YouTube handler to bypass Cobalt

- Create ytdlp-service with Flask API
- Use yt-dlp with cookies for YouTube downloads
- Expose on port 5003 (internal)
- Return Cobalt-compatible response format
- Add to docker-compose.production.yml"

# Push
git push origin main
```

### Bước 3: Deploy trên Server

```bash
# SSH to server
ssh root@103.75.187.172 -p 24700

cd /root/api-downloader

# Pull latest code
git pull origin main

# Convert cookies (first time only)
cd ytdlp-service
chmod +x convert-cookies-to-txt.sh
./convert-cookies-to-txt.sh
cd ..

# Build and deploy
docker-compose -f docker-compose.production.yml up -d --build ytdlp-service

# Check logs
docker logs ytdlp-youtube-handler --tail 50
```

### Bước 4: Test YouTube Handler

```bash
# Health check
curl http://localhost:5003/health

# Expected:
# {"status":"ok","service":"yt-dlp-handler","cookies":true}

# Test YouTube download
curl -X POST http://localhost:5003/api/youtube \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "quality": "720"
  }'

# Expected: JSON with status: "tunnel", url, audio, metadata
```

## 🔧 Update Web Interface

Bây giờ cần update web interface để:
- Detect YouTube URLs
- Route to `http://ytdlp-service:5003/api/youtube` thay vì Cobalt

### Option 1: Nginx Reverse Proxy (Simple)

Update `web-interface/nginx.conf.production`:

```nginx
# Route YouTube requests to yt-dlp service
location /api/youtube {
    proxy_pass http://ytdlp-service:5003/api/youtube;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}

# Other API requests to Cobalt
location /api/ {
    proxy_pass http://cobalt-api:9000/;
    # ... existing config
}
```

### Option 2: Update JavaScript (Advanced)

Update `web-interface/js/download.js`:

```javascript
async function processDownload(url) {
    // Detect YouTube
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

    // Choose API endpoint
    const apiEndpoint = isYouTube
        ? '/api/youtube'  // yt-dlp service
        : '/api/';        // cobalt API

    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, quality: selectedQuality })
    });

    // ... rest of code
}
```

## 📊 API Endpoints

### GET /health

**Health check**

Response:
```json
{
  "status": "ok",
  "service": "yt-dlp-handler",
  "cookies": true
}
```

### POST /api/youtube

**Download YouTube video**

Request:
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "quality": "720"
}
```

Response (success):
```json
{
  "status": "tunnel",
  "url": "https://video-url...",
  "audio": "https://audio-url...",
  "filename": "Video Title.mp4",
  "metadata": {
    "title": "Video Title",
    "duration": 180,
    "thumbnail": "https://..."
  }
}
```

Response (error):
```json
{
  "status": "error",
  "error": "Error message"
}
```

### POST /api/info

**Get video info only (no download)**

Request:
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "quality": "720"
}
```

Response:
```json
{
  "status": "success",
  "title": "Video Title",
  "duration": 180,
  "thumbnail": "https://...",
  "video_url": "https://...",
  "audio_url": "https://...",
  "formats": [...]
}
```

## 🔄 Refresh Cookies

Khi YouTube cookies expired (sau ~30 ngày):

```bash
# 1. Export cookies mới từ browser
# (Follow REFRESH_COOKIES_GUIDE.md)

# 2. Update cookies.json trên server
scp -P 24700 cookies.json root@103.75.187.172:/root/api-downloader/

# 3. Convert to cookies.txt
cd /root/api-downloader/ytdlp-service
./convert-cookies-to-txt.sh

# 4. Restart ytdlp-service
docker-compose -f docker-compose.production.yml restart ytdlp-service

# 5. Test
curl http://localhost:5003/health
```

## 🐛 Troubleshooting

### Issue 1: Service not starting

**Check logs:**
```bash
docker logs ytdlp-youtube-handler --tail 100
```

**Common causes:**
- Missing cookies.txt file
- Python dependencies failed
- Port 5003 already in use

**Fix:**
```bash
# Rebuild image
docker-compose -f docker-compose.production.yml build ytdlp-service --no-cache

# Restart
docker-compose -f docker-compose.production.yml up -d ytdlp-service
```

### Issue 2: Still getting 403 errors

**Check cookies loaded:**
```bash
curl http://localhost:5003/health

# Should show: "cookies": true
```

**If cookies: false:**
```bash
# Check cookies.txt exists
docker exec ytdlp-youtube-handler ls -la /app/cookies.txt

# If missing, recreate
cd /root/api-downloader/ytdlp-service
./convert-cookies-to-txt.sh
docker-compose -f docker-compose.production.yml restart ytdlp-service
```

### Issue 3: Slow downloads

**Increase workers:**

Edit `ytdlp-service/Dockerfile`:
```dockerfile
CMD ["gunicorn", "--bind", "0.0.0.0:5003", "--workers", "4", "--timeout", "300", "app:app"]
```

Then rebuild.

## 📈 Monitoring

### Health Check

```bash
# From server
curl http://localhost:5003/health

# From outside (via Apache proxy - if configured)
curl https://download.websites.com.vn/api/youtube/health
```

### Logs

```bash
# Real-time logs
docker logs ytdlp-youtube-handler --follow

# Last 100 lines
docker logs ytdlp-youtube-handler --tail 100

# Filter errors only
docker logs ytdlp-youtube-handler 2>&1 | grep -i error
```

### Performance

```bash
# Check container stats
docker stats ytdlp-youtube-handler

# Check port listening
netstat -tulpn | grep 5003
```

## 🔐 Security

### Port Exposure
- ✅ Port 5003 only exposed to localhost (127.0.0.1)
- ✅ Not accessible from internet directly
- ✅ Only accessible via Nginx reverse proxy

### Cookies Security
- ✅ Cookies mounted as read-only (`:ro`)
- ✅ Not included in Git (in .gitignore)
- ✅ Only accessible inside container

### Rate Limiting
Consider adding rate limiting if needed:
```python
from flask_limiter import Limiter

limiter = Limiter(app, default_limits=["100 per hour"])

@app.route('/api/youtube')
@limiter.limit("10 per minute")
def download_youtube():
    # ...
```

## ✅ Advantages

**vs Cobalt YouTube:**
- ✅ Works với YouTube hiện tại (bypass signature issue)
- ✅ Dùng yt-dlp (luôn được update)
- ✅ Full control over implementation
- ✅ Easy to debug và fix

**vs yt-session-generator:**
- ✅ Không cần Chromium (nhẹ hơn)
- ✅ Không bị VPS IP block
- ✅ Cookies work 100%

## ⚠️ Disadvantages

- ❌ Cần maintain thêm 1 service
- ❌ Cookies phải refresh mỗi 30 ngày
- ❌ Phụ thuộc vào yt-dlp updates

## 🎯 Summary

**Setup:**
1. ✅ Create ytdlp-service (Python + Flask + yt-dlp)
2. ✅ Convert cookies.json → cookies.txt
3. ✅ Add to docker-compose
4. ⏳ Update web interface to route YouTube URLs
5. ⏳ Deploy và test

**Result:**
- YouTube downloads work độc lập
- Bypass Cobalt YouTube issues
- Use yt-dlp với cookies
- Cobalt vẫn handle 20+ services khác

---

**Next:** Deploy service và update web interface routing!
