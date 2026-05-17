# ===========================================
# DEPENDENCIES STAGE - Install all deps
# ===========================================
FROM node:20-alpine AS deps

WORKDIR /app
RUN apk add --no-cache bash postgresql-client wget
RUN npm install -g npm@latest && npm -v
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ===========================================
# BUILD STAGE - Build the application
# ===========================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./
COPY eslint.config.mjs ./
COPY libs ./libs
COPY apps/backup-service ./apps/backup-service

RUN npx nx build backup-service --prod

# ===========================================
# PRODUCTION STAGE - Minimal runtime image
# ===========================================
FROM node:20-alpine AS production

RUN apk add --no-cache bash postgresql-client wget
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

COPY --chown=nestjs:nodejs --from=builder /app/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Seed writable runtime directories so Docker volume mounts inherit them.
RUN mkdir -p /data/backups /data/restores && \
  chown -R nestjs:nodejs /data

COPY --chown=nestjs:nodejs --from=builder /app/dist/apps/backup-service ./
COPY --chown=nestjs:nodejs --from=builder /app/apps/backup-service/scripts ./scripts
RUN find ./scripts -type f -name "*.sh" -exec chmod +x {} +

ENV NODE_ENV=production
EXPOSE 3006

USER nestjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3006/health/live || exit 1

CMD ["node", "main.js"]
