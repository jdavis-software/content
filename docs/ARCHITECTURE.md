# Architecture and boundaries

## Files and ownership
- `articles/<slug>/`: public-safe Markdown, JSON metadata, source ledger, derivative and approved assets.
- `lib/content.mjs`: contracts, file safety, hashing and validation.
- `lib/markdown.mjs`: non-executable Markdown rendering and lightweight code highlighting.
- `lib/site.mjs`: static HTML, RSS, sitemap and review-only workspace.
- `lib/publishing.mjs`: dry-run handoff and operator-attested receipt recording, with no live publisher.
- `scripts/content.mjs`: deterministic CLI and loopback-only preview server.
- `skills/`: original workflow instructions; `plugin.json` is the portable package manifest.
- `.studio/`: ignored private working drafts, cached renders, requests and receipts. Never deploy it.

The application is intentionally much smaller than the engineering systems discussed in the article. It has no Nx, Go server, database, paid cache or hosted MCP dependency. The content contract can outlive this renderer.

## Supported Markdown
Paragraphs, H2-H6 headings, single-line bold/italic, inline code, HTTPS/mailto/local anchor links, local assets images, flat ordered/unordered lists, fenced code blocks, blockquotes, horizontal rules and simple pipe tables. H1 belongs to metadata. Nested lists, reference-style links, complex nested inline markup, raw HTML and executable MDX are not implemented. Use explicit supported forms; rendering escapes raw markup. Code highlighting is lightweight, not a full compiler parser.

## Selection versus caching
Production selects only published/public-safe packages; preview includes review and draft but excludes archived. RSS and sitemap never list review drafts. Each article has article, LinkedIn, visuals, package and renderer fingerprints. A LinkedIn-only edit need not rerender article HTML. HTML cache records an output hash and checks it before reuse. This local output-integrity check is not protection against an attacker controlling both cache data and hashes.

Page builds clean stale files when routes or assets are removed. Generated outputs are deterministic for identical inputs; counters in the build manifest describe the current cache invocation. Static site production is a whole site deployment, not per-service immutable promotion; the article's distributed-system examples must not be misrepresented as features of this small site.

## Security
Do not execute raw source HTML or MDX. Reject unexpected artifact extensions, traversal paths and article symlinks. The SVG allowlist excludes executable/external-resource constructs. Credentials never enter the static output. The preview server binds 127.0.0.1 and serves a fixed build root; it is not a production server or authentication service.

Structural source checks are not semantic fact-checking. Secret pattern checks catch common forms, not every secret. An agent able to edit code, metadata and CI can bypass file-based gates; enforce publication approval in the host or GitHub permissions/review configuration, outside its authority.

## Future extensions
Swap the static generator for Astro when richer Markdown/rendering is justified. Add asset-render adapters behind an explicit host capability check. Extract the deterministic CLI operations into a local/remote MCP only after the personal workflow proves useful. Provider credentials, authorization and execution limits must be configured independently. Do not deploy an unnecessary always-on service for a static blog.
