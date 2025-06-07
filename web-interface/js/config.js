// Configuration and constants
export const CONFIG = {
    API_URL: 'http://localhost:9000/',
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
    ]
};

export const ERROR_MESSAGES = {
    'error.api.youtube.login': 'Video yêu cầu đăng nhập YouTube',
    'error.api.invalid_body': 'URL không hợp lệ',
    'error.api.fetch.empty_response': 'Không thể lấy dữ liệu video',
    'error.api.content.too_long': 'Video quá dài',
    'default': 'Lỗi không xác định'
};
