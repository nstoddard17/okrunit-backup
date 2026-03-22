# OKRunit

Human-in-the-loop approval gateway for automated workflows. AI agents and automation platforms call OKRunit's API when they need human approval for destructive/sensitive actions. OKRunit notifies the right humans, collects their decision, and calls back the automation with the result.

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** Tailwind CSS 4, shadcn/ui (New York style)
- **State:** Zustand (UI filters only), RSC + server actions for data
- **Database:** Supabase (hosted PostgreSQL, RLS, Realtime)
- **Email:** Resend
- **Push:** web-push (VAPID)
- **Hosting:** Vercel
- **Package manager:** npm

## Key References

- **Implementation Plan:** `PLAN.md` — Full implementation checklist with all phases
- **Integration Module Specs:** `integrations/shared/module-specs.md` — Canonical reference for all 9 platform integration modules. All integrations must match field names, output types, filter options, and sample data defined there.
- **Shared Constants:** `integrations/shared/constants.ts` — Shared field definitions, statuses, priorities, and endpoint paths used across integrations.
- **Database Types:** `src/lib/types/database.ts` — TypeScript types for all Supabase tables
- **API Validation:** `src/lib/api/validation.ts` — Zod schemas for all API inputs
- **Database Migrations:** `supabase/migrations/` — SQL migration files

## Project Structure

```
src/
  app/
    (auth)/          # Login, signup, invite, OAuth callback
    (dashboard)/     # Protected pages (dashboard, connections, settings, etc.)
    api/v1/          # REST API endpoints
  components/        # React components (approvals/, ui/, layout/, etc.)
  hooks/             # Custom hooks (realtime, approvals, connections, push)
  lib/
    api/             # Auth, validation, errors, audit, callbacks, rate-limiter, rules-engine
    supabase/        # Client, server, admin, middleware
    notifications/   # Orchestrator, channels (email, slack, web-push), filters, tokens
    types/           # TypeScript type definitions
  stores/            # Zustand stores (filters, notifications)
integrations/
  shared/            # module-specs.md + constants.ts
  zapier/            # Zapier native app
  make/              # Make.com custom app
  n8n/               # n8n community node
  windmill/          # Windmill Deno scripts
  pipedream/         # Pipedream components
  github-actions/    # GitHub Action
  temporal/          # Temporal Python workflows
  prefect/           # Prefect Python tasks/flows
  dagster/           # Dagster Python ops/sensors
supabase/migrations/ # Database migration SQL files
```

## Working Conventions

### How to Work
- Build features end-to-end autonomously. Only ask when truly ambiguous.
- Fix bugs found along the way — briefly mention what was fixed.
- Refactor freely when you see a better pattern. Update all affected files.
- Write production-ready code: full error handling, loading states, empty states, input validation.
- Write comprehensive tests for API endpoints, core logic, and UI components.
- Ask before committing to git (show the diff).
- **NEVER push to remote git without explicit permission.**

### Code Quality
- Full authority to change existing code patterns if a better alternative exists.
- Keep code concise, modern, and readable.
- Use Zod for all API input validation.
- Use proper TypeScript types — no `any`.
- Handle all error paths with structured error responses.
- Follow existing patterns in `src/lib/api/` for new API routes.

### Authentication Model
- **API Keys:** `gk_` prefix + 64 hex chars, SHA-256 hashed in DB, Bearer token auth
- **OAuth 2.0:** PKCE support, scopes: `approvals:read`, `approvals:write`, `comments:write`
- **Session Auth:** Supabase Auth with cookies for dashboard users
- API routes use dual auth from `src/lib/api/auth.ts`

### Database
- All tables are org-scoped with Row Level Security (RLS)
- Use `src/lib/supabase/admin.ts` (service role) to bypass RLS when needed
- Use `src/lib/supabase/server.ts` for server components/API routes
- Use `src/lib/supabase/client.ts` for client components
- Approval expiration is lazy (checked at read time, no cron)

## Integration Development

When creating or modifying any integration module (trigger, action, or search):

1. Reference `integrations/shared/module-specs.md` for the canonical spec
2. Ensure output fields match exactly across all platforms
3. All approval creation actions must set `source` to the platform name
4. All approval creation actions must auto-generate an idempotency key
5. Filter options must include all statuses and priorities defined in the spec
6. Use OAuth 2.0 for authentication on all platforms
7. All 9 integrations are equally important — maintain consistent quality

### Integration Status
- **Zapier:** In developer platform, needs full testing/verification
- **Make.com:** In developer platform, needs full testing/verification
- **n8n, Windmill, Pipedream, GitHub Actions, Temporal, Prefect, Dagster:** Code exists, unpublished

## API Endpoints

All API routes live under `src/app/api/v1/`. Key patterns:
- Auth check → emergency stop check → validate input → business logic → audit log → notifications → response
- Use `errorResponse()` from `src/lib/api/errors.ts` for error responses
- Use `logAuditEvent()` from `src/lib/api/audit.ts` for all mutations
- Callbacks delivered via `deliverCallback()` with HMAC signing + 3 retries

## Environment Variables

Read from `.env.local`. Key vars:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin (bypasses RLS)
- `RESEND_API_KEY` — Email sending
- `NEXT_PUBLIC_APP_URL` — Base URL for links
