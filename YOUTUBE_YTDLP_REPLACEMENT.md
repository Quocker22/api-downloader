# Báo cáo: Thay thế YouTube Handler bằng yt-dlp + ffmpeg

## 1. PHÂN TÍCH CẤU TRÚC HIỆN TẠI

### 1.1. Flow xử lý hiện tại
```
Client Request → API (api.js)
                   ↓
              match.js (route đến service)
                   ↓
              youtube.js (xử lý YouTube)
                   ↓ (dùng youtubei.js)
              Return response object
```

### 1.2. YouTube Service Handler (`api/src/processing/services/youtube.js`)

**Input (object `o`):**
- `id`: YouTube video ID
- `quality`: số (144-4320) hoặc "max"
- `format`: "h264" | "av1" | "vp9"
- `isAudioOnly`: boolean
- `youtubeHLS`: boolean
- `dubLang`: language code (optional)
- `dispatcher`: undici dispatcher

**Output Format:**

Trường hợp 1 - Audio only:
```javascript
{
    type: "audio",
    isAudioOnly: true,
    urls: "https://...",  // URL trực tiếp
    filenameAttributes: {
        service: "youtube",
        id: "video_id",
        title: "Video Title",
        author: "Channel Name",
        ...
    },
    fileMetadata: {
        title: "...",
        artist: "...",
        album: "...",  // optional
        copyright: "...",  // optional
        date: "..."  // optional
    },
    bestAudio: "m4a" | "opus" | "mp3",
    isHLS: boolean,
    originalRequest: { ... }
}
```

Trường hợp 2 - Video + Audio (cần merge):
```javascript
{
    type: "merge",
    urls: [
        "https://video_url",
        "https://audio_url"
    ],
    filenameAttributes: {
        service: "youtube",
        id: "...",
        title: "...",
        author: "...",
        resolution: "1920x1080",
        qualityLabel: "1080p",
        youtubeFormat: "h264",
        extension: "mp4"
    },
    fileMetadata: { ... },
    isHLS: boolean,
    originalRequest: { ... }
}
```

Trường hợp 3 - Lỗi:
```javascript
{
    error: "youtube.login" | "youtube.decipher" | "content.video.private" | ...
}
```

### 1.3. Vấn đề hiện tại

**Cobalt đang dùng `youtubei.js`** - một library interact với Internal YouTube API:
- ✅ Ưu điểm: Fast, không cần binary
- ❌ Nhược điểm:
  - YouTube liên tục thay đổi API → break thường xuyên
  - Cần handle decipher signatures
  - Thiếu hỗ trợ một số tính năng mới

## 2. GIẢI PHÁP: THAY THẾ BẰNG YT-DLP

### 2.1. Tại sao chọn yt-dlp?

**yt-dlp** là fork của youtube-dl với nhiều cải tiến:
- ✅ Luôn được cập nhật để work với YouTube
- ✅ Hỗ trợ đầy đủ tất cả formats, quality
- ✅ Extract metadata hoàn chỉnh
- ✅ Handle authentication, cookies
- ✅ Support playlists, live streams
- ✅ Có thể kết hợp với ffmpeg để merge/convert

### 2.2. Architecture mới

```
Client Request → API (api.js)
                   ↓
              match.js
                   ↓
              youtube-ytdlp.js (NEW!)
                   ↓
              yt-dlp wrapper (NEW!)
                   ↓
              yt-dlp binary + ffmpeg
                   ↓
              Parse JSON output
                   ↓
              Map to Cobalt format
                   ↓
              Return response object
```

### 2.3. Implementation Plan

#### File structure mới:
```
api/src/processing/
├── services/
│   ├── youtube.js (LEGACY - giữ lại để fallback)
│   ├── youtube-ytdlp.js (NEW - main handler)
│   └── ...
├── helpers/
│   ├── ytdlp-wrapper.js (NEW - wrapper cho yt-dlp)
│   ├── ytdlp-parser.js (NEW - parse output)
│   └── youtube-session.js (có thể dùng lại)
└── ...
```

#### Modules cần tạo:

**1. ytdlp-wrapper.js** - Execute yt-dlp command
```javascript
export async function getVideoInfo(videoId, options) {
    // Execute: yt-dlp -J --format=... URL
    // Return parsed JSON
}

export async function downloadVideo(videoId, options) {
    // Execute: yt-dlp + ffmpeg để merge
    // Return file path hoặc stream URL
}
```

**2. ytdlp-parser.js** - Parse yt-dlp output → Cobalt format
```javascript
export function parseToAudioResponse(ytdlpData) {
    // Map yt-dlp JSON → Cobalt audio response
}

export function parseToMergeResponse(ytdlpData) {
    // Map yt-dlp JSON → Cobalt merge response
}

export function parseError(error) {
    // Map yt-dlp errors → Cobalt error codes
}
```

**3. youtube-ytdlp.js** - Main service handler (thay thế youtube.js)
```javascript
import { getVideoInfo } from '../helpers/ytdlp-wrapper.js';
import { parseToAudioResponse, parseToMergeResponse, parseError } from '../helpers/ytdlp-parser.js';

export default async function(o) {
    try {
        const info = await getVideoInfo(o.id, {
            quality: o.quality,
            format: o.format,
            audioOnly: o.isAudioOnly,
            ...
        });

        if (o.isAudioOnly) {
            return parseToAudioResponse(info);
        }

        return parseToMergeResponse(info);

    } catch (error) {
        return { error: parseError(error) };
    }
}
```

## 3. PROOF OF CONCEPT (POC)

### 3.1. Test yt-dlp command trước

**Lấy video info (JSON):**
```bash
yt-dlp -J "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

**Output quan trọng:**
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Video Title",
  "uploader": "Channel Name",
  "duration": 123,
  "formats": [
    {
      "format_id": "137",
      "ext": "mp4",
      "height": 1080,
      "width": 1920,
      "vcodec": "avc1.640028",
      "acodec": "none",
      "url": "https://..."
    },
    {
      "format_id": "140",
      "ext": "m4a",
      "vcodec": "none",
      "acodec": "mp4a.40.2",
      "url": "https://..."
    }
  ],
  "requested_formats": [...],
  ...
}
```

**Lấy best format cho quality:**
```bash
# 1080p h264
yt-dlp -f "bestvideo[height<=1080][vcodec^=avc1]+bestaudio[acodec^=mp4a]" -J URL

# Audio only best
yt-dlp -f "bestaudio" -J URL

# 720p vp9
yt-dlp -f "bestvideo[height<=720][vcodec^=vp9]+bestaudio" -J URL
```

### 3.2. Test script độc lập

Tạo `test-ytdlp.js`:
```javascript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testYtDlp(videoId, quality = 1080) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const formatSelector = `bestvideo[height<=${quality}]+bestaudio`;
    const command = `yt-dlp -f "${formatSelector}" -J "${url}"`;

    try {
        const { stdout } = await execAsync(command);
        const data = JSON.parse(stdout);

        console.log('Title:', data.title);
        console.log('Duration:', data.duration);
        console.log('Formats:', data.requested_formats?.length || 'none');

        if (data.requested_formats) {
            console.log('Video:', {
                format_id: data.requested_formats[0].format_id,
                resolution: `${data.requested_formats[0].width}x${data.requested_formats[0].height}`,
                codec: data.requested_formats[0].vcodec,
                url: data.requested_formats[0].url.substring(0, 50) + '...'
            });

            console.log('Audio:', {
                format_id: data.requested_formats[1].format_id,
                codec: data.requested_formats[1].acodec,
                url: data.requested_formats[1].url.substring(0, 50) + '...'
            });
        }

        return data;

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    }
}

// Test
testYtDlp('dQw4w9WgXcQ', 1080);
```

## 4. IMPLEMENTATION STEPS

### Phase 1: Setup & POC (1-2 giờ)
- [x] Nghiên cứu Cobalt structure
- [ ] Cài yt-dlp trên server
- [ ] Test yt-dlp với các cases khác nhau
- [ ] Viết test script độc lập
- [ ] Verify output format

### Phase 2: Core Development (3-4 giờ)
- [ ] Tạo `ytdlp-wrapper.js` - execute yt-dlp command
- [ ] Tạo `ytdlp-parser.js` - parse output
- [ ] Tạo `youtube-ytdlp.js` - main handler
- [ ] Unit tests cho từng module

### Phase 3: Integration (2-3 giờ)
- [ ] Integrate vào `match.js`
- [ ] Add config để switch giữa old/new handler
- [ ] Test với production data
- [ ] Handle edge cases

### Phase 4: Deployment (1 giờ)
- [ ] Update Dockerfile để install yt-dlp + ffmpeg
- [ ] Update environment variables
- [ ] Deploy và monitor
- [ ] Rollback plan nếu có vấn đề

## 5. CÀI ĐẶT YT-DLP

### 5.1. Trên server Ubuntu/Debian:
```bash
# Method 1: Binary (khuyến nghị)
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Method 2: pip
sudo apt install python3-pip
pip3 install yt-dlp

# Verify
yt-dlp --version
```

### 5.2. Trong Docker (update Dockerfile):
```dockerfile
FROM node:23-alpine AS api
WORKDIR /app

# Install yt-dlp and ffmpeg
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    && pip3 install yt-dlp

COPY --from=build --chown=node:node /prod/api /app
COPY --from=build --chown=node:node /app/.git /app/.git

USER node

EXPOSE 9000
CMD [ "node", "src/cobalt" ]
```

## 6. ERROR MAPPING

Map yt-dlp errors → Cobalt error codes:

| yt-dlp Error | Cobalt Error Code |
|-------------|------------------|
| "Private video" | `content.video.private` |
| "Video unavailable" | `content.video.unavailable` |
| "This video requires payment" | `youtube.login` |
| "Sign in to confirm your age" | `content.video.age` |
| "Video is not available" | `content.video.region` |
| No format found | `youtube.no_matching_format` |
| Network error | `fetch.fail` |

## 7. PERFORMANCE & OPTIMIZATION

### Concerns:
- yt-dlp là binary → spawn process overhead
- Parse JSON lớn → memory usage

### Solutions:
- **Caching:** Cache video info trong Redis (5-10 phút)
- **Process Pool:** Reuse yt-dlp processes
- **Streaming:** Stream JSON output thay vì load toàn bộ
- **Timeout:** Set timeout cho yt-dlp (30s max)

## 8. FALLBACK STRATEGY

Giữ lại `youtube.js` (youtubei.js) để fallback:

```javascript
// In match.js
const USE_YTDLP = env.useYtDlp !== 'false'; // default true

// ...
case "youtube":
    if (USE_YTDLP) {
        return await youtube_ytdlp({ ...params, dispatcher });
    } else {
        return await youtube({ ...params, dispatcher });
    }
```

Config trong `.env`:
```bash
USE_YTDLP=true  # hoặc false để dùng legacy
```

## 9. TESTING CHECKLIST

- [ ] Video quality 1080p h264
- [ ] Video quality 720p vp9
- [ ] Video quality 4K
- [ ] Audio only
- [ ] Age-restricted video (với cookies)
- [ ] Private video (expect error)
- [ ] Live stream
- [ ] Unavailable video
- [ ] Long video (>1 hour)
- [ ] Short video (<30s)
- [ ] Video với dubbed audio
- [ ] HLS format

## 10. KẾT LUẬN

### Pros của yt-dlp:
✅ Luôn work với YouTube (community maintain active)
✅ Đơn giản hơn, ít phụ thuộc library
✅ Hỗ trợ nhiều tính năng hơn
✅ Dễ debug (có CLI để test)

### Cons:
❌ Phụ thuộc external binary
❌ Spawn process overhead
❌ Cần install yt-dlp + ffmpeg trên server

### Recommendation:
**Nên implement** vì lợi ích dài hạn > nhược điểm. YouTube API changes quá thường xuyên, dùng yt-dlp sẽ giảm maintenance burden.

---

**Next Steps:**
1. Approve architecture này
2. Tạo POC test script
3. Implement từng module
4. Integration testing
5. Deploy

Bạn muốn tôi bắt đầu implement Phase 1 (POC) không?
