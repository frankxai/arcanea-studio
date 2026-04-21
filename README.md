# Arcanea Studio

> Multi-model generative surface — 200+ image/video/lipsync/cinema models
> wired through a provider-agnostic router. Built on top of Anil Matcha's
> excellent [Open-Generative-AI](https://github.com/Anil-Matcha/Open-Generative-AI),
> rearchitected for Arcanea's Luminor hierarchy, lineage tracking, and
> Atelier-tier creator workflows.

**Status:** alpha (`v0.1.0-alpha.0`). Working. Router is real. Design system skin, Creation Cards, and Supabase lineage are in flight.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Ffrankxai%2Farcanea-studio&project-name=arcanea-studio&repository-name=arcanea-studio)

![Arcanea Studio](docs/assets/studio_demo.webp)

## What's in the box

| Surface | Models | Notes |
|---|---|---|
| **Image Studio** | 105+ (Nano Banana 2, Flux Dev/Pro, Ideogram, Seedream, Midjourney, Imagen) | t2i + i2i with multi-reference |
| **Video Studio** | 100+ (Sora, Veo, Kling, Seedance 2.0, Wan 2.2, Grok Imagine, Runway) | t2v + i2v |
| **LipSync Studio** | 9 (Infinite Talk, LTX Lipsync, …) | Portrait & video modes |
| **Cinema Studio** | 100+ with Camera/Lens/Focal/Aperture controls | Film-grammar prompt scaffolding |

## Router (the Arcanea wedge)

Upstream couples everything to Muapi.ai. Arcanea Studio abstracts this via `src/lib/router/`:

| Task | muapi | gemini (NB2) | fal | replicate |
|---|---|---|---|---|
| image.t2i | ✅ | ✅ | stub | stub |
| image.i2i | ✅ | ✅ | stub | stub |
| video.* | ✅ | ❌ → falls back | stub | stub |
| file.upload | ✅ | → muapi | stub | stub |

Switch providers from the browser console:

```js
localStorage.setItem('gemini_key', 'AIza...');
localStorage.setItem('arcanea.router', JSON.stringify({
  activeProvider: 'muapi',
  taskMap: { 'image.t2i': 'gemini', 'image.i2i': 'gemini' },
}));
```

See [`src/lib/router/README.md`](src/lib/router/README.md) for the full dispatch contract, activation recipes, and provider-authoring guide.

## Quickstart

```bash
pnpm install --ignore-workspace

# One-shot build
pnpm --ignore-workspace exec next build

# Dev (only when actively testing UI)
pnpm --ignore-workspace exec next dev

# Electron package
pnpm --ignore-workspace run electron:build:win    # or :mac / :linux
```

## Roadmap

- [x] **Phase 0** — Fork + rebrand (`@arcanea/studio`, `ai.arcanea.studio`)
- [x] **Phase 1** — Router abstraction (muapi + gemini live, fal/replicate stubs)
- [ ] **Phase 2** — Arcanea design system skin (Atlantean Teal / Cosmic Blue / Gold, Geist + Instrument Serif), TypeScript migration
- [ ] **Phase 3** — Supabase-backed Creation Cards + lineage graph + attribution-cascade royalties
- [ ] **Phase 4** — Luminor prompt enhancement (Artisan / Director / Oracle / Cinematographer archetypes)
- [ ] **Phase 5** — Electron desktop distribution (Atelier tier)
- [ ] **Phase 6** — arcanea.ai/studio hosted tier

## Upstream sync

Upstream is wired as the `upstream` git remote. See [`docs/UPSTREAM-SYNC.md`](docs/UPSTREAM-SYNC.md) for the cherry-pick procedure.

```bash
git fetch upstream
git log --oneline 6f9cdee..upstream/main     # what's new upstream
```

## Credits & license

MIT. See [LICENSE](LICENSE). See [NOTICE](NOTICE) for upstream attribution and the full record of modifications. Huge gratitude to [@matchaman11](https://github.com/matchaman11) for the upstream work.
