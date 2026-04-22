FROM node:22-bookworm-slim

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 先复制依赖声明，提升 Docker 缓存命中率
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages ./packages
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

# 再复制业务代码并构建
COPY apps/backend ./apps/backend
RUN pnpm --filter backend prisma:generate && pnpm --filter backend build

WORKDIR /app/apps/backend

EXPOSE 3001

# 容器启动时自动同步 schema（MVP 阶段用 db push 更轻量）
CMD ["sh", "-c", "pnpm prisma:push && pnpm start:prod"]
