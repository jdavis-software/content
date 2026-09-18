An agent has the repository, the documentation, and a large context window. It still changes the wrong thing.

The implementation can look reasonable. The missing detail is often smaller than the prompt: a contract that was superseded, a caller that relies on an edge case, or a test that explains why a seemingly unnecessary branch exists.

My response is not to remove the agent's ability to explore. It is to make the starting context more deliberate—and make further exploration easier to verify.

In [part one](https://jdavis-software.github.io/content/articles/parallel-agent-engineering/), I discussed organizing software for parallel implementation. In [part two](https://jdavis-software.github.io/content/articles/keeping-parallel-development-fast/), I followed that work through caches, builds, and persistent state. This installment asks what each agent should know before it starts changing anything.

**The unit I want to optimize is not the prompt. It is the path from a task to a justified change.**

## Capacity is useful. Selection is still a job.

A larger context window gives us room to inspect more evidence. That matters for broad migrations, unfamiliar systems, and problems whose relevant information is spread across many files.

It does not decide which document is current, which behavior the task must preserve, or whether a retrieved snippet belongs to the agent's working tree.

The 2024 *Lost in the Middle* study found that the position of relevant information affected performance on its question-answering and retrieval tasks. It is useful historical evidence that fitting text into a window and using it effectively are different questions—not a benchmark of the coding models available today. [Original paper](https://aclanthology.org/2024.tacl-1.9/).

I am not arguing that less context always wins. An underspecified prompt can be just as damaging as an indiscriminate document dump. I want enough information to establish the required behavior, with an explicit route to the details that remain outside the initial packet.

That means optimizing for relevant coverage, not merely the smallest token count.

## Start with the decision the agent needs to make

Consider an illustrative task: change an API client's retry behavior so that a validation error is returned immediately rather than retried.

A general instruction such as “fix retries” leaves a lot open. Which errors are retryable? Who owns the error classification? Does the transport expose the status code? Must the public client signature remain unchanged? Is there a test that distinguishes a transient failure from a permanent one?

For this task, I would establish the expected behavior, the accepted error contract, the relevant implementation and callers, and the focused verification before asking for a patch.

A useful packet might describe the following boundaries:

| Question | Evidence the agent needs |
| --- | --- |
| What must change? | The task's exact acceptance criteria |
| What must remain compatible? | The accepted API error contract and client surface |
| Where is the behavior implemented? | Resolved source locations in the current worktree |
| Who relies on it? | Relevant callers and dependency information |
| How will we establish completion? | Existing tests and the required new failure case |

The packet should not answer an unresolved policy question by quietly guessing. If the contract never classified a particular response, that is a decision to resolve, not a reason to paste another thousand lines into the prompt.

## Keep four views of the system separate

I think about context as four complementary views: intent, code structure, executable contracts, and observed execution state.

Intent explains the task and accepted decisions. Code structure explains projects, symbols, and callers. Executable contracts describe boundaries such as wire formats. Observed state tells us which checkout and tooling produced the evidence, and what remains incomplete.

These views can disagree. A design page can describe a planned interface that the source has not implemented. A generated client can lag its schema. A task can refer to a module that has moved.

I want those disagreements reported, not blended into one confident summary.

Nx's project graph describes projects and dependencies, while its task graph describes targets and prerequisites. That is useful architectural context, but neither graph is the company's decision history or a universal representation of runtime behavior. [Nx graph documentation](https://nx.dev/docs/features/explore-graph).

The same principle applies to the knowledge base. It explains selected intent. It does not become the implementation simply because an agent read it.

## Follow symbols, not just filenames

File search is a good starting point when the task includes an exact identifier. After finding the implementation, I want the agent to ask more precise questions: where is this symbol defined, where is it referenced, and which type or interface does it implement?

TypeScript tooling exposes definition, reference, type-definition, and implementation navigation. Those capabilities are different from running the compiler and receiving a list of type errors. An agent needs a callable integration with the relevant language tooling; an installed editor feature is not automatically an agent tool. [TypeScript navigation](https://code.visualstudio.com/docs/typescript/typescript-editing#_code-navigation).

On the Go side, `gopls` provides semantic navigation, including definitions, references, implementations, and call hierarchy. Its documentation also describes limits: reference results depend on the analyzed build configuration, and the static call hierarchy does not include dynamic calls. A query that returns no caller is not proof that no runtime consumer exists. [Gopls navigation](https://go.dev/gopls/features/navigation).

For cross-language boundaries, I would follow explicit OpenAPI and generator provenance rather than pretend a TypeScript language service can discover every Go HTTP handler by itself.

This is why small files and semantic navigation belong together. Granularity narrows editing surfaces. Navigation helps the agent move between them without turning the repository into a scavenger hunt.

## The current worktree is part of the evidence

“Source at commit X” is incomplete when an agent has modified tracked files, created an untracked test, or changed a document without saving it to disk.

Git distinguishes staged changes, working-tree changes, and untracked paths. A diff of tracked files alone is not a complete inventory of the current workspace. [Git status](https://git-scm.com/docs/git-status) and [Git diff](https://git-scm.com/docs/git-diff).

Language tooling may see another layer. Gopls describes snapshots, saved files, and unsaved editor overlays as distinct parts of its state. A disk-based helper and a language-server session can therefore answer from different versions of the same apparent file. [Gopls implementation model](https://go.dev/gopls/design/implementation).

My proposed context record includes the base revision, relevant file-content hashes, task revision, build configuration, and the source view actually queried. If the helper cannot see unsaved editor changes, it should say so. The workflow can save them first or ask the correct session; it should not silently call its answer current.

Capturing a snapshot also requires care. Reading several files while another process rewrites them can produce a mixed view. A practical implementation needs a consistent capture or a check that relevant inputs did not change during assembly.

The objective is not bureaucratic metadata. It is being able to answer: “Which code was this recommendation actually about?”

## An accepted decision is not just a similar paragraph

Suppose the knowledge base contains an early retry proposal and a later accepted correction. Both contain “timeout,” “validation,” and “retry.” Both may look relevant to a search engine.

Similarity does not tell us which one governs the implementation.

I would preserve stable decision IDs, explicit status, revision references, and supersession links. Retrieve the current accepted decision first; retain older material only when it explains history that the task needs. A recent timestamp by itself is not enough—a newly edited draft can still be a draft.

For the retry example, the agent should receive the accepted classification and any unresolved cases, not choose between two apparently authoritative paragraphs using whichever sounds more plausible.

The same applies to code generation. The schema, generator configuration, and consumed output need a traceable relationship. If the generated file disagrees with the accepted schema, the packet should identify the mismatch rather than invite an agent to hand-patch machine-owned code.

Context becomes more reliable when relationships are explicit enough to check before the model interprets them.

## A thin resolver beats another mandatory platform

The architecture I am working toward is a small Context Resolver that joins existing sources: the selected task, versioned decisions, observed project relationships, and language-tool results.

That live integration is a direction, not a completed service I am claiming to have deployed. The educational example in this article is much narrower: it checks an authored packet against explicit requirements.

The resolver should return the relevant evidence, its source identity, and unresolved dependencies. It should not replace Nx, recreate language-server analysis, become the task scheduler, or grant credentials.

Anthropic's context-engineering guidance describes a useful just-in-time pattern: retain lightweight identifiers and retrieve information when needed instead of always preloading every detail. I treat that as an implementation pattern worth evaluating, not a universal rule that preloading is wrong. [Context-engineering guidance](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents).

For a known task, the first version can be straightforward. Resolve the named contract. Read the focused module and its tests. Follow the relevant callers. Include the accepted decision. Record what is missing.

A new vector service is not a prerequisite to any of those operations.

## Try a packet that is large, stale, or incomplete

The explorer below uses a fictional retry task with five required evidence items: acceptance criteria, an error contract, the retry implementation, a caller, and a test file. Each has a named expected revision.

**Focused packet** supplies all five. **Repository dump** supplies the same required evidence plus unrelated material. It is larger, but the example does not pretend that its presence makes the model fail. **Stale contract** supplies the wrong contract revision. **Missing test** leaves out a required item.

You can inspect the selected evidence and its content, then change the current task so that a newer contract is required. The existing packet does not magically become current. Use **Refresh packet** to align the fixture with that requirement.

There is also an access-withdrawal scenario. The page contains only public fictional material, so this is not a real permission boundary; it demonstrates the check a trusted backend would need to perform before returning private content.

The displayed counts are fixture item counts, not tokens, quality scores, or measured model performance. “Requirements satisfied” means this model's declared evidence checks passed. It does not mean that an implementation is correct or authorized to ship.

## Choose retrieval by the question

For exact symbols, I would start with direct references, repository search, or language tooling. For a known task, an ordered reading map can be more useful than a broad search over the entire knowledge base.

Lexical search is valuable for exact identifiers and terminology. SQLite FTS5 supports full-text retrieval, including phrase and prefix queries. It can serve as an optional local index over selected documents without becoming an authoritative application database. [SQLite FTS5](https://www.sqlite.org/fts5.html).

Embedding-based retrieval has a different potential benefit: discovering conceptually related material when the query and source do not use the same words. That is a reason to evaluate it for exploratory questions, not a reason to let similarity select an active permission rule or the latest accepted schema.

I would add semantic retrieval only with explicit source, model, chunking, and indexing boundaries. Its result should still point back to inspectable evidence and pass the same revision and access checks.

The right order depends on the task. A repository-wide architectural investigation may legitimately need broad discovery. A known error in one client method usually does not need the same starting context.

## Bound the packet without hiding what matters

A context budget should reserve space for reasoning, tool results, and the eventual change. It should not shrink the evidence until the task is impossible to perform responsibly.

I would prioritize requirements and invariants, the focused implementation, relevant contracts and consumers, and the verification path. Additional background can remain reachable through stable references.

But “read only this function” can go too far. Its enclosing type, helper, transaction boundary, or call site may explain the behavior. A useful packet includes enough surrounding code to interpret a snippet and tells the agent how to expand the scope when needed.

If required evidence does not fit, the system should report the shortfall, split the work, or use staged retrieval. Quietly dropping the last required test to meet a token target is not optimization.

Each included section should answer a question. Each excluded required item should remain visible as a gap. Optional material can be omitted without pretending it never existed.

## Context is evidence, not authority

A retrieved document can contain instructions. That does not make those instructions trusted configuration for the agent.

A comment in a source file might tell the reader to ignore tests, disclose credentials, or widen the task. It remains untrusted repository content unless an independently controlled instruction mechanism gives it the relevant authority. OWASP identifies indirect prompt injection through external material as a distinct risk. [OWASP prompt-injection guidance](https://genai.owasp.org/llmrisk/llm01-prompt-injection/).

I want the packet to distinguish trusted task instructions from quoted evidence and to preserve where each piece came from. Source labels are helpful, but they are not a complete security defense. Tools still need least-privilege permissions and independent checks around sensitive actions.

Likewise, a cached packet does not confer access. If permission to a document is revoked, a server should not return its old content merely because the packet hash still matches. Filtering must happen before material reaches the model; hiding it in the browser afterward is not access control.

Good context helps an agent make decisions. It cannot substitute for the system enforcing what that agent is allowed to do.

## Reuse context with the same discipline as build output

Part two argued that a cache is only useful when its inputs are modeled correctly. Context packets have the same problem.

A candidate reuse key would include the task requirements, selected knowledge revisions, source snapshot, relevant graph/tool configuration, resolver version, and retrieval options. It should not be a hash of an entire company archive when most of that archive does not affect the task.

Permission checks remain live conditions outside that content key. A matching hash proves identity under a hashing scheme, not freshness, truth, or authorization.

Selective invalidation also has limits. A change to an unrelated document need not invalidate a packet assembled from direct references. A new document can affect a broad ranked-search result, however, because it changes the candidate collection. The retrieval method is itself part of the dependency model.

If the accepted contract changes while two agents are working, I would notify the affected owners and re-resolve their packets. I would not let one agent silently update a shared contract while another continues with an older interpretation and both report success.

## Give parallel agents a common agreement, not identical baggage

An API agent, a UI agent, and a test agent may share the same accepted contract and task objective. Their focused code context should differ.

The API agent needs its implementation and invariants. The UI agent needs the client surface and relevant presentation behavior. The test agent needs the expected behavior, fixtures, and failure cases. Shared assumptions stay pinned; local implementation evidence comes from the appropriate worktree.

That does not mean communication disappears. An agent that discovers a contract problem should return the specific conflict and the affected evidence, rather than independently invent a new rule. Integration still has to check the combined result.

I also want handoffs to preserve changed paths, accepted outputs, unresolved questions, actual checks, and the revisions those checks used. A parent should not have to ingest every child transcript to learn what changed. Nor should it accept “done” without enough evidence to review the result.

This is another place where the repository structure pays off. Clear ownership makes it easier to assemble useful context and easier to describe a completed change.

## Evaluate missing evidence, not just prompt size

I would test context assembly against representative tasks with known required evidence. Did it include the governing decision? Resolve the correct implementation? Find the important consumer? Preserve the relevant revision? Refuse an inaccessible source? Explain a missing dependency?

Then I would evaluate the actual engineering outcome separately: patch correctness, rework, tool calls, retrieval latency, cost, and time to an integrated result. The same task and model settings matter when comparing approaches.

The accompanying fixture is intentionally modest. Its requirements are manually authored, and it does not discover symbols, query a live knowledge base, run embeddings, or call a model. Its automated tests can establish that stale and missing inputs are surfaced. They cannot establish that the selected context improves an AI model's performance.

You can inspect the [fixture and its small verification script](https://github.com/jdavis-software/content/tree/main/examples/context-packet) and run `node examples/context-packet/verify.mjs` from the repository. No API key, model call, or external service is involved.

That distinction keeps the demo useful. We can inspect and test the assembly rules before claiming a productivity benefit that needs a separate experiment.

## Better context is a feedback loop

The goal is not a perfect prompt that anticipates every question. It is a reliable starting point, a way to retrieve more evidence, and a clear response when that evidence changes or is insufficient.

Give the agent the task, the governing decisions, the actual source relationships, and the checks that matter. Keep the rest discoverable. Let it investigate, but require it to show when it has crossed from observed fact into a proposal or an unresolved assumption.

**Give agents room to reason—and a smaller set of uncertainties they should never have had to guess about.**

That is the context strategy I want alongside parallel implementation and fast delivery: not an entire codebase pasted into every conversation, but the right evidence reaching the right worker at the right revision.
