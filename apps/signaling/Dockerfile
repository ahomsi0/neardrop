FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/signaling/package.json ./apps/signaling/
RUN pnpm install --frozen-lockfile
COPY packages/shared ./packages/shared
COPY apps/signaling ./apps/signaling
COPY tsconfig.base.json ./
RUN pnpm --filter @neardrop/signaling build

FROM base AS runner
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/signaling/package.json ./apps/signaling/
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/apps/signaling/dist ./dist
COPY --from=build /app/packages/shared ./packages/shared
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]
