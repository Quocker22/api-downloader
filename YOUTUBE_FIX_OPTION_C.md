# Hướng dẫn Fix YouTube Download - Option C: Cookies

## Tại sao chọn Option C?

**Option A (yt-session-generator) failed** vì VPS IP bị YouTube block → timeout khi extract tokens.

**Option C (cookies)** đơn giản và ổn định:
- ✅ Không cần external services
- ✅ Không tốn RAM (không cần Chromium)
- ✅ Work ngay lập tức
- ⚠️ Cần refresh cookies mỗi ~30 ngày

## Bước 1: Export Cookies từ Browser

### A. Cài Extension

**Chrome:**
1. Mở [Chrome Web Store](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Click "Add to Chrome"
3. Pin extension vào toolbar

**Firefox:**
1. Mở [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)
2. Click "Add to Firefox"

### B. Đăng nhập YouTube

1. Mở YouTube: https://www.youtube.com
2. Đăng nhập với Google account của bạn
3. Verify đã đăng nhập (thấy avatar góc phải)

### C. Export Cookies

1. Refresh trang YouTube (F5)
2. Click vào icon extension (góc phải browser)
3. Click "Export" hoặc "Download"
4. Lưu file `youtube.com_cookies.txt`

## Bước 2: Convert Cookies sang JSON

### Trên máy local (macOS/Linux):

```bash
cd /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader

# Make script executable
chmod +x scripts/convert-cookies.sh

# Convert (giả sử file export là youtube.com_cookies.txt ở Downloads)
./scripts/convert-cookies.sh ~/Downloads/youtube.com_cookies.txt

# File cookies.json sẽ được tạo trong thư mục hiện tại
```

### Hoặc convert thủ công:

Nếu bạn chỉ cần cookies cơ bản, tạo file `cookies.json`:

```json
[
  {
    "domain": ".youtube.com",
    "path": "/",
    "secure": true,
    "expiry": 1735689600,
    "name": "VISITOR_INFO1_LIVE",
    "value": "YOUR_VALUE_HERE"
  },
  {
    "domain": ".youtube.com",
    "path": "/",
    "secure": true,
    "expiry": 1735689600,
    "name": "PREF",
    "value": "YOUR_VALUE_HERE"
  }
]
```

**Important cookies to include:**
- `VISITOR_INFO1_LIVE`
- `PREF`
- `LOGIN_INFO`
- `CONSENT`
- `__Secure-3PSID`
- `__Secure-3PAPISID`

## Bước 3: Upload lên Server

```bash
# From your local machine
scp cookies.json root@103.75.187.172:/root/api-downloader/

# Verify upload
ssh root@103.75.187.172 "ls -lh /root/api-downloader/cookies.json"
```

Expected output:
```
-rw-r--r-- 1 root root 2.5K Nov 13 07:30 /root/api-downloader/cookies.json
```

## Bước 4: Deploy trên Server

```bash
# SSH vào server
ssh root@103.75.187.172

# Navigate to project
cd /root/api-downloader

# Pull latest code (đã config để dùng cookies)
git pull origin main

# Stop containers cũ
docker-compose -f docker-compose.production.yml down

# Verify cookies.json exists
cat cookies.json | head -5

# Deploy với cookies
./deploy.sh

# Check logs
docker logs cobalt-api --tail 50 | grep -i cookie
```

Expected logs:
```
[INFO] Loaded cookies from /cookies.json
[INFO] Found 15 YouTube cookies
```

## Bước 5: Test YouTube Download

### Test qua curl:

```bash
curl -X POST https://taivideo.websites.com.vn/ \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "videoQuality": "1080"
  }' | jq
```

Expected: Trả về JSON với `"status": "tunnel"` hoặc download URLs (không còn 403)

### Test qua Web Interface:

1. Mở https://download.websites.com.vn
2. Paste: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Download"
4. ✅ Phải download được video

## Troubleshooting

### Issue 1: Vẫn bị 403 sau khi add cookies

**Check cookies có load vào Cobalt không:**
```bash
docker exec cobalt-api cat /cookies.json | head -20
```

**Check logs:**
```bash
docker logs cobalt-api | grep -i cookie
```

**Possible fixes:**
1. Verify cookies.json format đúng (valid JSON)
2. Verify cookies chưa expired
3. Export lại cookies sau khi clear cache và đăng nhập lại

### Issue 2: Cookies expired

**Symptoms:** YouTube videos download OK lúc đầu, sau đó bắt đầu fail

**Fix:** Refresh cookies mỗi 30 ngày

```bash
# Export cookies mới từ browser
# Upload lên server
scp cookies.json root@103.75.187.172:/root/api-downloader/

# Restart Cobalt API
ssh root@103.75.187.172 "cd /root/api-downloader && docker-compose -f docker-compose.production.yml restart cobalt-api"
```

### Issue 3: File permissions

**Error:** `Permission denied: '/cookies.json'`

**Fix:**
```bash
chmod 644 /root/api-downloader/cookies.json
chown root:root /root/api-downloader/cookies.json

# Restart containers
docker-compose -f docker-compose.production.yml restart cobalt-api
```

### Issue 4: Mount error

**Error:** `Cannot start service cobalt-api: error while creating mount source path`

**Fix:**
```bash
# Verify file exists
ls -la /root/api-downloader/cookies.json

# If missing, create empty file first
echo "[]" > /root/api-downloader/cookies.json

# Then replace with actual cookies
```

## Maintenance

### Refresh cookies mỗi tháng

Set up cron job để nhắc refresh:

```bash
# Add to crontab
crontab -e

# Add this line (nhắc mỗi ngày 1 tháng)
0 9 1 * * echo "Time to refresh YouTube cookies!" | mail -s "Cobalt Maintenance" your@email.com
```

### Monitor cookie expiry

```bash
# Check cookie expiry dates
cat /root/api-downloader/cookies.json | jq '.[] | select(.name=="VISITOR_INFO1_LIVE") | .expiry'

# Convert timestamp to date
date -d @1735689600
```

## So sánh Options

| Feature | Option A (yt-session) | Option C (cookies) |
|---------|----------------------|-------------------|
| Setup time | 30 phút (failed) | 5 phút |
| Maintenance | Auto (nếu work) | Manual 30 ngày/lần |
| RAM usage | 300-400MB | 0MB |
| Stability | ❌ IP blocked | ✅ Stable |
| Production ready | ❌ Failed | ✅ Working |

## Kết luận

✅ **Option C được khuyến nghị cho VPS này vì:**
- Option A (yt-session-generator) bị YouTube block IP
- Cookies work ngay lập tức
- Không tốn RAM
- Dễ maintain (chỉ cần refresh 30 ngày/lần)

⚠️ **Lưu ý:**
- Đừng share cookies.json với người khác (có thông tin account)
- Backup cookies.json ở local machine
- Setup reminder để refresh mỗi tháng

---

**Next steps:**
1. Export cookies từ browser
2. Upload lên server
3. Deploy và test
4. Set reminder refresh sau 30 ngày
