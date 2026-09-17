---
name: adapt-linkedin
description: Adapt an approved technical argument into a plain-text LinkedIn draft without invented claims or automatic publishing.
---

# Adapt for LinkedIn

Read the article, evidence inventory and voice guidance. Preserve the technical argument in a much shorter native post: a concrete opening, useful explanation, a caveat when important, and the full article link. Do not promise algorithmic advantages or claim a formula guarantees engagement.

Write linkedin.md in plain text. Keep `{{articleUrl}}` exactly once as the canonical URL placeholder. Aim below the repository's configured character budget; the CLI checks the expanded URL. Use a few relevant hashtags. Avoid Markdown headings that render poorly when pasted and avoid decorative Unicode by default.

Do not regenerate the article, metadata or images just because the hook changes. Own only linkedin.md unless assigned broader work. Run `npm run studio -- prepare SLUG` to produce a dry-run handoff and inspect its exact text. Preparing is not approval and not posting.

A tagged Zapier tool must be discovered and inspected before use. Confirm the actual personal profile/company destination. The supported share action is not a native long-form article or newsletter action. Do not make any publishing call until review-publication's approval conditions are met.
