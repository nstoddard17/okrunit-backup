# OKRunit - Implementation Plan

## Context

OKRunit is a universal human-in-the-loop approval gateway. AI agents and automation platforms (Zapier, Make, n8n, custom scripts) call OKRunit's API when they need human approval for destructive/sensitive actions. OKRunit notifies the right humans, collects their decision, and calls back the automation with the result.

The repo at `/Users/nathanielstoddard/okrunit` is a fresh git repo with no code. We are building Weeks 1-2 of the spec: core infrastructure + notifications + real-time updates.

**Tech stack:** Next.js 15, React 19, Tailwind CSS, shadcn/ui, Supabase (hosted), Resend, Web Push, Slack webhooks, npm.

**Key decisions made:**
- Project name: `okrunit` (not SEAP)
- Package manager: npm
- Database: hosted Supabase (URL/keys ready)
- Resend: account and verified domain ready
- Terminology: "priority" (low/medium/high/critical), not "urgency"
- Callbacks: included (webhook delivery to external systems on decision)
- Slack: included (interactive messages with approve/reject buttons)
- State management: minimal Zustand for UI state only; lean into RSC + server actions
- Auth: dual model - API keys (Bearer token) for external callers, Supabase Auth (session cookies) for dashboard users
- Rich context: support both `metadata` (JSONB) and optional `context_html` (sanitized HTML preview)
- Team management: basic invite flow (invite users to org via email, assigned member role)
- Expiration: lazy check at read time (no cron job)
- Landing page: basic hero page for unauthenticated users

---

## Implementation Checklist

### Phase 1: Project Scaffolding
- [ ] Initialize Next.js 15 project with TypeScript, Tailwind, ESLint, App Router, src dir
- [ ] Initialize shadcn/ui (New York style, Slate, CSS variables)
- [ ] Install shadcn components: button, card, badge, dialog, dropdown-menu, input, label, select, separator, sheet, table, tabs, textarea, toast, avatar
- [ ] Install dependencies: @supabase/supabase-js, @supabase/ssr, zod, zustand, web-push, resend, date-fns, dompurify, recharts, next-themes
- [ ] Install dev dependencies: @types/web-push, @types/dompurify
- [ ] Create `.env.example` (committed, no secrets)
- [ ] Create `.env.local` (gitignored, user fills in Supabase/Resend/VAPID/Slack keys)
- [ ] Create `src/lib/supabase/client.ts` - browser client (`createBrowserClient`)
- [ ] Create `src/lib/supabase/server.ts` - server client with cookies (`await cookies()` per Next.js 15)
- [ ] Create `src/lib/supabase/admin.ts` - service role client (bypasses RLS)
- [ ] Create `src/lib/supabase/middleware.ts` - session refresh helper (uses `getUser()` not `getSession()`)
- [ ] Create `src/middleware.ts` - route protection + session refresh

### Phase 2: Database Schema
- [ ] Create `supabase/migrations/001_initial_schema.sql` with all tables:
  - [ ] `organizations` - multi-tenant orgs, `emergency_stop_active` boolean
  - [ ] `user_profiles` - linked to auth.users, `org_id`, `role` (owner/admin/member)
  - [ ] `connections` - API keys with `api_key_hash` (SHA-256), `api_key_prefix`, `is_active`, `rate_limit_per_hour`, `allowed_action_types` (text[]), `max_priority`, `scoping_rules` (JSONB)
  - [ ] `approval_requests` - core entity with `title`, `description`, `priority`, `status`, `callback_url`, `callback_headers`, `metadata` (JSONB), `context_html`, `decided_by`, `decided_at`, `decision_comment`, `decision_source`, `expires_at`, `idempotency_key`, `required_approvals` (int, default 1), `current_approvals` (int, default 0), `auto_approved` (boolean)
  - [ ] `org_invites` - team invitations with `token`, `expires_at`, `accepted_at`
  - [ ] `audit_log` - immutable event log
  - [ ] `push_subscriptions` - web push endpoints per user
  - [ ] `notification_settings` - per-user channel toggles, quiet hours, minimum priority, `slack_webhook_url`
  - [ ] `email_action_tokens` - single-use tokens for email approve/reject
  - [ ] `approval_comments` - threaded comments on approval requests
  - [ ] `webhook_delivery_log` - outbound callback attempt log (status, response, timing, retries)
  - [ ] `approval_rules` - auto-approve/routing rules per connection or org-wide
  - [ ] `approval_votes` - individual votes for multi-approver workflows (user_id, request_id, vote, comment)
  - [ ] `saved_filters` - user-saved filter presets
  - [ ] `approval_attachments` - file references in Supabase Storage
- [ ] Create custom enum types: `approval_status`, `approval_priority`
- [ ] Create `handle_new_user()` trigger - auto-provisions org + profile on signup (with invite support)
- [ ] Create `updated_at` trigger for all mutable tables
- [ ] Enable RLS on all tables with org-scoped policies
- [ ] Enable Realtime publication on `approval_requests`
- [ ] Create indexes on key query patterns
- [ ] Apply migration to hosted Supabase

### Phase 3: TypeScript Types
- [ ] Create `src/lib/types/database.ts` - types for all tables (Organization, UserProfile, Connection, ApprovalRequest, AuditLogEntry, OrgInvite, PushSubscription, NotificationSettings, EmailActionToken, ApprovalComment, WebhookDeliveryLog, ApprovalRule, ApprovalVote, SavedFilter, ApprovalAttachment)

### Phase 4: Authentication
- [ ] Create `src/app/(auth)/layout.tsx` - centered layout for auth pages
- [ ] Create `src/app/(auth)/login/page.tsx` - server component shell
- [ ] Create `src/app/(auth)/login/login-form.tsx` - client component with email/password login
- [ ] Create `src/app/(auth)/signup/page.tsx` - server component shell
- [ ] Create `src/app/(auth)/signup/signup-form.tsx` - client component with email/password signup (supports invite token in query param)
- [ ] Create `src/app/(auth)/callback/route.ts` - exchange auth code for session

### Phase 5: Landing Page
- [ ] Create `src/app/page.tsx` - check auth: authenticated → redirect to `/dashboard`, unauthenticated → show landing
- [ ] Create `src/components/landing/hero.tsx` - hero section with product description + login/signup CTAs

### Phase 6: API Shared Utilities
- [ ] Create `src/lib/api/auth.ts` - dual auth (API key hash lookup + session), `ApiError` class, `hashApiKey()`
- [ ] Create `src/lib/api/errors.ts` - `errorResponse()` helper
- [ ] Create `src/lib/api/validation.ts` - Zod schemas for all API inputs
- [ ] Create `src/lib/api/audit.ts` - `logAuditEvent()` helper
- [ ] Create `src/lib/api/callbacks.ts` - `deliverCallback()` with HMAC signing + 3 retries with exponential backoff
- [ ] Create `src/lib/constants.ts` - app-wide constants

### Phase 7: Approvals API
- [ ] Create `src/app/api/v1/approvals/route.ts` - POST (create) + GET (list with filters)
  - [ ] POST: auth → emergency stop check → validate → idempotency check → insert → audit log → dispatch notifications → return
  - [ ] GET: auth → filter by status/priority → paginate → lazy expiration check → return
- [ ] Create `src/app/api/v1/approvals/[id]/route.ts` - GET (single) + PATCH (respond) + DELETE (cancel)
  - [ ] PATCH: session auth only → validate → check pending → update → audit log → deliver callback → dispatch notifications → return

### Phase 8: Connections API
- [ ] Create `src/app/api/v1/connections/route.ts` - GET (list) + POST (create with API key generation)
  - [ ] POST: generate `gk_<hex>` key → store SHA-256 hash → return plaintext once
- [ ] Create `src/app/api/v1/connections/[id]/route.ts` - PATCH (update) + DELETE (deactivate)

### Phase 9: Dashboard UI
- [ ] Create `src/app/(dashboard)/layout.tsx` - auth guard + sidebar + header
- [ ] Create `src/components/layout/sidebar.tsx` - nav links + pending count badge + user info + sign out
- [ ] Create `src/components/layout/header.tsx` - page title + notification bell + emergency status indicator
- [ ] Create `src/app/(dashboard)/dashboard/page.tsx` - server component fetches initial approval data
- [ ] Create `src/app/(dashboard)/dashboard/loading.tsx` - skeleton loading state
- [ ] Create `src/app/(dashboard)/dashboard/error.tsx` - error boundary
- [ ] Create `src/components/approvals/approval-dashboard.tsx` - client wrapper with realtime + filters
- [ ] Create `src/components/approvals/approval-list.tsx` - renders list of approval cards
- [ ] Create `src/components/approvals/approval-card.tsx` - title, priority badge, status badge, connection name, timestamp
- [ ] Create `src/components/approvals/approval-detail.tsx` - dialog with sanitized context_html + metadata JSON + response form
- [ ] Create `src/components/approvals/approval-response-form.tsx` - approve/reject buttons + comment textarea
- [ ] Create `src/components/approvals/approval-filters.tsx` - filter bar: status, priority, search
- [ ] Create `src/components/approvals/priority-badge.tsx` - color-coded priority badge
- [ ] Create `src/stores/approval-filters-store.ts` - Zustand store for filter state

### Phase 10: Emergency Stop
- [ ] Create `src/app/api/v1/emergency-stop/route.ts` - POST toggle (admin/owner only, cancels all pending on activate)
- [ ] Create `src/app/(dashboard)/emergency/page.tsx` - emergency controls page
- [ ] Create `src/components/emergency/emergency-stop-button.tsx` - big red button with confirmation dialog
- [ ] Create `src/components/emergency/emergency-status.tsx` - banner when emergency stop is active

### Phase 11: Callback Delivery
- [ ] Implement `deliverCallback()` in `src/lib/api/callbacks.ts`
  - [ ] POST to callback_url with decision payload
  - [ ] HMAC-SHA256 signature in `X-OKRunit-Signature` header
  - [ ] 10-second timeout per attempt
  - [ ] 3 retries with exponential backoff (1s, 2s, 4s)
- [ ] Wire callback delivery into approval response flow (PATCH) and lazy expiration

### Phase 12: Team Management
- [ ] Create `src/app/api/v1/team/invite/route.ts` - POST: create org_invite + send email via Resend
- [ ] Create `src/app/api/v1/team/members/route.ts` - GET (list), PATCH (update role), DELETE (remove)
- [ ] Create `src/app/(auth)/invite/[token]/page.tsx` - validate token → join org or redirect to signup
- [ ] Create `src/app/(dashboard)/team/page.tsx` - team management page
- [ ] Create `src/app/(dashboard)/team/loading.tsx` - loading state
- [ ] Create `src/components/team/member-list.tsx` - org members with roles + remove button
- [ ] Create `src/components/team/invite-form.tsx` - email input + role select
- [ ] Create `src/components/team/pending-invites.tsx` - pending invites with revoke option

### Phase 13: Notifications - Web Push
- [ ] Create `public/sw.js` - service worker for push events + notification click routing + quick-approve
- [ ] Create `src/lib/notifications/channels/web-push.ts` - VAPID-signed push, auto-cleanup of 410 subscriptions
- [ ] Create `src/app/api/v1/push/subscribe/route.ts` - store push subscription
- [ ] Create `src/app/api/v1/push/unsubscribe/route.ts` - remove push subscription
- [ ] Create `src/hooks/use-push-notifications.ts` - register SW, request permission, manage subscription
- [ ] Create `src/components/notifications/push-permission-prompt.tsx` - prompt to enable push

### Phase 14: Notifications - Email
- [ ] Create `src/lib/notifications/channels/email.ts` - Resend adapter with HTML templates
- [ ] Create `src/lib/notifications/tokens.ts` - `generateActionToken()` + `validateAndConsumeToken()` (crypto random, single-use, 72h expiry)
- [ ] Create `src/app/api/email-actions/[token]/route.ts` - one-click approve/reject from email links

### Phase 15: Notifications - Slack
- [ ] Create `src/lib/notifications/channels/slack.ts` - Block Kit messages with interactive buttons
- [ ] Create `src/app/api/slack/interact/route.ts` - verify Slack signature, apply decision, update message

### Phase 16: Notification Orchestrator
- [ ] Create `src/lib/notifications/types.ts` - NotificationEvent, channel types, payload types
- [ ] Create `src/lib/notifications/filters.ts` - `shouldNotify()` with quiet hours + priority threshold
- [ ] Create `src/lib/notifications/orchestrator.ts` - load settings → filter → fan-out to channels in parallel
- [ ] Wire orchestrator into approval creation (POST) and response (PATCH) flows
- [ ] Create `src/components/notifications/notification-bell.tsx` - bell icon with unread count
- [ ] Create `src/stores/notification-store.ts` - Zustand store for unread count

### Phase 17: Real-time Updates
- [ ] Create `src/hooks/use-realtime.ts` - generic Supabase Realtime subscription hook
- [ ] Create `src/hooks/use-approvals.ts` - approval-specific: merges INSERT/UPDATE/DELETE into local state
- [ ] Create `src/hooks/use-connections.ts` - connection data hook
- [ ] Wire realtime into approval-dashboard.tsx (initial data from server, live updates from client)

### Phase 18: Audit Log
- [ ] Create `src/app/(dashboard)/audit-log/page.tsx` - audit log viewer (server component)
- [ ] Create `src/app/(dashboard)/audit-log/loading.tsx` - loading state
- [ ] Create `src/components/audit/audit-log-table.tsx` - paginated table with filters

### Phase 19: Connection Management UI
- [ ] Create `src/app/(dashboard)/connections/page.tsx` - connection management page
- [ ] Create `src/app/(dashboard)/connections/loading.tsx` - loading state
- [ ] Create `src/components/connections/connection-list.tsx` - connection cards with stats
- [ ] Create `src/components/connections/connection-card.tsx` - name, prefix, status, last used
- [ ] Create `src/components/connections/connection-form.tsx` - create dialog with one-time API key display

### Phase 20: Settings Page
- [ ] Create `src/app/(dashboard)/settings/page.tsx` - notification preferences
- [ ] Notification channel toggles (web push, email, Slack)
- [ ] Quiet hours configuration (start time, end time, timezone)
- [ ] Minimum priority threshold
- [ ] Slack webhook URL configuration

### Phase 21: Approval Comments Thread
- [ ] Create `src/app/api/v1/approvals/[id]/comments/route.ts` - GET (list) + POST (add comment)
  - [ ] Both session users AND API key connections can post comments (enables back-and-forth with requesting system)
- [ ] Create `src/components/approvals/approval-comments.tsx` - threaded comment list with reply form
- [ ] Add realtime subscription for new comments on the detail view
- [ ] Wire comments into approval-detail.tsx

### Phase 22: Webhook Delivery Log
- [ ] Update `deliverCallback()` in `src/lib/api/callbacks.ts` to log every attempt to `webhook_delivery_log` table
- [ ] Create `src/app/(dashboard)/webhooks/page.tsx` - webhook delivery log viewer
- [ ] Create `src/components/webhooks/delivery-log-table.tsx` - table with status badges, timing, expandable response bodies
- [ ] Create `src/components/webhooks/delivery-log-filters.tsx` - filter by status, connection, date range
- [ ] Add webhook log link to approval detail view (show delivery status for that approval)

### Phase 23: Auto-Approve Rules
- [ ] Create `src/lib/api/rules-engine.ts` - evaluate rules against incoming approval requests
- [ ] Create `src/app/api/v1/rules/route.ts` - GET (list) + POST (create) rules
- [ ] Create `src/app/api/v1/rules/[id]/route.ts` - PATCH (update) + DELETE rules
  - [ ] Match conditions: priority level, connection ID, action_type glob/regex, business hours
  - [ ] Actions: auto-approve (skip human), route to specific approvers
- [ ] Wire rules engine into POST /api/v1/approvals (after validation, before insert)
- [ ] Create `src/app/(dashboard)/rules/page.tsx` - rules management page
- [ ] Create `src/components/rules/rule-list.tsx` - list of rules with priority ordering (drag to reorder)
- [ ] Create `src/components/rules/rule-form.tsx` - create/edit rule with condition builder UI

### Phase 24: Multi-Approver Workflows
- [ ] Update approval creation to support `required_approvals` field (default 1)
- [ ] Update PATCH /api/v1/approvals/[id] to record votes instead of directly deciding
  - [ ] When vote count reaches `required_approvals` → mark as approved + fire callback
  - [ ] Any rejection → mark as rejected + fire callback (or configurable: require N rejections)
- [ ] Create `src/components/approvals/approval-votes.tsx` - show who has voted and current tally
- [ ] Update approval-detail.tsx to show vote progress bar (e.g., "2 of 3 approvals received")
- [ ] Update notifications to show "X more approvals needed"

### Phase 25: Batch Approvals
- [ ] Add multi-select checkboxes to approval-list.tsx
- [ ] Create `src/components/approvals/batch-actions-bar.tsx` - sticky bar with "Approve Selected (N)" / "Reject Selected (N)" buttons
- [ ] Create `src/app/api/v1/approvals/batch/route.ts` - POST: batch approve/reject multiple IDs
- [ ] Wire batch actions into the approval dashboard

### Phase 26: Dashboard Stats & Analytics
- [ ] Create `src/components/analytics/stats-cards.tsx` - pending count, approval rate, avg response time, volume this week
- [ ] Wire stats-cards into dashboard page (show above approval list)
- [ ] Create `src/app/api/v1/analytics/route.ts` - GET: aggregate stats (counts, averages, time series)
- [ ] Create `src/app/(dashboard)/analytics/page.tsx` - analytics page
- [ ] Create `src/components/analytics/response-time-chart.tsx` - avg response time by priority/connection over time
- [ ] Create `src/components/analytics/volume-chart.tsx` - approval creation/decision volume over time
- [ ] Create `src/components/analytics/approval-rate-chart.tsx` - approval vs rejection rate

### Phase 27: Anomaly Detection
- [ ] Create `src/lib/api/anomaly-detection.ts` - detect unusual patterns:
  - [ ] Spike detection: > N critical approvals in M minutes from same connection
  - [ ] Volume anomaly: approval rate > X% above rolling average
  - [ ] Rapid-fire detection: same connection submitting faster than rate limit
- [ ] Wire anomaly detection into POST /api/v1/approvals
- [ ] On anomaly: auto-trigger emergency stop (configurable) + send alert notification
- [ ] Create `src/components/emergency/anomaly-alert.tsx` - alert card showing what triggered the anomaly
- [ ] Add anomaly detection settings to org settings

### Phase 28: API Key Rotation
- [ ] Create `src/app/api/v1/connections/[id]/rotate/route.ts` - POST: generate new key, old key stays active for grace period
- [ ] Add `rotated_at`, `previous_key_hash`, `previous_key_expires_at` columns to connections table (migration)
- [ ] Update `src/lib/api/auth.ts` to check both current and previous key during grace period
- [ ] Create `src/components/connections/key-rotation-dialog.tsx` - rotation UI with grace period selector

### Phase 29: Webhook Playground
- [ ] Create `src/app/(dashboard)/playground/page.tsx` - interactive API testing tool
- [ ] Create `src/components/playground/request-builder.tsx` - form to build API requests (method, headers, body)
- [ ] Create `src/components/playground/response-viewer.tsx` - formatted response display with status, headers, body
- [ ] Create `src/components/playground/code-snippets.tsx` - auto-generated curl/Python/Node code snippets for the current request
- [ ] Pre-fill with user's API key and common request templates

### Phase 30: Rate Limiting
- [ ] Create `src/lib/api/rate-limiter.ts` - sliding window rate limiter using Supabase (count recent requests per connection)
- [ ] Wire rate limiter into POST /api/v1/approvals - return 429 when exceeded (uses `rate_limit_per_hour` from connections table, already in schema)
- [ ] Add rate limit headers to API responses: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] Show rate limit status on connection cards in dashboard

### Phase 31: Connection Scoping
- [ ] Update POST /api/v1/approvals to enforce connection scoping (uses `allowed_action_types`, `max_priority`, `scoping_rules` already in connections schema):
  - [ ] Reject if action_type not in allowed list
  - [ ] Reject if priority exceeds max_priority
  - [ ] Reject if IP not in allowlist (if configured)
- [ ] Create `src/components/connections/scoping-form.tsx` - UI to configure scoping rules per connection

### Phase 32: Approval Comments via API
- [ ] Extend POST /api/v1/approvals/[id]/comments to accept API key auth
- [ ] This enables external systems to respond to clarifying questions from approvers
- [ ] Add notification dispatch when a new comment is posted

### Phase 33: Approval Attachments
- [ ] Configure Supabase Storage bucket `approval-attachments` (via Supabase dashboard)
- [ ] Create `src/app/api/v1/approvals/[id]/attachments/route.ts` - POST (upload) + GET (list)
- [ ] Create `src/components/approvals/attachment-list.tsx` - file list with download links + thumbnails for images
- [ ] Create `src/components/approvals/attachment-upload.tsx` - drag-and-drop file upload
- [ ] Wire attachments into approval-detail.tsx

### Phase 34: Approval Search & Saved Filters
- [ ] Add full-text search to GET /api/v1/approvals (search across title, description, metadata)
- [ ] Create `src/app/api/v1/saved-filters/route.ts` - CRUD for saved filters (uses `saved_filters` table already in schema)
- [ ] Create `src/components/approvals/saved-filters.tsx` - dropdown to select/save/delete filter presets
- [ ] Update approval-filters.tsx with full-text search input + date range picker

### Phase 35: Dark Mode
- [ ] Update `src/app/layout.tsx` with ThemeProvider (next-themes already installed in Phase 1)
- [ ] Create `src/components/layout/theme-toggle.tsx` - light/dark/system toggle
- [ ] Add theme toggle to header or sidebar
- [ ] Verify all components render correctly in dark mode

### Phase 36: Polish & Final Testing
- [ ] Add `src/app/not-found.tsx` - 404 page
- [ ] Wire up toast notifications for action feedback (approved, rejected, error)
- [ ] Ensure responsive design (sidebar collapses on mobile via shadcn Sheet)
- [ ] Review and fix any TypeScript errors
- [ ] Test full E2E flow including all new features

---

## Verification Plan

### Manual E2E test
1. Start dev server (`npm run dev`)
2. Sign up → should auto-create org + profile
3. Create a connection → copy API key
4. Use `curl` to POST an approval request with the API key
5. Dashboard should show the new pending approval (realtime)
6. Click approve → should show confirmed status
7. Check callback was delivered to a test URL (use webhook.site or similar)
8. Test emergency stop → all pending approvals should be cancelled

### API smoke tests (curl)
```bash
# Create approval
curl -X POST http://localhost:3000/api/v1/approvals \
  -H "Authorization: Bearer gk_xxx" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test approval","priority":"high","callback_url":"https://webhook.site/xxx","metadata":{"test":true}}'

# Get status
curl http://localhost:3000/api/v1/approvals/<id> \
  -H "Authorization: Bearer gk_xxx"

# List pending
curl "http://localhost:3000/api/v1/approvals?status=pending" \
  -H "Authorization: Bearer gk_xxx"
```

### Notification testing
- Web push: enable in browser, create approval, verify notification appears
- Email: create approval, check Resend dashboard for delivery, test one-click links
- Slack: configure webhook URL, create approval, verify Slack message, test buttons

### Advanced feature testing
- Multi-approver: create approval with required_approvals=2, verify it stays pending after first vote, resolves after second
- Auto-approve: create a rule, submit matching approval, verify it auto-approves without human intervention
- Batch approvals: select multiple pending approvals, batch approve, verify all updated + callbacks fired
- Rate limiting: set rate_limit_per_hour=5 on connection, submit 6 requests, verify 6th gets 429
- Connection scoping: restrict connection to action_type "deploy", submit "delete" action, verify rejected
- Comments: post comment from dashboard user, post reply from API key, verify thread renders
- Attachments: upload file via API, verify it appears in approval detail view
- Webhook log: approve request with callback, check webhook delivery log shows attempt details
- Analytics: create several approvals over time, verify stats cards and charts render correctly
- API key rotation: rotate key, verify old key works during grace period, fails after
- Anomaly detection: rapidly submit many critical approvals, verify emergency stop triggers

---

## Future Feature Ideas (not in current scope)

### Approval Policies & Automation (extended)
- [ ] **Escalation chains** - if no one responds within X minutes, escalate to the next tier of approvers
- [ ] **Approval templates** - pre-defined approval types with default priority, timeout, required approvers
- [ ] **Conditional routing** - route approvals to different people based on metadata (e.g., financial > $10k → CFO)

### Security & Compliance
- [ ] **SSO/SAML** - enterprise single sign-on (Supabase Auth supports SAML)
- [ ] **Audit log export** - CSV/JSON export of audit logs for compliance
- [ ] **Data retention policies** - auto-delete old approval data after configurable period
- [ ] **Webhook signature verification docs** - guide for external systems to verify OKRunit callbacks

### Developer Experience (extended)
- [ ] **SDK packages** - `@okrunit/node`, `@okrunit/python` client libraries with typed methods
- [ ] **Approval request dry-run** - validate without creating (useful for testing integrations)
- [ ] **OpenAPI spec** - auto-generated or hand-written OpenAPI 3.0 spec

### Notification Enhancements
- [ ] **Microsoft Teams integration** - Adaptive Cards with approve/reject buttons
- [ ] **Discord integration** - webhook notifications with buttons
- [ ] **SMS notifications** - for critical priority approvals (via Twilio)
- [ ] **Digest mode** - batch low-priority notifications into periodic summary emails
- [ ] **Custom notification templates** - let orgs customize email/Slack content

### Platform Integrations
- [ ] **Zapier app** - native Zapier integration on the marketplace
- [ ] **Make.com module** - custom module for Make scenarios
- [ ] **n8n community node** - `n8n-nodes-okrunit` npm package
- [ ] **GitHub Actions** - action that pauses a workflow for human approval
- [ ] **Terraform provider** - `terraform-provider-okrunit` for infrastructure approval gates

### Advanced Features
- [ ] **Approval groups/categories** - organize approvals by type (deploys, access, financial)
- [ ] **Scheduled approvals** - approve but delay execution until a specific time
- [ ] **Approval delegation** - "I'm on vacation, delegate my approvals to X until Y date"
- [ ] **Undo window** - 30-second window to undo before callback fires
- [ ] **Desktop app (Tauri)** - system tray app with native notifications
- [ ] **Mobile app (Expo)** - native push notifications + approve from phone

### Self-Hosting & Enterprise
- [ ] **Docker compose** - one-command self-hosted deployment
- [ ] **Helm chart** - Kubernetes deployment
- [ ] **Custom branding** - logo, colors, custom domain
- [ ] **On-premise deployment guide** - run entirely within customer's infrastructure

---

## Complete File Manifest (~115 files)

```
# Root config (auto-generated + manual)
package.json                              # Auto-generated by create-next-app
tsconfig.json                             # Auto-generated
next.config.ts                            # Auto-generated
tailwind.config.ts                        # Auto-generated
postcss.config.mjs                        # Auto-generated
.eslintrc.json                            # Auto-generated
components.json                           # Auto-generated by shadcn init
.env.example                              # Committed, empty values
.env.local                                # Gitignored, user fills in
.gitignore                                # node_modules, .next, .env.local, .env*.local

src/
  middleware.ts

  app/
    layout.tsx                            # Root layout: fonts, metadata, ThemeProvider
    page.tsx                              # Landing page or redirect to /dashboard
    not-found.tsx                         # 404 page
    globals.css                           # Tailwind imports + shadcn CSS vars

    (auth)/
      layout.tsx                          # Centered layout for auth pages
      login/page.tsx
      login/login-form.tsx
      signup/page.tsx
      signup/signup-form.tsx
      callback/route.ts                   # Supabase auth callback
      invite/[token]/page.tsx             # Accept team invite

    (dashboard)/
      layout.tsx                          # Auth guard + sidebar + header
      dashboard/page.tsx                  # Main approval dashboard
      dashboard/loading.tsx
      dashboard/error.tsx
      connections/page.tsx                # Connection management
      connections/loading.tsx
      team/page.tsx                       # Team members + invites
      team/loading.tsx
      audit-log/page.tsx                  # Audit log viewer
      audit-log/loading.tsx
      emergency/page.tsx                  # Emergency controls
      settings/page.tsx                   # Notification preferences
      webhooks/page.tsx                   # Webhook delivery log
      webhooks/loading.tsx
      analytics/page.tsx                  # Analytics dashboard
      analytics/loading.tsx
      rules/page.tsx                      # Auto-approve rules
      rules/loading.tsx
      playground/page.tsx                 # API playground
      playground/loading.tsx

    api/
      v1/
        approvals/route.ts                # POST (create) + GET (list)
        approvals/[id]/route.ts           # GET (single) + PATCH (respond) + DELETE (cancel)
        approvals/[id]/comments/route.ts  # GET (list) + POST (add comment)
        approvals/[id]/attachments/route.ts # POST (upload) + GET (list)
        approvals/batch/route.ts          # POST: batch approve/reject
        emergency-stop/route.ts           # POST: toggle emergency stop
        connections/route.ts              # GET (list) + POST (create)
        connections/[id]/route.ts         # PATCH (update) + DELETE (deactivate)
        connections/[id]/rotate/route.ts  # POST: API key rotation
        team/invite/route.ts              # POST: send invite
        team/members/route.ts             # GET, PATCH, DELETE
        rules/route.ts                    # GET (list) + POST (create)
        rules/[id]/route.ts              # PATCH (update) + DELETE
        analytics/route.ts               # GET: aggregate stats
        saved-filters/route.ts           # GET, POST, DELETE
        push/subscribe/route.ts          # POST: store push subscription
        push/unsubscribe/route.ts        # POST: remove push subscription
      email-actions/[token]/route.ts      # GET: one-click approve/reject from email
      slack/interact/route.ts             # POST: Slack interactive callback

  lib/
    supabase/
      client.ts                           # Browser Supabase client
      server.ts                           # Server Supabase client (cookies)
      admin.ts                            # Service role client (bypasses RLS)
      middleware.ts                        # Session refresh helper
    api/
      auth.ts                             # Dual auth (API key + session), ApiError, hashApiKey
      errors.ts                           # errorResponse() helper
      validation.ts                       # Zod schemas for all API inputs
      audit.ts                            # logAuditEvent() helper
      callbacks.ts                        # deliverCallback() with HMAC + retries + logging
      rate-limiter.ts                     # Sliding window rate limiter
      rules-engine.ts                     # Auto-approve rule evaluation
      anomaly-detection.ts                # Spike/volume anomaly detection
    notifications/
      types.ts                            # NotificationEvent, channel types
      orchestrator.ts                     # Fan-out dispatcher
      filters.ts                          # shouldNotify() - quiet hours + priority
      tokens.ts                           # Email action token generate/validate
      channels/
        web-push.ts                       # VAPID-signed push adapter
        email.ts                          # Resend email adapter
        slack.ts                          # Slack Block Kit adapter
    types/
      database.ts                         # TypeScript types for all tables
    constants.ts                          # App-wide constants

  components/
    ui/                                   # shadcn (auto-generated)
    layout/
      sidebar.tsx                         # Nav links + pending badge + user info
      header.tsx                          # Page title + notification bell + emergency indicator
      theme-toggle.tsx                    # Dark mode toggle
    landing/
      hero.tsx                            # Landing page hero section
    approvals/
      approval-dashboard.tsx              # Client wrapper with realtime + filters
      approval-list.tsx                   # Renders list of approval cards
      approval-card.tsx                   # Title, priority, status, connection, timestamp
      approval-detail.tsx                 # Dialog: context_html + metadata + response form + comments + attachments
      approval-response-form.tsx          # Approve/reject buttons + comment textarea
      approval-filters.tsx                # Filter bar: status, priority, search, date range
      approval-votes.tsx                  # Multi-approver vote progress
      approval-comments.tsx               # Threaded comment list + reply form
      attachment-list.tsx                 # File list with download links + thumbnails
      attachment-upload.tsx               # Drag-and-drop file upload
      batch-actions-bar.tsx               # Sticky bar for batch approve/reject
      saved-filters.tsx                   # Saved filter dropdown
      priority-badge.tsx                  # Color-coded priority badge
    connections/
      connection-list.tsx                 # Connection cards with stats
      connection-card.tsx                 # Name, prefix, status, last used, rate limit
      connection-form.tsx                 # Create dialog with one-time API key display
      key-rotation-dialog.tsx             # API key rotation with grace period
      scoping-form.tsx                    # Connection scoping rules config
    team/
      member-list.tsx                     # Org members with roles + remove
      invite-form.tsx                     # Email + role invite form
      pending-invites.tsx                 # Pending invites with revoke
    emergency/
      emergency-stop-button.tsx           # Big red button with confirmation
      emergency-status.tsx                # Banner when active
      anomaly-alert.tsx                   # Anomaly detection alert card
    audit/
      audit-log-table.tsx                 # Paginated table with filters
    analytics/
      stats-cards.tsx                     # Pending, rate, avg time, volume
      response-time-chart.tsx             # Response time over time (recharts)
      volume-chart.tsx                    # Volume over time (recharts)
      approval-rate-chart.tsx             # Approval vs rejection rate (recharts)
    webhooks/
      delivery-log-table.tsx              # Webhook delivery log
      delivery-log-filters.tsx            # Filter by status, connection, date
    rules/
      rule-list.tsx                       # Auto-approve rules (drag to reorder)
      rule-form.tsx                       # Rule condition builder UI
    playground/
      request-builder.tsx                 # API request form
      response-viewer.tsx                 # Formatted response display
      code-snippets.tsx                   # Auto-generated curl/Python/Node code
    notifications/
      push-permission-prompt.tsx          # Prompt to enable push
      notification-bell.tsx               # Bell icon with unread count

  hooks/
    use-realtime.ts                       # Generic Supabase Realtime hook
    use-approvals.ts                      # Approval-specific realtime
    use-connections.ts                    # Connection data hook
    use-push-notifications.ts             # Push subscription management

  stores/
    approval-filters-store.ts             # Filter state (Zustand)
    notification-store.ts                 # Unread count (Zustand)

public/
  sw.js                                   # Service worker for push notifications

supabase/
  migrations/
    001_initial_schema.sql                # All tables, enums, triggers, RLS, indexes, realtime
```

---

### Phase 14: Messaging Platform Approval Channels

Enable users to receive approval requests and approve/reject them directly from messaging platforms they already use. Each channel sends interactive messages (buttons/cards) and processes responses back to OKRunit.

**Platforms:**
- [ ] **Discord** — Bot with slash commands and interactive button components
  - [ ] Discord bot application setup (OAuth2, bot token)
  - [ ] Approval request → Discord embed with Approve/Reject buttons
  - [ ] Button interaction handler → calls OKRunit API to record decision
  - [ ] Channel/role-based routing (send to specific channels per org/team)
  - [ ] Thread-based comments on approval requests
  - [ ] `/okrunit` slash command for listing/searching approvals

- [ ] **Slack** — Enhance existing Slack integration with full interactive workflow
  - [ ] Expand existing Slack notification channel to support interactive blocks
  - [ ] Approval request → Slack Block Kit message with Approve/Reject buttons
  - [ ] Interactive message handler → records decision via API
  - [ ] Channel routing configuration per org/team
  - [ ] Thread replies for comments
  - [ ] `/okrunit` slash command
  - [ ] Slack App Directory submission

- [ ] **Microsoft Teams** — Bot with Adaptive Cards
  - [ ] Teams bot registration (Azure Bot Service)
  - [ ] Approval request → Adaptive Card with action buttons
  - [ ] Bot Framework message handler → records decision
  - [ ] Channel/team routing configuration
  - [ ] Threaded replies for comments
  - [ ] Teams App Store submission

- [ ] **Telegram** — Bot with inline keyboard buttons
  - [ ] Telegram bot setup via BotFather
  - [ ] Approval request → message with inline Approve/Reject keyboard
  - [ ] Callback query handler → records decision
  - [ ] Group/channel routing

**Shared Infrastructure:**
- [ ] Messaging channel configuration UI in dashboard (connect/disconnect platforms)
- [ ] Per-org channel routing rules (which approvals go to which channels)
- [ ] Unified message delivery with retry logic (extend existing notification orchestrator)
- [ ] `decision_source` enum additions: `discord`, `teams`, `telegram` (Slack already exists)
- [ ] Database: `messaging_connections` table for storing bot tokens/webhook URLs per org
- [ ] Security: token encryption at rest, webhook signature verification per platform

**Self-Hosted Infrastructure Support:**
- [ ] All bots/integrations can run on customer infrastructure (no dependency on OKRunit servers)
- [ ] Docker images for each bot (Discord, Slack, Teams, Telegram)
- [ ] Helm chart for Kubernetes deployment
- [ ] Environment variable configuration (API key, bot tokens, channel mappings)
- [ ] Documentation for self-hosted setup per platform
