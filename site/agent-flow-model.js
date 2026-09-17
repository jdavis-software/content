/** One illustrative choreography, shared by Anime.js, step controls and tests.
 * Timings are storytelling, not a benchmark or live agent telemetry. */
export const DURATION = 10000;
export const LANES = ['a', 'b', 'c'];
export const TRACKS = [
  ['contract', 0, 500],
  ['fork_a', 500, 700], ['fork_b', 650, 700], ['fork_c', 800, 700],
  ['work_a', 1500, 2300], ['work_b', 1600, 3100], ['work_c', 1750, 2500],
  ['check_a', 3800, 800], ['check_b', 4700, 800], ['check_c', 4250, 800],
  ['join_a', 4600, 1000], ['join_b', 5500, 1000], ['join_c', 5050, 1000],
  ['integration', 6500, 1300], ['release', 7800, 700], ['artifact', 8500, 500],
];
export const PHASES = [
  {at: 0, seek: 500, label: 'Contract', text: 'Agree on the interface, ownership and acceptance checks before dividing the work.'},
  {at: 1500, seek: 2800, label: 'Parallel work', text: 'Three agents work independently, each in its own branch, worktree and mutable output directories.'},
  {at: 3800, seek: 5800, label: 'Focused checks', text: 'Each lane validates its own change. The lanes finish at different times; completed work waits for integration.'},
  {at: 6500, seek: 7400, label: 'Integration', text: 'Only after all three lanes arrive do we check the combined result. Independent checks are not the final gate.'},
  {at: 8500, seek: DURATION, label: 'Release', text: 'The integrated, reviewed result becomes an identified release artifact—not three unrelated deployments.'},
];
export function clampTime(value) {
  const time = Number(value);
  return Number.isFinite(time) ? Math.max(0, Math.min(DURATION, time)) : 0;
}
export function phaseAt(time) {
  const t = clampTime(time);
  return PHASES.findLastIndex(phase => t >= phase.at);
}
export function snapshot(time) {
  const t = clampTime(time);
  return Object.fromEntries([['time', t], ...TRACKS.map(([key, start, duration]) => [key, Math.max(0, Math.min(1, (t - start) / duration))])]);
}
