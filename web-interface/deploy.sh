#!/bin/bash

# Deployment script for Cobalt Web Interface
# This script builds the project and prepares it for deployment

echo "🚀 Starting deployment build..."

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

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
    ls -la dist/
    echo ""
    echo "🌐 You can now deploy the 'dist/' folder to:"
    echo "   • Static hosting (Netlify, Vercel, GitHub Pages)"
    echo "   • CDN"
    echo "   • Any web server"
    echo ""
    echo "🔍 To preview locally: npm run preview"
else
    echo "❌ Build failed!"
    exit 1
fi
