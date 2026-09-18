# Animated agent-flow diagram

The parallel-agent article replaces its static on-page cover illustration with an authored HTML/SVG diagram. A separately declared raster social card supplies social metadata and the homepage thumbnail; the original vector asset is retained as source. The component is an illustrative model, not a live graph, benchmark, connected agent dashboard or claim that workers ran.

## Controls and accessibility

A single ten-second Anime.js timeline draws the contract fan-out, independent work and focused checks, arrival paths, integration and release. Branch durations deliberately differ. Integration starts only after every incoming lane completes. Playback occurs once on entering the viewport; no loop, scroll hijacking or animation-driven page layout is used. Pause, replay, keyboard-operable scrubbing and five stage buttons let readers inspect the process.

Reduced-motion preferences are checked initially and on change. In that mode there is no playback and no initial engine import: stage buttons and scrubbing update the diagram immediately. Leaving the viewport or hiding the page pauses playback; a manual pause is not undone by scrolling. Without JavaScript the complete, labeled diagram remains visible and inactive controls are hidden. Engine-load failure preserves a static diagram and working stage controls.

## Ownership and runtime dependency

- `lib/agent-flow.mjs`: trusted markup only; no article-supplied executable HTML.
- `site/agent-flow-model.js`: the one set of track timings and phase descriptions.
- `site/agent-flow.js`: lazy import, controls and lifecycle; no network effects beyond local script loading.
- `site/agent-flow.css`: responsive presentation scoped to the component.
- `site/vendor/anime-4.5.0.esm.min.js`: unmodified official Anime.js 4.5.0 ESM bundle.

This introduces a **browser runtime dependency**, not a hosting subscription or a build-time npm install. The bundle is served from this site, never a CDN. It is 118,678 bytes uncompressed (approximately 40 KB gzip) and is deferred until the diagram enters view or the reader uses playback. Homepage visits do not import the diagram controller or engine. The normal build remains offline-capable; it copies the checked-in asset. A future measured bundle-size optimization may replace the full bundle with a reproducibly generated timeline-only subset; no such tree-shaking is claimed here.

Upstream: https://github.com/juliangarnier/anime/tree/v4.5.0

The upstream bundle Git blob is `c278b15616623e2b32ef499bbb1020b181324d59`; SHA-256 is `a19015a1a92d52025a2fb6703b6d67eadd1cc2aeaf880770e96e04cf6aa07be1`. The accompanying MIT license has Git blob `f999fa58ebdda6d8d0f3ae581ebdfe821f09603a` and SHA-256 `3f3e835a9952cfc2a6ca836fb95b3257c981f24fa3ef51249055acb09931897b`. Preserve the upstream copyright and license when updating. Tests verify both hashes. Version upgrades require inspecting the upstream changes, updating explicit identities and running the interaction checks; there is no automatic latest-version fetch in the site build.

## Verification contract

Native tests cover track ordering, integration gating, deterministic reverse scrubbing, phase boundaries, non-JavaScript markup, local asset packaging and cache invalidation. Rendered checks must additionally exercise actual Anime.js playback, pause/resume, replay, scrubbing, viewport suspension, reduced-motion changes, failure fallback and mobile overflow. Passing model tests alone does not prove browser rendering.
