FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/signaling/package.json ./apps/signaling/
RUN pnpm install --frozen-lockfile
COPY packages/shared ./packages/shared
COPY apps/signaling ./apps/signaling
COPY tsconfig.base.json ./
RUN pnpm --filter @neardrop/signaling build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=build /app/apps/signaling/dist/index.js ./index.js
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
