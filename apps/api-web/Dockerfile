FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api-business/package.json ./apps/api-business/package.json
COPY apps/api-web/package.json ./apps/api-web/package.json
COPY apps/orchestrator/package.json ./apps/orchestrator/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/sdk/package.json ./packages/sdk/package.json
COPY packages/observability/package.json ./packages/observability/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/utils/package.json ./packages/utils/package.json
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api-web/node_modules ./apps/api-web/node_modules
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/api-web ./apps/api-web
COPY packages ./packages
RUN npm run build:packages
RUN npm --workspace apps/api-web run build

FROM base AS production-deps
COPY package.json package-lock.json ./
COPY apps/api-business/package.json ./apps/api-business/package.json
COPY apps/api-web/package.json ./apps/api-web/package.json
COPY apps/orchestrator/package.json ./apps/orchestrator/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/config/package.json ./packages/config/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/sdk/package.json ./packages/sdk/package.json
COPY packages/observability/package.json ./packages/observability/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/utils/package.json ./packages/utils/package.json
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_PATH=/app/apps/api-web/node_modules:/app/node_modules

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/apps/api-web/node_modules ./apps/api-web/node_modules
COPY --from=build /app/apps/api-web/dist ./apps/api-web/dist
COPY --from=build /app/packages ./packages
COPY package.json package-lock.json ./
COPY apps/api-web/package.json ./apps/api-web/package.json

RUN mkdir -p /app/storage/documents \
    && chown -R nestjs:nodejs /app/storage

USER nestjs
EXPOSE 3000

CMD ["node", "apps/api-web/dist/apps/api-web/src/main.js"]
