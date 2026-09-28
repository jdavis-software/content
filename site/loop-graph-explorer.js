import {traceFor,view} from './loop-graph-model.js';
const root=document.querySelector('#loop-graph-explorer');
if(root){
 let scenario='repair',trace=traceFor(scenario),index=4,timer=null;
 const q=s=>root.querySelector(s), range=q('#lg-range'),play=q('[data-lg-play]');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const statusLabels={waiting:'Waiting',working:'Implementing / checking',passed:'Checks passed',repair:'Repair required',escalated:'Escalated',stale:'Stale contract'};
 function stop(){clearTimeout(timer);timer=null;play.textContent='Play trace';}
 function render(){
  const s=trace[index],v=view(s);q('[data-lg-contract]').textContent=s.contract;
  for(const key of ['client','api']){
   const node=q(`[data-lg-lane="${key}"]`);node.dataset.status=s[key].status;
   node.querySelector('[data-lg-lane-status]').textContent=statusLabels[s[key].status];
   node.querySelector('[data-lg-lane-detail]').textContent=`Attempt ${s[key].attempt} · contract ${s[key].revision??'not assigned'}`;
  }
  for(const [key,ok,label] of [['join',v.joined,v.joinLabel],['integration',v.integrated,v.integrationLabel],['approval',v.approved,v.approvalLabel]]){
   const node=q(`[data-lg-gate="${key}"]`);node.dataset.pass=String(ok);node.querySelector('span').textContent=label;
  }
  q('[data-lg-title]').textContent=v.title;q('[data-lg-reason]').textContent=s.reason;
  range.max=String(trace.length-1);range.value=String(index);range.setAttribute('aria-valuetext',`Event ${index} of ${trace.length-1}: ${s.reason}`);
  q('#lg-position').textContent=`${index} / ${trace.length-1}`;
  q('[data-lg-prev]').disabled=index===0;q('[data-lg-next]').disabled=index===trace.length-1;
  play.disabled=motion.matches;play.title=motion.matches?'Use individual steps with reduced motion enabled':'';
 }
 root.querySelectorAll('fieldset').forEach(x=>x.disabled=false);
 root.querySelectorAll('[data-lg-case]').forEach(b=>b.addEventListener('click',()=>{
  stop();scenario=b.dataset.lgCase;trace=traceFor(scenario);index=0;
  root.querySelectorAll('[data-lg-case]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();
 }));
 for(const [sel,delta] of [['[data-lg-prev]',-1],['[data-lg-next]',1]])q(sel).addEventListener('click',()=>{stop();index=Math.max(0,Math.min(trace.length-1,index+delta));render();});
 range.addEventListener('input',()=>{stop();index=Number(range.value);render();});
 q('[data-lg-reset]').addEventListener('click',()=>{stop();index=0;render();});
 function tick(){if(index>=trace.length-1){stop();return;}index++;render();if(index===trace.length-1)stop();else timer=setTimeout(tick,1100);}
 play.addEventListener('click',()=>{if(timer){stop();return;}if(motion.matches)return;if(index===trace.length-1){index=0;render();}play.textContent='Pause trace';timer=setTimeout(tick,1100);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 motion.addEventListener('change',()=>{stop();render();});
 if('IntersectionObserver' in window)new IntersectionObserver(es=>{if(!es[0].isIntersecting)stop();}).observe(root);
 render();
}
