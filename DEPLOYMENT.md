# Hướng dẫn Deploy Cobalt API Downloader lên Production Server

## Tổng quan

Hệ thống bao gồm 2 services:
- **API Backend (Cobalt)**: `taivideo.websites.com.vn` → Port 5001
- **Web Interface**: `download.websites.com.vn` → Port 5002

Apache sẽ làm reverse proxy cho cả 2 services.

## Yêu cầu hệ thống

### Server
- **OS**: Ubuntu 20.04+ hoặc Debian 11+
- **RAM**: Tối thiểu 2GB (khuyến nghị 4GB+)
- **CPU**: 2 cores+
- **Disk**: 20GB+ dung lượng trống
- **Network**: IP public với domain đã trỏ về server

### Phần mềm cần cài đặt
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Apache
sudo apt install apache2 -y

# Install Certbot (cho SSL)
sudo apt install certbot python3-certbot-apache -y
```

## Cấu trúc thư mục Project

```
api-downloader/
├── docker-compose.production.yml   # Docker Compose config cho production
├── .env.production                 # Environment variables
├── deploy.sh                       # Deployment script
├── apache-configs/                 # Apache VirtualHost configs
│   ├── taivideo.websites.com.vn.conf
│   └── download.websites.com.vn.conf
├── cobalt/                         # API Backend (chỉ config)
│   └── docker-compose.yml          # (không dùng trong production)
└── web-interface/                  # Web Frontend
    ├── Dockerfile
    ├── nginx.conf.production
    └── ...
```

## Bước 1: Chuẩn bị DNS

Trỏ 2 subdomain về IP server của bạn:

```
A Record: taivideo.websites.com.vn  → YOUR_SERVER_IP
A Record: download.websites.com.vn  → YOUR_SERVER_IP
```

Kiểm tra DNS đã propagate:
```bash
nslookup taivideo.websites.com.vn
nslookup download.websites.com.vn
```

## Bước 2: Cấu hình Environment Variables

Chỉnh sửa file `.env.production`:

```bash
nano .env.production
```

**Cấu hình tối thiểu:**
```env
API_URL=https://taivideo.websites.com.vn
WEB_DOMAIN=download.websites.com.vn
SERVER_IP=YOUR_SERVER_IP
```

**Cấu hình nâng cao** (tùy chọn):
```env
# Rate Limiting
RATELIMIT_WINDOW=60
RATELIMIT_MAX=20

# Turnstile (Cloudflare CAPTCHA)
TURNSTILE_SITEKEY=your_turnstile_sitekey
TURNSTILE_SECRET=your_turnstile_secret

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_16_chars
JWT_EXPIRY=120
```

## Bước 3: Chạy Deployment Script

### Cách 1: Tự động (Khuyến nghị)

```bash
# Cho phép chạy script
chmod +x deploy.sh

# Chạy deployment
sudo ./deploy.sh
```

Script sẽ tự động:
1. Kiểm tra prerequisites
2. Enable Apache modules cần thiết
3. Copy và enable VirtualHost configs
4. Build và start Docker containers
5. Reload Apache
6. Kiểm tra health của các services

### Cách 2: Thủ công (Manual)

Nếu muốn deploy từng bước:

#### 3.1. Enable Apache modules
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
```

#### 3.2. Copy Apache configs
```bash
sudo cp apache-configs/taivideo.websites.com.vn.conf /etc/apache2/sites-available/
sudo cp apache-configs/download.websites.com.vn.conf /etc/apache2/sites-available/
```

#### 3.3. Enable sites
```bash
sudo a2ensite taivideo.websites.com.vn.conf
sudo a2ensite download.websites.com.vn.conf
```

#### 3.4. Test Apache config
```bash
sudo apache2ctl configtest
```

#### 3.5. Start Docker containers
```bash
# Pull images
docker compose -f docker-compose.production.yml pull

# Build web interface
docker compose -f docker-compose.production.yml build cobalt-web

# Start containers
docker compose -f docker-compose.production.yml up -d
```

#### 3.6. Reload Apache
```bash
sudo systemctl reload apache2
```

## Bước 4: Kiểm tra Deployment

### Kiểm tra Docker containers
```bash
# Xem containers đang chạy
docker compose -f docker-compose.production.yml ps

# Xem logs
docker compose -f docker-compose.production.yml logs -f
```

### Kiểm tra endpoints nội bộ
```bash
# Test API (internal)
curl -I http://127.0.0.1:5001/

# Test Web (internal)
curl -I http://127.0.0.1:5002/
```

Kỳ vọng: HTTP 200 hoặc 301/302

### Kiểm tra Apache
```bash
# Kiểm tra Apache status
sudo systemctl status apache2

# Xem Apache logs
sudo tail -f /var/log/apache2/taivideo-error.log
sudo tail -f /var/log/apache2/download-error.log
```

### Test qua domain (HTTP - chưa SSL)
```bash
curl -I http://taivideo.websites.com.vn
curl -I http://download.websites.com.vn
```

Hoặc mở trình duyệt:
- http://taivideo.websites.com.vn (API)
- http://download.websites.com.vn (Web UI)

## Bước 5: Setup SSL với Let's Encrypt

```bash
# Cài SSL cho API domain
sudo certbot --apache -d taivideo.websites.com.vn

# Cài SSL cho Web domain
sudo certbot --apache -d download.websites.com.vn
```

Certbot sẽ:
1. Tự động verify domain ownership
2. Issue SSL certificate
3. Cập nhật Apache config (thêm VirtualHost 443)
4. Setup auto-renewal

### Test SSL
```bash
# Test HTTPS
curl -I https://taivideo.websites.com.vn
curl -I https://download.websites.com.vn
```

### Kiểm tra SSL certificate
```bash
sudo certbot certificates
```

### Test auto-renewal
```bash
sudo certbot renew --dry-run
```

## Quản lý Containers

### Xem logs
```bash
# Tất cả containers
docker compose -f docker-compose.production.yml logs -f

# Chỉ API
docker compose -f docker-compose.production.yml logs -f cobalt-api

# Chỉ Web
docker compose -f docker-compose.production.yml logs -f cobalt-web
```

### Stop/Start/Restart
```bash
# Stop tất cả
docker compose -f docker-compose.production.yml stop

# Start tất cả
docker compose -f docker-compose.production.yml start

# Restart tất cả
docker compose -f docker-compose.production.yml restart

# Restart chỉ API
docker compose -f docker-compose.production.yml restart cobalt-api

# Restart chỉ Web
docker compose -f docker-compose.production.yml restart cobalt-web
```

### Rebuild và restart
```bash
# Rebuild web (nếu có thay đổi code)
docker compose -f docker-compose.production.yml build cobalt-web

# Restart với image mới
docker compose -f docker-compose.production.yml up -d cobalt-web
```

### Update containers (pull latest images)
```bash
# Stop containers
docker compose -f docker-compose.production.yml down

# Pull latest images
docker compose -f docker-compose.production.yml pull

# Start lại
docker compose -f docker-compose.production.yml up -d
```

**Lưu ý:** Watchtower đã được cấu hình để tự động update containers mỗi 15 phút.

## Troubleshooting

### 1. Container không start
```bash
# Xem logs
docker compose -f docker-compose.production.yml logs cobalt-api
docker compose -f docker-compose.production.yml logs cobalt-web

# Restart container
docker compose -f docker-compose.production.yml restart
```

### 2. Apache không proxy được
```bash
# Kiểm tra Apache error logs
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/taivideo-error.log
sudo tail -f /var/log/apache2/download-error.log

# Test Apache config
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

### 3. Port bị chiếm
```bash
# Kiểm tra port 5001, 5002
sudo netstat -tulpn | grep 500

# Hoặc dùng lsof
sudo lsof -i :5001
sudo lsof -i :5002
```

### 4. Domain không trỏ đúng
```bash
# Kiểm tra DNS
nslookup taivideo.websites.com.vn
dig taivideo.websites.com.vn

# Kiểm tra từ server
curl -I http://localhost
curl -I http://127.0.0.1:5001
curl -I http://127.0.0.1:5002
```

### 5. SSL certificate lỗi
```bash
# Xem certificates
sudo certbot certificates

# Renew manually
sudo certbot renew

# Kiểm tra Apache SSL config
sudo apache2ctl -S
```

### 6. API không kết nối được từ Web
```bash
# Kiểm tra Docker network
docker network ls
docker network inspect cobalt-network

# Kiểm tra connectivity giữa containers
docker exec cobalt-web ping cobalt-api
docker exec cobalt-web curl http://cobalt-api:9000/
```

## Monitoring & Logs

### Container logs
```bash
# Realtime logs
docker compose -f docker-compose.production.yml logs -f --tail=100

# Logs của ngày hôm nay
docker compose -f docker-compose.production.yml logs --since "$(date +%Y-%m-%d)"
```

### Apache access logs
```bash
# API access log
sudo tail -f /var/log/apache2/taivideo-access.log

# Web access log
sudo tail -f /var/log/apache2/download-access.log
```

### System resources
```bash
# Xem resource usage của containers
docker stats

# Xem disk usage
docker system df
```

## Backup & Restore

### Backup
```bash
# Backup environment file
cp .env.production .env.production.backup

# Backup Apache configs
sudo cp -r /etc/apache2/sites-available/taivideo* ~/backups/
sudo cp -r /etc/apache2/sites-available/download* ~/backups/
```

### Restore
```bash
# Restore containers
docker compose -f docker-compose.production.yml up -d

# Restore Apache configs
sudo cp ~/backups/taivideo* /etc/apache2/sites-available/
sudo cp ~/backups/download* /etc/apache2/sites-available/
sudo a2ensite taivideo.websites.com.vn.conf
sudo a2ensite download.websites.com.vn.conf
sudo systemctl reload apache2
```

## Security Best Practices

1. **Firewall**: Chỉ mở ports cần thiết
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

2. **Cập nhật hệ thống thường xuyên**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Backup định kỳ**
   - Environment files
   - Apache configs
   - SSL certificates (nếu cần)

4. **Monitoring logs**
   - Setup log rotation
   - Monitor error logs hàng ngày

5. **Rate limiting**: Cấu hình trong `.env.production`
   ```env
   RATELIMIT_WINDOW=60
   RATELIMIT_MAX=20
   ```

## Support

Nếu gặp vấn đề, kiểm tra:
1. Container logs: `docker compose -f docker-compose.production.yml logs`
2. Apache logs: `/var/log/apache2/`
3. Docker network: `docker network inspect cobalt-network`
4. Firewall: `sudo ufw status`

## Liên hệ

- GitHub Issues: https://github.com/Quocker22/api-downloader/issues
- Documentation: Xem thêm tại thư mục `docs/`
