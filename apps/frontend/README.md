# Frontend (Next.js)

Apply Flow 前端应用，基于 Next.js 16（App Router）构建，提供登录/注册、岗位看板、提醒交互与 AI 分析展示。

## 技术栈

- Next.js 16 + React 19
- Tailwind CSS 4
- dnd-kit（看板拖拽排序交互）
- shadcn/ui + lucide-react

## 目录说明

```text
apps/frontend/
├─ app/
│  ├─ page.tsx              # 首页（岗位看板）
│  ├─ login/page.tsx        # 登录页
│  ├─ register/page.tsx     # 注册页
│  └─ components/           # 看板核心业务组件
├─ components/ui/           # UI 基础组件
├─ lib/api.ts               # API 请求封装
└─ next.config.ts
```

## 环境变量

前端主要使用以下变量（Docker Compose 已内置）：

- `NEXT_PUBLIC_API_BASE_URL`：浏览器端请求后端地址，默认 `http://localhost:3001`
- `API_BASE_URL`：SSR 阶段请求后端地址（Docker 内网场景使用）

## 本地开发

在仓库根目录执行：

```sh
pnpm install
pnpm dev
```

只启动前端（在当前目录）：

```sh
pnpm dev
```

访问地址：`http://localhost:3000`

## 常用脚本

```sh
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## API 调用约定

- 统一通过 `lib/api.ts` 调用后端
- 登录/注册成功后，将 Token 存入 `localStorage`
- 请求会自动附带 `Authorization: Bearer <token>`
- 业务错误会抛出 `ApiError`，页面可按状态码做提示

## 主要页面能力

- `/login`：邮箱密码登录，支持中英文文案切换
- `/register`：邮箱密码注册（密码长度校验）
- `/forgot-password`：发送验证码并重置密码
- `/change-password`：登录态发送验证码并修改密码
- `/`：岗位看板，包含岗位管理、提醒与 AI 分析

## 开发建议

- 业务代码优先放在 `app/components/`
- 通用 UI 放在 `components/ui/`
- 若多个应用都需要复用，再抽到根目录 `packages/`
