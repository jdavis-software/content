---
name: write-article
description: Write or revise a concrete, source-backed technical article in Jordan Davis’s voice using the content-package contract.
---

# Write the article

Read brand/voice.md and the research inventory. Start with a concrete problem, implementation detail or decision. Outline one coherent argument; give each section a different job. Address the costs, operating limits and failure cases rather than claiming tools eliminate them.

Create article.md with H2 sections: its title lives in metadata.json. Use the supported Markdown dialect in docs/ARCHITECTURE.md. Code examples must be labelled as illustrative unless execution evidence exists. Cite verified primary sources inline with Markdown links. No HTML/MDX execution, external inline images, secrets or internal page links.

Retain metadata status review until human approval. updatedAt reflects an actual edit, not a fabricated freshness signal. Provide a concrete description, category, tags and meaningful coverAlt. Public-safe material goes to articles/ only after disclosure review; Git status is not privacy protection.

Run `npm run validate`. Preview the rendered body and inspect code blocks, heading hierarchy, links and narrow screens. Return the artifact paths, source coverage and unresolved verification gaps. Never label a draft published based on a local build.
