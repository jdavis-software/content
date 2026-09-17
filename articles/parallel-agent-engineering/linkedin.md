Fewer files are not always a simpler architecture—especially when several AI agents need to work at once.

That is changing how I structure software.

In my DriftGate rebuild, I am combining smaller, cohesive files with TypeScript 7, Go, Nx, semantic code navigation, generated API contracts, and isolated Git worktrees.

The important part is how they fit together.

An agent gets a bounded task and the relevant context. Generated contracts reduce interface guesswork. Repeatable scaffolding establishes conventions. Focused checks validate the change. Private build outputs prevent workers from overwriting each other.

Then the same boundaries carry into DevOps: reuse compatible dependencies and completed artifacts, keep mutable test state isolated, and invalidate only the work that actually changed.

Small files alone do not produce smaller rebuilds. Real dependency edges, generated inputs, tool versions, and output ownership determine that.

I am not trying to make repositories harder for people to understand. I am moving away from the assumption that one person—or one agent—will hold the entire system in their head.

The goal is less rediscovery, fewer collisions, and a shorter path from a task to a working, integrated change.

I wrote about the architecture and its tradeoffs:
{{articleUrl}}

#SoftwareEngineering #AgenticAI #TypeScript #DevOps
