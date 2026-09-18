# Public source ledger

- [Docker cache optimization](https://docs.docker.com/build/cache/optimize/) — Layer ordering, build context, and the distinction between layer reuse and useful persistent tool caches.
- [Docker build-cache invalidation](https://docs.docker.com/build/cache/invalidation/) — RUN-cache freshness and build-secret content not automatically invalidating cached build steps.
- [BuildKit cache-mount options](https://docs.docker.com/reference/dockerfile/#run---mounttypecache) — Cache mount persistence, empty-cache correctness, and shared/private/locked coordination.
- [Docker cache storage backends](https://docs.docker.com/build/cache/backends/) — External cache import/export and ownership of cache export locations.
- [pnpm fetch](https://pnpm.io/cli/fetch) — Preparing dependencies from lockfile/configuration before copying the full application; local dependency caveats.
- [Go build and test cache](https://pkg.go.dev/cmd/go#hdr-Build_and_test_caching) — Separate build/test caches, concurrent invocation safety, and underlying input considerations.
- [Go test command](https://pkg.go.dev/cmd/go#hdr-Test_packages) — Successful package-list test-result caching and the explicit -count=1 fresh-test option.
- [Nx task-result caching](https://nx.dev/docs/features/cache-task-results) — Restoring outputs of cacheable tasks rather than invoking commands again.
- [Nx affected tasks](https://nx.dev/docs/features/ci-features/affected) — Git base/head and project dependency graph drive affected selection.
- [Nx inputs and dependent-task outputs](https://nx.dev/docs/reference/inputs) — Generated output hashing, Git-ignored input behavior, and the need for complete consumer input patterns.
- [Docker Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/) — Synchronization/restart/rebuild modes and platform-specific dependency-directory caveats.
- [Docker Compose project names](https://docs.docker.com/compose/how-tos/project-name/) — Project-level resource naming; not a claim of complete runtime isolation.
- [sqlc configuration](https://docs.sqlc.dev/en/latest/reference/config.html) — Generator inputs include schema and query source files, distinct from executing migrations.
- [PostgreSQL CREATE DATABASE](https://www.postgresql.org/docs/current/sql-createdatabase.html) — Template cloning constraints, no concurrent template sessions, and transaction-block restriction.
- [sqlc transaction binding](https://docs.sqlc.dev/en/latest/howto/transactions.html) — Generated query methods can bind to an existing transaction through WithTx.
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — Read Committed statement snapshots and transaction retry requirements under stronger isolation.
- [Temporal persistence](https://docs.temporal.io/temporal-service/persistence) — Temporal Service-owned execution/history persistence, distinct from a worker build artifact.
- [Temporal Go testing and replay](https://docs.temporal.io/develop/go/testing-suite) — Representative-history replay as compatibility evidence for Workflow Definition changes.
- [Docker build practices and image pinning](https://docs.docker.com/build/building/best-practices/#pin-base-image-versions) — Moving tags versus fixed image digests and explicit update responsibility.
- [SQLite FTS5 full-text search](https://www.sqlite.org/fts5.html) — Optional local full-text indexing of selected documents; lexical queries and rebuild from retained content, not automatic vector search or application authority.

Checked September 17, 2026. Source documentation supports mechanisms, not personal performance claims. The Dockerfile is an illustrative fragment; Docker/PostgreSQL/Temporal integration tests were not executed for this article. The separately supplied Go probe was executed locally and does not measure delivery speed. No private project or customer material is included.
