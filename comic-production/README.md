# Arcanea comic production kernel

Offline, standard-library Python prototype for **creator-owned** sequential art.
It does not call a provider, edit accepted canon, spend credits, publish, or
certify artistic quality. The output remains a draft even when every structural
check passes. This directory is additive and has no dependency on the Studio UI.

## Run

Python 3.10+; no dependency installation:

```bash
python3 comic-production/production.py validate comic-production/example.json
python3 comic-production/production.py compile comic-production/example.json > panel-specs.json
python3 comic-production/production.py impact comic-production/example.json --changed prop-memory
python3 -m unittest discover -s comic-production -v
```

`snapshot` prints a hash of the complete input excluding its hash field. After
an intentional revision, a responsible editor records the new hash in the
packet; hashing is revision identity, never approval. Changes to dialogue,
layout, references, and story state all invalidate the previous snapshot.

## What exists

- Versioned JSON packet with source/state/visibility labels, characters,
  environments, reference roles, pages, normalized panel geometry, dialogue,
  explicit preconditions/effects, and proposed exports.
- Ordered state simulation catches declared physical/knowledge continuity
  contradictions. State variables can represent possessions, injuries,
  knowledge, beliefs, time, or location; the editor must actually declare them.
- Compiler emits one neutral art brief per panel; dialogue is a separate
  lettering payload. Reference records and source hash travel with the brief.
- Dependency graph propagates entity/reference/panel changes to affected
  panels, pages, and export plans. It adds state-producer edges for declared
  reads in addition to explicit narrative dependencies.
- A non-canon, original eight-page, 24-panel fixture: **The Last Sound of Home**.
  All creative additions are proposals. Its visual references are pending and
  its generation/rights/release reviews are pending.
- Fourteen focused tests exercise concrete production failures.

## Intentionally absent

No image bytes, asset-rights verification, human approvals, executable export,
font shaping, print preflight, hosted persistence, tenancy, generation adapter,
payments, model tuning, semantic contradiction detection, or production UI.
The `exports` objects are dependency nodes, not proof that files were exported.
The validator enforces the v0.1 exercised contract; it is not a general JSON
Schema implementation or a production authorization boundary.

Panel geometry is a proposed layout. Passing overlap and bounds checks does
not establish reading flow, staging quality, or a print-safe page. Automatic
balloon word budgets are review heuristics, not universal comics standards.
Available reference URIs/hashes are declared metadata, not independently
verified byte receipts. Future adapters must fetch and verify bytes before use.
Official Arcanea canon is deliberately unsupported without a designated,
authorized canon adapter.

## Production architecture

Keep the existing Studio provider router. Put comic logic before dispatch:

1. Source and canon revision -> story/character state.
2. Script -> editable page thumbnails -> approved panel brief.
3. Panel brief + identity/environment/layout references -> selected provider.
4. Candidate bytes -> continuity and artistic review -> bounded repair.
5. Reviewed panel art + separate lettering -> page composition.
6. Reviewed pages -> format-specific exports -> release evidence.

Store draft facts and creator-approved facts separately. Characters can hold
incorrect beliefs; `char.knowledge.*` and `char.belief.*` must not be merged with
the world's physical state. Canon branches, story-time validity, and revision
history must remain separate dimensions. Retrieval supplies relevant evidence;
it never authorizes a retcon. Start with relational tables and an edge table;
add a graph engine only after measured traversal needs justify it.

## Plugin extensions to implement

These names describe proposed modules, not installed skills or working commands:

| Module | Contract and human decision |
| --- | --- |
| Series editor | Audience promise, protagonist contradiction, episode pressure, irreversible choice, payoff. Creator decides premise and ending. |
| Comic script editor | Page/panel script, pacing, dialogue compression, page turns or scroll reveals. Editor accepts thumbnails before expensive render. |
| Continuity planner | Temporal state, knowledge/belief separation, geography, handedness, wardrobe, injuries, props, retcon impact. Canon owner accepts changes. |
| Layout director | Reading direction, panel shapes, camera scale, balloon reservations, subject boxes, screen direction. Artist approves visual staging. |
| Panel art director | Reference precedence, named invariants, task-specific model route, candidate comparison, bounded repairs. Artist judges actual outputs. |
| Letterer/localizer | Exact script text, speaker/tail, font rights, editable balloons, glossary, translation fit. Human letterer signs final page. |
| Press preflight | Printer-specific trim, bleed, resolution at placed size, color profile, margins, proof copy, retailer metadata, disclosure. Publisher approves destination-specific release. |
| Reader evaluator | Blind reading-flow, identity, emotional-turn, and retention tests against lawful indie references. Independent reviewers judge; no synthetic human approval. |

## First integration backlog

1. Add a comic workspace with pages/panels and explicit selected targets. Render
   the fixture as editable thumbnails before adding orchestration complexity.
2. Map the neutral brief into verified `image.i2i`/reference mechanics of the
   existing router. No silent provider fallback between approved panels.
3. Persist job fingerprints, source revision, provider/model identity, request
   IDs, byte hashes, cost, selected candidates, and review records. Reconcile
   ambiguous provider outcomes before retrying or reserving more budget.
4. Keep lettering vector/text-based. Persist balloons, tails, SFX, translation
   variants, and embedded/licensed fonts separately from raster panel art.
5. Build PDF/CBZ/web-scroll export adapters. Add fixed-layout EPUB only after
   validation on actual reading apps; support variable balloons and localizers.
6. Expose bounded MCP contracts for context, draft panel plans, change-impact,
   candidate comparison, and export preflight. Mutation/spend/release remain
   behind authenticated authority, tenant isolation, budgets, and durable receipts.

## Evidence and research

Reviewed 2026-10-04. External claims require their own account/runtime checks.

- [CELSYS: storyboard before drafting](https://tips.clip-studio.com/en-us/articles/501)
- [Anifusion documentation](https://anifusion.ai/help/): editable page/panel
  workflows and reference controls already exist in the market; that alone is
  not a differentiated product.
- [DiffSensei](https://jianzongwu.github.io/projects/diffsensei/): multi-character
  identity and layout-conditioned generation. Its paper explicitly describes
  the collected dataset as academic, non-commercial use; do not assume code
  availability licenses datasets or weights for commercial distribution.
- [DreamingComics](https://arxiv.org/abs/2512.01686): layout-conditioned subjects
  and video-model priors for visual consistency. This kernel does not implement
  the paper or inherit its reported benchmark performance.
- [KDP content guidelines](https://kdp.amazon.com/en_US/help/topic/G200672390)
- [Ingram content guidelines](https://www.ingramcontent.com/page/content-guidelines)

Human-quality publication is a reviewed artifact outcome. It is not a property
conferred by a model name, a successful validator, or an agent-team size.
