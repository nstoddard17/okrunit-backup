# OKrunit

Human-in-the-loop approval gateway for automated workflows.

## Git Workflow — IMPORTANT

**NEVER push directly to `main`.** It is protected and will reject direct pushes.

Always use this workflow:
1. Create a feature branch: `git checkout -b <branch-name>`
2. Commit changes to the branch
3. Push the branch: `git push -u origin <branch-name>`
4. A GitHub Action will automatically create a PR and enable auto-merge
5. CI (lint, typecheck, tests, build) runs on the PR
6. If CI passes, the PR auto-merges to `main` via squash merge

**NEVER force push to any branch. NEVER disable branch protection.**

## Database Migrations — IMPORTANT

When you create a Supabase migration file in `supabase/migrations/`, you **MUST** push it immediately:

```bash
supabase db push --include-all
```

Always push migrations right after creating them. Do NOT leave unpushed migrations — they will cause runtime errors when code depends on schema changes that haven't been applied to the remote database.
