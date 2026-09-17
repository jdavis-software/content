The most useful question I have found to ask about coding agents is not “How fast can this model write code?” It is “How much independent work can my engineering system safely accept?”

That question is changing how I structure repositories, define tasks, and think about delivery. I am moving toward smaller modules, explicit contracts, isolated Git worktrees, and validation that understands dependencies. TypeScript, Go, `tsx`, ESM, and Nx all have a place in that approach. But the interesting part is how the pieces fit together.

**More agents are only useful when more work can actually proceed independently.** Otherwise, faster code generation just moves the queue to integration, CI, or deployment.

## Start with the unit of work, not the number of agents

“Build authentication” looks like a task. In practice, it contains several different decisions: the public contract, token validation, service-account credentials, permission checks, persistence, tests, and integration with the application.

Hand that entire problem to multiple agents and they can easily duplicate decisions or modify the same files. I would rather establish the contract first, then divide the implementation into bounded tasks.

A work packet should explain the objective, files the agent owns, permitted dependencies, acceptance checks, and the specific artifact it must return. It should also say what the agent must not change.

```json
{
  "task": "Implement service-account token validation",
  "owns": ["packages/identity/token-validation/**"],
  "reads": ["packages/identity/contracts/**"],
  "mustNotChange": ["packages/billing/**", "pnpm-lock.yaml"],
  "checks": ["identity-token-validation:test", "identity-token-validation:typecheck"],
  "integration": "Return the agreed AuthContext contract"
}
```

This is an illustrative packet, not a claim that every repository already enforces these fields. The important part is that ownership and exit conditions are explicit.

The aim is not to remove reasoning from engineering. It is to stop every agent from independently rediscovering the same architecture or renegotiating an interface that was already agreed.

## Nx gives the repository a map

I use Nx's project graph as architectural context. It describes projects and their dependencies; the task graph then expresses the target-level work and prerequisites we intend to execute. Those are related graphs, not interchangeable concepts.

Nx's affected workflow combines Git changes with the project graph to identify impacted projects. Its caching system can restore task outputs when the relevant computation inputs match. That gives an orchestrator two useful questions: what might need checking, and which previously completed checks are still reusable? [Nx affected documentation](https://nx.dev/docs/features/ci-features/affected) and [task caching](https://nx.dev/docs/features/cache-task-results).

My architectural goal is to keep those dependency surfaces small enough to be meaningful. A universal `shared` package that almost everything imports can defeat that goal. Splitting a repository into folders does not create independence if the imports still couple everything together.

I want an identity task to understand identity's contracts and immediate dependencies, not ingest the entire company codebase before changing a validator.

## Worktrees isolate files, not the whole world

Git worktrees provide separate working directories attached to one repository, allowing different branches to be checked out at the same time. They are a practical way to keep agents from changing files underneath one another. [Git worktree documentation](https://git-scm.com/docs/git-worktree).

```bash
git worktree add ../content-agent-contracts -b agent/contracts
git worktree add ../content-agent-tests -b agent/tests
```

The working pattern I am targeting is one bounded task, one branch, one worktree, and one accountable owner.

But a worktree is not a container or a security boundary. Agents can still collide through shared database schemas, development ports, Docker resources, caches, or external services. They can also produce incompatible changes on perfectly isolated branches.

That means the task needs runtime boundaries as well as file boundaries. Give test jobs isolated database names, avoid sharing mutable generated directories, and serialize changes to dependency manifests and shared contracts. Review the integrated result, not just each branch in isolation.

## TypeScript 7 makes validation a more interesting investment

Microsoft released TypeScript 7.0 on July 8, 2026. Its compiler is a native Go port that uses native execution and parallelism; Microsoft reports typical full-build improvements of roughly 8–12 times in the workloads described in its announcement. Those are vendor measurements, not results I am claiming for my own projects. [TypeScript 7.0 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

The practical implication for my workflow is simpler than a headline benchmark: agents repeatedly edit, check, inspect, and try again. Reducing validation latency can shorten those iterations.

There is an adoption caveat. The 7.0 announcement explicitly calls out the missing stable compiler API and compatibility concerns for tooling that embeds TypeScript, including Astro, MDX, Vue, and Svelte. I would verify each toolchain rather than assume replacing a compiler package upgrades everything around it.

Faster compilation also does not mean unlimited concurrency. Several agents can each start multithreaded compilers and compete for the same memory and CPU. I want concurrency limits based on the machine and workload, not on the largest number of workers a configuration field accepts.

## Go and TypeScript solve different parts of my system

My direction is not “rewrite everything in Go.” TypeScript remains useful for application interfaces, web experiences, SDKs, and tooling. I am choosing Go where its operating model fits backend services and workers.

Go provides goroutines and channels as language-level concurrency constructs. They make it possible to express concurrent work, but they do not automatically provide backpressure, safe retries, or a distributed transaction. Those remain application-design responsibilities. [Effective Go: concurrency](https://go.dev/doc/effective_go#concurrency).

There are two separate uses of Go in this discussion: Microsoft choosing it to implement the TypeScript compiler, and me choosing it for parts of my application architecture. The first does not prove the second is optimal. I still need workload evidence, understandable ownership, and operational simplicity.

For a mixed-language system, I want versioned contracts between components, not an assumption that a TypeScript type somehow validates the payload a Go service receives. Boundary validation belongs at runtime too.

## `tsx` and ESM reduce avoidable friction

`tsx` is the execution tool I use for small TypeScript scripts. It is not a replacement for a dedicated typecheck. Running a script successfully and proving its types are sound are different checks. [tsx project documentation](https://github.com/privatenumber/tsx).

I also prefer a consistent ESM convention. Node supports explicit module selection through mechanisms including `.mjs` files and a package's `type` field. A clear convention makes it easier to reason about imports and execution. It does not eliminate every CommonJS interoperability issue. [Node's ESM documentation](https://nodejs.org/api/esm.html).

The value is reducing unnecessary decisions: which module system to use, which runtime executes a script, and which command is authoritative in CI. When those answers vary between packages without a good reason, agents spend time resolving avoidable ambiguity.

## The same boundaries help CI and caching

One small edit should not make the build system behave as though the whole platform changed.

The target is not “never invalidate a cache.” That would be unsafe. The target is **invalidate precisely, and reuse only what is still valid**.

Nx cache inputs can include source files, relevant configuration, runtime values, environment variables, and external dependencies. Omitting a real input can produce a false cache hit; declaring everything globally can create unnecessary misses. Correctness comes before hit rate. [Nx inputs and named inputs](https://nx.dev/docs/reference/inputs).

Here is how I reason about three changes:

| Change | Expected validation scope | What needs caution |
| --- | --- | --- |
| Identity implementation | Identity and known consumers | Integration behavior can still cross service boundaries |
| Shared contract | Every known consumer of that contract | A small diff can legitimately have a wide impact |
| LinkedIn copy | Content checks for that derivative | It should not regenerate an unrelated cover image |

Affected selection and caching are different decisions. A task can be affected yet still reuse a matching cached result. An apparently unrelated task may need to rerun when a global toolchain or environment input changes.

I would keep targeted checks in the fast path and retain appropriate integration and broader regression checks. A dependency graph is valuable evidence, not proof that every runtime relationship has been modeled.

## Docker and deployment need their own contracts

A source dependency graph is not automatically a deployment graph. A package may be consumed by multiple deployable services. Several packages may ship together. Runtime coupling may not appear as a source import at all.

I want an explicit mapping from projects to deployable artifacts, followed by release checks appropriate to each service.

Docker has a separate cache model. Build-context size, `COPY` ordering, dependency installation, and cache mounts affect what can be reused. A changed file in the context does not by itself mean every layer must rebuild; what matters is how the build steps consume those inputs. [Docker cache optimization](https://docs.docker.com/build/cache/optimize/).

For delivery, the goal is to build an artifact once, identify it by digest, validate it, and promote that artifact rather than independently rebuilding it for each environment. That requires a deliberate configuration strategy. Frontend settings embedded at build time, for example, can prevent one artifact from being reused unchanged everywhere.

Smaller deployment units can reduce the immediate blast radius, but they do not remove shared database migrations, incompatible API changes, or cross-service rollback problems. Those still need release coordination.

## Parallelism has a critical path

I think about the workflow as contracts first, independent implementation second, and integration afterward.

```text
                    Agreed contract
                          |
             +------------+------------+
             |            |            |
         Agent A      Agent B      Agent C
         worktree     worktree     worktree
             |            |            |
         focused      focused      focused
         checks       checks       checks
             +------------+------------+
                          |
                  integration checks
                          |
                   reviewed release
```

Adding workers helps only while useful independent work remains. Eventually the bottleneck may be a shared contract, a database migration, a review queue, or a limited test environment.

The feedback I want is not just “agents completed tasks.” I want to know how long a validated change took to reach integration, how often changes had to be redone, how much CI was reused, and whether failures escaped review.

I am not claiming a particular multiplier here. A measured throughput improvement needs a baseline, comparable tasks, hardware details, and a record of both successes and rework. Otherwise, an impressive agent count is just an impressive agent count.

## The repository is part of the engineering system

The broader shift for me is treating repository structure as part of execution design.

Clear ownership reduces collisions. Explicit contracts reduce redundant decisions. Fast checks make iteration less expensive. Worktrees isolate working files. Dependency-aware caching avoids recomputing unrelated work. Release boundaries keep a small change from automatically becoming a large deployment event.

None of those ideas requires an AI agent. Agents simply make weak boundaries expensive much faster.

That is why the question I keep returning to is not “Which model writes code fastest?” It is this:

**How should I design software delivery when implementation capacity can operate in parallel, but correctness still has to be established end to end?**

That is the engineering problem I am building around.
