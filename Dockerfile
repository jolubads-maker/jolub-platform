# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Frontend
RUN npm run build

# Build Backend
# Ensure tsc is available (it's in devDependencies)
RUN npx tsc -p server/tsconfig.json

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Start command
CMD ["node", "dist-server/index.js"]
