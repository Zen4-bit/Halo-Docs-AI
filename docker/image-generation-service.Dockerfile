FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

RUN mkdir -p /app/generated_images /app/logs

COPY backend/vertexAIService.js ./
COPY docker/image-service.js ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S imageservice -u 1001 && \
    chown -R imageservice:nodejs /app

USER imageservice

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

CMD ["node", "image-service.js"]
