# Google Analytics 4 (GA4) Setup Guide

## 🎯 Tổng quan

Google Analytics tracking code đã được tích hợp sẵn vào `web-interface/index.html` với placeholder ID: `G-XXXXXXXXXX`.

**Bạn cần:**
1. Tạo GA4 property
2. Lấy Measurement ID
3. Thay thế placeholder trong code
4. Deploy lên production

## 📋 Bước 1: Tạo Google Analytics Account

### A. Truy cập Google Analytics

1. Mở: https://analytics.google.com
2. Đăng nhập bằng Google Account
3. Click **"Start measuring"** hoặc **"Admin"** (nếu đã có account)

### B. Tạo Account mới

1. Click **"Create Account"**
2. **Account name:** `DOWNLOADBYTHT` (hoặc tên bạn muốn)
3. Chọn các options:
   - ✅ Data sharing settings (recommended để bật tất cả)
4. Click **"Next"**

## 📋 Bước 2: Tạo Property (GA4)

### A. Property Details

1. **Property name:** `download.websites.com.vn`
2. **Reporting time zone:** `(GMT+07:00) Asia/Ho Chi Minh`
3. **Currency:** `Vietnamese Dong (₫)`
4. Click **"Next"**

### B. Business Information

1. **Industry category:** `Other`
2. **Business size:** Chọn theo thực tế (VD: `Small - 1 to 10 employees`)
3. Click **"Next"**

### C. Business Objectives

Chọn mục tiêu:
- ✅ **Generate leads**
- ✅ **Examine user behavior**

Click **"Create"**

### D. Accept Terms

- ✅ Đọc và accept Terms of Service
- ✅ Đọc và accept Data Processing Amendment

Click **"I Accept"**

## 📋 Bước 3: Setup Data Stream

### A. Choose Platform

1. Click **"Web"**
2. Điền thông tin:
   - **Website URL:** `https://download.websites.com.vn`
   - **Stream name:** `DOWNLOADBYTHT Web`
3. ✅ Enable **"Enhanced measurement"** (recommended)
4. Click **"Create stream"**

### B. Lấy Measurement ID

Sau khi tạo xong, bạn sẽ thấy:

```
Measurement ID: G-XXXXXXXXXX
```

**Ví dụ:** `G-ABC1234DEF`

📝 **Copy ID này** - bạn sẽ dùng ở bước tiếp theo!

## 📋 Bước 4: Cập nhật Code

### Option A: Update trên Local Machine (Recommended)

```bash
cd /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader/web-interface

# Backup original file
cp index.html index.html.backup

# Replace placeholder with your actual Measurement ID
# macOS:
sed -i '' 's/G-XXXXXXXXXX/G-ABC1234DEF/g' index.html

# Linux:
# sed -i 's/G-XXXXXXXXXX/G-ABC1234DEF/g' index.html

# Verify changes
grep "G-ABC1234DEF" index.html
```

Hoặc edit thủ công:
1. Mở file `web-interface/index.html`
2. Tìm 2 chỗ có `G-XXXXXXXXXX` (line ~73 và ~78)
3. Thay bằng Measurement ID của bạn (VD: `G-ABC1234DEF`)
4. Save file

### Option B: Update trực tiếp trên Server

```bash
# SSH vào server
ssh root@103.75.187.172 -p 24700

cd /root/api-downloader/web-interface

# Backup
cp index.html index.html.backup

# Replace (thay G-ABC1234DEF bằng ID thật của bạn)
sed -i 's/G-XXXXXXXXXX/G-ABC1234DEF/g' index.html

# Verify
grep "G-ABC1234DEF" index.html
```

## 📋 Bước 5: Deploy to Production

### A. Commit changes (nếu update trên local)

```bash
cd /Users/dinhvietquoc/Documents/workspaces/incokit/api-downloader

# Stage changes
git add web-interface/index.html

# Commit
git commit -m "Update Google Analytics Measurement ID"

# Push
git push origin main
```

### B. Deploy trên server

```bash
# SSH vào server
ssh root@103.75.187.172 -p 24700

cd /root/api-downloader

# Pull latest code (nếu commit từ local)
git pull origin main

# Rebuild and deploy
./deploy.sh

# Wait for deployment
sleep 30

# Verify deployment
curl -I https://download.websites.com.vn
```

## 📋 Bước 6: Verify Tracking Works

### A. Real-time Reports

1. Mở Google Analytics: https://analytics.google.com
2. Chọn property **"download.websites.com.vn"**
3. Vào **Reports** → **Realtime**
4. Mở website của bạn: https://download.websites.com.vn
5. Trong vòng 30 giây, bạn sẽ thấy:
   - Active users: 1
   - Page view event

### B. Debug với Chrome Extension

**Install GA Debugger:**
1. Chrome Web Store: [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
2. Install extension
3. Mở https://download.websites.com.vn
4. Click icon extension để enable
5. Mở DevTools (F12) → Console tab
6. Refresh page
7. Sẽ thấy GA debug messages

### C. Network Tab Check

1. Mở https://download.websites.com.vn
2. F12 → Network tab
3. Filter: `gtag` hoặc `google-analytics`
4. Refresh page
5. Phải thấy requests đến:
   - `https://www.googletagmanager.com/gtag/js?id=G-...`
   - `https://www.google-analytics.com/g/collect?...`

## 📊 Events đang được Track

### 1. Page Views (Automatic)
- Mỗi lần user visit trang
- Tracked by GA4 automatically

### 2. Analyze Button Click (Custom Event)
- Event name: `analyze_button_click`
- Trigger: Khi user click nút "PHÂN TÍCH"
- Parameters:
  - `event_category`: engagement
  - `event_label`: Analyze URL

### 3. Enhanced Measurement (Automatic)
Nếu bạn enable Enhanced Measurement trong GA4, tự động track:
- ✅ **Scrolls** - User scroll xuống 90% page
- ✅ **Outbound clicks** - Click links ra ngoài site
- ✅ **Site search** - Nếu có search function
- ✅ **Video engagement** - Nếu có embedded videos
- ✅ **File downloads** - Khi download files

## 📈 Thêm Custom Events (Optional)

Để track thêm events, thêm code vào `web-interface/js/app.js`:

### Example 1: Track Download Success

```javascript
// After successful download
gtag('event', 'download_success', {
  'event_category': 'downloads',
  'event_label': serviceName, // youtube, tiktok, etc.
  'value': 1
});
```

### Example 2: Track Service Usage

```javascript
// When user downloads from specific service
gtag('event', 'service_used', {
  'event_category': 'services',
  'service_name': 'youtube', // or tiktok, facebook, etc.
  'quality': selectedQuality
});
```

### Example 3: Track Errors

```javascript
// When download fails
gtag('event', 'download_error', {
  'event_category': 'errors',
  'error_type': errorCode,
  'error_message': errorMessage
});
```

## 📊 Important Reports to Monitor

### 1. Realtime Report
**Path:** Reports → Realtime

**What to see:**
- Current active users
- Pages they're viewing
- Events happening right now

**Use case:** Verify tracking works immediately after deployment

### 2. Acquisition Report
**Path:** Reports → Acquisition → Traffic acquisition

**What to see:**
- Where users come from (Google, Facebook, Direct, etc.)
- Which channels bring most traffic
- Conversion by channel

**Use case:** Understand marketing effectiveness

### 3. Engagement Report
**Path:** Reports → Engagement → Events

**What to see:**
- Custom events (analyze_button_click, etc.)
- Event count
- Event parameters

**Use case:** See how users interact with your site

### 4. User Attributes
**Path:** Reports → User → Demographics

**What to see:**
- User location (countries, cities)
- Browser and device types
- Screen resolutions

**Use case:** Optimize UX for your audience

## 🎯 Goals & Conversions Setup

### Create Conversion Event

1. Go to **Admin** → **Events**
2. Find event: `analyze_button_click`
3. Toggle **"Mark as conversion"** → ON
4. This becomes a conversion goal

### View Conversion Reports

**Path:** Reports → Engagement → Conversions

**Metrics:**
- Total conversions
- Conversion rate
- Conversion value

## 🔒 Privacy & GDPR Compliance

### A. Update Privacy Policy

Thêm vào Privacy Policy của bạn:

```
Chúng tôi sử dụng Google Analytics để thu thập thông tin
về cách người dùng tương tác với website. Dữ liệu được
thu thập bao gồm:
- Trang được xem
- Thời gian truy cập
- Thiết bị sử dụng
- Vị trí địa lý (quốc gia/thành phố)

Dữ liệu này được sử dụng để cải thiện trải nghiệm người dùng.
Không có thông tin cá nhân được thu thập.
```

### B. Cookie Consent (Optional)

Nếu muốn tuân thủ GDPR nghiêm ngặt, thêm cookie consent banner.

**Simple implementation:**
```javascript
// Check if user accepted cookies
if (localStorage.getItem('cookieConsent') === 'true') {
    // Load GA tracking code
} else {
    // Show cookie banner
    showCookieConsentBanner();
}
```

## 🛠️ Troubleshooting

### Issue 1: No data in GA4

**Check:**
1. ✅ Measurement ID đúng? (grep trong index.html)
2. ✅ Website đã deploy code mới chưa?
3. ✅ Disable ad blockers khi test
4. ✅ Check Network tab có requests đến google-analytics.com không

**Fix:**
```bash
# Verify Measurement ID on server
ssh root@103.75.187.172 -p 24700
grep "gtag/js?id=" /root/api-downloader/web-interface/index.html
```

### Issue 2: Events not tracking

**Check:**
1. ✅ Event name đúng format? (lowercase, underscores)
2. ✅ gtag function có được gọi không? (console.log)
3. ✅ Element ID đúng không? (`download-btn`)

**Debug:**
```javascript
// Add console.log to verify
document.getElementById('download-btn').addEventListener('click', function() {
    console.log('Button clicked!');
    gtag('event', 'analyze_button_click', {...});
});
```

### Issue 3: Data showing wrong location

**Reason:** User using VPN or proxy

**Solution:** This is expected, GA4 tracks based on IP geolocation

## 📚 Resources

### Official Documentation
- **GA4 Setup:** https://support.google.com/analytics/answer/9304153
- **Events:** https://support.google.com/analytics/answer/9267735
- **Reports:** https://support.google.com/analytics/answer/9212670

### Video Tutorials
- **GA4 Basics:** https://www.youtube.com/watch?v=hfI26s1YtFI
- **Custom Events:** https://www.youtube.com/watch?v=8mGmPrRXHHQ

### Tools
- **GA Debugger Chrome Extension:** https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna
- **Google Tag Assistant:** https://tagassistant.google.com/

## ✅ Setup Checklist

### Initial Setup
- [ ] Create Google Analytics account
- [ ] Create GA4 property
- [ ] Get Measurement ID (G-XXXXXXXXXX)
- [ ] Update index.html with real Measurement ID
- [ ] Commit and push to Git
- [ ] Deploy to production server
- [ ] Verify tracking in Realtime report

### Post-Deployment
- [ ] Check data after 24 hours
- [ ] Setup conversion events
- [ ] Create custom reports
- [ ] Add to Dashboard
- [ ] Setup email alerts (optional)
- [ ] Document Measurement ID in safe place

### Weekly Monitoring
- [ ] Check Realtime report
- [ ] Review top pages
- [ ] Check conversion rate
- [ ] Monitor traffic sources

### Monthly Review
- [ ] Analyze user behavior trends
- [ ] Compare month-over-month growth
- [ ] Identify popular features
- [ ] Optimize based on data

---

**Created:** 2025-11-13
**Last Updated:** 2025-11-13
**Status:** ✅ GA4 Code Integrated | 🔄 Needs Measurement ID

**Quick Start:**
1. Get GA4 Measurement ID from https://analytics.google.com
2. Replace `G-XXXXXXXXXX` in `web-interface/index.html` (2 places)
3. Deploy: `./deploy.sh`
4. Verify in GA4 Realtime report
