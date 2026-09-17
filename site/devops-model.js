// An illustrative dependency model, not a live Nx graph or a cache simulator.
export const NODES = [
  {id:'source', group:'input', name:'Source', sub:'TypeScript / Go', detail:'Hand-authored code is a canonical input. A UI-only edit and a Workflow edit select different targets even though they share this source category.'},
  {id:'openapi', group:'input', name:'OpenAPI', sub:'Wire contracts', detail:'Edit the accepted OpenAPI schema, not generated clients. This example models a wire-shape change consumed by the console and Go API.'},
  {id:'sql', group:'input', name:'SQL + queries', sub:'Schema / migrations', detail:'sqlc consumes schema and query inputs. Tern applies migrations separately. Code generation does not mean a live database was migrated.'},
  {id:'tools', group:'input', name:'Toolchain', sub:'Pins / locks / config', detail:'Compiler, generator, dependency, and relevant configuration versions are real inputs. The toolchain scenario intentionally models a broad upgrade, not an unrelated lockfile edit.'},
  {id:'ts-client', group:'generated', name:'TypeScript client', sub:'Hey API + Valibot', detail:'Generated client and runtime validators derive from OpenAPI and generator inputs. The console consumes this output; a UI-only edit does not change the schema.'},
  {id:'go-wire', group:'generated', name:'Go transport', sub:'oapi-codegen', detail:'Generated Go wire types and transport derive from OpenAPI. This model assigns them to the API; it does not assume every worker imports HTTP transport.'},
  {id:'queries', group:'generated', name:'Go query code', sub:'sqlc', detail:'sqlc reads SQL schema and query files. A relevant row-shape change can affect generated output and its consumers; a data-only migration need not change generated code.'},
  {id:'console', group:'artifact', name:'Next.js console', sub:'App build → Docker image', detail:'Typecheck and build the console from its source and generated client. Source layers may rebuild while compatible dependency layers remain reusable.'},
  {id:'api', group:'artifact', name:'Go API', sub:'Go binary → Docker image', detail:'The API consumes generated wire and SQL artifacts. Inputs, Go dependencies, compiler, target platform, and container recipe must participate in the relevant cache keys.'},
  {id:'worker', group:'artifact', name:'Temporal Go worker', sub:'Go binary → Docker image', detail:'This worker uses application query code in Activities and connects to Temporal Service. A worker build does not rewrite Temporal persistence or reset running histories.'}
];
export const EDGES = [['openapi','ts-client'],['openapi','go-wire'],['sql','queries'],['ts-client','console'],['go-wire','api'],['queries','api'],['queries','worker']];
const prerequisites = {console:['ts-client'],api:['go-wire','queries'],worker:['queries']};
export const SCENARIOS = {
  ui: {label:'UI code', input:'source', targets:['console'], dirty:['console'], checks:['console'], headline:'A UI edit should stay a UI-sized change.', text:'Rebuild the console and run its focused checks. The API contract, Go services, and databases are unchanged in this model. Dependency layers may still be reused.'},
  contract: {label:'OpenAPI', input:'openapi', targets:['console','api'], dirty:['ts-client','go-wire','console','api'], checks:['console','contract'], headline:'Change the agreement. Follow its consumers.', text:'A relevant wire-shape change regenerates the Go transport and TypeScript client/validators, then rebuilds their consumers. Unchanged sqlc output can be reused. The worker is not an HTTP-contract consumer here.'},
  sql: {label:'SQL schema', input:'sql', targets:['api','worker'], dirty:['queries','api','worker'], checks:['database','activity'], headline:'Validate the schema—not just the binaries.', text:'This example changes a queried row shape. Regenerate sqlc output, rebuild its API/Activity consumers, and test migrations and transaction behavior in isolated PostgreSQL resources. A data-only migration can have a narrower impact.'},
  workflow: {label:'Go Workflow', input:'source', targets:['worker'], dirty:['worker'], checks:['workflow'], headline:'New worker code. Existing workflow history.', text:'Rebuild the worker and check Workflow determinism/replay compatibility against representative histories. Application SQL is unchanged. Temporal Service persistence is not a build cache to erase.'},
  toolchain: {label:'Toolchain', input:'tools', targets:['console','api','worker'], dirty:['ts-client','go-wire','queries','console','api','worker'], checks:['console','contract','database','workflow'], headline:'Some changes legitimately reach the whole graph.', text:'A broad compiler/generator upgrade changes keys for the targets shown. Warm stores may retain compatible downloads, but previous task results are not valid merely because they exist. A narrowly scoped config edit need not affect every target.'},
  unchanged: {label:'No code change', input:null, targets:['console','api','worker'], dirty:[], checks:['integration'], headline:'Cache availability is not the same as validity.', text:'Request the same three builds. Warm mode assumes compatible outputs exist. Cold mode has no local reusable outputs: required work runs, but no source input became invalid and no database is reset.'}
};
export const CHECKS = {
  console:'Console typecheck + UI smoke', contract:'Serialized API boundary tests', database:'Migration + transaction checks',
  activity:'Database-backed Activity checks', workflow:'Workflow replay / compatibility', integration:'Fresh integration smoke'
};
export const STATE = {
  rebuild:{label:'Rebuild', symbol:'↻', text:'A relevant input changed; the previous result is not reusable under the new key.'},
  reuse:{label:'Reuse', symbol:'✓', text:'A required prerequisite/output has matching inputs and an available verified result in this warm-cache model.'},
  cold:{label:'Cold miss', symbol:'＋', text:'A required result is unavailable locally. Compute it; absence is not invalidation.'},
  outside:{label:'Not selected', symbol:'—', text:'Outside the requested target set for this modeled change. Cold mode does not schedule it.'}
};
export function evaluate(scenario='ui', mode='warm') {
  if (!Object.hasOwn(SCENARIOS,scenario)) throw new Error('Unknown change scenario');
  if (!['warm','cold'].includes(mode)) throw new Error('Unknown cache mode');
  const plan=SCENARIOS[scenario], needed=new Set(plan.targets), dirty=new Set(plan.dirty);
  for (const target of plan.targets) for (const input of prerequisites[target]) needed.add(input);
  const states=Object.fromEntries(NODES.map(node=>[node.id,node.group==='input' ? (node.id===plan.input?'changed':'canonical') : !needed.has(node.id)?'outside':dirty.has(node.id)?'rebuild':mode==='warm'?'reuse':'cold']));
  const edges=EDGES.filter(([,to])=>needed.has(to));
  const counts={rebuild:0,reuse:0,cold:0};
  for(const id of needed) counts[states[id]]++;
  const cacheNeeds={pnpm:needed.has('console')||needed.has('ts-client'),go:needed.has('api')||needed.has('worker')||needed.has('go-wire')||needed.has('queries'),nx:needed.size>0,docker:plan.targets.length>0};
  const caches=Object.fromEntries(Object.entries(cacheNeeds).map(([key,required])=>[key,!required?'Not needed':mode==='cold'?'Populate as needed':scenario==='toolchain'?'Compatible entries only':key==='nx'?'Match each task key':'Compatible entries available']));
  return {scenario,mode,plan,states,edges,counts,caches,checks:plan.checks.map(id=>CHECKS[id]),runtime:{application:['sql','toolchain'].includes(scenario)?'Validate in isolated DB':'Data preserved',temporal:'History preserved',derived:'Optional · not provisioned'}};
}
