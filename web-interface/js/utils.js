// Utility functions
export function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return 'Không xác định';
    if (seconds < 60) return Math.round(seconds) + ' giây';
    if (seconds < 3600) return Math.round(seconds / 60) + ' phút';
    return Math.round(seconds / 3600) + ' giờ';
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function parseUrls(input) {
    // Split by both commas and newlines, then filter and validate
    return input
        .split(/[,\n\r]+/)
        .map(url => url.trim())
        .filter(url => url && validateUrl(url));
}

export function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function sanitizeFilename(filename) {
    return filename.replace(/[<>:"/\\|?*]/g, '_');
}
