Two agents can both pass their checks and still produce a broken system.

One built against yesterday’s contract. The other built against today’s.

That is why I don’t think about loops and graphs as competing approaches to agent engineering.

A loop improves a bounded result: implement, check, repair, or stop.

A graph coordinates the wider process: dependencies, parallel work, compatible artifacts, review, and recovery.

The interesting part is where they meet.

In my latest Engineering Notes article, I explore:

• Local repair without restarting unrelated work
• Joins that check which revisions actually belong together
• Planning versus scheduling
• Worktree isolation versus runtime ownership
• Durable recovery without assuming exactly-once effects
• Approval tied to an exact artifact—not a green box

I also built an interactive illustration. You can step through an API repair, an exhausted retry budget, a changed contract, or a pending approval and see where the workflow stops.

Andrew Ng’s reflection, tool use, planning, and multi-agent patterns provide useful foundations. The loop-and-graph architecture in this article is my synthesis, not a prescribed progression attributed to him.

Loops improve the work. Graphs coordinate the work. Contracts determine whether the pieces belong together.

Read the article:
{{articleUrl}}

#AgenticAI #SoftwareEngineering #SoftwareArchitecture #DeveloperTools
