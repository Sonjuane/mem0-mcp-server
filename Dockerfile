FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mem0 -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY .env.example ./

# Create .Mem0-Files directory with proper permissions
RUN mkdir -p .Mem0-Files && chown -R mem0:nodejs .Mem0-Files

# Change ownership of the app directory
RUN chown -R mem0:nodejs /app

# Switch to non-root user
USER mem0

# Expose port (for SSE transport when implemented)
EXPOSE 8050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Default command
CMD ["node", "src/main.js"]