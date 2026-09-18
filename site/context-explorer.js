import {makePacket,inspectPacket} from './context-model.js';
const root=document.querySelector('#context-packet-explorer');
if(root){
 const one=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
 let mode='focused',packet=makePacket(),selected='contract';
 const labels={current:'Current',optional:'Additional',omitted:'Not selected',missing:'Missing',stale:'Stale',blocked:'Access withdrawn'};
 function render(){
  const result=inspectPacket(packet,{expected:one('#context-revision').value,contractAllowed:!one('#context-access').checked});
  one('[data-ce-count="current"]').textContent=`${result.current} / ${result.required}`;
  one('[data-ce-count="selected"]').textContent=String(result.selected);
  one('[data-ce-count="optional"]').textContent=String(result.optional);
  one('#context-verdict').textContent=result.headline;one('#context-guidance').textContent=result.guidance;
  one('.ce-result').dataset.ready=String(result.ready);
  for(const row of result.rows){const b=one(`[data-context-source="${row.id}"]`);b.dataset.state=row.state;b.setAttribute('aria-pressed',String(row.id===selected));b.querySelector('em').textContent=labels[row.state];}
  const detail=result.rows.find(r=>r.id===selected);
  one('#context-detail-title').textContent=detail.label;
  one('#context-detail-path').textContent=detail.path;
  one('#context-detail-revision').textContent=detail.revision??'Not in packet';
  one('#context-detail-expected').textContent=detail.required?detail.wanted:'Not required for this task';
  one('#context-detail-body').textContent=detail.body??(detail.state==='blocked'?'Content withheld in this simulated view. Production access must be checked before private content is returned.':'No content was included for this evidence item.');
  all('[data-context-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.contextMode===mode)));
 }
 all('[data-context-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.contextMode;packet=makePacket(mode,one('#context-revision').value);selected=mode==='missing'?'tests':'contract';render();}));
 all('[data-context-source]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.contextSource;render();}));
 one('#context-revision').addEventListener('change',render);
 one('#context-access').addEventListener('change',()=>{selected='contract';render();});
 one('#context-refresh').addEventListener('click',()=>{mode='focused';packet=makePacket(mode,one('#context-revision').value);render();});
 render();
}
