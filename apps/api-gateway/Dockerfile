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
COPY eslint.config.mjs ./
COPY libs ./libs
COPY apps/api-gateway ./apps/api-gateway

# Build the api-gateway using Nx
RUN npx nx build api-gateway --prod

# ===========================================
# PRODUCTION STAGE - Minimal runtime image
# ===========================================
FROM node:20-alpine AS production

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create non-root user for security  
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy the Nx-generated package.json (minimal dependencies only!)
COPY --chown=nestjs:nodejs --from=builder /app/dist/apps/api-gateway/package*.json ./

# Install ONLY the minimal dependencies from Nx-generated package.json
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Copy ONLY the built application
COPY --chown=nestjs:nodejs --from=builder /app/dist/apps/api-gateway ./

# Copy the OpenAPI documentation (required at runtime)
COPY --chown=nestjs:nodejs --from=builder /app/apps/api-gateway/doc ./apps/api-gateway/doc

USER nestjs

# Health check (checks if the API is responding)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/live || exit 1

# Expose HTTP port
EXPOSE 3000

# Start the application
CMD ["node", "main.js"]
