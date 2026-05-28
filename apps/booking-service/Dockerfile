# ===========================================
# DEPENDENCIES STAGE - Install all deps
# ===========================================
FROM node:20-alpine AS deps

WORKDIR /app
RUN npm install -g npm@latest && npm -v
# Copy only package files for better caching
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm i --legacy-peer-deps

# ===========================================
# BUILD STAGE - Build the application
# ===========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source files needed for build
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY libs ./libs
COPY eslint.config.mjs ./
COPY apps/booking-service ./apps/booking-service

# Generate Prisma Client for booking-service
WORKDIR /app/apps/booking-service
RUN npx --yes prisma@6.16.2 generate

# Build the booking-service using Nx
WORKDIR /app
RUN npx nx build booking-service --prod

# ===========================================
# PRODUCTION STAGE - Minimal runtime image
# ===========================================
FROM node:20-alpine AS production

# Install openssl for Prisma
RUN apk add --no-cache openssl wget

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy the Nx-generated package.json (minimal dependencies only!)
COPY --chown=nestjs:nodejs --from=builder /app/dist/apps/booking-service/package*.json ./

# Install ONLY the minimal dependencies from Nx-generated package.json
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy ONLY the built application and Prisma files
COPY --chown=nestjs:nodejs --from=builder /app/dist/apps/booking-service ./
COPY --chown=nestjs:nodejs --from=builder /app/apps/booking-service/generated ./generated
COPY --chown=nestjs:nodejs --from=builder /app/apps/booking-service/prisma ./prisma

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health/live || exit 1

# Expose TCP port (configured via environment)
EXPOSE 3004

# Start the application
CMD ["node", "main.js"]
