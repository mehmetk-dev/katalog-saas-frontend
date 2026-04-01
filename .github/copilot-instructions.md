# FogCatalog — Copilot Instructions

## Project Overview

FogCatalog is a SaaS platform for creating professional digital product catalogs.  
**Monorepo**: Next.js 16 frontend (port 3000) + Express 5 backend (port 4000).  
See [CLAUDE.md](../CLAUDE.md) for full architecture, data models, and workflow diagrams.

## Build & Run

```bash
# Frontend
pnpm install
pnpm dev                 # localhost:3000

# Backend
cd backend
npm install
npm run dev              # localhost:4000

# Full stack
docker-compose up -d
```

## Test & Lint

```bash
pnpm test                # Vitest watch mode
pnpm test:run            # Single run
pnpm test:coverage       # With coverage
pnpm lint                # ESLint (flat config)
pnpm type-check          # TypeScript strict check
```

- **Framework**: Vitest + React Testing Library + `@testing-library/user-event`
- **Test location**: `tests/` directory (not co-located)
- **Pattern**: `describe` / `it` / `expect` with `vi.mock()` for module mocking

## Architecture Rules

- **Frontend is a thin client.** Server actions (`lib/actions/`) call the Express backend via `apiFetch()`. Never call Supabase directly from actions — route through the backend.
- **All API calls go through `lib/api.ts`** (`apiFetch` wrapper) which handles timeouts, retries, and auth headers automatically.
- **Auth via Supabase JWT.** `middleware.ts` refreshes sessions. Three Supabase clients: `client.ts` (browser), `server.ts` (SSR), `proxy.ts` (middleware).
- **Image storage uses a factory pattern** (`lib/storage/`). Provider is selected via `NEXT_PUBLIC_STORAGE_PROVIDER` env var. Default: Cloudinary.
- **Row Level Security (RLS)** is active in Supabase. All DB queries are scoped by `user_id`.

## Code Style

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `catalog-editor.tsx` |
| Components | PascalCase | `CatalogEditor` |
| Functions | camelCase | `getCatalogs` |
| Constants | SCREAMING_SNAKE | `MAX_PRODUCTS` |
| Types | PascalCase | `Product`, `Catalog` |

- Client components start with `"use client"` directive
- Page containers are named `*-page-client.tsx`
- Path alias: `@/` maps to project root

## i18n (Internationalization)

- Translations in `lib/translations/` — 12 modular files merged in `index.ts`
- Languages: `tr` (Turkish) and `en` (English)
- **Always add both languages** when creating new strings
- Add strings to the appropriate domain module (e.g., `products.ts`, `catalog.ts`)

## Validation

- **All user input validated with Zod** (`lib/validations/`)
- `safeString()` helper strips whitespace and caps length (XSS prevention)
- `safeUrl` blocks non-HTTP(S) protocols
- Backend uses its own Zod schemas in `backend/src/controllers/*/schemas.ts`

## Backend Conventions

- Express 5 with Helmet, CORS, rate-limiting, compression
- Controllers are modularized: `controllers/products/` has `read.ts`, `write.ts`, `bulk.ts`, `media.ts`
- Auth middleware at `backend/src/middlewares/auth.ts` — JWT verification via Supabase
- Global error handler at `backend/src/middlewares/errorHandler.ts`

## Notifications & Errors

- **Frontend toasts**: Use `sonner` (`toast.success()`, `toast.error()`)
- **Backend errors**: Throw or return `res.status(code).json({ error })` — caught by global handler

## Key References

| Topic | Document |
|-------|----------|
| Full architecture & data models | [CLAUDE.md](../CLAUDE.md) |
| Environment setup | [ENVIRONMENT_SETUP.md](../ENVIRONMENT_SETUP.md) |
| Local DB quickstart | [LOCAL_DB_QUICKSTART.md](../LOCAL_DB_QUICKSTART.md) |
| Cloudinary troubleshooting | [TROUBLESHOOTING_CLOUDINARY.md](../TROUBLESHOOTING_CLOUDINARY.md) |
| Performance notes | [PERFORMANCE_OPTIMIZATIONS.md](../PERFORMANCE_OPTIMIZATIONS.md) |
| Database migrations | `supabase/migrations/` (38 SQL files) |
| Codebase audit | [CODEBASE_DETAILED_AUDIT.md](../CODEBASE_DETAILED_AUDIT.md) |
