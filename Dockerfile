# ============================================
# JOLUB Platform - Backend Only Dockerfile
# ============================================

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and Prisma schema FIRST (needed for postinstall)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (this will run prisma generate via postinstall)
RUN npm ci

# Copy rest of source code
COPY . .

# Build ONLY the server (TypeScript to JavaScript)
RUN npm run build:server

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy package files and Prisma schema FIRST (needed for postinstall)
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only (this will run prisma generate via postinstall)
RUN npm ci --omit=dev

# Copy built server from builder
COPY --from=builder /app/dist-server ./dist-server

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start command
CMD ["node", "dist-server/index.js"]
