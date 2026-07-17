# Repository Instructions

This repo is part of the FrankX / Starlight / Arcanea agent estate.

## Classification

- Repo: `arcanea-studio`
- Class: Next.js app (`@arcanea/studio`) — multi-model generative media surface, forked from Anil Matcha's Open-Generative-AI and rearchitected for Arcanea's Luminor hierarchy and provider routing. Status: alpha (`v0.1.0-alpha.0`).
- Default health command: `npm run lint` (`next lint`). Full check: `pnpm install --ignore-workspace && pnpm --ignore-workspace exec next build`.
- Remote: https://github.com/frankxai/arcanea-studio

## What this repo is

200+ image/video/lipsync/cinema models (Nano Banana 2, Flux, Ideogram, Seedream, Sora, Veo, Kling, Seedance, Wan, Grok Imagine, Runway, and more) wired through a provider-agnostic router at `src/lib/router/` — the Arcanea wedge over the upstream project's hard-coded Muapi.ai coupling. Upstream is tracked as the `upstream` git remote for cherry-picking (`docs/UPSTREAM-SYNC.md`). Roadmap (README) runs Phase 0 (fork/rebrand, done) through Phase 6 (hosted tier); current work is Phase 2 (Arcanea design-system skin, TypeScript migration).

## Agent Rules

- Read this file before making changes.
- Preserve existing user work and unrelated dirty files.
- Keep edits scoped to the requested task.
- Prefer existing repo conventions over new abstractions.
- Run the health command before handoff when feasible.
- Do not publish secrets, private memory, credentials, or internal-only strategy.

## Class-Specific Guidance

- Preserve upstream attribution — see `NOTICE` for the full record of modifications from Open-Generative-AI. Never strip the upstream credit when touching router/provider code.
- Router changes go in `src/lib/router/` — read `src/lib/router/README.md` for the dispatch contract before adding a new provider or task mapping; don't couple UI code directly to a specific provider (muapi/gemini/fal/replicate) the way upstream did.
- Studio outputs are media assets for a world repo, not an alternate canon source — when a world is selected, treat `@arcanea/world-sdk` (`world.arcanea.json`, visual DNA, characters, locations) as the canonical creative brief and propose outputs back as files/PRs against the world repo rather than storing them as a separate source of truth.
- When syncing from upstream (`git fetch upstream`), review the diff for anything that reintroduces the hard Muapi.ai coupling this fork exists to remove.

## Handoff

Summarize changed files, validation run, risks, and any follow-up needed.

## Design Taste Kernel

For any site, app, landing page, dashboard, visual identity, brand, motion, media, social, or frontend task, apply the shared Design Taste Kernel before handoff:

- C:\Users\frank\starlight\repos\DESIGN_TASTE.md
- C:\Users\frank\starlight\repos\WEB_EXPERIENCE_STANDARD.md
- C:\Users\frank\starlight\repos\MOTION_TASTE_RUBRIC.md
- C:\Users\frank\starlight\repos\MULTI_AGENT_DESIGN_COUNCIL.md
- C:\Users\frank\starlight\repos\VISUAL_QA_GATE.md

When motion, scroll, generated media, GIF/video, or premium polish matters, route through the Motion Design Studio plugin/skills and verify the result visually. This repo also inherits the Arcanea brand pack at `../starlight-design-intelligence/brand-packs/arcanea/` — the Phase 2 design-system skin work (Atlantean Teal / Cosmic Blue / Gold, Geist + Instrument Serif) should draw from it rather than inventing a new palette.
