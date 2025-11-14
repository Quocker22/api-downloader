#!/usr/bin/env python3
"""
YouTube Download Handler using yt-dlp
Bypass Cobalt for YouTube downloads
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import os
import json

app = Flask(__name__)
CORS(app)

COOKIES_FILE = '/app/cookies.txt'

def get_video_info(url, quality='720'):
    """
    Extract video info using yt-dlp with cookies
    """
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'cookiefile': COOKIES_FILE if os.path.exists(COOKIES_FILE) else None,
        'format': f'bestvideo[height<={quality}]+bestaudio/best[height<={quality}]',
        'nocheckcertificate': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            # Get best video and audio URLs
            formats = info.get('formats', [])

            # Find video and audio streams
            video_url = None
            audio_url = None

            for f in formats:
                if f.get('vcodec') != 'none' and not video_url:
                    video_url = f.get('url')
                if f.get('acodec') != 'none' and not audio_url:
                    audio_url = f.get('url')

            return {
                'status': 'success',
                'title': info.get('title', 'Unknown'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail'),
                'video_url': video_url,
                'audio_url': audio_url,
                'formats': [{
                    'quality': f.get('height', 'audio'),
                    'ext': f.get('ext'),
                    'url': f.get('url')
                } for f in formats[:5]]  # Top 5 formats
            }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'yt-dlp-handler',
        'cookies': os.path.exists(COOKIES_FILE)
    })

@app.route('/api/youtube', methods=['POST'])
def download_youtube():
    """
    Handle YouTube download requests

    Request body:
    {
        "url": "https://www.youtube.com/watch?v=...",
        "quality": "720"  # optional, default 720
    }
    """
    data = request.get_json()

    if not data or 'url' not in data:
        return jsonify({
            'status': 'error',
            'error': 'Missing URL parameter'
        }), 400

    url = data['url']
    quality = data.get('quality', '720')

    # Validate YouTube URL
    if 'youtube.com' not in url and 'youtu.be' not in url:
        return jsonify({
            'status': 'error',
            'error': 'Invalid YouTube URL'
        }), 400

    # Get video info
    result = get_video_info(url, quality)

    if result['status'] == 'error':
        return jsonify({
            'status': 'error',
            'error': result['message']
        }), 500

    # Return in Cobalt-compatible format
    return jsonify({
        'status': 'tunnel',
        'url': result['video_url'],
        'audio': result['audio_url'],
        'filename': f"{result['title']}.mp4",
        'metadata': {
            'title': result['title'],
            'duration': result['duration'],
            'thumbnail': result['thumbnail']
        }
    })

@app.route('/api/info', methods=['POST'])
def video_info():
    """Get video info without downloading"""
    data = request.get_json()

    if not data or 'url' not in data:
        return jsonify({'status': 'error', 'error': 'Missing URL'}), 400

    result = get_video_info(data['url'], data.get('quality', '720'))
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003, debug=False)
