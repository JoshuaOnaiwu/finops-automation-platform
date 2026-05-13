FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend

RUN npm install

# Return to app root
WORKDIR /app

# Copy entire project
COPY . .

# Expose app port
EXPOSE 4000

# Start metrics server
CMD ["node", "backend/metricsServer.js"]