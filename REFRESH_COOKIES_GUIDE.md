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
    "VISITOR_PRIVACY_METADATA=CgJWThIEGgAgWg%3D%3D; _ga_VCGEPY40VB=GS2.1.s1753237789$o1$g1$t1753238005$j60$l0$h0; __Secure-ROLLOUT_TOKEN=CL_-kZ_boYWEyQEQnJGWtrORjgMYpM6FxfrfjgM%3D; LOGIN_INFO=AFmmF2swRAIgT79WMAiaZdSXe-erO87xNiDUk_XEbs6Caxr8Pz4VxNICIEQHLS81CVPrtCMdOCRP8LP0loyYOKWAa0IFaAkSokKp:QUQ3MjNmeklfMXFOWUh5ODFPM3dsdUgtSk9STUx1S2xucUVmRzVnTUFrTG8zQ0ZIUUszUGh0czgzSkZPQm1tOXBPcW1JMFJlTHZZbFZ5S09pSXFUSHZXT0p4bGUzNlhVVkxiX2VrZkVQLUZxZi1pclFxejQyTGtLekY0VXY4elV0c21fT3phVUNsbjE1SHNsSTV4a2c0VXlWV0F2a01nQXh3; SID=g.a0002giKKvlYBPXuJDy-edq3HdZxGK_lbQfjvkO5BsR-QjtrAzAe7nvLgah7ukvb7CiJ-CnlxQACgYKAUoSARQSFQHGX2MiJCzZVLaKj-v1lNnwm_QeWhoVAUF8yKrjTBuT7brqrechoVF9s8YE0076; __Secure-1PSID=g.a0002giKKvlYBPXuJDy-edq3HdZxGK_lbQfjvkO5BsR-QjtrAzAeruACeeaZ26RypKaW8i4Y7AACgYKASISARQSFQHGX2MirgNBPGSbnOpyeymydB1aBhoVAUF8yKrat5Avhp97dD_AnI8lfRsG0076; __Secure-3PSID=g.a0002giKKvlYBPXuJDy-edq3HdZxGK_lbQfjvkO5BsR-QjtrAzAe3HULW8PN2EWiGypisr6_9gACgYKAYkSARQSFQHGX2MiRl1iz8NoCv905RPx2IYN9hoVAUF8yKpoPskng-9sCuEi1YCx1UaX0076; HSID=AghYqzlmXgtwrRflZ; SSID=ALDOs76qpRd9Q4GP9; APISID=a7ob3se_SUjQf-bf/ANKZUld9BcHjyC7lk; SAPISID=JYBOmItT1ldm5fXO/AvY-Ysj4iKf8dWOCD; __Secure-1PAPISID=JYBOmItT1ldm5fXO/AvY-Ysj4iKf8dWOCD; __Secure-3PAPISID=JYBOmItT1ldm5fXO/AvY-Ysj4iKf8dWOCD; NID=526=anRWUMbcq9p3TnbQjkt3SEC6Q9QRyeV5II8ujZOXveY_Ahuxp3eDcHdPZ6nmMQbNukxSr7Ojo_5nhSEDoWU9ZWvgmtUkwA8CL_-Hsa5dTQvxpHG74merQ9aWsektqly1uCQau2aNZCS9XsU1tNYVNgDR1sNz4OiBQS2Wz5wI1voPprVdBvkJc6Xe-FNkCalh31eR9Iz7GK-sr-8gQYYYFvk9pXviKaeuaO3Qr1CwzXvhaozk1BqOFDt05nk1bc92j9j7bLk; __Secure-1PSIDTS=sidts-CjQBwQ9iI9_MwmDoZD0wfwtG5YgNiDBbedAiPZqTcQgWqPSQKFTB5n0aVEpNktt5JiclT6SKEAA; __Secure-3PSIDTS=sidts-CjQBwQ9iI9_MwmDoZD0wfwtG5YgNiDBbedAiPZqTcQgWqPSQKFTB5n0aVEpNktt5JiclT6SKEAA; PREF=tz=Asia.Saigon&f7=150; ST-l3hjtt=session_logininfo=AFmmF2swRAIgT79WMAiaZdSXe-erO87xNiDUk_XEbs6Caxr8Pz4VxNICIEQHLS81CVPrtCMdOCRP8LP0loyYOKWAa0IFaAkSokKp%3AQUQ3MjNmeklfMXFOWUh5ODFPM3dsdUgtSk9STUx1S2xucUVmRzVnTUFrTG8zQ0ZIUUszUGh0czgzSkZPQm1tOXBPcW1JMFJlTHZZbFZ5S09pSXFUSHZXT0p4bGUzNlhVVkxiX2VrZkVQLUZxZi1pclFxejQyTGtLekY0VXY4elV0c21fT3phVUNsbjE1SHNsSTV4a2c0VXlWV0F2a01nQXh3; SIDCC=AKEyXzVwX9dlQQzF5mSWytNoL91qlO7c89JUKfJiQ8WOmJ3GrwyeS0fdMpaKBxCz_NPyD53Hxw; __Secure-1PSIDCC=AKEyXzXKycVJ47Bx_xmF1ZYuZqxad3H_fAg38DiuIWbUUYkDMqMZWZKwLOCPY8PfVGYQ5k-4KiA; __Secure-3PSIDCC=AKEyXzUneshmX2NbdwR8mRImVF3coqM02b8mUt1ZEv_b98yk0q4waXsBBhbgTl-HpJ-5n8y_vQ; ST-xuwub9=session_logininfo=AFmmF2swRAIgT79WMAiaZdSXe-erO87xNiDUk_XEbs6Caxr8Pz4VxNICIEQHLS81CVPrtCMdOCRP8LP0loyYOKWAa0IFaAkSokKp%3AQUQ3MjNmeklfMXFOWUh5ODFPM3dsdUgtSk9STUx1S2xucUVmRzVnTUFrTG8zQ0ZIUUszUGh0czgzSkZPQm1tOXBPcW1JMFJlTHZZbFZ5S09pSXFUSHZXT0p4bGUzNlhVVkxiX2VrZkVQLUZxZi1pclFxejQyTGtLekY0VXY4elV0c21fT3phVUNsbjE1SHNsSTV4a2c0VXlWV0F2a01nQXh3"
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
