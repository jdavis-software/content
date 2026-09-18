/** Public fictional fixture. No repository queries, model calls or real authorization. */
export const MODES = Object.freeze({focused:'Focused packet',all:'Repository dump',stale:'Stale contract',missing:'Missing test'});
export const REQUIRED = Object.freeze(['task','contract','implementation','caller','tests']);
export const SOURCES = Object.freeze({
  task:{label:'Acceptance criteria',path:'tasks/retry-validation.md',revision:'r1',body:'Return validation failures immediately. Preserve the public client signature. Retry only errors classified as transient by the accepted contract.'},
  contract:{label:'Accepted error contract',path:'api/errors.yaml',revision:'r2',body:'Contract r2: VALIDATION_ERROR is permanent. TRANSIENT_UNAVAILABLE may be retried under the bounded retry policy.'},
  implementation:{label:'Retry implementation',path:'src/client/retry.ts',revision:'r1',body:'Current implementation receives an error classification and attempt limit. Inspect the branch that decides whether to schedule another attempt.'},
  caller:{label:'Client caller',path:'src/client/request.ts',revision:'r1',body:'The caller maps wire errors to the client error type. Its public return signature must remain compatible.'},
  tests:{label:'Retry failure tests',path:'tests/client/retry.test.ts',revision:'r1',body:'Verify a validation failure causes one attempt. Verify transient retry is bounded and the final error is preserved.'},
  branding:{label:'Brand palette',path:'docs/brand/palette.md',revision:'r1',body:'Illustrative unrelated evidence: the marketing site uses a green accent. This does not establish retry behavior.'},
  billing:{label:'Billing glossary',path:'docs/billing/glossary.md',revision:'r1',body:'Illustrative unrelated evidence: invoice terminology. No modeled dependency on this client retry task.'},
  archive:{label:'Archived UI proposal',path:'archive/ui-layout.md',revision:'r1',body:'Illustrative unrelated historical document. It is not an accepted retry contract.'}
});
function checkRevision(value) {if(!['r2','r3'].includes(value))throw new Error('Expected contract revision must be r2 or r3');}
export function makePacket(mode='focused',expected='r2') {
  if(!Object.hasOwn(MODES,mode))throw new Error('Unknown packet mode');checkRevision(expected);
  const ids=mode==='all'?Object.keys(SOURCES):REQUIRED.filter(id=>mode!=='missing'||id!=='tests');
  return ids.map(id=>({id,revision:id==='contract'?(mode==='stale'?(expected==='r3'?'r2':'r1'):expected):SOURCES[id].revision}));
}
export function inspectPacket(packet,{expected='r2',contractAllowed=true}={}) {
  checkRevision(expected);
  if(!Array.isArray(packet)||typeof contractAllowed!=='boolean')throw new Error('Invalid fixture inputs');
  const seen=new Set();
  for(const entry of packet){
    if(!entry||!Object.hasOwn(SOURCES,entry.id)||typeof entry.revision!=='string'||seen.has(entry.id))throw new Error('Unknown, duplicate or invalid evidence');
    seen.add(entry.id);
  }
  const rows=Object.entries(SOURCES).map(([id,source])=>{
    const entry=packet.find(e=>e.id===id),required=REQUIRED.includes(id),wanted=id==='contract'?expected:source.revision;
    const state=!entry?(required?'missing':'omitted'):id==='contract'&&!contractAllowed?'blocked':required&&entry.revision!==wanted?'stale':required?'current':'optional';
    let body=entry&&state!=='blocked'?source.body:null;
    if(id==='contract'&&body){body=entry.revision==='r1'?'Contract r1 is superseded. It does not provide the accepted validation-error classification required for this task.':entry.revision==='r3'?'Contract r3: VALIDATION_ERROR is permanent; retryable errors must also satisfy the updated Retry-After requirement. Reinspect the contract before implementing.':source.body;}
    return {id,label:source.label,path:source.path,required,wanted,revision:entry?.revision??null,state,body};
  });
  const count=state=>rows.filter(r=>r.state===state).length;
  const current=count('current'),missing=count('missing'),stale=count('stale'),blocked=count('blocked');
  return {rows,current,missing,stale,blocked,optional:count('optional'),selected:packet.length,required:REQUIRED.length,ready:current===REQUIRED.length,
    headline:blocked?'Access check failed':missing?'Required evidence is missing':stale?'Packet revision is stale':'Declared requirements satisfied',
    guidance:blocked?'Do not return the restricted material. Re-resolve access through the trusted source owner. This page simulates that condition with public data.':missing?'Retrieve the required test and inspect its relevant assertions before treating this task packet as complete.':stale?'Read the accepted contract at the expected revision and rebuild the affected packet. A matching filename is not a matching revision.':'The five declared evidence checks pass. This is not proof of patch correctness, sufficient evidence for every real task, or permission to publish.'};
}
