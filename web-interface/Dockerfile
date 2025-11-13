# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Replace config.js with production config for build
RUN if [ -f js/config.production.js ]; then \
        cp js/config.production.js js/config.js; \
    fi

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
# For production, use nginx.conf.production
COPY nginx.conf.production /etc/nginx/conf.d/default.conf

# Create a simple index.html if it doesn't exist (fallback)
RUN test -f /usr/share/nginx/html/index.html || echo '<h1>App not built properly</h1>' > /usr/share/nginx/html/index.html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
