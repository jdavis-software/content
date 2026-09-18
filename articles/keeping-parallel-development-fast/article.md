An agent finishes a small change. Then the delivery pipeline behaves as though the entire product has changed with it.

Dependencies are downloaded again. Unrelated projects are checked again. A container image is rebuilt from the wrong boundary. Another worker resets the database that a test was using. The code arrived quickly; the working result did not.

That is the failure mode I am designing against.

In [the first article in this series](https://jdavis-software.github.io/content/articles/parallel-agent-engineering/), I explained how granular ownership, generated contracts, semantic navigation, and Git worktrees make parallel implementation more practical. This is the operational half: keeping that parallel work fast without turning cache reuse into a correctness gamble.

**I want to reuse completed work, not accidentally share everyone's changing state.**

## Start with three different questions

Before adding another cache, I want the pipeline to answer three questions separately.

Does this task need to be considered for this change? Are its previous results valid for the current inputs? Are those results actually available to this worker?

Those questions produce different outcomes:

| Situation | Appropriate response |
| --- | --- |
| Outside the requested dependency closure | Do not schedule the task |
| Required task, matching key, trusted output available | Restore the result |
| Required task, matching inputs, output unavailable | Compute the missing result |
| Required task, relevant inputs changed | Compute a result under the new key |

A cold miss is not proof that source changed. An old result can remain perfectly valid for an older revision while being unusable for the revision in front of us.

There is a fourth question after those three: what behavior still needs fresh verification? A successful build cache lookup is not an approval to deploy.

This vocabulary matters when diagnosing a slow pipeline. “The cache broke” can mean an incorrectly broad input, an evicted object, an unavailable remote store, or a correctly rejected stale result. Each needs a different fix.

## Name the source of truth before naming the cache

In a mixed Go and TypeScript application, I treat source, toolchain configuration, dependency locks, API contracts, SQL migrations, and query files as explicit inputs. Generated clients, compiled binaries, and container images sit downstream.

That does not make every input globally relevant. A UI component and an API schema have different consumers. The build definition should preserve that distinction rather than hash the entire repository for every target.

For SQL, I separate generation from execution. sqlc reads the configured schema and query sources to produce query code. A migration runner applies database changes. Running the generator does not migrate a live PostgreSQL instance. [sqlc's configuration reference](https://docs.sqlc.dev/en/latest/reference/config.html) describes those source inputs.

A task contract should therefore name both what it reads and what it writes. For a client generator, that might mean the contract files, generator version, configuration, and templates as inputs, with one private generated-client directory as output.

An agent should change the accepted schema or generator configuration, then regenerate. Hand-editing the generated client creates another competing source of truth.

## There is no single warm cache

A warm development environment can contain several useful stores without possessing a reusable result for the task currently requested.

| Layer | What I expect it to reuse | What it does not establish |
| --- | --- | --- |
| pnpm package store | Available dependency packages | Correct application output |
| Go module cache | Downloaded dependency source | A compiled service |
| Go build cache | Compatible compilation results | Fresh external-system behavior |
| Nx task cache | Declared task results and outputs | Complete modeling of runtime dependencies |
| Docker layer cache | Matching build-step results | Current packages from a moving upstream repository |
| BuildKit cache mounts | Tool-managed working caches | A guaranteed cache hit for the surrounding layer |

pnpm's `fetch` command prepares packages from the lockfile and relevant configuration before the full application is copied into an image. The subsequent install still matters; local dependencies and the chosen dependency set must be accounted for. [pnpm fetch](https://pnpm.io/cli/fetch).

The Go command maintains its own build and test caches. Nx can restore the outputs of a cacheable task without invoking the underlying command. These are separate layers of reuse, not interchangeable green checkmarks. [Go cache documentation](https://pkg.go.dev/cmd/go#hdr-Build_and_test_caching) and [Nx task caching](https://nx.dev/docs/features/cache-task-results).

My warming step prepares the layers that the next work is likely to need. It does not launch every service and precompute every possible target just to declare the machine warm.

## Follow one change through the system

Consider an illustrative application with a TypeScript console, a Go API, and a Temporal Go worker. The console consumes a generated API client. The API consumes generated wire types and SQL query code. The worker uses SQL query code inside Activities.

A UI-only edit selects the console. A wire-contract change selects its generators and actual consumers. A SQL row-shape change can select query generation, the API, the worker, and database checks. That last case is different from a data-only migration that leaves generated types unchanged.

With matching outputs available, unchanged prerequisites can be restored. With a cold cache, those prerequisites may have to run. Unrelated targets should remain unrelated in either case.

Nx's affected mechanism uses Git changes and the project graph to select impacted projects. Cache evaluation then decides whether selected work can be restored. The base and head revisions must be correct; an incorrect comparison can undermine otherwise excellent input declarations. [Nx affected tasks](https://nx.dev/docs/features/ci-features/affected).

Try **No code change**, then switch between **Warm** and **Cold** in the explorer below. Next select **OpenAPI** and follow the consumers. This is the same explanatory model introduced in part one, now used as a worked reference—not a connection to live infrastructure or a performance measurement.

## Docker has two different cache mechanisms

Docker layer reuse answers whether a build step needs to execute. A BuildKit cache mount can make that step cheaper when execution is necessary.

That is why a source edit should not automatically mean downloading dependencies again. Put stable dependency inputs before frequently changing source, and keep irrelevant files out of the build context. [Docker cache optimization](https://docs.docker.com/build/cache/optimize/).

Here is an illustrative Go build stage, not a complete production Dockerfile. It assumes an application with both `go.mod` and `go.sum`; the builder image must be supplied as a reviewed, digest-pinned reference.

```dockerfile
# syntax=docker/dockerfile:1
ARG GO_BUILDER_IMAGE
FROM ${GO_BUILDER_IMAGE} AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    go build -trimpath -o /out/api ./cmd/api
```

If the source changes, the compile step may run while retaining useful module downloads and compiler entries. Cache mounts are working storage, however—not guaranteed inputs and not a place to leave the only copy of the output. The build must still succeed when they are empty. [Dockerfile cache-mount reference](https://docs.docker.com/reference/dockerfile/#run---mounttypecache).

I keep `node_modules`, worktree output, reports, local credentials, and unrelated content out of the relevant context. I do not ignore required source just to manufacture hits.

The less obvious trap is freshness: a cached `RUN` instruction does not inspect the package server to discover that newer packages exist. Changes to secret contents also do not automatically change the build cache key. Pin or deliberately refresh external inputs; never put secret values in build arguments merely to influence a key. [Docker invalidation rules](https://docs.docker.com/build/cache/invalidation/).

## Warm the right environment once

My preferred preparation phase resolves the repository's intended tools, installs the pinned dependencies, prepares required images, and verifies a representative path before assigning dependent work.

Then workers reuse that preparation where it is compatible. A shared package store is not a reason to point two worktrees at one mutable `node_modules` installation. Host and container dependencies may also contain platform-specific native code. Docker explicitly warns against synchronizing such dependency directories across environments. [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/).

For ephemeral CI machines, a remote cache can carry completed results between runners. It also introduces a publisher and a reader that need a trust relationship. I would not let an untrusted pull request write artifacts that privileged release jobs later consume as trusted output.

Docker supports external cache backends, but the export destination needs ownership too. Multiple exporters writing the same cache location can overwrite one another. Separate appropriate scopes and choose the useful fallback caches deliberately. [Docker cache backends](https://docs.docker.com/build/cache/backends/).

Warming should be an optimization that can fail safely. If a cache disappears, the worker should do more computation—not lose the ability to determine the correct result.

## Generated output is a real dependency

One of the easiest mistakes is getting generation order right while getting the consumer's cache key wrong.

Suppose a generator runs before a TypeScript check, but the check ignores the generated declarations. The command order looks sensible. The restored result may still describe a different API.

Nx supports dependent-task outputs as explicit inputs, including declaration-file patterns. Git-ignored output needs deliberate treatment because normal source-file inputs do not include ignored files. Patterns must cover the generated files that actually influence the consumer, not merely the convenient subset. [Nx inputs and dependent-task outputs](https://nx.dev/docs/reference/inputs).

I want to test that contract in both directions. Change a relevant schema and confirm the consumer responds. Change an unrelated note and confirm the consumer remains reusable. Change a generator and inspect both its output and downstream decisions.

If regenerated bytes are identical, a consumer keyed to those bytes may remain reusable; a consumer also keyed to upstream source can legitimately rerun. That is a property of its declared inputs, not a universal promise from content hashing.

**Small files reduce editing overlap. Correct input declarations determine cache reuse.** They solve related but different problems.

## Every worker needs somewhere safe to write

A worktree gives an agent a separate checkout. It does not automatically allocate private generated directories, ports, test reports, container resources, or database records.

I think of a worker's environment as a small resource assignment: its checkout, output root, service ports, test database, and workflow task queue. The assignment also identifies what can be shared and what only this worker may clean up.

Compose project names help scope project resources. That is useful for parallel work, but explicit container names, external volumes, bind mounts, and published host ports still need review. A project label does not magically rename every external resource. [Compose project names](https://docs.docker.com/compose/how-tos/project-name/).

For caches intended for concurrent access, I use the tool's supported coordination rather than inventing a shared-folder protocol. Go documents that its build cache supports concurrent invocations. BuildKit offers sharing modes for cache mounts, and the appropriate choice depends on the tool. That is different from two generators overwriting the same final files. [Go cache documentation](https://pkg.go.dev/cmd/go#hdr-Build_and_test_caching) and [BuildKit mount options](https://docs.docker.com/reference/dockerfile/#run---mounttypecache).

The rule is not “nothing mutable can be shared.” It is “share through a mechanism designed to coordinate access; otherwise give the output an owner.”

## PostgreSQL is not another build-cache directory

A reusable PostgreSQL image is useful preparation. The database files inside a running system have a different responsibility.

For ordinary parallel integration tests, separate databases on one prepared server can be a practical starting point. Independent server instances offer stronger process and configuration isolation at a higher resource cost. Neither arrangement makes shared CPU, I/O, roles, or connection limits disappear.

A prepared template can reduce fixture setup, but its identity must include the relevant database version, extensions, migration revision, and seed definition. PostgreSQL requires the template database to have no other sessions while it is copied. Creating a database is also not an operation to hide inside the application's transaction. [CREATE DATABASE](https://www.postgresql.org/docs/current/sql-createdatabase.html).

I would assign each run a uniquely named test resource, verify its ownership, and clean up only that resource. A migration test should include upgrading an appropriate previous schema and exercising the result—not just starting a pristine database that already looks correct.

A cold compiler cache does not justify dropping a database. A failed test does not authorize an agent to wipe another worker's fixtures. Keeping those decisions separate is part of keeping parallel development reliable.

## Compilation cannot prove a transaction invariant

The persistence boundary is where seemingly independent modules can still participate in one atomic operation.

If an operation must update an authorization record and an execution record together, the adapters need the intended shared transaction. sqlc's `WithTx` lets generated queries use an existing transaction; it does not decide the application's transaction boundary for us. [sqlc transactions](https://docs.sqlc.dev/en/latest/howto/transactions.html).

Nor does a successful typecheck establish the behavior of competing database transactions. PostgreSQL's default Read Committed isolation gives statements their own snapshots, and stronger isolation can require transaction retries. Tests must exercise the invariant we need, not merely the fact that a query returned a row. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

For database-backed checks, I avoid caching away execution unless every external input and fixture is deliberately controlled. A typical target can be non-cacheable at the task-runner level while still reusing compiled code.

There may also be an inner test-result cache. Go's `-count=1` disables test-result reuse; that does not discard its compilation cache. Bypassing an outer Nx result alone does not necessarily disable an inner Go test result. [Go test caching](https://pkg.go.dev/cmd/go#hdr-Test_packages).

Fresh behavior checks and warm compilation are compatible. We do not need to choose between rerunning everything cold and trusting yesterday's database test.

## Temporal history is a compatibility boundary

A Temporal worker image is a build artifact. Temporal Service persistence stores workflow execution state and history. Rebuilding the worker does not mean that history should be recreated. [Temporal persistence](https://docs.temporal.io/temporal-service/persistence).

That changes which verification is relevant. A deterministic Workflow-code change may need replay against representative histories. A database-backed Activity change may need transaction and retry checks instead. A UI edit does not automatically require either, unless a real dependency connects it to those behaviors.

Temporal's testing guidance recommends replaying representative histories when checking Workflow Definition changes. Passing those histories is evidence for the cases exercised, not a proof about every possible execution. Histories can also contain sensitive inputs; keep the fixtures private or properly sanitized. [Temporal Go testing and replay](https://docs.temporal.io/develop/go/testing-suite).

I keep application PostgreSQL, Temporal persistence, and any derived search index visually and operationally distinct. They may use similar storage technology, but their ownership and recovery procedures are different.

An optional lexical or vector index can be rebuilt from its own canonical inputs when its contract permits. It is not a reason to add another database to every development environment, and it is not a substitute for workflow history or application records.

## Application-data invalidation is a different problem

Build caches commonly ask whether a result matches declared inputs. An application cache may need to react while its authoritative data is changing concurrently.

Consider this illustrative race: a reader loads an old database value; a writer commits a new value and evicts the cached entry; the original reader then fills that entry with the old value. “Delete after write” alone did not establish the freshness guarantee we wanted.

The response depends on the requirement. Versioned values, coordinated publication, bounded staleness, or avoiding the cache on a critical path are different choices. A timeout-based expiry is a freshness policy, not immediate revocation.

For authorization-sensitive decisions, I would define what happens on stale data and failed refresh before introducing caching. A fast answer is not useful if it can continue granting access after the policy requires denial.

That is why I do not put application-data eviction, build-result reuse, and database lifecycle behind one generic “clear cache” button. The phrase hides three different contracts.

## Keep the development loop separate from the release loop

The inner loop should exercise the change without repeatedly rebuilding the world. Source synchronization can be appropriate for a development server; compiled Go code still needs compilation and a process using the new binary. Compose distinguishes synchronization, restart, and image rebuild actions. [Compose Watch actions](https://docs.docker.com/compose/how-tos/file-watch/).

The release loop has a different question: is this identified artifact appropriate for this environment?

I want to build a candidate, record its digest and provenance, run the relevant checks, and promote that same artifact where runtime configuration allows. Tags are useful names, but they can move. Docker's build guidance describes digest pinning when exact image identity matters. [Image pinning](https://docs.docker.com/build/building/best-practices/#pin-base-image-versions).

Build-time frontend configuration can prevent one artifact from being used unchanged everywhere. Database migrations can prevent a simple image rollback from restoring compatibility. A fresh security scan can be necessary even when no source changed.

Those are reasons for deliberate release checks, not reasons to discard all development caches. Conversely, a development container with source mounted over its application is not proof that the shipped image contains that source.

## Measure the cases people actually encounter

I would measure a small matrix before claiming the workflow is faster:

| Case | What the run should reveal |
| --- | --- |
| Fresh worker, selected stores empty | Preparation and computation cost |
| Same revision, compatible results available | Restoration and remaining verification cost |
| One UI edit | Whether unrelated backend work stays out |
| One consumed contract change | Whether generators and consumers respond |
| Test-only edit | Whether test execution is separate from production output |
| Several workers at once | Queueing, cache coordination, CPU, memory, and I/O contention |

“Cold” needs an explicit definition: which stores were empty, which images already existed, and whether a remote fallback was available. Use disposable cache scopes for experiments instead of pruning a shared developer machine.

Record source and toolchain revisions, platform, worker count, cache locations, retries, and the exact commands. Count time waiting for integration as well as command execution. A warmer build that moves the bottleneck into a longer queue is not an end-to-end improvement.

The repository includes a tiny, standard-library-only [Go cache probe](https://github.com/jdavis-software/content/tree/main/examples/go-cache) for this article. It distinguishes an executed test, a repeated cached test, and a forced fresh execution with `-count=1`. It is a reproducible semantics check, not a PostgreSQL integration test or a performance benchmark.

I have deliberately not attached a productivity multiplier to these examples. The explorer models dependencies; the probe checks a narrow cache behavior. Neither measures the throughput of an entire engineering team.

## The real optimization is selective repetition

I still want compilers to reject incorrect code, database tests to expose broken invariants, and release checks to catch incompatibilities. The work to eliminate is the unrelated computation and repeated setup surrounding those checks.

That requires a dependency model, not just a larger cache. It requires ownership of mutable output, not just another branch. It requires knowing which state is disposable and which state is the reason the system exists.

**Warm what can be reused. Invalidate what changed. Recheck what matters. Preserve what must survive.**

That is how I want rapid implementation to become rapid delivery—not simply a faster way to accumulate unintegrated changes.
