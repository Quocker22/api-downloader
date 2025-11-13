#!/bin/bash

###############################################
# Cobalt API Downloader - Deployment Script
# Deploy to production server with Apache
###############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Cobalt API Downloader - Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Step 1: Check prerequisites
echo -e "\n${YELLOW}[1/8] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed!${NC}"
    exit 1
fi

if ! command -v apache2 &> /dev/null; then
    echo -e "${RED}Apache2 is not installed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Step 2: Enable Apache modules
echo -e "\n${YELLOW}[2/8] Enabling Apache modules...${NC}"

a2enmod proxy
a2enmod proxy_http
a2enmod proxy_wstunnel
a2enmod rewrite
a2enmod headers
a2enmod ssl

echo -e "${GREEN}✓ Apache modules enabled${NC}"

# Step 3: Copy Apache VirtualHost configs
echo -e "\n${YELLOW}[3/8] Installing Apache VirtualHost configs...${NC}"

if [ -f "apache-configs/taivideo.websites.com.vn.conf" ]; then
    cp apache-configs/taivideo.websites.com.vn.conf /etc/apache2/sites-available/
    echo -e "${GREEN}✓ API VirtualHost config copied${NC}"
else
    echo -e "${RED}✗ API VirtualHost config not found!${NC}"
    exit 1
fi

if [ -f "apache-configs/download.websites.com.vn.conf" ]; then
    cp apache-configs/download.websites.com.vn.conf /etc/apache2/sites-available/
    echo -e "${GREEN}✓ Web VirtualHost config copied${NC}"
else
    echo -e "${RED}✗ Web VirtualHost config not found!${NC}"
    exit 1
fi

# Step 4: Enable sites
echo -e "\n${YELLOW}[4/8] Enabling Apache sites...${NC}"

a2ensite taivideo.websites.com.vn.conf
a2ensite download.websites.com.vn.conf

echo -e "${GREEN}✓ Sites enabled${NC}"

# Step 5: Test Apache configuration
echo -e "\n${YELLOW}[5/8] Testing Apache configuration...${NC}"

if apache2ctl configtest; then
    echo -e "${GREEN}✓ Apache configuration is valid${NC}"
else
    echo -e "${RED}✗ Apache configuration has errors!${NC}"
    exit 1
fi

# Step 6: Build and start Docker containers
echo -e "\n${YELLOW}[6/8] Building and starting Docker containers...${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Warning: .env.production not found, using default values${NC}"
fi

# Stop existing containers if any
docker compose -f docker-compose.production.yml down 2>/dev/null || true

# Pull latest images
docker compose -f docker-compose.production.yml pull

# Build web interface
docker compose -f docker-compose.production.yml build cobalt-web

# Start containers
docker compose -f docker-compose.production.yml up -d

echo -e "${GREEN}✓ Docker containers started${NC}"

# Step 7: Wait for containers to be healthy
echo -e "\n${YELLOW}[7/8] Waiting for containers to be healthy...${NC}"

sleep 5

# Check container status
if docker ps | grep -q "cobalt-api"; then
    echo -e "${GREEN}✓ API container is running${NC}"
else
    echo -e "${RED}✗ API container failed to start!${NC}"
    docker compose -f docker-compose.production.yml logs cobalt-api
    exit 1
fi

if docker ps | grep -q "cobalt-web"; then
    echo -e "${GREEN}✓ Web container is running${NC}"
else
    echo -e "${RED}✗ Web container failed to start!${NC}"
    docker compose -f docker-compose.production.yml logs cobalt-web
    exit 1
fi

# Step 8: Reload Apache
echo -e "\n${YELLOW}[8/8] Reloading Apache...${NC}"

systemctl reload apache2

if systemctl is-active --quiet apache2; then
    echo -e "${GREEN}✓ Apache reloaded successfully${NC}"
else
    echo -e "${RED}✗ Apache failed to reload!${NC}"
    systemctl status apache2
    exit 1
fi

# Final checks
echo -e "\n${YELLOW}Running final checks...${NC}"

# Test API endpoint
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5001/ | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ API endpoint (127.0.0.1:5001) is responding${NC}"
else
    echo -e "${YELLOW}⚠ API endpoint may not be ready yet${NC}"
fi

# Test Web endpoint
if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5002/ | grep -q "200\|301\|302"; then
    echo -e "${GREEN}✓ Web endpoint (127.0.0.1:5002) is responding${NC}"
else
    echo -e "${YELLOW}⚠ Web endpoint may not be ready yet${NC}"
fi

# Success message
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Make sure DNS records point to this server:"
echo -e "   - taivideo.websites.com.vn → $(hostname -I | awk '{print $1}')"
echo -e "   - download.websites.com.vn → $(hostname -I | awk '{print $1}')"
echo -e "\n2. Setup SSL certificates with Let's Encrypt:"
echo -e "   ${GREEN}sudo certbot --apache -d taivideo.websites.com.vn${NC}"
echo -e "   ${GREEN}sudo certbot --apache -d download.websites.com.vn${NC}"
echo -e "\n3. Test your sites:"
echo -e "   - API: http://taivideo.websites.com.vn"
echo -e "   - Web: http://download.websites.com.vn"
echo -e "\n4. View logs:"
echo -e "   ${GREEN}docker compose -f docker-compose.production.yml logs -f${NC}"
echo -e "\n5. Manage containers:"
echo -e "   Stop:    ${GREEN}docker compose -f docker-compose.production.yml stop${NC}"
echo -e "   Start:   ${GREEN}docker compose -f docker-compose.production.yml start${NC}"
echo -e "   Restart: ${GREEN}docker compose -f docker-compose.production.yml restart${NC}"

echo -e "\n${GREEN}========================================${NC}"
