FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

RUN mkdir -p /app/generated_videos /app/logs

COPY backend/vertexAIService.js ./
COPY docker/video-service.js ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S videoservice -u 1001 && \
    chown -R videoservice:nodejs /app

USER videoservice

EXPOSE 5002

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

CMD ["node", "video-service.js"]
