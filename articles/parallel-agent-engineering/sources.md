# Public sources

- [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) — Native Go implementation, language-service capabilities, and explicitly attributed full-build benchmark range.
- [Nx affected tasks](https://nx.dev/docs/features/ci-features/affected) — Affected-project selection from Git changes and the project graph.
- [Nx task caching](https://nx.dev/docs/features/cache-task-results) — Reuse of completed task computations and outputs when the relevant inputs match.
- [Nx inputs and named inputs](https://nx.dev/docs/reference/inputs) — Real task inputs, generated dependent-task output files, and cache correctness.
- [Git worktree reference](https://git-scm.com/docs/git-worktree) — Separate working directories and branches attached to one repository.
- [Docker cache optimization](https://docs.docker.com/build/cache/optimize/) — Stable dependency layers, persistent cache mounts, and tool-specific sharing/locking requirements.
- [Node ESM reference](https://nodejs.org/api/esm.html) — Explicit module format and import/export conventions; interoperability is not eliminated.
- [Gopls feature index](https://go.dev/gopls/features/) — Definition, reference, implementation, and type-oriented source navigation.
- [tsx and TypeScript checking](https://tsx.hirok.io/typescript) — Executing TypeScript with tsx is separate from dedicated typechecking.
- [Nx project and task graphs](https://nx.dev/docs/features/explore-graph) — Distinct project and task graph responsibilities.
- [Nx TypeScript 7 compatibility](https://nx.dev/docs/kb/typescript-7) — Native TypeScript 7 compilation alongside scoped TypeScript 6 compiler-API tooling.
- [Nx local generators](https://nx.dev/docs/kb/local-generators) — Workspace-owned generators for repeatable scaffolding; project-specific behavior remains separately qualified.
- [Oxlint type-aware linting](https://oxc.rs/docs/guide/usage/linter/type-aware) — Type-aware lint rules and the tsgolint integration, including floating-promise detection.
- [Oxfmt documentation](https://oxc.rs/docs/guide/usage/formatter) — Formatting responsibility in the native JavaScript/TypeScript toolchain.
- [oapi-codegen project](https://github.com/oapi-codegen/oapi-codegen) — Generation of Go client/server wire artifacts from OpenAPI.
- [Hey API Valibot plugin](https://heyapi.dev/docs/openapi/typescript/plugins/valibot) — Generating Valibot schemas from OpenAPI and explicitly enabling SDK validation.
- [sqlc documentation](https://docs.sqlc.dev/en/latest/) — Generating typed query code from SQL.
- [sqlc transactions](https://docs.sqlc.dev/en/latest/howto/transactions.html) — WithTx binds generated queries to an existing transaction.
- [tern migration tool](https://github.com/jackc/tern) — SQL migration tooling in the selected persistence stack.
- [pgx driver documentation](https://pkg.go.dev/github.com/jackc/pgx/v5) — Go PostgreSQL access and transaction primitives.
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — Database concurrency/isolation semantics remain relevant across application module boundaries.
- [Temporal Go Workflow contract](https://pkg.go.dev/go.temporal.io/sdk/workflow) — Deterministic Workflow restrictions and delegation of external effects to Activities.
- [Docker Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/) — Separate synchronization, sync/restart, and image rebuild responses to file changes.

Checked September 17, 2026. Public documentation supports the named tools and mechanisms, not proof of the author's entire deployed environment.

The article distinguishes selected/qualified tooling, architectural direction, illustrative examples, and vendor measurements. The thin live Context Resolver and full multi-environment artifact promotion are not presented as completed deployments. SQLite full-text indexing is optional; no additional database deployment is asserted. Detailed source-to-claim reconciliation remains in the private planning record.
