# Interactive DevOps / invalidation model

The published parallel-agent article includes a second authored diagram after its warm-cache section. It is an explanation, not a live scheduler, cache inspector, database controller, or measured speedup. The simpler three-node end-of-article demo is replaced by this richer model; the Anime.js worktree diagram at the top is unchanged.

## Owned boundaries

- `site/devops-model.js`: canonical illustrative scenarios, explicit input/output relationships, independent validity/availability classifications.
- `lib/devops-flow.mjs`: server-rendered accessible explanatory markup and fail-fast placement at the PostgreSQL heading.
- `site/devops-flow.js`: scenario/mode selection, inspection, SVG connectors and short opt-in WAAPI tracing. No new library or external request.
- `site/devops-flow.css`: scoped responsive styles, dark mode, non-color state labels and print handling.
- All four files participate in article-render fingerprints. They are copied into site output only when the pilot is included; homepage HTML does not load the controller.

## Model semantics

Warm assumes matching unchanged entries exist. Cold removes cached build outputs; it does not change source truth or schedule unrelated targets. Red means a relevant input changed. Blue means a needed output is missing. Green means a needed, matching result is available. Amber behavior checks remain separate from build-cache reuse. A cold run does not reset data or delete caches. Identical generator outputs can preserve downstream hits; the contract/schema examples deliberately assume consumed shapes changed.

UI edits select console tasks; relevant OpenAPI changes select Go wire and TS client/Valibot consumers; SQL row-shape changes select sqlc and its API/Activity consumers; deterministic Workflow changes select worker/replay checks. Toolchain is an intentionally broad compiler/generator upgrade, not a claim every lockfile delta rebuilds everything. No-change mode makes validity versus availability explicit.

`sqlc` consumes schema/query files; Tern applies migrations through a separate owned path. Temporal workers connect to Temporal Service, which owns workflow persistence. PostgreSQL application state, service-owned workflow history, and optional SQLite full-text projections have different roles. The optional index is not represented as deployed. No app-data cache, Redis, Elasticsearch, or vector database is invented.

Sources reviewed September 17, 2026:
- https://nx.dev/docs/reference/inputs
- https://docs.docker.com/build/cache/optimize/
- https://docs.sqlc.dev/en/latest/tutorials/getting-started-postgresql.html
- https://docs.temporal.io/develop/go/workflows/versioning

## Rendering and accessibility

The default warm/UI model is rendered into HTML, so text and canonical relationships remain readable without JavaScript. Interactive controls appear only after initialization. Each status has a symbol and label as well as color. Buttons support normal keyboard navigation and explicit pressed state; a live summary reports only scenario changes, not animation frames. Native short-lived tracing can be stopped; it cancels on offscreen/hidden state, resizing, scenario changes or reduced-motion preference changes. Reduced motion disables tracing but not exploration. Narrow screens use readable stacked cards and textual provenance instead of crossing SVG paths. Runtime decisions and state do not depend on animation completion.

No services are provisioned, migrated, restarted or deployed by interactions. The operations-heavy companion article remains separate.
