FROM node:22-bookworm-slim

WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# 先复制依赖声明，提升 Docker 缓存命中率
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY packages ./packages

RUN pnpm install --frozen-lockfile

# 再复制前端代码并构建
COPY apps/frontend ./apps/frontend
WORKDIR /app/apps/frontend
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
