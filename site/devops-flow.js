import {NODES, SCENARIOS, STATE, evaluate} from './devops-model.js';
const root=document.querySelector('.devops-flow');
if(root) {
  const $=s=>root.querySelector(s), $$=s=>[...root.querySelectorAll(s)];
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const map=$('.dv-map'), svg=$('.dv-edges'), trace=$('[data-dv-trace]');
  let scenario='ui', mode='warm', selected=null, model=evaluate(), animations=[], frame=0;
  const nodes=Object.fromEntries($$('[data-dv-node]').map(el=>[el.dataset.dvNode,el]));
  function stop() {for(const a of animations)a.cancel();animations=[];trace.textContent=preference.matches?'Reduced motion':'Trace dependencies ↘';root.dataset.tracing='false';}
  function drawEdges() {
    stop();svg.replaceChildren();
    if(map.clientWidth<560)return;
    const bounds=map.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    model.edges.forEach(([from,to])=>{
      const a=nodes[from].getBoundingClientRect(),b=nodes[to].getBoundingClientRect();
      const x1=a.left-bounds.left+a.width/2,y1=a.bottom-bounds.top,x2=b.left-bounds.left+b.width/2,y2=b.top-bounds.top;
      const p=document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d',`M${x1} ${y1} C${x1} ${y1+20} ${x2} ${y2-20} ${x2} ${y2}`);
      p.setAttribute('pathLength','1');p.setAttribute('class','dv-edge');p.dataset.state=model.states[to];p.dataset.to=to;
      svg.append(p);
    });
  }
  function detail() {
    $('.dv-detail').hidden=!selected;
    if(!selected)return;
    const n=NODES.find(n=>n.id===selected),state=model.states[selected];
    $('[data-dv-detail-title]').textContent=n.name;
    $('[data-dv-detail-text]').textContent=n.detail+' '+(STATE[state]?.text||'Edit canonical inputs through their review boundary; generated artifacts remain downstream.');
  }
  function render() {
    stop();model=evaluate(scenario,mode);root.dataset.scenario=scenario;root.dataset.cacheMode=mode;
    $$('[data-dv-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dvScenario===scenario)));
    $$('[data-dv-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.dvMode===mode)));
    for(const n of NODES) {
      const el=nodes[n.id],state=model.states[n.id];el.dataset.state=state;
      el.setAttribute('aria-pressed',String(selected===n.id));
      el.querySelector('.dv-status').textContent=n.group==='input'?(state==='changed'?'● Changed input':'Source of truth'):`${STATE[state].symbol} ${STATE[state].label}`;
    }
    $('[data-dv-headline]').textContent=model.plan.headline;$('[data-dv-explanation]').textContent=model.plan.text;
    $('[data-dv-counts]').textContent=`${model.counts.rebuild} rebuild${model.counts.rebuild===1?'':'s'} · ${mode==='warm'?`${model.counts.reuse} reusable results`:`${model.counts.cold} cold misses`} · ${model.checks.length} fresh check${model.checks.length===1?'':'s'}`;
    $$('[data-dv-cache]').forEach(el=>el.textContent=model.caches[el.dataset.dvCache]);
    $$('[data-dv-runtime]').forEach(el=>el.textContent=model.runtime[el.dataset.dvRuntime]);
    $('[data-dv-checks]').replaceChildren(...model.checks.map(text=>{const s=document.createElement('span');s.textContent=text;return s;}));
    detail();drawEdges();
  }
  function playTrace() {
    if(animations.length){stop();return;}
    if(preference.matches||document.hidden||!Element.prototype.animate)return;
    trace.textContent='Stop trace';root.dataset.tracing='true';
    const tracks=[...svg.querySelectorAll('.dv-edge')];
    for(const p of tracks) {
      const level=NODES.find(n=>n.id===p.dataset.to).group==='artifact'?500:0;
      const a=p.animate([{strokeDasharray:'1',strokeDashoffset:1,opacity:.1},{strokeDasharray:'1',strokeDashoffset:0,opacity:.9}],{duration:600,delay:level,fill:'none',easing:'ease-out'});animations.push(a);
    }
    // Narrow screens keep textual lineage and briefly emphasize selected cards instead of tangled paths.
    if(!tracks.length) for(const el of Object.values(nodes).filter(el=>['rebuild','cold','reuse'].includes(el.dataset.state))) animations.push(el.animate([{opacity:.55},{opacity:1}],{duration:450}));
    const current=animations;Promise.all(current.map(a=>a.finished.catch(()=>{}))).then(()=>{if(animations===current)stop();});
  }
  $$('[data-dv-scenario]').forEach(b=>b.addEventListener('click',()=>{scenario=b.dataset.dvScenario;render();}));
  $$('[data-dv-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.dvMode;render();}));
  for(const [id,el] of Object.entries(nodes)) el.addEventListener('click',()=>{selected=selected===id?null:id;for(const [key,n] of Object.entries(nodes))n.setAttribute('aria-pressed',String(key===selected));detail();});
  trace.addEventListener('click',playTrace);
  function motionPreference(){stop();trace.disabled=preference.matches||!Element.prototype.animate;trace.textContent=preference.matches?'Reduced motion':'Trace dependencies ↘';}
  preference.addEventListener('change',motionPreference);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(root);
  if('ResizeObserver' in window)new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(drawEdges);}).observe(map);
  else addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(drawEdges);});
  render();motionPreference();$('.dv-controls').hidden=false;$('.dv-static-note').hidden=true;
}
