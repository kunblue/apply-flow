# Apply Flow

Apply Flow 是一个 AI 驱动的求职管理看板（Monorepo），支持账号登录、岗位投递进度管理、面试/跟进提醒，以及基于 JD 与简历文本的 AI 匹配分析。

## 技术栈

- 前端：Next.js 16、React 19、Tailwind CSS 4、dnd-kit、shadcn/ui
- 后端：NestJS 11、Prisma 6、JWT（Cookie 鉴权）
- 数据库：PostgreSQL 16
- AI：Google Gemini（`gemini-2.5-flash`）
- 工程化：pnpm workspace、Turborepo、ESLint、Prettier、Docker Compose

## 仓库结构

```text
.
├─ apps/
│  ├─ frontend/     # Next.js 前端应用
│  └─ backend/      # NestJS 后端应用
├─ packages/        # 共享配置与组件
├─ prisma/          # Prisma schema
├─ docker-compose.yml
└─ turbo.json
```

## 快速启动（推荐：Docker）

### 1) 准备环境变量

```sh
cp .env.example .env
```

可选：在根目录 `.env` 中填写 `GEMINI_API_KEY` 启用 AI 分析能力。

### 2) 一键启动

```sh
pnpm docker:up
```

### 3) 访问服务

- 前端：`http://localhost:3000`
- 后端：`http://localhost:3001`
- PostgreSQL：`localhost:5432`

### 4) 常用命令

```sh
pnpm docker:logs
pnpm docker:down
pnpm docker:build
```

## 本地开发（非 Docker）

### 1) 安装依赖

```sh
pnpm install
```

### 2) 启动数据库（任选其一）

- 使用 Docker 仅启动 DB：

```sh
docker compose up -d db
```

- 或自行准备本地 PostgreSQL，并保证连接串可用。

### 3) 准备后端环境变量

```sh
cp apps/backend/.env.example apps/backend/.env
```

按实际环境修改 `DATABASE_URL`、`FRONTEND_URL`、`JWT_SECRET`、`GEMINI_API_KEY`。

### 4) 同步 Prisma

```sh
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:push
```

### 5) 启动前后端

在仓库根目录执行：

```sh
pnpm dev
```

默认端口：
- 前端：`3000`
- 后端：`3001`

## 常用脚本

```sh
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

## 核心功能

- 账号系统：注册、登录、登出、获取当前用户
- 岗位看板：增删改查、状态流转（DRAFT/APPLIED/INTERVIEW/REJECTED/OFFER）
- 简历处理：支持 PDF 与 DOCX 提取文本（不支持旧版 `.doc`）
- AI 分析：输出结构化 JSON（匹配度、简历评分、优化建议、自我介绍模板）
- 提醒管理：标记已读、忽略、稍后提醒、批量标记已读
- 多语言体验：前端界面支持中英文切换

## 待优化点
- 接入各简历平台，爬取当前用户的投递简历信息
- AI模型支持自己选，接入多平台的模型
- 接入OCR支持图片PDF
- 登录验证邮件验证码，通知新增邮件

## 更多文档

- 前端文档：`apps/frontend/README.md`
- 后端文档：`apps/backend/README.md`