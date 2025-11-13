# Hướng dẫn Refresh YouTube Cookies (Mỗi 30 ngày)

## Tại sao cần refresh cookies?

YouTube cookies có thời hạn ~30 ngày. Sau khi hết hạn, downloads sẽ bắt đầu fail với lỗi 403 Forbidden.

**Dấu hiệu cookies cần refresh:**
- YouTube videos không tải được (403 error)
- Web interface báo lỗi khi download YouTube
- Các videos từ services khác vẫn work OK

## Quy trình Refresh (5-10 phút)

### Bước 1: Export cookies mới từ Browser

**A. Mở YouTube và đăng nhập**
1. Mở trình duyệt Chrome/Firefox
2. Truy cập: https://www.youtube.com
3. Đăng nhập với Google account của bạn
4. Verify đã đăng nhập (thấy avatar góc phải)

**B. Export cookies**

**Trên Chrome:**
1. Click vào icon extension "Get cookies.txt LOCALLY" (góc phải)
2. Click "Export"
3. Lưu file với tên: `youtube.com_cookies_YYYY-MM-DD.json`

**Trên Firefox:**
1. Click vào icon extension "cookies.txt"
2. Click "Export"
3. Lưu file với tên: `youtube.com_cookies_YYYY-MM-DD.json`

**C. Di chuyển file vào project**

```bash
# Copy file export vào project directory
cp ~/Downloads/youtube.com_cookies_*.json /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader/
```

### Bước 2: Convert cookies sang format Cobalt

```bash
# Navigate to project
cd /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader

# Set filename (thay YYYY-MM-DD bằng ngày thực tế)
COOKIE_FILE="youtube.com_cookies_2025-11-13.json"

# Convert to Cobalt format
cat "$COOKIE_FILE" | jq -r '.cookies | map("\(.name)=\(.value)") | join("; ")' | jq -Rs '{"youtube": [.]}' > cookies.json

# Verify format (phải thấy {"youtube": [...] })
head -c 300 cookies.json
```

Expected output:
```json
{
  "youtube": [
    "VISITOR_PRIVACY_METADATA=...; LOGIN_INFO=...; SID=..."
  ]
}
```

### Bước 3: Upload lên Server

**Option A: Dùng SCP (nếu có SSH key)**
```bash
scp -P 24700 cookies.json root@103.75.187.172:/root/api-downloader/
```

**Option B: Tạo file trực tiếp trên server (nếu không có SSH key)**

```bash
# 1. SSH vào server
ssh root@103.75.187.172 -p 24700

# 2. Navigate to project
cd /root/api-downloader

# 3. Backup cookies cũ
mv cookies.json cookies.json.backup

# 4. Copy cookie string từ máy local
# Chạy lệnh này trên LOCAL machine:
cat cookies.json | jq -r '.youtube[0]'

# 5. Paste vào server (thay YOUR_COOKIE_STRING bằng output từ bước 4)
cat > cookies.json << 'EOF'
{
  "youtube": [
    "YOUR_COOKIE_STRING_HERE"
  ]
}
EOF
```

### Bước 4: Restart Cobalt API

```bash
# Đảm bảo đang ở trong /root/api-downloader
cd /root/api-downloader

# Restart API để load cookies mới
docker-compose -f docker-compose.production.yml restart cobalt-api

# Wait 5 giây
sleep 5

# Verify cookies loaded (không có warnings)
docker logs cobalt-api --tail 20 | grep cookie
```

Expected output:
```
[✓] cookies loaded successfully!
```

**KHÔNG có** warnings như:
```
[!] ignoring unknown service in cookie file: 0
```

### Bước 5: Test YouTube Download

**Test qua curl:**
```bash
curl -X POST https://taivideo.websites.com.vn/ \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "videoQuality": "720"}'
```

Expected: Response có `"status": "tunnel"` hoặc download URL (không có error)

**Test qua Web Interface:**
1. Mở: https://download.websites.com.vn
2. Paste: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click "Download"
4. ✅ File phải tải về thành công với size > 0 bytes

## Troubleshooting

### Issue 1: Format cookies bị lỗi

**Symptoms:** Vẫn thấy warnings "ignoring unknown service"

**Fix:**
```bash
# Verify format trên server
cat /root/api-downloader/cookies.json | head -c 200

# Phải thấy: {"youtube": [
# KHÔNG phải: [{"domain": ".youtube.com"
```

Nếu sai format, chạy lại Bước 2 (Convert cookies)

### Issue 2: Cookies vẫn expired

**Symptoms:** Vẫn bị 403 sau khi refresh

**Possible causes:**
- Cookies export từ browser chưa đăng nhập
- Account YouTube bị lock
- Export nhầm từ Incognito mode

**Fix:**
1. Đăng xuất YouTube hoàn toàn
2. Clear browser cookies
3. Đăng nhập lại YouTube
4. Test xem YouTube có work trên browser không
5. Export cookies lại

### Issue 3: SCP không work (permission denied)

**Fix:** Dùng Option B ở Bước 3 - tạo file trực tiếp trên server

### Issue 4: Restart API failed

**Check logs:**
```bash
docker logs cobalt-api --tail 50
```

**Common issues:**
- File cookies.json không tồn tại → Verify path
- File cookies.json bị corrupt → Re-upload
- API container không running → `docker ps` để check

## Quick Reference - One-liner Commands

**On Local Machine:**
```bash
# Full process
cd /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader && \
cat youtube.com_cookies_*.json | jq -r '.cookies | map("\(.name)=\(.value)") | join("; ")' | jq -Rs '{"youtube": [.]}' > cookies.json && \
scp -P 24700 cookies.json root@103.75.187.172:/root/api-downloader/
```

**On Server:**
```bash
# Restart and verify
cd /root/api-downloader && \
docker-compose -f docker-compose.production.yml restart cobalt-api && \
sleep 5 && \
docker logs cobalt-api --tail 20 | grep cookie
```

## Setup Reminder

### Option 1: Calendar Reminder

Tạo reminder trên Google Calendar:
- Title: "Refresh YouTube Cookies cho api-downloader"
- Frequency: Every 30 days
- Include link to this guide

### Option 2: Cron Job Email Reminder (trên server)

```bash
# Add to crontab
crontab -e

# Add this line (gửi email reminder vào ngày 1 mỗi tháng lúc 9am)
0 9 1 * * echo "Time to refresh YouTube cookies! Guide: /root/api-downloader/REFRESH_COOKIES_GUIDE.md" | mail -s "Cobalt Maintenance Reminder" your@email.com
```

### Option 3: Slack/Discord Webhook

Tạo script reminder gửi vào Slack/Discord mỗi 30 ngày.

## Cookie Expiry Check

Để check khi nào cookies sẽ hết hạn:

```bash
# On server
cat /root/api-downloader/cookies.json | grep -o '"youtube":\[.*\]' | \
  grep -oP 'SIDCC=[^;]+' | head -1

# Manually check expiry date của SIDCC cookie từ browser DevTools
# F12 → Application → Cookies → youtube.com → Tìm SIDCC → Xem Expires
```

## Notes

- **Backup cookies cũ:** Server tự động backup thành `cookies.json.backup`
- **Security:** Không commit cookies.json vào Git (đã có trong .gitignore)
- **Multiple accounts:** Có thể dùng cookies từ account khác nếu cần
- **Cookie lifespan:** Thường 30 ngày, nhưng có thể ngắn hơn nếu IP thay đổi

## File Structure

```
api-downloader/
├── cookies.json                    # Active cookies (DO NOT commit to Git)
├── cookies.json.backup             # Auto backup by server
├── cookies.json.example            # Template
├── youtube.com_cookies_*.json      # Raw exports from browser
├── REFRESH_COOKIES_GUIDE.md        # This file
└── scripts/
    └── convert-cookies.sh          # Conversion script (optional)
```

## Summary Checklist

- [ ] Export cookies từ YouTube (đã đăng nhập)
- [ ] Convert sang format Cobalt: `{"youtube": ["cookie_string"]}`
- [ ] Upload lên server: `/root/api-downloader/cookies.json`
- [ ] Restart Cobalt API
- [ ] Verify logs: `[✓] cookies loaded successfully!` (no warnings)
- [ ] Test download một video YouTube
- [ ] Set reminder cho lần refresh tiếp theo (30 ngày)

---

**Last updated:** 2025-11-13
**Next refresh due:** 2025-12-13
**Estimated time:** 5-10 minutes
