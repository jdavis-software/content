# Article 2 — keeping parallel development fast

Selection: A01 in the editorial backlog; the user explicitly requested selecting the next item and publishing it. This is a general-purpose engineering article, not product marketing. The article and LinkedIn derivative live in `articles/keeping-parallel-development-fast/`.

## Content and assets

Approximately 3,125 words, 19 primary-source ledger entries, one original host-generated 1734 × 907 PNG, and the existing interactive DevOps model reused at a second article route. The image is a roughly 1.91:1 raster, declared at its actual dimensions for Open Graph/Twitter metadata. It is not another service or a remote runtime dependency. Source artwork provenance and SHA-256 are in the article package.

The article distinguishes input changes, cold misses, trusted reusable results, fresh behavior checks, mutable outputs, and durable state. Its Dockerfile is an illustrative build-stage fragment, not a tested production recipe. No personal speedup multiplier or cold/warm timing is asserted.

## Validation recorded before publication

- `npm run check`: 68 Node tests passed, two-article production build completed.
- Three Go cache semantics checks passed using the actually installed `go1.23.2 linux/amd64` compiler: first test executed, repeat reported cached, `-count=1` executed. The fixture is standard-library-only, uses temporary private caches, and disables dependency/toolchain downloads. This is not a production compiler recommendation or a benchmark.
- 45 rendered/HTTP checks passed at 1440 × 1100 and 390 × 844, including homepage selection, search/link target, actual PNG decoding, complete cover aspect ratio, metadata, no overflow, warm/cold and contract scenarios, detail panels, theme controls, and no-JavaScript fallback.
- Browser plugin was absent. Chromium localhost navigation returned `ERR_BLOCKED_BY_ADMINISTRATOR`; no browser policy was altered. Built HTML/CSS/JS was rendered offline in Playwright; actual server responses and feeds were checked separately. Live browser navigation, cross-browser rendering, and LinkedIn's own crawler are not implied.
- Docker, PostgreSQL, and Temporal integration/benchmark runs were not executed in this session. The examples are source-backed design guidance; the explorer is an authored model.

Legacy tests now isolate their single-article fixtures rather than assuming the entire production repository always has only one article. Additional tests exercise the two-article release, independent DevOps assets, no draft-image leakage, per-article cache reuse, and the actual raster identity. Markdown validation distinguishes fenced-code comments from forbidden body H1 headings.

## Publishing boundary

The release uses GitHub Pages. LinkedIn copy is prepared for Jordan to post manually; no LinkedIn action is invoked. Deployment success must be established by the current workflow and public HTML/image verification, not this pre-publication test record. The temporary source/image/assembly workflows are removed from the final release; the normal deployment trigger is restored to manual-only afterward.
