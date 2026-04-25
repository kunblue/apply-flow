# Frontend (Next.js)

This is the Apply Flow frontend application, built with Next.js 16 (App Router). It provides login/register flows, job board interactions, reminder UX, and AI analysis display.

## Tech Stack

- Next.js 16 + React 19
- Tailwind CSS 4
- dnd-kit (drag interactions on board cards)
- shadcn/ui + lucide-react

## Directory Overview

```text
apps/frontend/
├─ app/
│  ├─ page.tsx              # Home page (job board)
│  ├─ login/page.tsx        # Login page
│  ├─ register/page.tsx     # Register page
│  └─ components/           # Core business components
├─ components/ui/           # UI primitives
├─ lib/api.ts               # API request wrapper
└─ next.config.ts
```

## Environment Variables

Frontend uses the following variables (already wired in Docker Compose):

- `NEXT_PUBLIC_API_BASE_URL`: backend URL used in browser requests (default `http://localhost:3001`)
- `API_BASE_URL`: backend URL used during SSR (mainly for Docker internal networking)

## Local Development

From repo root:

```sh
pnpm install
pnpm dev
```

Frontend only (from this directory):

```sh
pnpm dev
```

App URL: `http://localhost:3000`

## Common Scripts

```sh
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## API Convention

- Use `lib/api.ts` as the unified request layer
- Store token in `localStorage` after login/register
- Requests automatically include `Authorization: Bearer <token>`
- Business errors throw `ApiError` and are handled by status code at page level

## Main Pages

- `/login`: email/password login with locale switch
- `/register`: email/password registration (with password length guard)
- `/forgot-password`: send verification code and reset password
- `/change-password`: send verification code and change password in authenticated session
- `/`: job board with CRUD/reminders/AI analysis interactions

## Development Notes

- Keep feature logic in `app/components/`
- Keep reusable UI in `components/ui/`
- Move code to root `packages/` only when it needs cross-app reuse
