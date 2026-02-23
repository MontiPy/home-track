# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Track is a family household management app (calendar, chores, meals, budget, pets, grocery lists, vault, messaging). Built with Next.js 16 App Router, PostgreSQL via Prisma, Google OAuth via NextAuth.js v5 beta.

## Commands

```bash
# Development
pnpm dev                    # Start dev server (port 3000)
pnpm build                  # prisma generate && next build
pnpm lint                   # ESLint

# Testing (Vitest)
pnpm test                   # Single run
pnpm test:watch             # Watch mode
pnpm test:coverage          # With v8 coverage
pnpm vitest run src/app/api/chores  # Run tests for a specific feature

# Database (Prisma + PostgreSQL)
pnpm db:migrate             # Create/apply migration
pnpm db:push                # Push schema without migration
pnpm db:seed                # Seed via tsx prisma/seed.ts
pnpm db:studio              # Prisma Studio GUI
pnpm db:generate            # Regenerate Prisma client
```

## Architecture

### Auth Flow

Google OAuth → NextAuth.js v5 (JWT strategy) → custom callbacks in `src/lib/auth.ts`:
- `signIn`: checks for existing member or pending invitation, creates member if invited
- `jwt`: enriches token with `memberId`, `householdId`, `role`, `memberName`, `memberColor`
- `session`: copies token fields to session

Session is extended in `src/types/next-auth.d.ts`. Auth guards in `src/lib/auth-guard.ts` provide `requireAuth()`, `requireHousehold()`, and `requireRole()` for server components (they redirect on failure).

Middleware (`src/middleware.ts`) checks session cookies for all non-public routes, rate-limits API routes (100/min/IP), and adds security headers.

### Data Model

All entities belong to a Household. Members are linked by `googleId` (not NextAuth's default User/Account tables). Roles: `ADMIN`, `MEMBER`, `CHILD`. Schema uses `@@map` for snake_case table names. Cascade deletes from Household down.

Key relationships: Household → Members → [ChoreAssignments, Expenses, GroceryItems, Messages, etc.]. Prisma singleton in `src/lib/db.ts`.

### API Routes

All in `src/app/api/{feature}/route.ts`. Consistent pattern:
1. Call `auth()` to get session
2. Return 401 if unauthenticated
3. Validate input with Zod schemas from `src/lib/validations.ts` (using `parseBody()`)
4. Query/mutate via Prisma, always filtering by `householdId`
5. Return `NextResponse.json()`

### Pages

- `src/app/(auth)/` — sign-in, onboarding (route group, no sidebar)
- `src/app/(dashboard)/` — all authenticated pages (shared layout with sidebar/header)
- `src/app/kiosk/` — wall-mounted tablet display mode (uses bearer token auth via `kioskToken`)

Server components call `requireHousehold()` then fetch data. Client components ("use client") handle interactivity and call API routes.

### Testing

Tests live adjacent to source: `src/app/api/{feature}/__tests__/route.test.ts`. Mocks in `src/test/mocks/` — `auth.ts` exports `mockSession` and `mockAuthFn`, `db.ts` exports `mockDb` with all Prisma models stubbed. `src/test/helpers.ts` has `createMockRequest()` for building NextRequest objects.

### Styling

Tailwind CSS v4 with `@import "tailwindcss"` syntax in `src/app/globals.css`. Custom theme variables (indigo primary `#4F46E5`). UI components in `src/components/ui/` use `class-variance-authority` for variants and `clsx`/`tailwind-merge` via `cn()` from `src/lib/utils.ts`. Icons from `lucide-react`.

### Vault Encryption

`src/lib/encryption.ts` uses AES-256-GCM with `VAULT_ENCRYPTION_KEY` env var. Vault item content is encrypted at rest.

## Environment Variables

```
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  # Google OAuth
AUTH_SECRET                              # NextAuth secret (openssl rand -base64 32)
DATABASE_URL                             # PostgreSQL connection string
OPENWEATHERMAP_API_KEY                   # Weather widget
VAULT_ENCRYPTION_KEY                     # AES-256 key (openssl rand -base64 32)
```

## Key Conventions

- Package manager: **pnpm** (v10.29.3)
- Path alias: `@/*` maps to `./src/*`
- Zod v4 for validation (imported from `zod`, not `zod/v4`)
- `date-fns` for date manipulation
- Prisma schema column mapping: camelCase in code, snake_case in DB
