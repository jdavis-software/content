---
name: plan-visuals
description: Choose and prepare evidence-backed cover images, editable diagrams, and optional LinkedIn infographics with existing host tools.
---

# Plan visuals

Read brand/visual-guidelines.md, the article and its evidence. Identify the relationship the visual explains. Decide which asset types are useful; do not generate one of everything by default. Write the brief before invoking a generation tool.

Use the host image-generation tool for GPT Image requests. Use the exact supplied image for edits; request an upload when a referenced target is missing. Do not hard-code an assumed “latest” model. Record the actual model if exposed; otherwise say not exposed. A separately billed API requires explicit budget approval and secure authentication, never a key in chat or Git.

For diagrams, use the installed Mermaid workflow or an approved Whimsical board. Preserve the editable .mmd source and verify the rendered export. Source lint, actual rendering and visual review are separate evidence states. Do not describe the pilot's original SVG as Mermaid output.

For LinkedIn infographics, invoke the installed LinkedIn Animated Infographics workflow when available. Evidence first, static first, then animation only when motion explains the idea. Review readability at feed scale. Save a static fallback and provenance. Do not call any third-party endpoint without the appropriate user-authorized connection.

Store approved exports and provenance under assets/. Use the host file tools to save only a real, inspected export; retain its provenance and SHA-256 hash. Rerun validation and preview after replacing a cover. Do not put unapproved private screenshots in the public repo.
