/** Authored teaching fixture. No agents, model calls, or actual approvals. */
export const scenarios = [
  {id:'success',label:'All checks pass'},
  {id:'repair',label:'API repair'},
  {id:'exhausted',label:'Budget exhausted'},
  {id:'changed',label:'Contract changed'},
  {id:'approval',label:'Approval pending'},
];
export const lanes=['client','api'];
export function initialState(){return {contract:'r1',client:{status:'waiting',revision:null,attempt:0},api:{status:'waiting',revision:null,attempt:0},integration:null,approval:null,released:false,reason:'A reviewed contract is the shared input. No worker has produced evidence yet.'};}
export function candidateKey(s){return `${s.contract}:${s.client.revision}:${s.client.attempt}:${s.api.revision}:${s.api.attempt}`;}
export function canJoin(s){return lanes.every(k=>s[k].status==='passed'&&s[k].revision===s.contract);}
export function view(s){
 const joined=canJoin(s),key=candidateKey(s),integrated=joined&&s.integration===key,approved=integrated&&s.approval===key;
 return {joined,integrated,approved,releaseReady:approved&&s.released,
  joinLabel:joined?'Compatible candidates':'Join blocked',
  integrationLabel:integrated?'Integration checked':'Integration waiting',
  approvalLabel:approved?'Illustrative approval recorded':'Review waiting',
  title:s.released&&approved?'Release candidate ready':lanes.some(k=>s[k].status==='escalated')?'Escalated — no release':lanes.some(k=>s[k].status==='stale')?'Contract mismatch — replan required':integrated&&!approved?'Waiting for artifact-specific approval':'Work in progress'};
}
export function transition(previous,event){
 const s=structuredClone(previous);
 if(!event||typeof event.kind!=='string')throw new Error('An event kind is required');
 if(['start','pass','fail'].includes(event.kind)&&!lanes.includes(event.lane))throw new Error('Unknown lane');
 if(event.kind==='start'){
  const lane=s[event.lane];
  if(!['waiting','repair'].includes(lane.status))throw new Error('Lane cannot start from this state');
  if(lane.attempt>=2)throw new Error('Authored two-attempt budget exhausted');
  lane.attempt++;lane.status='working';lane.revision=s.contract;
  s.integration=null;s.approval=null;s.released=false;
 } else if(event.kind==='pass'||event.kind==='fail'){
  const lane=s[event.lane];
  if(lane.status!=='working'||lane.revision!==s.contract)throw new Error('No current work to verify');
  lane.status=event.kind==='pass'?'passed':lane.attempt>=2?'escalated':'repair';
 } else if(event.kind==='contract'){
  if(!event.revision||event.revision===s.contract)throw new Error('A new contract revision is required');
  s.contract=event.revision;
  for(const key of lanes)if(s[key].revision)s[key].status='stale';
  s.integration=null;s.approval=null;s.released=false;
 } else if(event.kind==='integrate'){
  if(!canJoin(s))throw new Error('Cannot integrate incompatible or unfinished candidates');
  s.integration=candidateKey(s);
 } else if(event.kind==='approve'){
  if(!view(s).integrated)throw new Error('Approval requires this checked candidate');
  s.approval=candidateKey(s);
 } else if(event.kind==='release'){
  if(!view(s).approved)throw new Error('Release requires matching integration and approval');
  s.released=true;
 } else throw new Error('Unknown event kind');
 s.reason=event.reason;return s;
}
const event=(kind,reason,extra={})=>({kind,reason,...extra});
const kickoff=[
 event('start','Client begins implementation against contract r1. The API task is independently eligible.',{lane:'client'}),
 event('start','API begins in its own worktree and output area. Both lanes are now active.',{lane:'api'}),
 event('pass','Client checks pass for r1. Preserve this candidate while the API continues.',{lane:'client'}),
];
export function traceFor(id){
 if(!scenarios.some(x=>x.id===id))throw new Error('Unknown scenario');
 const events=[...kickoff];
 if(id==='repair'||id==='exhausted')events.push(
  event('fail','The API check fails. Its local loop gets the failure; the client is not restarted.',{lane:'api'}),
  event('start','API attempt 2 uses focused feedback. Client remains passed at attempt 1.',{lane:'api'}));
 if(id==='exhausted')events.push(event('fail','The API fails again. Its two-attempt teaching budget is exhausted; escalate instead of looping forever.',{lane:'api'}));
 else {
  events.push(event('pass','API checks pass. The join can now compare two candidates for the same contract.',{lane:'api'}));
  if(id==='changed')events.push(event('contract','Contract r2 supersedes r1. Both old results are now stale for this join; replan the affected work.',{revision:'r2'}));
  else {
   events.push(event('integrate','The combined candidate passes the illustrative integration check. This does not grant release permission.'));
   if(id!=='approval')events.push(event('approve','A fictional reviewer approves this exact checked candidate. This event grants no real permissions.'),event('release','The illustrated release candidate is ready. No real deployment or external action occurs.'));
  }
 }
 const states=[initialState()];for(const e of events)states.push(transition(states.at(-1),e));return states;
}
