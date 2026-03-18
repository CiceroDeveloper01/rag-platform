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

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./tsconfig.base.json
COPY apps/web ./apps/web
COPY packages ./packages
RUN npm run build:packages
RUN npm --workspace apps/web run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
