# Loops Inside Graphs — publication note

The user requested the next Engineering Notes article from an X link and an AI Builder Club article. This is original engineering synthesis: local repair loops inside a coordinated workflow, with typed outcomes, explicit joins, compatible revisions, separate integration and approval, and bounded recovery.

Article: `articles/loops-inside-graphs/`. It contains approximately 2,768 words and fourteen source records: twelve primary sources, the user-supplied editorial mapping, and one unavailable X discovery link. The X post returned 403 and exact-ID search did not recover its contents; no post text, video, or purported PDF was attributed or invented. Andrew Ng's four design patterns are not presented as an ordered loop-to-graph progression.

## Illustration

`site/loop-graph-model.js` supplies an authored, finite state-transition model. Client and API lanes consume a contract revision, report fictional checks, and join only when compatible. The teaching fixture demonstrates successful work, one local API repair, exhausted retries, a superseding contract, and pending approval. A combined candidate key identifies the fixture's revisions and attempts; it is not a cryptographic artifact digest or production evidence store. Real implementations need exact artifact identities and independently resolved evidence.

The two-attempt limit is illustrative. Trace positions are events, not time or performance. No AI agents, framework, authorization system, build runner, or deployment endpoint is connected. Fictional approval events grant no real permissions. The default repair view is server-rendered; controls are disabled without JavaScript. Keyboard stepping, finite playback, offscreen/tab-hidden pausing, and reduced-motion behavior are implemented. Only this article loads the new browser modules.

The cover is an original SVG with a derived 1200 × 627 raster for social previews. It has no vendor logos, personal photos, or speedup claims. The optional one-time packaging step renders the SVG with CairoSVG; the ordinary site build does not install or require an image renderer. Asset provenance records the actual published PNG hash.

## Checks before release

- `npm run check`: 106 Node tests passed; the production build contains five articles.
- 45 browser/HTTP assertions passed using the existing system Chromium through Python Playwright at 1440, 390, and 320 pixel widths. Checks include identity and real PNG decoding, no horizontal overflow, every scenario's terminal outcome, client result preservation through API repair, keyboard stepping, finite playback, reduced motion, theme control, and static fallback.
- No Browser/Computer plugin controller was available. Direct navigation to `http://127.0.0.1:4321` returned `ERR_BLOCKED_BY_ADMINISTRATOR`. No browser policy was changed. Browser tests rendered the built HTML/CSS/JavaScript offline; the actual local HTTP response and static metadata were checked separately.
- The legacy Jev fixture now intentionally selects its original four articles; its assertions are unchanged. New regression tests check five-article publishing, independent publication/removal, and article-specific render-cache inputs.

These tests verify the article and authored example, not a live multi-agent system or throughput benchmark. Public delivery is established separately by the release workflow, not by this note. Live cross-browser rendering and LinkedIn's crawler are not implied. LinkedIn text remains a manual-post draft; no social account is changed. Restore manual-only Pages publishing after the requested release.
