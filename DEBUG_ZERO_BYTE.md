# Debug Zero Byte YouTube Downloads

## Vấn đề:
YouTube videos download về nhưng toàn zero byte.

## Nguyên nhân có thể:
1. ✅ ytdlp-service trả về URLs từ Google servers (external)
2. ❌ Browser không download được direct từ Google Video servers (CORS)
3. ❌ Download manager cố gắng fetch qua JavaScript nhưng fail

## Debug Commands (Chạy trên server):

```bash
# 1. Check ytdlp-service logs
docker logs ytdlp-youtube-handler --tail 50

# 2. Test API endpoint
curl -X POST http://localhost:5003/api/youtube \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","quality":"720"}' | jq '.'

# 3. Check if URLs are valid (try downloading one)
curl -I "https://rr3---sn-8qj-i5o66.googlevideo.com/videoplayback?..."
# Should return: HTTP/2 200
```

## Root Cause:

YouTube video URLs từ Google servers có:
- **CORS restrictions** - Browser không thể fetch via JavaScript
- **Expire quickly** - URLs có thời hạn (parameter `expire=`)
- **Require direct download** - Phải dùng `<a download>` tag, không qua fetch()

## Solution:

Cần update `download.js` để:
1. **Detect external URLs** (googlevideo.com)
2. **Skip progress tracking** cho external URLs
3. **Use direct download** với `<a>` tag thay vì fetch()

Current flow (❌ BROKEN):
```
YouTube URL → ytdlp returns googlevideo.com URL
            → download.js tries to fetch()
            → CORS error / zero byte
```

Fixed flow (✅ WORKING):
```
YouTube URL → ytdlp returns googlevideo.com URL
            → download.js detects external URL
            → Direct download with <a download> tag
            → Browser handles download natively
```
