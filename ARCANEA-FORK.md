# Arcanea Studio — Fork Provenance

**Upstream:** [Anil-matcha/Open-Generative-AI](https://github.com/Anil-Matcha/Open-Generative-AI) @ commit `6f9cdeeb47b42b833c5be2d181fd5dc95abaa09a`
**Forked:** 2026-04-20
**By:** Frank Riemer (Arcanea)
**License status:** ⚠ UPSTREAM HAS NO LICENSE FILE — keep this repo **private** until clarified with @matchaman11. Do not publish releases. Do not distribute the Electron binary with Arcanea branding until license is confirmed.

## Why forked
Upstream ships 200+ image/video/lipsync/cinema models through a Muapi.ai-coupled Electron+Next shell. Arcanea replaces the single-vendor router with `@arcanea/router-spec@1.0.2` and wires the four studios (Image/Video/LipSync/Cinema) to the Luminor hierarchy (Artisan/Director/Oracle/Cinematographer). Full plan in `C:\Users\frank\vibeclubs.ai\ARCANEA-STUDIO-EVOLUTION.md`.

## Next steps on your laptop

```powershell
cd C:\Users\frank\Arcanea\forks\arcanea-studio

# Fresh git init (no upstream history pulled — clean start)
git init
git add -A
git commit -m "chore(fork): initial import of Open-Generative-AI @ 6f9cdee as arcanea-studio"

# Private remote (license-gated)
gh repo create frankxai/arcanea-studio --private --source=. --remote=origin --push

# Migrate npm → pnpm (Arcanea CLAUDE.md rule)
rm package-lock.json
pnpm install

# One-shot build verify (don't leave dev server running — 16GB rule)
pnpm build

# When Phase 1 router work starts, create the branch
git checkout -b arc-studio-02-router-adapter
```

## Prod deps install verified in sandbox (Apr 20)
`npm install --omit=dev` resolved 42 packages (Next 15 + React 19 + tailwind-v4) in 17s, 261MB. `node_modules/.bin/next` present. Build chain intact.

Dev dependencies (electron, vite, electron-builder) not installed in sandbox — too large for session limits. Install locally with full `pnpm install` before attempting `pnpm electron:build:win`.
