# Content Studio

Jordan Davis's GitHub-first technical publishing workspace. Markdown is canonical; the site is static; research and generation run through an interactive agent host; publication requires a separate review.

## Test it now

Node.js 22 or newer. **No npm install, API key, paid CMS or hosted MCP is needed.**

```bash
npm run check
npm run dev
```

Open **http://127.0.0.1:4321/content/**. The local review build includes the first article and a review workspace at `/content/studio/`. Test the topic filters, search, theme toggle, code-copy controls and interactive dependency example.

```bash
npm run studio -- doctor
npm run studio -- list
npm run studio -- plan parallel-agent-engineering
npm run studio -- prepare parallel-agent-engineering
npm run studio -- status parallel-agent-engineering
```

`npm run build` creates `dist/` with **release-selected articles only** (the metadata status is named `published`). Revision 2 of the pilot is selected for the first production deployment, so its route, assets, RSS and sitemap entry are included. This is build inclusion, not evidence that GitHub Pages is live: `publishedUrl` remains null until the actual URL is verified. Draft/review packages still stay out of production. `npm run studio -- build --preview` writes the local review site into ignored `.studio/preview/`.

## The first article

**Parallel AI agents are changing how I architect software** covers TypeScript, Go, Nx, ESM, tsx, isolated worktrees, dependency-aware caching, CI and deployment. Public primary sources are recorded alongside the draft. The article uses a generated 1200 × 627 PNG for social previews and the homepage thumbnail. The original SVG source is retained; the two interactive diagrams remain unchanged. Image provenance is recorded in the article package. See [social previews](docs/SOCIAL-PREVIEWS.md) for validation and LinkedIn cache-refresh steps.

## Engineering series

1. [Parallel AI agents are changing how I architect software](https://jdavis-software.github.io/content/articles/parallel-agent-engineering/)
2. [Keeping Parallel Development Fast: Docker, Warm Caches, PostgreSQL, and Precise Invalidation](https://jdavis-software.github.io/content/articles/keeping-parallel-development-fast/)

3. [AI Agents Don’t Need the Entire Codebase. They Need the Right Context.](https://jdavis-software.github.io/content/articles/better-context-for-ai-agents/)
4. [Jev: The Decision Layer Emerging Inside AI Agents](https://jdavis-software.github.io/content/articles/jev-decision-layer/)

The second installment reuses the DevOps explorer and adds a [small Go cache probe](examples/go-cache/README.md). The probe is optional; the site build still requires only Node. See [article-two verification](docs/ARTICLE-TWO.md).

## New content

```bash
npm run studio -- new my-topic --title "My article title"
```

New material starts under ignored `.studio/drafts/`. Review its disclosure before moving it to `articles/`; this repository and its Git branches are public. Complete the metadata, article, source ledger, cover and LinkedIn derivative. Run validation and preview before approval.

## Skills-only plugin

`plugin.json` and `skills/*/SKILL.md` form a portable skills-only Content Studio plugin. The host model researches and writes; the CLI validates and packages. Host tools handle Notion, GPT Image, Mermaid/Whimsical, optional infographics and approved Zapier actions. No connector credentials are embedded or inherited by the CLI.

Use the host's local plugin/skill installation flow for this repository. The portable manifest follows the official manual skills-only format. Installation into a particular ChatGPT/Codex account is not performed by cloning the repo. For direct testing in a checked-out repository, tell the agent to read `skills/content-studio/SKILL.md` first.

## Deploy

GitHub Pages uses `.github/workflows/deploy-pages.yml`. Select **Settings → Pages → Source: GitHub Actions** once, then run the **Deploy approved site** workflow on `main`. No additional workflow template is needed. The approved pilot is already included in the production build. There is no automatic LinkedIn post and no draft site deployment. The candidate address is `https://jdavis-software.github.io/content/`; consider it live only after a successful deployment and URL check.

The deployment workflow is manual by design. Set up an independently enforced review gate if agents will receive deployment permissions. An editable `status` field is not a security boundary.

## Design and implementation

The initial static generator is native Node ESM rather than Astro. This is the lightweight static alternative allowed in the plan: it can be built and tested offline without installing dependencies. The interactive agent-flow diagram uses a pinned, locally served Anime.js 4.5.0 browser bundle; no CDN or paid service is required. The supported Markdown subset is documented; executable MDX and plugins are deliberately excluded. A future Astro adapter can consume the same article packages without changing the source contract.

Read [architecture](docs/ARCHITECTURE.md), [publishing](docs/PUBLISHING.md), [integrations](docs/INTEGRATIONS.md) and [test evidence](docs/TESTING.md).

## Scope

Implemented: static site, local review workspace, content CLI, public-safe structural validation, per-unit fingerprints, integrity-checked page cache, dry-run publishing handoff, operator-attested receipt storage, six agent skills, pipeline definitions and tests.

Not implied: a hosted MCP, an installed account-level plugin, verified Zapier authentication, autonomous writing without a host model, paid image generation, native LinkedIn articles/newsletters, or a measured speedup from parallel agents.

## Animated architecture diagram

The pilot has an interactive contract → worktrees → focused checks → integration → release diagram. It plays once on entering the viewport and supports pause, replay, timeline scrubbing, and stage selection. Reduced-motion users get immediate static stages; the full diagram remains visible without JavaScript. The engine loads only when the diagram is used or enters view, not on the homepage. See `docs/MOTION.md` for the local vendor pin and maintenance notes.
