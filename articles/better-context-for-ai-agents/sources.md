# Public references

- [Lost in the Middle (2024)](https://aclanthology.org/2024.tacl-1.9/) — Historical positional sensitivity on the paper’s tasks; not a benchmark of current coding agents.
- [Nx project and task graphs](https://nx.dev/docs/features/explore-graph) — Project and target graphs have distinct responsibilities, separate from decisions and runtime authority.
- [TypeScript code navigation](https://code.visualstudio.com/docs/typescript/typescript-editing#_code-navigation) — Definitions, references, type definitions and implementations are navigation capabilities, not just compiler diagnostics.
- [Gopls semantic navigation](https://go.dev/gopls/features/navigation) — Definition/reference/implementation queries and documented build-configuration and dynamic-call limitations.
- [Git status](https://git-scm.com/docs/git-status) — Staged, working-tree and untracked state must be distinguished when describing source.
- [Git diff](https://git-scm.com/docs/git-diff) — Tracked diffs describe selected comparisons, not automatically all workspace content.
- [Gopls implementation model](https://go.dev/gopls/design/implementation) — Snapshots, saved files, unsaved overlays and build configuration are explicit state in the documented design.
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — Just-in-time context acquisition using lightweight identifiers is a vendor-described pattern, not a universal performance guarantee.
- [SQLite FTS5](https://www.sqlite.org/fts5.html) — Local lexical full-text retrieval, including phrase and prefix queries; not automatically vector retrieval.
- [OWASP prompt injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — Indirect prompt injection through external content and the need for independently enforced controls.

The context-pack architecture is the author’s proposed design. The interactive example is a public, fictional, deterministic model with manually declared requirements; it is not a live context service or a model-performance experiment.
