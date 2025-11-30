FROM node:20

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -sf python3 /usr/bin/python

WORKDIR /app

# Set environment variables
ENV NODE_ENV=development
ENV npm_config_legacy_peer_deps=true

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

# Install root dependencies
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Install web dependencies
WORKDIR /app/apps/web
RUN npm install --legacy-peer-deps --no-audit --no-fund

# Expose port
EXPOSE 3000

# Command to run
CMD ["npm", "run", "dev"]
