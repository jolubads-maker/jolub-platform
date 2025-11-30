# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Argumentos de construcción para el frontend (VITE_...)
ARG VITE_API_URL
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_CLOUDINARY_UPLOAD_PRESET

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Frontend
# Las variables de entorno VITE_ deben estar disponibles aquí si se usan en el build
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm ci --only=production

# Copy built assets from builder (Frontend)
COPY --from=builder /app/dist ./dist

# Copy server source code for tsx execution
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src
# Note: Copiamos src root también si hay dependencias compartidas, aunque parece que todo está en server/src
# Por seguridad copiamos todo lo necesario. Si server/src es autocontenido, basta con server.
# Revisando estructura: server/src/index.ts.

# Generate Prisma Client
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Start command using tsx (Opción B)
CMD ["npx", "tsx", "server/src/index.ts"]
