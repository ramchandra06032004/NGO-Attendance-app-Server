FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching optimization)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 8080

CMD ["node", "src/index.js"]
