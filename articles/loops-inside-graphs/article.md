Two agents finish their tasks. Both say the checks passed. The integrated change still fails.

The client was built against one API contract. The service was built against another. Each worker improved its own output, but nothing established that the outputs belonged together.

That is the distinction I keep coming back to as I think about parallel agent engineering: **a good local feedback loop is not the same thing as a well-coordinated system.**

The earlier notes in this series covered [independent worktrees](https://jdavis-software.github.io/content/articles/parallel-agent-engineering/), [selective rebuilding](https://jdavis-software.github.io/content/articles/keeping-parallel-development-fast/), [task-specific evidence](https://jdavis-software.github.io/content/articles/better-context-for-ai-agents/), and [bounded decisions](https://jdavis-software.github.io/content/articles/jev-decision-layer/). This article connects those pieces through control flow: where work repeats, where it branches, and what must be true before separate results can advance together.

My preferred framing is not loops versus graphs. It is **loops inside graphs, with explicit contracts between them.**

## Two questions, not two competing architectures

A worker loop asks: what should I do next to improve this result?

An orchestration graph asks: which work is eligible to run, what does it depend on, and what happens after it finishes?

These are useful engineering distinctions, not mutually exclusive mathematical categories. A loop can be represented as a cycle in a graph. A graph can contain an iterative worker, a deterministic transformation, a tool call, or a human checkpoint. A graph does not have to be acyclic, and a node does not have to be an agent.

LangGraph's documentation makes that concrete: nodes contain computation, edges determine subsequent execution, and their composition supports looping workflows. Both nodes and edges can use models or ordinary code. That is an implementation example, not a reason every application must adopt LangGraph. [Graph API](https://docs.langchain.com/oss/javascript/langgraph/graph-api).

For me, the practical question is where to make a boundary visible. A helper function can stay inside a worker. A handoff whose failure, authority, or recovery needs separate treatment probably deserves an explicit boundary.

## Keep the attribution straight

The [AI Builder Club article that prompted this note](https://www.aibuilderclub.com/blog/andrew-ng-loop-to-graph-engineering) explicitly separates Andrew Ng's design patterns from the publication's own loop-to-graph interpretation. I am keeping that distinction here rather than presenting an implementation sequence as Ng's prescribed method.

Ng's original framework identifies **reflection, tool use, planning, and multi-agent collaboration**. These describe ways to organize agentic work; they are not four mandatory stages that every system must graduate through. His reflection discussion includes self-critique, feedback from tools, and a separate critic agent. Reflection therefore does not imply a single isolated node. [Original pattern overview](https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance/) and [reflection](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection).

The architecture below is my synthesis: use iteration to improve bounded work, and use explicit transitions to coordinate the larger process. It is not a newly verified Andrew Ng PDF or a universal recipe.

## Start with a worker that knows how to stop

Imagine assigning an agent a small Go API change. It reads the accepted contract, implements the handler, runs the focused checks, and examines a failing result. That failure can become useful feedback for another attempt.

But “keep trying until it works” is not a sufficient execution contract.

I want the worker to distinguish a repairable implementation error from missing evidence, an unavailable dependency, an exceeded budget, and an unresolved architectural decision. Repeating a compiler invocation cannot settle a missing product requirement. Asking another model to approve a result cannot make an unavailable test pass.

A useful worker result might look like this illustrative TypeScript shape:

```typescript
type Revision = string;

type WorkerResult =
  | {
      kind: "candidate";
      artifactRevision: Revision;
      contractRevision: Revision;
      evidenceRefs: readonly string[];
    }
  | {
      kind: "needs-repair";
      failureRefs: readonly string[];
      attempt: number;
    }
  | {
      kind: "blocked";
      reason: "missing-input" | "dependency-unavailable";
    }
  | {
      kind: "escalate";
      reason: "budget-exhausted" | "contract-conflict";
    };
```

This type is a design sketch, not a security boundary or a complete scheduler. A worker can still return an unsupported claim. The receiver must resolve the referenced evidence, check its scope, and decide whether the transition is allowed.

The important choice is that success is not the only terminal outcome. Stopping with a useful blocker is better than generating another confident paragraph after the useful work has ended.

## Feedback needs evidence, not just another opinion

A critic can identify a missing case or propose a better approach. That is useful, but it is different from observing a failing test or checking the actual response of a service.

In the API example, I would preserve the failing input, the relevant command, its outcome, and the exact artifact revision. The next attempt should address that failure rather than restart broad repository exploration without a reason.

I would also keep the verifier outside the worker's unilateral control. An implementation agent should not make its task pass by quietly deleting the assertion, changing the acceptance contract, or substituting an easier check. Tests can legitimately change, but that change needs its own review against the intended behavior.

Passing checks is evidence for the exercised cases, not a proof of universal correctness. Reflection also needs evaluation rather than assumed benefit. Ng's later course announcement places particular emphasis on traces, evaluation, and error analysis as the basis for deciding which part of a workflow to improve. [Evaluation and error analysis](https://www.deeplearning.ai/the-batch/check-out-our-course-on-how-to-build-ai-agents).

## Add a graph when the handoff becomes the problem

Now expand the example. One worker owns a TypeScript client; another owns the Go API. Both consume a reviewed wire contract. Each has a local implement/check/repair loop. An integrator receives their candidate artifacts and runs the cross-boundary checks.

The dependency structure is straightforward:

```text
Accepted contract revision
           |
     +-----+-----+
     |           |
 Client loop   API loop
     |           |
     +-----+-----+
           |
  Compatible artifact join
           |
    Integration checks
           |
   Required review / approval
           |
      Release candidate
```

The outer structure should not restart the client merely because the API has a repairable local defect. It should also refuse to combine a client for contract A with a service for contract B, even when both workers report green checks.

This is where the graph earns its place: eligibility, ownership, revision compatibility, and downstream transitions become inspectable instead of being implied by chat history.

Anthropic's engineering guide distinguishes fixed parallel subtasks from orchestrator-workers that determine subtasks from the input. Either can fit inside a larger workflow; neither removes the need to inspect actual outcomes and establish stopping conditions. [Composable agent patterns](https://www.anthropic.com/engineering/building-effective-agents).

## Watch the difference in the trace

The illustration below uses two fictional workers and authored check results. It does not call a model, execute a build, or manage real permissions.

Select **API repair** to see one lane revisit its implementation while the client result remains available. Select **Budget exhausted** to see repeated failure stop at escalation rather than turn into an endless cycle. **Contract changed** makes an important case visible: completed results tied to an older contract do not satisfy the new join. **Approval pending** shows that compatible artifacts and successful integration are still not permission to advance through a required human gate.

Step through the events or play the finite trace. The point is the transition logic, not a simulated speedup. An event position is not elapsed time, and two animated lanes are not evidence that two real agents ran.

## The join is an engineering decision

Fan-out diagrams are easy to draw. The join is usually where the difficult questions start.

Which results are required? Must all succeed, or is a partial result useful? Which source and contract revision does each result represent? What happens to late responses after the run has been cancelled? Who owns the merged output?

For this example, I would accept a client/API pair only when both candidates refer to the current contract, their required checks have valid evidence, and their output identities are known. The integration result must then identify the exact combined candidate it checked. A green badge from a different combination is not a substitute.

There are other legitimate policies. A search application might return the first useful source. A research report might continue with a clearly labeled unavailable source. A release pipeline might require every mandatory check. “Wait for the agents” hides those differences.

I would record branch completion under stable task identities, not append unstructured prose to a shared mutable transcript and ask another model to infer what finished. For shared fields, the merge rule needs to be deliberate: reject conflicting writes, reduce a collection, or name one writer. Arrival order should not silently decide business meaning.

## Planning proposes work; scheduling admits it

A plan describes intended work. A scheduler decides whether a particular unit can run now.

Those are different responsibilities. A planner may suggest three tasks, but the third may depend on the first two. A task may also be blocked by a missing credential, a writer reservation, an unavailable tool, or an exhausted concurrency limit.

In my design, the planner can propose a dependency change. It cannot retroactively declare an unreviewed contract accepted or invent capacity by adding more agents to a list. The execution layer validates the proposal against the resources and constraints that actually exist.

This is also how I would use a semantic router. A model can recommend “search,” “inspect code,” or “request review” from the current evidence. Ordinary code decides whether that route is eligible, whether its input is current, and whether it carries an external effect requiring approval.

A fixed topology can already make different choices on different runs through conditional edges. We do not need to pretend older graphs always execute the same path to explain why a model-based routing function can be useful.

## There are several graphs in this system

The word graph can conceal a category error.

My **execution graph** describes work and transitions. The **Nx project graph** describes project relationships. Nx then constructs a **task graph** for commands and prerequisites. A **knowledge graph or document map** describes relationships between information. These structures may inform one another, but they do not answer the same question. [Nx's mental model](https://nx.dev/docs/concepts/mental-model).

Suppose an OpenAPI contract changes. The implementation roadmap decides which tasks need new acceptance. The build system determines which targets depend on the relevant inputs. The context layer finds the affected decisions and source definitions. The orchestrator coordinates the eligible work.

Copying all of that into a second manually maintained graph would make the system harder to trust. I would connect the existing owners through versioned references instead. The orchestration layer should not pretend it is a compiler, a source index, and a project-management database at once.

This is why graph engineering is not a reason to add a graph database. The appropriate execution representation might be a few functions and typed records.

## Worktrees isolate edits, not the whole runtime

Git worktrees provide separate working trees with their own checked-out files and per-worktree state, while sharing repository data. That makes them useful editing surfaces for independent tasks. [Git worktree documentation](https://git-scm.com/docs/git-worktree).

I still need to allocate output directories, ports, test fixtures, and mutable service resources deliberately. A branch name does not protect a database another worker can reset. A graph node name does not restrict the filesystem paths a process can write.

For the running example, the client and API workers receive distinct owned paths and output roots. An integration owner assembles their accepted revisions. Generated contracts have a clear source and producer rather than two workers racing to rewrite the same files.

Small, cohesive files help narrow editing ownership. They do not automatically produce independent tasks. Two tiny files can still participate in the same transaction invariant, public interface, or migration sequence. Parallelism comes from understanding those dependencies, not counting files or drawing more nodes.

## Recover the smallest valid scope

A failed operation needs classification before repetition.

A transient provider timeout may justify another invocation under a retry policy. A failed assertion may justify a repair attempt with the failure attached. A missing requirement may need a human decision. A contract change may invalidate downstream evidence. Treating all four as “retry the agent” loses the reason for the failure.

I call the affected area the **recovery scope**: the smallest set of work whose results can no longer be used under the current inputs and acceptance rules.

In the illustration, an API repair leaves the client candidate untouched. A new shared contract blocks the old pair because both candidates declare that contract as an input. In a real repository, a narrower change could affect fewer consumers; the dependency declarations should determine the scope.

The same rule applies to caches. An unchanged, trusted build result can remain reusable. That does not automatically make an old integration result current, and it never converts a prior approval into approval of a new artifact. Reuse, verification, and authority are three separate decisions.

## Persistence is not exactly-once execution

A saved graph picture is not a recoverable run. The runtime needs the state required to resume, together with a defined policy for work whose outcome is uncertain.

LangGraph distinguishes thread-scoped checkpoints from cross-thread stores. Its in-memory checkpoint implementation does not survive process restart; persistent storage must be chosen when that is a requirement. [Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence).

There is another trap around human pauses: LangGraph's interrupt documentation explains that a resumed node restarts from its beginning. Work before the interruption can run again. Splitting approval and external effects into explicit boundaries helps, but the executor still needs appropriate duplicate handling. [Interrupt and re-execution semantics](https://docs.langchain.com/oss/javascript/langgraph/interrupts).

Consider an external ticket creation request that times out after the provider accepted it. Replaying the node is not enough to decide whether another ticket should be created. The application needs a supported idempotency key, a way to reconcile the result, or an explicit unresolved state.

For longer-running processes, Temporal supplies a durable execution model rather than merely a diagram. Its Activity documentation describes retryable work and the need to design Activities for idempotency. That can support a graph-shaped application without requiring a separate graph framework for every operation. [Temporal workflow execution](https://docs.temporal.io/workflow-execution) and [Activities](https://docs.temporal.io/activities).

I would choose one owner for durable orchestration in a given layer. Nesting runtimes without deciding who owns retries, cancellation, and recovery can produce duplicate work with better-looking dashboards.

## A human checkpoint must name the thing being approved

“Approved” is incomplete without an object.

For a release, I want the approval to name the candidate artifact, the target environment, the intended action, and any validity conditions. A changed candidate should not inherit permission merely because a previous run reached the same box in the diagram.

This does not require human review of every reversible local edit. It requires placing review where its purpose is clear: changing an accepted contract, publishing externally, or authorizing another consequential effect.

The approving identity and policy live outside the worker's editable output. A model can summarize why a candidate is ready. It cannot establish its own authority by returning an `approved: true` field.

The illustration intentionally stops at a release candidate. Its approval scenario is a fictional event in a trace, not a control connected to deployment or to your accounts.

## Measure the boundary that actually fails

Adding more agents is not automatically an improvement. Ng's multi-agent discussion presents roles as a useful decomposition and also notes that freely interacting agents can have hard-to-predict output quality. [Multi-agent collaboration](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-5-multi-agent-collaboration).

For an implementation, I would inspect separate questions: does the worker improve after concrete feedback? Do joins reject incompatible results? How much time is spent waiting for dependencies? How often does a repair spread into unrelated work? Are operators being asked for decisions they can actually make?

A trace should expose the task and attempt, relevant revisions, the selected transition and its reason, evidence references, and the terminal outcome. Sensitive inputs still need access controls and retention limits; observability is not permission to log everything.

The useful metric is an accepted end-to-end outcome under the intended constraints. A higher node count, more model calls, or a faster isolated loop does not establish that result.

This article contains no live multi-agent benchmark. The accompanying tests check the publication and its authored transition model, not the performance or safety of a deployed agent fleet.

## Keep the structure smaller than the problem

A single worker can be enough when it has one objective, a useful verifier, a bounded failure policy, and no meaningful handoff. I would keep that implementation simple.

Add explicit graph structure when branching, independent ownership, durable waiting, or different approval boundaries make the handoffs important. Keep local loops where feedback can improve a bounded result. Keep deterministic operations deterministic. Let a blocked path remain visibly blocked.

The goal is not to replace every loop with a graph. It is to stop leaving system-level decisions implicit inside local conversations.

**Loops improve the work. Graphs coordinate the work. Contracts determine whether the pieces belong together.**
