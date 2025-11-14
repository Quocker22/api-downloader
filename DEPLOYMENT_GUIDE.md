# 🚀 Deployment Guide - Complete YouTube Fix

## 📋 Overview

This deployment updates the complete YouTube download system:
- ✅ ytdlp-service running on port 5003 (YouTube handler)
- ✅ Cobalt API running on port 5001 (other services)
- ✅ Web interface with smart routing (detects YouTube URLs)
- ✅ Nginx routing: `/api/youtube` → ytdlp-service, `/api/` → Cobalt

## 🔧 Deployment Steps

### 1. SSH to Server

```bash
ssh root@103.75.187.172 -p 24700
cd /root/api-downloader
```

### 2. Pull Latest Code

```bash
git pull origin main
```

**Expected output:**
```
remote: Counting objects: X, done.
From github.com:Quocker22/api-downloader
   29fa8c66..f3788a29  main -> main
Updating 29fa8c66..f3788a29
Fast-forward
 web-interface/js/api.js     | XX ++++++++++++++++++
 web-interface/js/config.js  | XX ++---
 web-interface/nginx.conf    | XX ++++++++++++++++++++++++++-
 3 files changed, 105 insertions(+), 31 deletions(-)
```

### 3. Rebuild and Restart Web Interface

```bash
# Stop current containers
docker-compose -f docker-compose.production.yml down cobalt-web

# Rebuild web interface with new Nginx config
docker-compose -f docker-compose.production.yml build cobalt-web --no-cache

# Start all services
docker-compose -f docker-compose.production.yml up -d
```

### 4. Verify Services are Running

```bash
docker ps | grep -E 'cobalt|ytdlp'
```

**Expected output:**
```
ytdlp-youtube-handler   Up X minutes (healthy)
cobalt-web              Up X minutes (healthy)
cobalt-api              Up X minutes (healthy)
```

### 5. Test Health Checks

```bash
# Test ytdlp-service
curl http://localhost:5003/health

# Expected: {"status":"ok","service":"yt-dlp-handler","cookies":true}

# Test Cobalt API
curl http://localhost:5001/

# Expected: {"cobalt":{"version":"11.5",...}}
```

### 6. Test YouTube Download (Internal)

```bash
# Test via Nginx routing (from within container network)
docker exec cobalt-web curl -X POST http://localhost:80/api/youtube \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","quality":"720"}'
```

**Expected response:**
```json
{
  "status": "tunnel",
  "url": "https://...",
  "audio": "https://...",
  "filename": "Rick Astley - Never Gonna Give You Up...",
  "metadata": {...}
}
```

### 7. Check Logs (if issues occur)

```bash
# Web interface logs (Nginx)
docker logs cobalt-web --tail 50

# ytdlp-service logs
docker logs ytdlp-youtube-handler --tail 50

# Cobalt API logs
docker logs cobalt-api --tail 50
```

## 🧪 Testing from Browser

### Test YouTube URL

1. Open: https://download.websites.com.vn/
2. Enter YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Phân tích"
4. **Check browser console (F12):**
   - Should see: `🎬 YouTube URL detected, routing to yt-dlp service`
   - Should see: `📤 Sending request to: /api/youtube`
   - Should see: `📥 Response data: {status: "tunnel", ...}`
5. Click "Tải xuống" button
6. Video should download successfully

### Test Non-YouTube URL (TikTok/Instagram)

1. Enter TikTok/Instagram URL
2. Click "Phân tích"
3. **Check browser console:**
   - Should see: `🌐 Non-YouTube URL, routing to Cobalt API`
   - Should see: `📤 Sending request to: /api/`
4. Download should work via Cobalt

## 🔍 Troubleshooting

### Issue 1: Nginx routing not working

**Symptom:** Requests to `/api/youtube` return 404 or 502

**Check:**
```bash
# Check Nginx config syntax
docker exec cobalt-web nginx -t

# Reload Nginx config
docker exec cobalt-web nginx -s reload
```

**If still failing:**
```bash
# Rebuild web container
docker-compose -f docker-compose.production.yml build cobalt-web --no-cache
docker-compose -f docker-compose.production.yml up -d cobalt-web
```

### Issue 2: ytdlp-service not reachable from Nginx

**Symptom:** Nginx returns 502 Bad Gateway for `/api/youtube`

**Check:**
```bash
# Verify ytdlp-service is running and healthy
docker ps | grep ytdlp
docker logs ytdlp-youtube-handler --tail 30

# Check network connectivity
docker exec cobalt-web curl http://ytdlp-service:5003/health
```

**Fix:**
```bash
# Restart ytdlp-service
docker-compose -f docker-compose.production.yml restart ytdlp-service
```

### Issue 3: Still getting YouTube errors

**Check cookies:**
```bash
# Verify cookies.txt exists and has content
docker exec ytdlp-youtube-handler cat /app/cookies.txt | head -5

# If empty or missing, regenerate
cd /root/api-downloader/ytdlp-service
./convert-cookies-to-txt.sh
docker-compose -f docker-compose.production.yml restart ytdlp-service
```

### Issue 4: Browser console shows old code

**Clear browser cache:**
- Chrome: F12 → Network tab → Disable cache
- Or hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

## 📊 Architecture Diagram

```
User Browser (https://download.websites.com.vn)
         ↓
    Apache Reverse Proxy (:443)
         ↓
    Docker: cobalt-web (:80 internal, :5002 exposed)
         ↓
    Nginx routing:
         ↓
    ┌────────────────┐
    │  YouTube URL?  │
    └────────────────┘
         ↓        ↓
      YES        NO
       ↓          ↓
 /api/youtube  /api/
       ↓          ↓
 ytdlp-service  cobalt-api
   Port 5003    Port 9000
       ↓          ↓
   yt-dlp +   Cobalt Core
   cookies    (20+ services)
       ↓          ↓
   Returns download URLs
```

## ✅ Success Criteria

After deployment, you should see:

1. ✅ All 3 containers running and healthy:
   - `cobalt-web`
   - `cobalt-api`
   - `ytdlp-youtube-handler`

2. ✅ YouTube downloads work through web interface:
   - Browser console shows routing to `/api/youtube`
   - Returns valid video URL
   - Download completes successfully

3. ✅ Other services (TikTok, Instagram, etc.) still work:
   - Routed to Cobalt API
   - Download as expected

4. ✅ No errors in container logs

## 🎯 Summary

**What we deployed:**
- Smart URL routing in web interface (api.js)
- YouTube detection logic
- Nginx proxy configuration for dual routing
- Relative API URLs for flexibility

**Result:**
- YouTube URLs → yt-dlp service (working)
- Other URLs → Cobalt API (working)
- Seamless user experience
- No more YouTube signature errors

---

**Deploy date:** 2025-11-14
**Services:** Cobalt API + yt-dlp YouTube handler + Web UI
**Status:** ✅ Ready for production
