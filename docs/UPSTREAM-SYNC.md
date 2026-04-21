# Upstream Sync Procedure

**Upstream:** `Anil-Matcha/Open-Generative-AI` (remote name `upstream`)
**Our fork base:** commit `6f9cdee` (2026-04-20)
**Strategy:** selective cherry-pick of upstream improvements; we do NOT track upstream `main` with merges because our rebrand touches `package.json`, `muapi.js`, and will touch more.

## One-time setup (already done in this repo)

```bash
git remote add upstream https://github.com/Anil-Matcha/Open-Generative-AI.git
git fetch upstream --depth=1
```

## Check for upstream changes

```bash
git fetch upstream
git log --oneline 6f9cdee..upstream/main   # commits since our fork base
```

If nothing, upstream hasn't moved. If there are commits, review them — most will be provider-catalog updates (new models in `models_dump.json`), which are usually safe to cherry-pick; some will be Muapi-coupled features that we'll rewrite through the router.

## Safe cherry-pick (recommended pattern)

```bash
git fetch upstream
git checkout -b sync/upstream-YYYY-MM-DD
git cherry-pick <commit-sha>           # one at a time
# resolve conflicts — expect package.json, README.md, muapi.js
pnpm --ignore-workspace install
pnpm --ignore-workspace exec next build
git checkout main && git merge --no-ff sync/upstream-YYYY-MM-DD
```

## What to always cherry-pick

- Updates to `models_dump.json` / `src/lib/models.js` — new model endpoints
- Bug fixes in `packages/studio/src/components/*.jsx` — upstream UI patches
- Electron shell fixes in `electron/main.js`

## What to NEVER auto-merge

- Anything in `src/lib/muapi.js` — we replaced this with the router shim; upstream changes should be ported into `src/lib/router/providers/muapi.js` instead
- `package.json` — our branding and `@arcanea/router-spec` dep must survive
- `README.md` — ours diverges on branding
- `build/` Electron icons — we will replace these with Arcanea mark

## Automated alert (future work)

A GitHub Action that runs `git fetch upstream && git log --oneline <base>..upstream/main` weekly and opens an issue when upstream moves. Lives in `.github/workflows/upstream-watch.yml` — not shipped yet; file a ticket when we make the repo public.
