# OKRunit

Human-in-the-loop approval gateway for automated workflows.

## Key References

- **Integration Module Specs:** `integrations/shared/module-specs.md` — Canonical reference for all platform integration modules (Zapier, Make, n8n, etc.). Always reference this file when building or modifying integration modules to ensure consistency across platforms. All integrations must match the field names, output types, filter options, and sample data defined there.

- **Shared Constants:** `integrations/shared/constants.ts` — Shared field definitions, statuses, priorities, and endpoint paths used across integrations.

## Integration Development

When creating or modifying any integration module (trigger, action, or search):

1. Reference `integrations/shared/module-specs.md` for the canonical spec
2. Ensure output fields match exactly across all platforms
3. All approval creation actions must set `source` to the platform name
4. All approval creation actions must auto-generate an idempotency key
5. Filter options must include all statuses and priorities defined in the spec
6. Use OAuth 2.0 for authentication on all platforms
