# Jev article publication notes

The user requested a research-based Jev article in the existing content site, followed by a LinkedIn handoff. No Jev experiment, model installation, paid model request, or benchmark is part of this publication.

Article: `articles/jev-decision-layer/`; title: **Jev: The Decision Layer Emerging Inside AI Agents**. It contains approximately 3,156 whitespace-delimited words, a twenty-project community reading map, 34 source records (31 primary documentation/project records and 3 explicitly labeled user-supplied post records), and a 1200 × 627 social image. Neither the original X videos nor the twelve-page community PDF was independently inspected. AJ's savings remain an attributed harness-level claim. Static topology is not described as requiring identical execution paths; Jev probabilities are not described as access grants or guaranteed correctness.

## Illustrated decision flow

The article includes an original static HTML/CSS/JavaScript explorer. Three fictional tasks have authored probability distributions. The example checks freshness, a deliberately invented 0.70 top-probability selection rule, permission, and observed outcome. It does not calculate Jev confidence, invoke any model, enforce real authorization, or execute external tools. An ambiguous route requests more evidence. A changed observation does not silently fall through to an old runner-up. Failed outcome checks do not establish completion.

The full default explanation is server rendered. No-JavaScript controls are disabled rather than appearing functional. Keyboard controls, semantic fieldsets, live status, a finite trace animation, and reduced-motion behavior are included. The homepage and earlier articles do not load these new browser modules. Their fingerprints are specific to this article. No new npm dependency or remote runtime asset is added.

## Verification before release

- `npm run check`: **94 tests passed**, production build includes four articles.
- **61 browser/HTTP assertions passed**: 1440, 390, and 320 pixel widths; title/content identity, decoded image, no horizontal overflow, scenario selection, probability preservation when permission changes, stale observation, failed result checks, keyboard operation, dark mode, reduced motion, finite trace cleanup, and no-JavaScript fallback.
- The Browser plugin was unavailable. Python Playwright used the existing system Chromium. Direct navigation to `http://127.0.0.1:4321` returned `ERR_BLOCKED_BY_ADMINISTRATOR`; browser policy was not changed. Rendered checks used built HTML/CSS/JavaScript offline. The actual local server returned HTTP 200 and the expected article/head metadata independently.
- Local visual screenshots are outside the source repository. Live Chrome/Safari/Firefox rendering and LinkedIn's crawler are not implied by these checks.
- One existing test fixture was narrowed to its intended three articles instead of assuming the repository can never gain a fourth. Its assertions remain intact; new tests cover the four-article release and independent Jev article publication/removal.

The generated-image attempts produced mock webpages. Only the central Jev artwork from generation `4ead9c63-8ca4-4904-933c-3e54d85cd430` was retained; mock navigation, faces, dates, and unsupported performance claims were excluded. The final social card combines that cropped artwork with deterministic editorial typography and layout. Provenance and image hash are in the article package.

Publication success is established by the deployment run and `scripts/verify-publication.py`, not by this pre-release note. LinkedIn text is a draft only. Restore manual-only Pages release triggering after the explicitly requested publication.
