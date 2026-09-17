The most useful question I have found to ask about coding agents is not “How fast can this model write code?” It is “How much independent work can my engineering system safely accept?”

That question is changing how I structure repositories, define tasks, and think about delivery. TypeScript 7, Go, Nx, ESM, generated contracts, and isolated Git worktrees are all parts of the same approach: make the work explicit enough that agents can execute independently without repeatedly rediscovering the system.

The compiler matters. So do the files an agent has to read, the interfaces it can trust, the outputs it is allowed to write, and the infrastructure it has to wait for.

**More agents are only useful when more work can actually proceed independently.** Otherwise, faster code generation just moves the queue to integration, CI, or deployment.

## Start with the unit of work, not the number of agents

“Build authentication” looks like a task. In practice, it contains several different decisions: the public contract, token validation, service-account credentials, permission checks, persistence, and integration with the application.

Hand that entire problem to several agents and they can duplicate decisions or modify the same files. I would rather establish the contract first, then divide the implementation into bounded tasks.

A useful work packet identifies the behavior to implement, the source and contract revision to consume, the files the agent owns, and the checks that establish completion. It also states what the agent must not change.

For example, an illustrative packet might look like this:

```json
{
  "task": "Implement service-account token validation",
  "owns": [
    "internal/identity/domain/token_validation.go",
    "internal/identity/domain/token_validation_test.go"
  ],
  "reads": ["api/identity/openapi.yaml"],
  "mustNotChange": ["api/**", "go.mod", "pnpm-lock.yaml"],
  "checks": ["identity:test", "identity:vet"],
  "handoff": "Implementation, focused checks, integration notes"
}
```

Those paths and target names illustrate the contract; they are not a universal task format. The important change is that the agent starts with a bounded problem instead of an invitation to redesign everything around it.

The aim is not to remove reasoning from engineering. It is to stop every worker from renegotiating decisions that were already made.

## Small files are becoming a concurrency decision

This is one of the less obvious changes in my approach.

A large service file can feel convenient to a human: related behavior is visible in one place. But it also becomes a shared editing surface. Token validation, authorization, persistence, and transport work may all send different agents into that same file.

I am moving toward smaller, cohesive files inside clearly owned modules. A simplified identity module might contain:

```text
internal/identity/
  domain/
    identity.go
    token_validation.go
    token_validation_test.go
  application/
    authorize.go
    repository.go
  adapters/postgres/
    repository.go
  transport/http/
    handler.go
```

That produces more files to navigate. I am comfortable with that tradeoff when it gives each task a narrower reading and writing surface. Fewer files in the explorer is no longer the only measure of simplicity.

**I want the repository organized for precise changes, not just convenient browsing.**

That does not mean making it hostile to humans. Clear naming, module summaries, and navigable contracts matter more when the file count grows. Nor does it mean one function per package, one Go module per domain, or one microservice per feature.

Files, language packages, Nx projects, and deployable services are different boundaries. Splitting a file can reduce editing overlap without changing what the compiler must rebuild. Creating a new Nx project only makes sense when it has meaningful targets and accurately declared dependencies.

File-size checks are useful guardrails against sprawling implementations. They are not the architectural objective. The objective is a coherent responsibility that an agent can understand, modify, and validate without touching unrelated behavior.

## Nx gives the repository a map—but symbols matter too

I use Nx's project graph as architectural context. It describes projects and their relationships; the task graph describes the target-level work and prerequisites we intend to execute. [Nx's graph documentation](https://nx.dev/docs/features/explore-graph) makes that distinction explicit.

But a project graph cannot answer every question an agent has about code.

“Which application depends on this library?” is different from “Where is this method implemented?” or “Which callers use this type?”

That is why the navigation work also includes callable TypeScript language-service and Go `gopls` queries. Definitions, references, and type information let an agent move through the actual implementation rather than infer relationships from filenames alone. [Gopls documents these semantic navigation capabilities](https://go.dev/gopls/features/).

The combination is more useful than either layer by itself: identify the affected project, resolve the relevant symbol, inspect its consumers, then retrieve the surrounding code that matters.

It also has to reflect the agent's current worktree and edits. An index of yesterday's main branch is not an adequate answer to a question about today's modified implementation.

Smaller files work better when the system can navigate their relationships. Otherwise, granularity just replaces one large reading problem with a scavenger hunt.

## Give the agent the right context, not the entire company

Code explains what exists. It does not always explain why a boundary exists, which decision superseded an older one, or what a task is expected to deliver.

My next layer is a thin Context Resolver: assemble a bounded task pack from selected knowledge, the work-plan revision, the actual Nx graphs, and existing TypeScript/Go navigation.

That resolver is an approved direction, not something I am presenting as a completed live service. The distinction matters because static reading maps and a fully integrated resolver are not the same capability.

The design is deliberately modest. Required decisions, relevant contracts, owned paths, important consumers, completion checks, and unresolved dependencies belong in the pack. The full research archive does not.

Each underlying system keeps its job. Notion holds human research and decisions; selected knowledge can be distributed through versioned files; the work plan defines tasks; Nx and language tooling describe the code. A context pack does not become another scheduler or permission system.

I do not need a new vector database simply to tell an agent which contract to read. Exact references and existing navigation come first. Optional search infrastructure should solve demonstrated retrieval friction, not become a prerequisite to writing the next feature.

## Generate the agreement before parallelizing the implementation

“Agree on the API” becomes much stronger when the agreement is executable.

The stack uses modular OpenAPI contracts, `oapi-codegen` for Go transport artifacts, and Hey API for TypeScript clients with Valibot runtime validation. Rather than independently maintaining equivalent wire models in two languages, both sides derive from the canonical contract. [oapi-codegen](https://github.com/oapi-codegen/oapi-codegen) and [Hey API's Valibot integration](https://heyapi.dev/docs/openapi/typescript/plugins/valibot) supply those generation capabilities.

The intended relationship is:

```text
Canonical OpenAPI contract
             |
      +------+------+
      |             |
Generated Go    Generated TypeScript
wire artifacts  client and validators
      |             |
Application     Thin SDK ergonomics
behavior        and consumers
```

That lets backend and client work proceed against the same agreed shapes. It does not remove the need to test serialized responses, malformed input, missing versus null values, error cases, or values that cross language-specific numeric limits.

A TypeScript type is not runtime validation of a response from a Go service. And a structurally valid request is not necessarily authorized.

I also want HTTP, MCP, SDK, and CLI surfaces to converge on the same application behavior. The CLI should not invent its own policy rules; the SDK should not quietly become a second authorization engine. Generated code owns protocol consistency. Thin handwritten layers own ergonomics. Domain logic owns the actual decisions.

The schema and generator configuration are versioned inputs. Generated output stays machine-owned and reproducible, not a second implementation that agents hand-patch. Shared contract changes still need an owner; downstream agents consume that accepted interface rather than all editing it simultaneously.

## Stop asking every agent to invent the same starting point

The same principle applies before the first line of feature logic.

The approach includes bounded feature generators for Go and the console. They establish the expected files, companion tests, and relevant boundaries. Console generation requires an explicit server or client choice; existing targets are rejected rather than overwritten.

These are implementations of the [local-generator pattern supported by Nx](https://nx.dev/docs/kb/local-generators), not a reason to add another service or language module for every task.

An agent should not repeatedly decide where tests belong, how to name a component, or which starting structure the repository expects. Those conventions are better encoded once, then exercised through the normal checks.

This is where deterministic tooling complements a reasoning model. Let the generator handle the repeated structure. Let the agent handle the behavior that is actually new.

## Worktrees isolate files. Build outputs need isolation too.

Git worktrees provide separate working directories attached to the same repository, allowing different branches to be checked out simultaneously. That keeps agents from changing the same checkout underneath one another. [Git worktree reference](https://git-scm.com/docs/git-worktree).

My working pattern is one bounded task, one branch, one worktree, and one accountable owner.

But separate source directories are only the beginning. Generated clients, compiled binaries, TypeScript build state, Next build directories, test reports, and temporary files also need clear ownership.

Two agents can have cleanly separated source code and still corrupt each other's work by writing to one shared generated-output directory. A build process can rewrite a declaration file while another process is reading it. Separate invocations of the same task graph can compete over outputs inside one worktree.

The rule I want is straightforward: each lane owns its mutable outputs. Reuse verified immutable artifacts through the build system, rather than share a directory of in-progress results.

Worktrees are also not containers or a security boundary. Database identities, ports, workflow task queues, and external resources need their own isolation where the task uses them. Shared manifests, migrations, and composition roots retain a single writer.

## TypeScript 7 changes the feedback loop

Microsoft's TypeScript 7.0 release uses a native Go implementation and shared-memory parallelism. Its announcement reports typical full-build speedups of roughly 8–12 times in the workloads it describes. Those are Microsoft's measurements, not a multiplier I am claiming for my projects. [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

For this workflow, the implication is that agents repeatedly edit, check, inspect, and try again. Reducing validation latency can shorten those iterations across many tasks.

Adoption still needs explicit boundaries. In the qualified stack, application and SDK checks use native TypeScript 7, while tools that require the classic JavaScript compiler API retain a scoped TypeScript 6 compatibility dependency. Nx documents this [side-by-side approach](https://nx.dev/docs/kb/typescript-7).

I would rather preserve a small, understood compatibility layer than hide type errors or assume every tool understands the new compiler because its package installs successfully.

Compiler parallelism also shares hardware with agent parallelism. Several workers can each launch a multithreaded compiler and oversubscribe the machine. The useful concurrency limit depends on CPU, memory, and the workload—not the largest number a configuration field accepts.

## A faster compiler is only part of the toolchain

The feedback loop also includes formatting and linting. The selected JavaScript/TypeScript tooling includes Oxfmt, Oxlint, and its type-aware `oxlint-tsgolint` path. [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) handles formatting; [Oxlint's type-aware checks](https://oxc.rs/docs/guide/usage/linter/type-aware) use type information for rules such as detecting floating promises.

On the Go side, formatting, `vet`, focused tests, and semantic navigation each have their role. These checks should produce clear failures close to the change that caused them.

The repository launcher selects pinned executables rather than relying on whichever global tool an agent happens to find. A frozen dependency installation, the intended compiler, and the actual task worktree need to agree.

I also distinguish a tool being installed from an agent being able to call it correctly. A language server on disk is not yet a tested navigation workflow. A plugin visible to a parent agent is not proof that a child loaded the same instructions.

Prepare the required capabilities, verify a representative path, and reuse that setup. Repeating an entire environment audit after every small edit defeats the point of a fast loop.

## Go, TypeScript, `tsx`, and ESM have distinct jobs

My direction is not “rewrite everything in Go.” Go owns backend services and Temporal workers where that model fits; TypeScript serves the web, clients, SDKs, and developer tooling.

Temporal's Go tooling supports durable workflow applications. Workflow orchestration and effectful Activities are separate responsibilities; database and provider I/O do not belong inside deterministic Workflow code. [Temporal Go Workflow contract](https://pkg.go.dev/go.temporal.io/sdk/workflow).

The same clarity applies to TypeScript tooling. `tsx` executes TypeScript scripts; successful execution is not a substitute for a dedicated typecheck. It is also not the same thing as the `.tsx` source extension used for JSX. [tsx and typechecking](https://tsx.hirok.io/typescript).

ESM provides a consistent import/export convention. Explicit module choices reduce avoidable ambiguity around script execution and package boundaries, without pretending that CommonJS interoperability disappears. [Node ESM reference](https://nodejs.org/api/esm.html).

I want each layer to have a clear job. Adding several overlapping tools to solve the same problem gives agents more decisions, not necessarily more capability.

## The same boundaries help CI and caching

One small edit should not make the build system behave as though the whole platform changed.

The target is not “never invalidate a cache.” The target is **invalidate precisely, and reuse only what is still valid**.

Nx's affected workflow identifies impacted projects using Git changes and the project graph. Cache reuse asks a different question: do this task's relevant inputs match a previous computation? A task can be affected and still find a reusable result. [Nx affected documentation](https://nx.dev/docs/features/ci-features/affected).

Those inputs extend beyond hand-authored source. They include relevant configuration, tool versions, dependencies, environment values, schemas, and generated artifacts. Our task wiring explicitly accounts for generated output consumed by later checks, including files intentionally ignored by Git. [Nx inputs and dependent-task outputs](https://nx.dev/docs/reference/inputs).

Here is the behavior I want to preserve:

| Change | Work that should respond | Work that may remain reusable |
| --- | --- | --- |
| A test-only edit | The relevant test target | An unchanged production build |
| An identity implementation edit | Identity and its affected consumers | Unrelated billing work |
| A wire-contract edit | Its generators and actual consumers | Unrelated contract families |
| A compiler or generator change | Every target that depends on it | Only genuinely independent work |

These are intended dependency relationships, not promises that every small diff has a small impact. A shared contract can legitimately reach much of the system.

Splitting a file does not create a cache boundary. Declaring the real inputs does. Omitting a dependency to improve the hit rate just makes the build system confidently wrong.

## Start warm without sharing everyone's state

Once multiple agents are working, repeated environment setup becomes another source of wasted time.

The operating approach is to prepare pinned tools and needed dependencies, warm reusable caches, and make the required images available before assigning dependent work. An agent changing one function should not begin by rebuilding the development environment from scratch.

But “warm cache” is not one mechanism. Package caches, native compiler caches, Nx task results, and Docker layers answer different reuse questions.

Docker can retain stable dependency layers while rebuilding source-dependent work. BuildKit cache mounts can also preserve downloads or compilation caches even when a layer must rerun. Their sharing and locking settings must match the tools using them. [Docker cache optimization](https://docs.docker.com/build/cache/optimize/).

That gives us two separate goals: avoid executing unchanged work, and make necessary work cheaper when it does execute.

Neither justifies hiding a real input or trusting an image with the wrong source identity. Prebuilt is only useful when it is the right build.

The boundary is not “share everything to save time.” It is “reuse compatible inputs and completed artifacts; isolate changing outputs and test data.”

## PostgreSQL belongs in the architecture—not in a miscellaneous services box

Parallel code changes eventually meet shared state. Small files do not make database operations independent.

PostgreSQL remains the authoritative application database. The selected persistence tooling uses ordered SQL migrations through [tern](https://github.com/jackc/tern), sqlc-generated Go query code, and [pgx](https://pkg.go.dev/github.com/jackc/pgx/v5) for access and transactions. [sqlc generates typed code from SQL](https://docs.sqlc.dev/en/latest/); its transaction support lets generated query code participate in an existing transaction through `WithTx`. [sqlc transactions](https://docs.sqlc.dev/en/latest/howto/transactions.html).

That matters when identity, policy, and execution updates need one atomic outcome. Their adapters must share the intended transaction rather than quietly open independent ones. Separate modules are not permission to break an invariant across commits. PostgreSQL's concurrency semantics still apply. [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

The same ownership discipline applies during tests: use isolated database resources and deterministic fixtures where required, keep application and workflow-persistence responsibilities distinct, and clean up only the lane's own resources. A reusable database image is useful. Sharing one writable PostgreSQL data directory between independent servers is not.

I also separate operational data from derived search or knowledge indexes. A possible SQLite full-text index for developer context is a different role—not a second source of application truth and not a required part of the initial resolver.

More databases do not automatically produce more parallelism. Explicit data ownership does.

## Fast development and release verification are different loops

The development loop should be lightweight: make a bounded change, run the relevant compiler and checks, exercise the changed behavior, and integrate it.

Docker Compose Watch distinguishes source synchronization, synchronization with restart, and image rebuilds. That makes it possible to choose the appropriate response to a changed input instead of treating every edit as a full image build. For Go code, syncing a file alone is not enough; the development path still needs the appropriate compilation and process restart. [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/).

A database race test is valuable when transaction behavior changes. It is not the default response to a copy edit. Likewise, an unchanged broad suite should not be rerun indefinitely as a substitute for diagnosing one concrete failure.

Release verification has a different job. It checks the actual built candidate, its configuration, its integrations, and the behavior exposed through the running service.

My release direction is to validate identified artifacts and promote those artifacts where configuration permits, rather than assume independent rebuilds are equivalent. That is a release design—not a claim that a full multi-environment promotion platform is already operating.

A source dependency graph also is not automatically a deployment graph. Projects need explicit mappings to deployable units, and shared migrations or incompatible API changes still require coordination.

## Parallelism still has a critical path

The resulting flow is contracts and preparation first, independent implementation next, then integration against the actual combined result.

```text
        Task + accepted contract + relevant context
                            |
          +-----------------+-----------------+
          |                 |                 |
       Agent A           Agent B           Agent C
       worktree          worktree          worktree
       private output    private output    private output
          |                 |                 |
       focused           focused           focused
       checks            checks            checks
          +-----------------+-----------------+
                            |
                 integrated behavior check
                            |
                 identified release artifact
```

I want useful delegation, not artificial fan-out to fill available slots. Shared contract work has an owner. Integration needs reserved capacity. Tasks that can already proceed should not wait for unrelated infrastructure or an entire architectural layer to be declared finished.

Adding workers helps while independent work remains. Eventually the bottleneck may be a migration, a shared environment, a review queue, or a decision that cannot be parallelized.

The useful measurements are time to a validated integrated change, rework, cache reuse, time spent waiting, and defects that escape—not simply the number of agents that were active.

A fast fixture or successful cache restore is evidence about that boundary. It is not a whole-product delivery multiplier.

## The repository is part of the engineering system

The broader shift for me is treating repository structure as part of execution design.

Small, cohesive files reduce shared editing surfaces. Semantic navigation makes those files discoverable. Generated contracts reduce interface invention. Repeatable generators establish conventions. Fast native checks shorten feedback. Worktrees and private outputs isolate execution. Warm, correctly keyed caches avoid repeating work. Explicit state and release boundaries make integration more deliberate.

Most of these ideas are familiar engineering practices. Parallel agents make their interaction much harder to ignore.

I am not trying to make code less understandable to people. I am trying to stop organizing the entire delivery process around the assumption that one person—or one agent—will carry the whole system in their head.

The speedup I care about is the work that no longer has to happen: repeated discovery, duplicated decisions, avoidable conflicts, unnecessary rebuilds, and setup that should already be reusable.

The question I keep returning to is still this:

**How should I design software delivery when implementation capacity can operate in parallel, but correctness still has to be established end to end?**

That is the engineering problem I am building around.
