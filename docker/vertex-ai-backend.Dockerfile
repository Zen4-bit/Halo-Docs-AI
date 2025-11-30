FROM node:18-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create necessary directories
RUN mkdir -p /app/generated_images /app/generated_videos /app/logs

# Copy backend files
COPY backend/server-vertex.js ./
COPY backend/vertexAIService.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S vertexai -u 1001 && \
    chown -R vertexai:nodejs /app

USER vertexai

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server-vertex.js"]
