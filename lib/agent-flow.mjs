import {PHASES} from '../site/agent-flow-model.js';

const lanes = [['a', 'API behavior'], ['b', 'Client SDK'], ['c', 'Test coverage']];
const path = (key, d) => `<g data-flow-edge="${key}"><path class="af-rail" d="${d}"/><path class="af-trace" pathLength="1" d="${d}"/><circle class="af-packet" r="1" cx="500" cy="0"/></g>`;
const links = (kind) => `<svg class="af-links" viewBox="0 0 1000 64" preserveAspectRatio="none" aria-hidden="true">${
  kind === 'fork' ? lanes.map(([key], i) => path(`fork_${key}`, `M500 0 C500 30 ${[166.667,500,833.333][i]} 26 ${[166.667,500,833.333][i]} 64`)).join('') :
  kind === 'join' ? lanes.map(([key], i) => path(`join_${key}`, `M${[166.667,500,833.333][i]} 0 C${[166.667,500,833.333][i]} 38 500 34 500 64`)).join('') : path('release', 'M500 0 L500 64')
}</svg>`;

/** Authored trusted component, never rendered from arbitrary article HTML. */
export function agentFlow() {
  return `<section class="agent-flow article-cover" id="parallel-agent-flow" aria-labelledby="agent-flow-title">
  <div class="af-heading"><div><p class="af-eyebrow">THE ARCHITECTURE, IN MOTION</p><h2 id="agent-flow-title">Parallel work.<br>Shared confidence.</h2></div><span class="af-badge">Illustrative model</span></div>
  <p class="af-intro">One contract. Three isolated lanes. A single integration gate.</p>
  <div class="af-board" aria-hidden="true">
    <div class="af-node af-central" data-flow-node="contract"><span class="af-node-number">01 / DEFINE</span><strong>Agreed contract</strong><small>Interface · ownership · checks</small></div>
    ${links('fork')}
    <div class="af-lanes">${lanes.map(([key, label]) => `<div class="af-node af-worker" data-flow-node="${key}"><span class="af-node-number">02 / WORKTREE ${key.toUpperCase()}</span><strong>Agent ${key.toUpperCase()}</strong><small>${label}</small><div class="af-meter"><span data-flow-meter="${key}"></span></div><span class="af-worker-status" data-flow-status="${key}">Checks passed</span></div>`).join('')}</div>
    ${links('join')}
    <div class="af-node af-central" data-flow-node="integration"><span class="af-node-number">03 / CONVERGE</span><strong>Integration + review</strong><small data-integration-status>Validate the combined result</small></div>
    ${links('release')}
    <div class="af-node af-central af-release" data-flow-node="artifact"><span class="af-node-number">04 / DELIVER</span><strong>Release artifact <span class="af-check">✓</span></strong><small>One identified, reviewed result</small></div>
  </div>
  <p class="sr-only">An agreed contract branches into agents A, B and C in isolated worktrees. Each completes focused checks independently. All three join for integration and review before producing one release artifact.</p>
  <div class="af-controls" hidden>
    <div class="af-transport"><button type="button" data-flow-play>Play animation</button><button type="button" data-flow-replay>Replay</button><label class="af-scrub-label"><span class="sr-only">Animation progress</span><input type="range" data-flow-seek min="0" max="10000" step="50" value="0" aria-label="Animation progress"></label><output class="af-percent">0%</output></div>
    <div class="af-steps" role="group" aria-label="Explore the animation stages">${PHASES.map((p,i)=>`<button type="button" data-flow-step="${i}" aria-pressed="false"><span>0${i+1}</span>${p.label}</button>`).join('')}</div>
    <div class="af-explainer" aria-live="polite" aria-atomic="true"><strong data-flow-phase>Contract</strong><p data-flow-description>${PHASES[0].text}</p></div>
  </div>
  <p class="af-caption"><span data-flow-mode>Independent work, coordinated integration.</span> An illustration—not a live build, real agent activity or a speed benchmark.</p>
</section>`;
}
