#!/bin/bash

###############################################
# Fix SSL Config - Remove duplicate CORS headers
# Run this after certbot creates SSL config
###############################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Fixing SSL Config - Remove CORS headers${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Copying SSL configs...${NC}"

# Backup existing SSL configs
if [ -f "/etc/apache2/sites-available/taivideo.websites.com.vn-le-ssl.conf" ]; then
    cp /etc/apache2/sites-available/taivideo.websites.com.vn-le-ssl.conf \
       /etc/apache2/sites-available/taivideo.websites.com.vn-le-ssl.conf.backup
    echo -e "${GREEN}✓ Backed up taivideo SSL config${NC}"
fi

if [ -f "/etc/apache2/sites-available/download.websites.com.vn-le-ssl.conf" ]; then
    cp /etc/apache2/sites-available/download.websites.com.vn-le-ssl.conf \
       /etc/apache2/sites-available/download.websites.com.vn-le-ssl.conf.backup
    echo -e "${GREEN}✓ Backed up download SSL config${NC}"
fi

# Copy new SSL configs (if they exist in repo)
if [ -f "apache-configs/taivideo.websites.com.vn-le-ssl.conf" ]; then
    cp apache-configs/taivideo.websites.com.vn-le-ssl.conf \
       /etc/apache2/sites-available/
    echo -e "${GREEN}✓ Updated taivideo SSL config${NC}"
fi

if [ -f "apache-configs/download.websites.com.vn-le-ssl.conf" ]; then
    cp apache-configs/download.websites.com.vn-le-ssl.conf \
       /etc/apache2/sites-available/
    echo -e "${GREEN}✓ Updated download SSL config${NC}"
fi

echo -e "\n${YELLOW}Testing Apache configuration...${NC}"
if apache2ctl configtest; then
    echo -e "${GREEN}✓ Apache configuration is valid${NC}"
else
    echo -e "${RED}✗ Apache configuration has errors!${NC}"
    echo -e "${YELLOW}Restoring backups...${NC}"

    if [ -f "/etc/apache2/sites-available/taivideo.websites.com.vn-le-ssl.conf.backup" ]; then
        cp /etc/apache2/sites-available/taivideo.websites.com.vn-le-ssl.conf.backup \
           /etc/apache2/sites-available/taivideo.websites.com.vn-le-ssl.conf
    fi

    if [ -f "/etc/apache2/sites-available/download.websites.com.vn-le-ssl.conf.backup" ]; then
        cp /etc/apache2/sites-available/download.websites.com.vn-le-ssl.conf.backup \
           /etc/apache2/sites-available/download.websites.com.vn-le-ssl.conf
    fi

    exit 1
fi

echo -e "\n${YELLOW}Reloading Apache...${NC}"
systemctl reload apache2

if systemctl is-active --quiet apache2; then
    echo -e "${GREEN}✓ Apache reloaded successfully${NC}"
else
    echo -e "${RED}✗ Apache failed to reload!${NC}"
    exit 1
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}SSL Config fixed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Testing HTTPS endpoints:${NC}"
echo -e "API:  curl -I https://taivideo.websites.com.vn"
echo -e "Web:  curl -I https://download.websites.com.vn"
