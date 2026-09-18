import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile, mkdtemp, cp, rm, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DURATION, TRACKS, PHASES, snapshot, phaseAt, clampTime} from '../site/agent-flow-model.js';
import {agentFlow} from '../lib/agent-flow.mjs';
import {build} from '../lib/site.mjs';
import {loadPackage, fingerprints} from '../lib/content.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = 'parallel-agent-engineering';
async function fixture(t) {
  const out = await mkdtemp(path.join(tmpdir(), 'agent-flow-'));
  t.after(() => rm(out, {recursive:true, force:true}));
  for (const name of ['articles','site','lib','studio.config.json']) await cp(path.join(root,name),path.join(out,name),{recursive:true});
  for(const entry of await readdir(path.join(out,'articles')))if(entry!==slug)await rm(path.join(out,'articles',entry),{recursive:true,force:true});
  return out;
}
test('the illustrative timeline is bounded and has independent lane timings', () => {
  assert.equal(clampTime(-10),0); assert.equal(clampTime(Infinity),0);
  assert.equal(clampTime(DURATION+1),DURATION);
  assert.ok(TRACKS.every(([,start,length]) => start >= 0 && length > 0 && start+length <= DURATION));
  assert.equal(new Set(TRACKS.map(([key]) => key)).size,TRACKS.length);
  assert.notEqual(TRACKS.find(t=>t[0]==='work_a')[2],TRACKS.find(t=>t[0]==='work_b')[2]);
});
test('integration never starts before all focused checks and arrival paths complete', () => {
  for (let t=0;t<=DURATION;t+=25) {
    const s=snapshot(t);
    if(s.integration>0) for(const lane of ['a','b','c']) {
      assert.equal(s[`check_${lane}`],1); assert.equal(s[`join_${lane}`],1);
    }
    if(s.artifact>0) {assert.equal(s.integration,1);assert.equal(s.release,1);}
  }
});
test('backward scrubbing returns the exact same deterministic state', () => {
  const expected=snapshot(2800);snapshot(DURATION);snapshot(7400);
  assert.deepEqual(snapshot(2800),expected);
  assert.ok(Object.entries(snapshot(DURATION)).every(([key,value])=>key==='time'||value===1));
});
test('every stage button has a matching phase, including the static final state', () => {
  PHASES.forEach((phase,i)=>assert.equal(phaseAt(phase.seek),i));
  assert.equal(phaseAt(-3),0);assert.equal(phaseAt(Infinity),0);
});
test('the authored diagram is complete without JavaScript and controls start hidden', () => {
  const html=agentFlow();
  assert.match(html,/class="af-controls" hidden/);
  for(const label of ['Agreed contract','Agent A','Agent B','Agent C','Integration + review','Release artifact']) assert.ok(html.includes(label));
  assert.equal((html.match(/data-flow-edge=/g)||[]).length,7);
  assert.match(html,/aria-live="polite"/);assert.match(html,/not a live build/);
  assert.doesNotMatch(html,/<script|onclick=|DriftGate/);
});
test('the vendored Anime.js and its license have pinned integrity', async () => {
  const files=[['anime-4.5.0.esm.min.js','a19015a1a92d52025a2fb6703b6d67eadd1cc2aeaf880770e96e04cf6aa07be1'],['ANIME-LICENSE.txt','3f3e835a9952cfc2a6ca836fb95b3257c981f24fa3ef51249055acb09931897b']];
  for(const [name,expected] of files) {
    const bytes=await readFile(path.join(root,'site/vendor',name));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected);
  }
});
test('the homepage does not import Anime.js and the article uses local modules', async t => {
  const f=await fixture(t);
  const meta=path.join(f,'articles',slug,'metadata.json');const m=JSON.parse(await readFile(meta));m.status='published';await writeFile(meta,JSON.stringify(m));
  await build(f);
  const home=await readFile(path.join(f,'dist/index.html'),'utf8');
  assert.doesNotMatch(home,/agent-flow\.js|anime-4/);
  const article=await readFile(path.join(f,'dist/articles',slug,'index.html'),'utf8');
  assert.match(article,/src="\/content\/agent-flow.js"/);
  assert.match(article,/id="parallel-agent-flow"/);
  assert.doesNotMatch(article,/DriftGate/);
  assert.match(await readFile(path.join(f,'dist/vendor/ANIME-LICENSE.txt'),'utf8'),/MIT License/);
});
test('draft-only builds do not publish the optional diagram scripts or library', async t => {
  const f=await fixture(t);const meta=path.join(f,'articles',slug,'metadata.json');
  const m=JSON.parse(await readFile(meta));m.status='review';await writeFile(meta,JSON.stringify(m));
  const result=await build(f);
  assert.ok(!result.outputs.some(p=>p.startsWith('agent-flow')||p.startsWith('vendor/')));
});
test('changing the choreography invalidates cached article rendering', async t => {
  const f=await fixture(t);const p=await loadPackage(f,slug);const before=await fingerprints(p,f);
  const file=path.join(f,'site/agent-flow-model.js');await writeFile(file,(await readFile(file,'utf8'))+'\n// changed choreography\n');
  const after=await fingerprints(p,f);
  assert.notEqual(before.renderer,after.renderer);assert.equal(before.article,after.article);
});
