FROM node:24-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.json tsconfig.base.json ./
COPY lib/ ./lib/
COPY artifacts/ ./artifacts/
COPY scripts/ ./scripts/

RUN pnpm install --frozen-lockfile

RUN PORT=3000 BASE_PATH=/ NODE_ENV=production \
    pnpm --filter @workspace/images-dashboard run build

RUN pnpm --filter @workspace/api-server run build

FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist/ ./dist/
COPY --from=builder /app/artifacts/images-dashboard/dist/public/ ./dist/public/

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "dist/index.mjs"]
