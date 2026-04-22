# Backend (NestJS)

This service powers Apply Flow backend APIs, including authentication, job management, reminder workflows, and AI analysis.

## Tech Stack

- NestJS 11
- Prisma 6 + PostgreSQL
- JWT + Cookie auth (`httpOnly`)
- File parsing: PDF (`pdf-parse`) and DOCX (`mammoth`)
- AI: Google Gemini (`gemini-2.5-flash`)

## Environment Variables

Create env file first:

```sh
cp .env.example .env
```

Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_URL`: allowed frontend origin for CORS
- `JWT_SECRET`: JWT signing key
- `GEMINI_API_KEY`: required for AI analysis endpoint

## Local Development

Run from repo root:

```sh
pnpm install
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:push
pnpm --filter backend dev
```

Default service URL: `http://localhost:3001`

## Common Scripts

```sh
pnpm --filter backend dev
pnpm --filter backend build
pnpm --filter backend start:prod
pnpm --filter backend lint
pnpm --filter backend test
pnpm --filter backend test:e2e
```

## API Overview

Health/basic route:

- `GET /`: returns `Hello World!`

Auth routes (`/api/auth`):

- `POST /register`: create user and set auth cookie
- `POST /login`: login and set auth cookie
- `POST /logout`: clear auth cookie
- `GET /me`: get current user (auth required)

Job routes (`/api/jobs`, all require auth):

- `GET /`: list current user jobs
- `GET /:id`: get one job
- `POST /`: create job (supports `resume` upload)
- `PATCH /:id`: update job fields
- `PATCH /:id/resume`: update resume file
- `DELETE /:id`: delete job
- `POST /:id/analyze`: run AI analysis (`locale: zh | en`)
- `PATCH /:id/reminder`: update reminder state (`read` / `ignore` / `snooze`)
- `PATCH /reminders/mark-read`: bulk mark reminders as read

## Data Model Highlights

`JobApplication` includes:

- `company`, `position`, `status`
- `jdText`, `resumeText`
- `interviewAt`, `followUpAt`
- `reminderState`, `reminderSnoozedUntil`
- `aiFeedback`

Enums:

- `ApplicationStatus`: `DRAFT` / `APPLIED` / `INTERVIEW` / `REJECTED` / `OFFER`
- `ReminderState`: `UNREAD` / `READ` / `IGNORED`

## Upload Support

- Supported: `PDF`, `DOCX`
- Not supported: legacy `.doc` (returns explicit error)
- Parsed text is sanitized and stored in `resumeText`
