import {assess} from './jev-model.js';
const root=document.getElementById('jev-decision-explorer');
if(root){
 let caseId='implementation',traceTimer;
 const flags={fresh:true,allowed:true,verified:true};
 const q=s=>root.querySelector(s),all=s=>[...root.querySelectorAll(s)];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function stopTrace(){clearTimeout(traceTimer);root.classList.remove('jev-tracing');q('[data-jev-trace-status]').textContent='';}
 function render(){
  stopTrace();const a=assess({caseId,...flags});root.dataset.path=a.path;
  all('[data-jev-case]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.jevCase===caseId)));
  q('[data-jev-state]').textContent=a.scenario.state;
  all('[data-jev-route]').forEach((r,i)=>{r.dataset.selected=String(r.dataset.jevRoute===a.route.id);r.querySelector('[data-jev-prob]').textContent=a.scenario.probabilities[i].toFixed(2);r.querySelector('[data-jev-bar]').style.width=`${a.scenario.probabilities[i]*100}%`;});
  q('[data-jev-status]').dataset.jevStatus=a.status;q('[data-jev-title]').textContent=a.title;q('[data-jev-detail]').textContent=a.detail;
  q('[data-jev-path]').textContent=`PROPOSED: ${a.route.label} · ${a.executed?'SIMULATED EXECUTION':'NO EXECUTION'}`;
  all('[data-jev-flag]').forEach(i=>{i.checked=flags[i.dataset.jevFlag];});
 }
 all('fieldset, [data-jev-trace], [data-jev-reset]').forEach(x=>{x.disabled=false;});
 all('[data-jev-case]').forEach(b=>b.addEventListener('click',()=>{caseId=b.dataset.jevCase;render();}));
 all('[data-jev-flag]').forEach(i=>i.addEventListener('change',()=>{flags[i.dataset.jevFlag]=i.checked;render();}));
 q('[data-jev-reset]').addEventListener('click',()=>{caseId='implementation';Object.assign(flags,{fresh:true,allowed:true,verified:true});render();});
 q('[data-jev-trace]').addEventListener('click',()=>{
  stopTrace();const a=assess({caseId,...flags});
  const announce=()=>{q('[data-jev-trace-status]').textContent=`Illustrative trace: ${a.title}.`;};
  if(reduced.matches){announce();return;}
  root.classList.add('jev-tracing');traceTimer=setTimeout(()=>{root.classList.remove('jev-tracing');announce();},1100);
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTrace();});
 reduced.addEventListener('change',stopTrace);render();
}
