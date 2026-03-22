# OKRunit Approval Gate — GitHub Action

A GitHub Action that pauses a workflow until a human approves or rejects via [OKRunit](https://okrunit.com).

## Quick Start

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Request deployment approval
        id: approval
        uses: okrunit/approval-gate@v1
        with:
          api-key: ${{ secrets.OKRUNIT_API_KEY }}
          title: "Deploy ${{ github.ref_name }} to production"
          description: "Commit: ${{ github.event.head_commit.message }}"
          priority: high
          timeout: 1800

      - name: Deploy
        run: |
          echo "Approved by ${{ steps.approval.outputs.decided-by }}"
          echo "Deploying..."
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | Yes | — | OKRunit API key (`gk_...`) |
| `api-url` | No | `https://app.okrunit.com` | OKRunit instance URL |
| `title` | No | Auto-generated | Approval title (defaults to workflow name) |
| `description` | No | — | Context for the reviewer |
| `priority` | No | `medium` | `low`, `medium`, `high`, or `critical` |
| `metadata` | No | — | JSON metadata (merged with GitHub context) |
| `timeout` | No | `3600` | Max wait time in seconds |
| `poll-interval` | No | `10` | Polling interval in seconds |

## Outputs

| Output | Description |
|--------|-------------|
| `approval-id` | The approval request UUID |
| `status` | `approved`, `rejected`, or `timeout` |
| `description` | Description of the approval request |
| `priority` | Priority level (low, medium, high, critical) |
| `source` | Source platform (github-actions) |
| `action-type` | Action type of the approval |
| `required-approvals` | Number of required approvals |
| `current-approvals` | Number of current approvals |
| `updated-at` | ISO timestamp of the last update |
| `decided-by` | Name of the decider |
| `decided-at` | ISO timestamp of the decision |
| `decision-comment` | Comment from the decider |

## Behavior

- **Approved**: The step succeeds, downstream steps run
- **Rejected**: The step fails with the rejection comment as the error
- **Timeout**: The step fails with a timeout message

GitHub context (repo, workflow, run ID, actor, ref, SHA) is automatically included in the approval metadata.

## CLI Workflow

Use the `gh` CLI for a seamless experience:

```bash
# Store your API key as a repo secret
gh secret set OKRUNIT_API_KEY

# Trigger a workflow that includes an approval gate
gh workflow run deploy.yml

# Watch the run (will show "waiting for approval" status)
gh run watch

# Check the latest run status
gh run list --workflow=deploy.yml --limit=5

# View run details including approval outputs
gh run view <run-id>
```

## Advanced: Conditional Approval

Only require approval for production, skip for staging:

```yaml
- name: Approval gate
  if: github.ref == 'refs/heads/main'
  uses: okrunit/approval-gate@v1
  with:
    api-key: ${{ secrets.OKRUNIT_API_KEY }}
    title: "Production deploy: ${{ github.event.head_commit.message }}"
    priority: critical
```

## Development

```bash
cd integrations/github-actions
npm install
npm run build

# The dist/ folder must be committed for GitHub Actions
git add dist/
```

## Publishing

1. Create a separate repo (e.g., `okrunit/approval-gate`)
2. Copy the contents of this directory
3. Run `npm install && npm run build`
4. Commit everything including `dist/`
5. Tag a release: `git tag v1 && git push --tags`
