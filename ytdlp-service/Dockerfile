FROM python:3.11-slim

WORKDIR /app

# Install yt-dlp and dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir \
    yt-dlp \
    flask \
    flask-cors \
    gunicorn

# Copy application code
COPY app.py /app/
COPY cookies.txt /app/

EXPOSE 5003

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5003", "--workers", "2", "--timeout", "300", "app:app"]
