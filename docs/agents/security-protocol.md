# Security Protocol

Checklist for every agent iteration — run before committing and before ending a session.

## Pre-commit checks

Before `git add` / `git commit`, verify:

- [ ] No `.env*` file with real values is staged — only `.env.example` (placeholder values only) belongs in the repo
- [ ] No `.claude/` files are staged — `settings.local.json` contains absolute machine paths
- [ ] No `credentials*.json`, `serviceAccountKey.json`, or OAuth token files are staged
- [ ] No hardcoded secrets in code — grep for patterns like `sk-`, `ghp_`, `Bearer `, raw UUIDs used as keys
- [ ] `HANDOFF.md` and `hidden-docs/` remain untracked (both are in `.gitignore`)

Quick scan command:
```bash
git diff --cached | grep -iE "(password|secret|token|api_key|database_url)\s*=" | grep -v "your-" | grep -v "example" | grep -v "generate"
```

## Files that must never be committed

| File / pattern | Why |
|---|---|
| `.env.local`, `.env.production`, `.env.staging` | Real credentials |
| `.env.development`, `.env.test` | May contain local DB credentials |
| `.claude/settings.local.json` | Absolute filesystem paths, local permission grants |
| `HANDOFF.md` | Private planning / context handoff notes |
| `hidden-docs/` | Private research or personal notes |
| `scripts/seed-my-history.ts` | Personal attempt data |
| `credentials*.json` / `serviceAccountKey.json` | OAuth / GCP service account keys |

## If a secret is accidentally committed

1. **Do not push** if the commit hasn't been pushed yet — `git reset HEAD~1` to undo, remove the file, recommit
2. **If already pushed:** rotate the secret immediately (GitHub OAuth, DB password, etc.), then purge from history with `git filter-repo --path <file> --invert-paths` and force-push; contact GitHub support to clear cached views
3. Supabase DB passwords: Project Settings → Database → Reset password
4. GitHub OAuth secrets: github.com/settings/developers → regenerate client secret

## What is safe to commit

- `.env.example` — placeholder values only, no real credentials
- `CLAUDE.md` — project instructions, no secrets
- `docs/` — architecture, decisions, this file
- `problems.json` — static problem metadata, no user data
- All `src/` code — must not contain hardcoded credentials

## Gitignore maintenance

If you add a new file category that should stay local (personal scripts, local config, generated secrets), add it to `.gitignore` in the same commit that creates the file — before it can be accidentally staged.

Run `git check-ignore -v <file>` to verify a file is covered.
