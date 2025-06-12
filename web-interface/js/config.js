// Configuration and constants
export const CONFIG = {
    API_URL: 'https://upload.thtmmo.com/',
    BATCH_DELAY: 1000, // 1 second delay between batch requests
    SUPPORTED_PLATFORMS: [
        { name: 'YouTube', icon: 'fab fa-youtube' },
        { name: 'TikTok', icon: 'fab fa-tiktok' },
        { name: 'Instagram', icon: 'fab fa-instagram' },
        { name: 'Twitter', icon: 'fab fa-twitter' },
        { name: 'Facebook', icon: 'fab fa-facebook' },
        { name: 'Twitch', icon: 'fab fa-twitch' },
        { name: 'Vimeo', icon: 'fab fa-vimeo' },
        { name: 'SoundCloud', icon: 'fab fa-soundcloud' },
        { name: 'Reddit', icon: 'fab fa-reddit' },
        { name: 'Pinterest', icon: 'fab fa-pinterest' },
        { name: 'Tumblr', icon: 'fab fa-tumblr' },
        { name: 'Bilibili' },
        { name: 'Bluesky' },
        { name: 'Dailymotion' },
        { name: 'Loom' },
        { name: 'OK.ru' },
        { name: 'Rutube' },
        { name: 'Snapchat' },
        { name: 'Streamable' },
        { name: 'VK' },
        { name: 'Xiaohongshu' }
    ],
    
    // API Options based on Cobalt API documentation
    DEFAULT_OPTIONS: {
        // General options (matching exact schema parameters)
        audioBitrate: '128', // 320/256/128/96/64/8 (kbps)
        audioFormat: 'mp3', // best/mp3/ogg/wav/opus
        downloadMode: 'auto', // auto/audio/mute
        filenameStyle: 'basic', // classic/pretty/basic/nerdy
        videoQuality: 'max', // max/4320/2160/1440/1080/720/480/360/240/144
        disableMetadata: false,
        
        // Service-specific options (matching exact schema parameters)
        youtubeVideoCodec: 'h264', // h264/av1/vp9
        youtubeDubLang: '', // language code like 'en' or 'zh-CN'
        convertGif: true,
        allowH265: false,
        tiktokFullAudio: false,
        youtubeBetterAudio: false,
        youtubeHLS: false
    },
    
    // UI Labels for options
    OPTION_LABELS: {
        audioBitrate: {
            '320': '320 kbps (Chất lượng cao nhất)',
            '256': '256 kbps (Chất lượng cao)',
            '128': '128 kbps (Cân bằng)',
            '96': '96 kbps (Nhẹ)',
            '64': '64 kbps (Rất nhẹ)',
            '8': '8 kbps (Tối thiểu)'
        },
        audioFormat: {
            'best': 'Tốt nhất',
            'mp3': 'MP3',
            'ogg': 'OGG',
            'wav': 'WAV',
            'opus': 'OPUS'
        },
        downloadMode: {
            'auto': 'Tự động',
            'audio': 'Chỉ âm thanh',
            'mute': 'Video im lặng'
        },
        filenameStyle: {
            'classic': 'Cổ điển',
            'pretty': 'Đẹp',
            'basic': 'Cơ bản',
            'nerdy': 'Chi tiết'
        },
        videoQuality: {
            'max': 'Tối đa',
            '4320': '4K (4320p)',
            '2160': '4K (2160p)',
            '1440': '2K (1440p)',
            '1080': 'Full HD (1080p)',
            '720': 'HD (720p)',
            '480': 'SD (480p)',
            '360': '360p',
            '240': '240p',
            '144': '144p'
        },
        youtubeVideoCodec: {
            'h264': 'H.264 (Tương thích cao)',
            'av1': 'AV1 (Hiệu quả)',
            'vp9': 'VP9 (Cân bằng)'
        }
    }
};

export const ERROR_MESSAGES = {
    'error.api.youtube.login': 'Video yêu cầu đăng nhập YouTube',
    'error.api.invalid_body': 'URL không hợp lệ',
    'error.api.fetch.empty_response': 'Không thể lấy dữ liệu video',
    'error.api.content.too_long': 'Video quá dài',
    'default': 'Lỗi không xác định'
};
