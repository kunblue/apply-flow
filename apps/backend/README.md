# Backend (NestJS)

Apply Flow 后端服务，提供用户鉴权、岗位管理、提醒管理与 AI 分析接口。

## 技术栈

- NestJS 11
- Prisma 6 + PostgreSQL
- JWT Bearer Token 鉴权（`Authorization` 请求头）
- 文件解析：PDF（`pdf-parse`）、DOCX（`mammoth`）
- AI：Google Gemini（`gemini-2.5-flash`）

## 环境变量

先复制示例文件：

```sh
cp .env.example .env
```

关键变量说明：

- `DATABASE_URL`：PostgreSQL 连接串
- `FRONTEND_URL`：允许跨域的前端地址（用于 CORS `origin`）
- `JWT_SECRET`：JWT 签名密钥
- `GEMINI_API_KEY`：AI 分析能力所需密钥（可选，不配置则 AI 接口报错）

## 本地开发

在仓库根目录执行：

```sh
pnpm install
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:push
pnpm --filter backend dev
```

服务默认监听：`http://localhost:3001`

## 常用脚本

```sh
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend start:prod
pnpm --filter backend lint
pnpm --filter backend test
pnpm --filter backend test:e2e
```

## API 概览

基础连通性：

- `GET /`：返回 `Hello World!`

鉴权（`/api/auth`）：

- `POST /register/send-code`：发送注册验证码
- `POST /register`：校验验证码后注册并返回 Bearer Token
- `POST /login`：登录并返回 Bearer Token
- `POST /logout`：前端清理本地 Token（服务端返回成功）
- `POST /password/forgot/send-code`：发送“忘记密码”验证码
- `POST /password/reset`：使用验证码重置密码
- `POST /password/change/send-code`：登录态发送“修改密码”验证码
- `POST /password/change`：登录态校验验证码后修改密码
- `GET /me`：获取当前登录用户（需携带 `Authorization: Bearer <token>`）

岗位（`/api/jobs`，全部需鉴权）：

- `GET /`：查询当前用户全部岗位
- `GET /:id`：查询单个岗位
- `POST /`：创建岗位（支持上传 `resume` 文件）
- `PATCH /:id`：更新岗位信息
- `PATCH /:id/resume`：更新岗位简历文件
- `DELETE /:id`：删除岗位
- `POST /:id/analyze`：AI 分析岗位匹配度（支持 `locale: zh | en`）
- `PATCH /:id/reminder`：更新提醒状态（read / ignore / snooze）
- `PATCH /reminders/mark-read`：批量标记提醒已读

## 数据模型要点

`JobApplication` 核心字段包括：

- `company`、`position`、`status`
- `jdText`、`resumeText`
- `interviewAt`、`followUpAt`
- `reminderState`、`reminderSnoozedUntil`
- `aiFeedback`

状态枚举：

- `ApplicationStatus`：`DRAFT` / `APPLIED` / `INTERVIEW` / `REJECTED` / `OFFER`
- `ReminderState`：`UNREAD` / `READ` / `IGNORED`

## 文件上传说明

- 支持：`PDF`、`DOCX`
- 不支持：旧版 `.doc`（会返回明确错误）
- 上传后会提取纯文本并做清洗，再存入 `resumeText`
