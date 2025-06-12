#!/bin/bash

# Deployment script for Cobalt Web Interface
# This script builds the project and prepares it for deployment

set -e  # Exit on any error

DEPLOY_TYPE=${1:-"build"}  # Default to build, can be "docker" or "build"

echo "🚀 Starting deployment ($DEPLOY_TYPE)..."

case $DEPLOY_TYPE in
    "docker")
        echo "🐳 Building and running with Docker..."
        
        # Build Docker image
        echo "🔨 Building Docker image..."
        docker build -t cobalt-web-interface .
        
        # Stop existing container if running
        echo "🛑 Stopping existing container..."
        docker-compose down 2>/dev/null || true
        
        # Start new container
        echo "▶️ Starting new container..."
        docker-compose up -d
        
        echo "✅ Docker deployment successful!"
        echo "🌐 App is running at: http://localhost"
        echo "🔍 Check logs: docker-compose logs -f"
        ;;
        
    "build")
        # Clean previous build
        echo "🧹 Cleaning previous build..."
        npm run build:clean 2>/dev/null || rm -rf dist/
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing dependencies..."
            npm install
        fi
        
        # Build for production
        echo "🔨 Building for production..."
        npm run build
        
        # Check if build was successful
        if [ $? -eq 0 ]; then
            echo "✅ Build successful!"
            echo "📁 Files ready in 'dist/' directory:"
            ls -la dist/ 2>/dev/null || echo "No dist directory found"
            echo ""
            echo "🌐 Deploy options:"
            echo "   • Static hosting: Upload 'dist/' folder"
            echo "   • Nginx: Copy 'dist/' to /usr/share/nginx/html/"
            echo "   • Apache: Copy 'dist/' to /var/www/html/"
            echo "   • Docker: Run './deploy.sh docker'"
            echo ""
            echo "🔍 To preview locally: npm run preview"
            echo "📋 Nginx config available in: nginx.conf"
        else
            echo "❌ Build failed!"
            exit 1
        fi
        ;;
        
    *)
        echo "❌ Invalid deploy type: $DEPLOY_TYPE"
        echo "Usage: ./deploy.sh [build|docker]"
        echo "  build  - Build static files for deployment (default)"
        echo "  docker - Build and run with Docker"
        exit 1
        ;;
esac
