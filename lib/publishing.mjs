import {readFile,mkdir,open} from 'node:fs/promises';
import path from 'node:path';
import {loadPackage,configAt,validatePackage,fingerprints,canonical,hash,readJson,atomicWrite} from './content.mjs';
export async function prepare(root,slug,{account='UNSELECTED'}={}) {
  const c=await configAt(root), p=await loadPackage(root,slug);
  const errors=await validatePackage(p,c); if(errors.length)throw new Error(errors.join('\n'));
  const f=await fingerprints(p,root), articleUrl=canonical(c,slug), text=p.linkedin.replaceAll('{{articleUrl}}',articleUrl).trim();
  const payload={version:1,slug,target:{provider:'zapier-mcp',platform:'linkedin',account},articleUrl,text,media:[],articleStatus:p.meta.status,packageHash:f.package};
  const request={...payload,idempotencyKey:hash(JSON.stringify(payload)),state:'awaiting-human-approval',approval:null,
    requirements:['Confirm exact target account and final text','Approve outside the agent-editable repository','Verify production article URL after deployment','Use a connected, supported LinkedIn action','Record an actual provider response; do not infer publication from a successful handoff']};
  await atomicWrite(path.join(root,'.studio','requests',request.idempotencyKey+'.json'),JSON.stringify(request,null,2)+'\n');
  return request;
}
export async function publicationStatus(root,slug) {
  const p=await loadPackage(root,slug), f=await fingerprints(p,root);
  let receipt=null;
  try{receipt=await readJson(path.join(root,'.studio','receipts',slug+'.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
  return {slug,articleStatus:p.meta.status,currentPackageHash:f.package,receipt,needsReview:!receipt||receipt.packageHash!==f.package};
}
export async function recordReceipt(root,slug,file) {
  const p=await loadPackage(root,slug), f=await fingerprints(p,root), receipt=await readJson(file);
  if(receipt.slug!==slug || receipt.packageHash!==f.package)throw new Error('Receipt does not match the current package');
  if(receipt.platform!=='linkedin' || typeof receipt.providerPostId!=='string' || !receipt.providerPostId.trim())throw new Error('A real LinkedIn providerPostId is required');
  if(typeof receipt.account!=='string'||!receipt.account.trim()||receipt.account==='UNSELECTED')throw new Error('Receipt needs the confirmed target account');
  let url; try{url=new URL(receipt.url);}catch{throw new Error('Receipt needs a LinkedIn URL');}
  if(url.protocol!=='https:'||url.username||url.password||!['www.linkedin.com','linkedin.com'].includes(url.hostname)||!/^\/(?:posts\/|feed\/update\/)/.test(url.pathname))throw new Error('Receipt URL must be a LinkedIn post URL');
  if(!/^\d{4}-\d{2}-\d{2}T/.test(receipt.recordedAt||'')||!Number.isFinite(Date.parse(receipt.recordedAt)))throw new Error('Receipt needs an ISO recordedAt');
  if(receipt.confirmedByHuman!==true)throw new Error('Provider evidence must be confirmed by the operator');
  const dest=path.join(root,'.studio','receipts',slug+'.json');
  await mkdir(path.dirname(dest),{recursive:true});
  // First receipt wins. Never silently replace a receipt or turn a revision into a new post.
  let fd;
  try{fd=await open(dest,'wx');await fd.writeFile(JSON.stringify({...receipt,verification:'operator-attested; not independently queried by this CLI'},null,2)+'\n');}
  finally{await fd?.close();}
  return {recorded:true,slug,providerPostId:receipt.providerPostId};
}
export async function publishInstructions(root,slug,options={}) {
  const state=await publicationStatus(root,slug);
  if(state.receipt)throw new Error('A publication receipt already exists. Reconcile or update that post; do not create a duplicate.');
  const request=await prepare(root,slug,options);
  return {blocked:true,reason:'No autonomous publisher is enabled in V1. Use the authenticated host connector after explicit human approval.',request};
}
