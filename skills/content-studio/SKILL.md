---
name: content-studio
description: Coordinate a topic or approved Notion source into a researched technical article, visuals, and LinkedIn draft in the content repository.
---

# Content Studio

## Entry and capabilities
Locate the repository and read AGENTS.md and brand/voice.md. Run `npm run studio -- doctor` where a shell is available. Discover the host's Notion, GitHub, image-generation, diagram, infographic, and Zapier tools. A missing capability is a blocked step, not permission to invent a result or request raw credentials.

## Workflow
1. Accept a topic or exact source reference. Fetch referenced Notion material through its connector. Do not publish raw internal source material.
2. Use research-article to construct an evidence inventory. Mark unverifiable claims instead of guessing.
3. Write in private working storage first. Use write-article to produce article.md, metadata.json, and public sources.json.
4. Once the argument is stable, delegate independent owned paths to adapt-linkedin and plan-visuals. Use worktrees when agents share a repository. Do not claim agents ran unless they actually did.
5. Use review-publication, run validation/tests, and build a preview. Return the draft and exact package fingerprint.
6. Stop for human review. Publishing and paid API generation need separate authorization.

## Existing tools, not hidden magic
This skills-only plugin runs within a capable host; it is not a hosted MCP or an autonomous background service. It does not inherit authentication outside that host. The Node CLI handles deterministic files and validation; the host model handles writing and research. Installing these skills does not connect Zapier, LinkedIn, Notion, or an image API.

## Test prompt
“Use Content Studio to prepare an article about TypeScript, Go, Nx, ESM and worktrees for parallel engineering agents. Create a public-safe evidence ledger and a LinkedIn derivative, use the pilot's diagrammatic style, and keep publication in review.”
