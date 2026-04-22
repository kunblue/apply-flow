# Apply Flow

Apply Flow is an AI-powered job search dashboard in a monorepo setup. It supports account-based authentication, application tracking, reminder workflows, and AI analysis based on JD + resume text.

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS 4, dnd-kit, shadcn/ui
- Backend: NestJS 11, Prisma 6, JWT (Cookie auth)
- Database: PostgreSQL 16
- AI: Google Gemini (`gemini-2.5-flash`)
- Tooling: pnpm workspace, Turborepo, ESLint, Prettier, Docker Compose

## Repository Structure

```text
.
├─ apps/
│  ├─ frontend/     # Next.js frontend app
│  └─ backend/      # NestJS backend app
├─ packages/        # Shared configs/components
├─ prisma/          # Prisma schema
├─ docker-compose.yml
└─ turbo.json
```

## Quick Start (Recommended: Docker)

### 1) Prepare environment variables

```sh
cp .env.example .env
```

Optionally set `GEMINI_API_KEY` in root `.env` to enable AI analysis.

### 2) Start all services

```sh
pnpm docker:up
```

### 3) Service URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

### 4) Useful commands

```sh
pnpm docker:logs
pnpm docker:down
pnpm docker:build
```

## Local Development (Without Docker for app runtime)

### 1) Install dependencies

```sh
pnpm install
```

### 2) Start database (choose one)

- Start only DB via Docker:

```sh
docker compose up -d db
```

- Or use your own local PostgreSQL instance.

### 3) Prepare backend env file

```sh
cp apps/backend/.env.example apps/backend/.env
```

Update `DATABASE_URL`, `FRONTEND_URL`, `JWT_SECRET`, and `GEMINI_API_KEY` as needed.

### 4) Sync Prisma

```sh
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:push
```

### 5) Start frontend and backend

Run from repo root:

```sh
pnpm dev
```

Default ports:
- Frontend: `3000`
- Backend: `3001`

## Common Scripts

```sh
pnpm dev
pnpm build
pnpm lint
pnpm check-types
pnpm format
```

## Core Features

- Auth system: register, login, logout, get current user
- Job board: CRUD + status flow (`DRAFT`/`APPLIED`/`INTERVIEW`/`REJECTED`/`OFFER`)
- Resume processing: parse PDF and DOCX text (`.doc` is not supported)
- AI analysis: structured JSON output (match score, resume score, improvements, intro template)
- Reminder management: mark read, ignore, snooze, bulk mark read
- Language support: Chinese / English UI switching

## More Docs

- Frontend docs: `apps/frontend/README.en.md`
- Backend docs: `apps/backend/README.en.md`
