import {DURATION, LANES, TRACKS, PHASES, snapshot, phaseAt, clampTime} from './agent-flow-model.js';

// Keep reading functional even if the optional animation engine cannot load.
const root = document.querySelector('.agent-flow');
if (root) {
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const state = snapshot(0);
  const play = $('[data-flow-play]');
  const replay = $('[data-flow-replay]');
  const seek = $('[data-flow-seek]');
  const nodes = Object.fromEntries($$('[data-flow-node]').map(el => [el.dataset.flowNode, el]));
  const meters = Object.fromEntries(LANES.map(key => [key, $(`[data-flow-meter="${key}"]`)]));
  const statuses = Object.fromEntries(LANES.map(key => [key, $(`[data-flow-status="${key}"]`)]));
  const edges = $$('[data-flow-edge]').map(group => {
    const trace = group.querySelector('.af-trace');
    return {key: group.dataset.flowEdge, trace, packet: group.querySelector('.af-packet'), length: trace.getTotalLength()};
  });
  let timeline, loading, failed = false, visible = false, started = false, wantsPlay = false, lastPhase = -1;
  let observer;

  function setNode(el, progress) {
    el.dataset.state = progress >= 1 ? 'complete' : progress > 0 ? 'active' : 'waiting';
  }
  function render(time) {
    root.dataset.time = String(Math.round(time));
    for (const edge of edges) {
      const value = state[edge.key];
      edge.trace.style.strokeDashoffset = String(1 - value);
      const moving = value > 0 && value < 1 && !preference.matches;
      edge.packet.style.opacity = moving ? '1' : '0';
      if (moving) {
        const point = edge.trace.getPointAtLength(value * edge.length);
        edge.packet.setAttribute('cx', point.x);
        edge.packet.setAttribute('cy', point.y);
      }
    }
    for (const key of LANES) {
      const work = state[`work_${key}`], check = state[`check_${key}`];
      setNode(nodes[key], check === 1 ? 1 : state[`fork_${key}`] > 0 ? .5 : 0);
      const label = check >= 1 ? 'Checks passed' : work >= 1 ? 'Checking' : work > 0 ? 'Working' : 'Waiting';
      if (statuses[key].textContent !== label) statuses[key].textContent = label;
      meters[key].style.transform = `scaleX(${work * .75 + check * .25})`;
    }
    setNode(nodes.contract, state.contract);
    setNode(nodes.integration, state.integration);
    setNode(nodes.artifact, state.artifact);
    $('.af-check').style.opacity = String(state.artifact);
    const arrived = LANES.filter(key => state[`join_${key}`] >= 1).length;
    $('[data-integration-status]').textContent = state.integration > 0 ? 'Validate the combined result' : `${arrived} of 3 lanes ready`;
    seek.value = String(Math.round(time));
    $('.af-percent').textContent = `${Math.round(time / DURATION * 100)}%`;
    const phase = phaseAt(time);
    if (phase !== lastPhase) {
      lastPhase = phase;
      $('[data-flow-phase]').textContent = PHASES[phase].label;
      $('[data-flow-description]').textContent = PHASES[phase].text;
      seek.setAttribute('aria-valuetext', PHASES[phase].label);
      $$('[data-flow-step]').forEach((button, i) => button.setAttribute('aria-pressed', String(i === phase)));
    }
  }
  function updateControls() {
    const running = Boolean(timeline && !timeline.paused && !preference.matches);
    play.textContent = preference.matches ? 'Reduced motion' : state.time >= DURATION ? 'Play again' : running ? 'Pause' : 'Play animation';
    play.disabled = preference.matches || failed;
    replay.disabled = preference.matches || failed;
    root.dataset.playing = String(running);
    $('[data-flow-mode]').textContent = failed ? 'Static view: animation unavailable.' : preference.matches ? 'Reduced motion: explore the stages without animation.' : 'Play once, pause, scrub or explore each stage.';
  }
  function showAt(time) {
    wantsPlay = false;
    timeline?.pause();
    const t = clampTime(time);
    timeline?.seek(t, true);
    // Same linear tracks for reduced-motion/no-engine snapshots and playback.
    Object.assign(state, snapshot(t));
    render(t); updateControls();
  }
  function fallback() {
    failed = true; wantsPlay = false;
    timeline?.pause();
    showAt(DURATION);
  }
  function ensureTimeline() {
    if (!loading) loading = import('./vendor/anime-4.5.0.esm.min.js').then(({createTimeline}) => {
      const previousTime = state.time;
      timeline = createTimeline({autoplay: false, defaults: {ease: 'linear'},
        onUpdate: self => { if (!preference.matches) render(self.currentTime); },
        onComplete: () => { wantsPlay = false; render(DURATION); updateControls(); }
      });
      timeline.add(state, {time: [0, DURATION], duration: DURATION}, 0);
      for (const [key, start, duration] of TRACKS) timeline.add(state, {[key]: [0, 1], duration}, start);
      timeline.seek(previousTime, true);
      Object.assign(state, snapshot(previousTime));
      render(previousTime);
      // Timeline objects are thenable: deliberately do not return one here.
    }).catch(fallback);
    return loading;
  }
  async function start() {
    if (preference.matches || failed) return;
    started = true; wantsPlay = true;
    await ensureTimeline();
    if (!wantsPlay || preference.matches || failed) return;
    if (state.time >= DURATION) { timeline.seek(0, true); Object.assign(state, snapshot(0)); }
    if (visible && !document.hidden) timeline.play();
    updateControls();
  }
  play.addEventListener('click', () => {
    started = true;
    if (wantsPlay) { wantsPlay = false; timeline?.pause(); updateControls(); }
    else start();
  });
  replay.addEventListener('click', () => { showAt(0); start(); });
  seek.addEventListener('input', () => { started = true; showAt(seek.value); });
  $$('[data-flow-step]').forEach(button => button.addEventListener('click', () => {
    started = true; showAt(PHASES[Number(button.dataset.flowStep)].seek);
  }));
  function syncVisibility() {
    if (!visible || document.hidden) timeline?.pause();
    else if (wantsPlay && !preference.matches) timeline?.play();
    updateControls();
  }
  document.addEventListener('visibilitychange', syncVisibility);
  preference.addEventListener('change', () => {
    started = true;
    showAt(preference.matches ? DURATION : 0);
  });
  window.addEventListener('pagehide', () => { timeline?.pause(); });
  window.addEventListener('pageshow', syncVisibility);
  root.dataset.enhanced = 'true';
  $('.af-controls').hidden = false;
  showAt(preference.matches ? DURATION : 0);
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !started && !preference.matches) start();
      else syncVisibility();
    }, {threshold: 0.15});
    observer.observe(root);
  } else {
    // No automatic playback without reliable viewport visibility.
    visible = true;
  }
}
