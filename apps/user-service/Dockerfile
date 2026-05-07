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
COPY apps/user-service ./apps/user-service

# Generate Prisma Client for user-service
WORKDIR /app/apps/user-service
RUN npx --yes prisma@6.16.2 generate

# Build the user-service using Nx
WORKDIR /app
RUN npx nx build user-service --prod

# ===========================================
# PRODUCTION STAGE - Minimal runtime image
# ===========================================
FROM node:20-alpine AS production

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy the full root package.json for dependencies including Prisma
COPY --chown=nestjs:nodejs --from=builder /app/package.json ./
COPY --chown=nestjs:nodejs --from=builder /app/package-lock.json ./

# Install dependencies including Prisma for runtime
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Copy ONLY the built application and Prisma files
COPY --chown=nestjs:nodejs --from=builder /app/dist/apps/user-service ./
COPY --chown=nestjs:nodejs --from=builder /app/apps/user-service/generated ./generated
COPY --chown=nestjs:nodejs --from=builder /app/apps/user-service/prisma ./prisma

USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node --version || exit 1

# Expose TCP port (configured via environment)
EXPOSE 3001

# Start the application
CMD ["node", "main.js"]
