/** Fictional editorial scenarios. These are not model responses or a live policy system. */
export const routes = [
  {id:'code',label:'Read code',detail:'Inspect the known implementation.'},
  {id:'docs',label:'Read docs',detail:'Retrieve the documented contract.'},
  {id:'generate',label:'Generate',detail:'Ask a generative model for new prose.'}
];
export const cases = [
  {id:'implementation',label:'Find an implementation',state:'The symbol name and current repository revision are known. Locate the implementation before proposing a change.',probabilities:[.81,.17,.02]},
  {id:'ambiguous',label:'Ambiguous evidence',state:'The request could concern implementation behavior, a documented promise, or an explanation. Required context is missing.',probabilities:[.39,.34,.27]},
  {id:'explanation',label:'Write a new explanation',state:'The accepted facts are already available. The task now needs an original explanation, not another search.',probabilities:[.04,.08,.88]}
];
export function assess({caseId='implementation',fresh=true,allowed=true,verified=true}={}) {
  if([fresh,allowed,verified].some(v=>typeof v!=='boolean'))throw new Error('Illustrative flags must be booleans');
  const scenario=cases.find(x=>x.id===caseId);
  if(!scenario)throw new Error('Unknown illustrative scenario');
  const max=Math.max(...scenario.probabilities),route=routes[scenario.probabilities.indexOf(max)];
  // This probability threshold is a deliberately invented teaching rule, NOT Jev confidence.
  if(!fresh)return {scenario,route,status:'refresh',title:'Refresh the observation',detail:'The candidate set or source revision changed. Do not execute an old selection or silently choose the runner-up.',path:'observe',executed:false};
  if(max<.70)return {scenario,route,status:'clarify',title:'Ask for more evidence',detail:'The top option is below this example’s 0.70 probability threshold. That rule is illustrative—not a calibrated production recommendation.',path:'decide',executed:false};
  if(!allowed)return {scenario,route,status:'blocked',title:'Permission blocks the route',detail:'The model still prefers the same option. A score cannot grant credentials, override policy, or authorize an irreversible action.',path:'gate',executed:false};
  if(!verified)return {scenario,route,status:'unverified',title:'Completion is not established',detail:'The permitted route was simulated, but its independent result check failed. A completed call does not prove the task succeeded.',path:'verify',executed:true};
  return {scenario,route,status:'checked',title:'Illustrative checks satisfied',detail:'The fictional route is current and permitted, and its result check passes. No tool, model, repository, or account was actually accessed.',path:'result',executed:true};
}
