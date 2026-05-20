FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/signaling/package.json ./apps/signaling/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/signaling/node_modules ./apps/signaling/node_modules
COPY packages/shared ./packages/shared
COPY apps/signaling ./apps/signaling
COPY tsconfig.base.json ./
RUN pnpm --filter @neardrop/signaling build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/signaling/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/shared ./packages/shared
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
