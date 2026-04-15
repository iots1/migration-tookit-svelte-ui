FROM node:24.7.0-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:24.7.0-alpine AS runner

WORKDIR /app

RUN corepack enable pnpm

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --prod --frozen-lockfile

ENV NODE_ENV=production
ENV PORT=5173

EXPOSE 5173

CMD ["node", "build"]