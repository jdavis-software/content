# Test record — 2026-09-17

## Automated checks

`npm run check` passed on Node 22.16.0: metadata and six skills validated, **32 native Node tests passed**, and the production build completed with **zero published articles**, correctly excluding the review pilot.

The tests exercise safe Markdown and URLs, real calendar dates, public/private boundaries, secret-pattern detection, SVG safety, symlink rejection, packaged image paths, the LinkedIn character budget, fingerprint isolation, render-cache reuse and corruption recovery, output locks, alternate base paths, stale-route removal, draft/RSS exclusion, deterministic publication requests, receipt validation, duplicate protection, and private-by-default CLI drafts. Test publication records are synthetic fixtures in disposable temporary directories, not real LinkedIn posts.

## Rendered verification

Browser plugin was unavailable. Playwright Chromium was used at **1440 × 1000** and **390 × 844**. Browser policy blocked localhost navigation, so the built HTML/CSS/JS and local images were loaded for offline rendering without changing browser policies. This is rendered UI evidence, not a live deployment test.

Verified: meaningful page/title, article search and empty state, topic filtering, theme toggle, article link target, read-only review workspace, interactive dependency example, graceful clipboard-unavailable feedback, and no mobile horizontal overflow. No JavaScript page errors were observed. Screenshots were inspected for typography, layout, spacing, asset framing, and mobile readability.

Separately, HTTP requests to the real local Node server returned 200 for the homepage, about page, workspace, pilot article, CSS, JavaScript, RSS and sitemap. An unknown route returned 404.

## Explicitly not verified here

- Actual GitHub Pages hosting activation and a public deployment.
- Clipboard success and theme persistence in a normal browser origin. The offline test only verifies the toggle and graceful clipboard failure.
- Live Zapier / LinkedIn posting, model API calls, or host plugin installation.
- GPT Image or animated-infographic generation. The pilot cover is original SVG artwork, not a model output.
- Full Mermaid parser/render acceptance. The .mmd source is retained; the preview uses the original SVG illustration.
- Benchmark claims about Jordan's engineering throughput. The article does not fabricate measurements.

## Run locally

With Node 22 or newer, run `npm run check`, then `npm run dev`. Open `http://127.0.0.1:4321/content/` and `/content/studio/`. No dependency installation is needed. Check clipboard and theme persistence there, then review the article before any publication.

`npm run build` creates production output in `dist/`. `npm run studio -- build --preview` creates review output in `.studio/preview/`. Builds targeting the same output are serialized by an exclusive lock; after a crash, confirm the recorded process is no longer running before manually removing that stale `.studio/locks/` file.
