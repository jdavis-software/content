#!/usr/bin/env node
import {readFile,writeFile,mkdir,readdir,stat,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createServer} from 'node:http';
import {spawnSync} from 'node:child_process';
import {configAt,packages,loadPackage,validatePackage,assertSlug,fingerprints,canonical,readJson,atomicWrite} from '../lib/content.mjs';
import {build} from '../lib/site.mjs';
import {prepare,publicationStatus,recordReceipt,publishInstructions} from '../lib/publishing.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2), cmd=argv.shift()||'help';
const flag=name=>argv.includes('--'+name);
const option=(name,fallback)=>{const i=argv.indexOf('--'+name);return i<0?fallback:argv[i+1];};
const result=value=>console.log(JSON.stringify(value,null,2));
async function validate() {
 const c=await configAt(root), list=await packages(root), errors=[];
 for(const p of list)for(const error of await validatePackage(p,c))errors.push(`${p.slug}: ${error}`);
 const plugin=await readJson(path.join(root,'plugin.json'));
 if(plugin.name!=='content-studio')errors.push('Plugin name must be content-studio');
 const skills=await readdir(path.join(root,'skills'),{withFileTypes:true});
 for(const entry of skills.filter(x=>x.isDirectory())) {
  const body=await readFile(path.join(root,'skills',entry.name,'SKILL.md'),'utf8');
  if(!body.startsWith('---\n')||!/^name: /m.test(body)||!/^description: /m.test(body))errors.push(`Invalid skill frontmatter: ${entry.name}`);
 }
 if(errors.length)throw new Error(errors.join('\n'));
 result({valid:true,packages:list.length,skills:skills.filter(x=>x.isDirectory()).length});
}
async function serve() {
 const c=await configAt(root), preview=flag('preview');
 const outDir=preview?'.studio/preview':'dist';
 await build(root,{preview,outDir});
 const directory=path.join(root,outDir), port=Number(option('port','4321'));
 if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Port must be an integer from 1024 to 65535');
 const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
 const server=createServer(async(req,res)=>{
  try {
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
   const url=new URL(req.url,'http://127.0.0.1');
   const pathname=decodeURIComponent(url.pathname);
   if(pathname==='/'&&c.basePath){res.writeHead(302,{Location:c.basePath+'/'});res.end();return;}
   if(c.basePath&&!(pathname===c.basePath||pathname.startsWith(c.basePath+'/'))){res.writeHead(404);res.end('Not found');return;}
   let rel=pathname.slice(c.basePath.length).replace(/^\//,'')||'index.html';
   let file=path.resolve(directory,rel);
   if(!file.startsWith(directory+path.sep)&&file!==directory)throw new Error('Invalid path');
   const info=await stat(file);if(info.isDirectory())file=path.join(file,'index.html');
   const actual=await realpath(file);if(!actual.startsWith(directory+path.sep))throw new Error('Invalid path');
   const bytes=await readFile(actual);
   res.writeHead(200,{'Content-Type':mime[path.extname(actual)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; img-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
   res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(directory,'404.html'),'utf8'));}
 });
 server.listen(port,'127.0.0.1',()=>console.log(`Content Studio ${preview?'review':'production'}: http://127.0.0.1:${port}${c.basePath}/`));
 for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
async function createDraft(slug) {
 assertSlug(slug);const title=option('title',null);if(!title)throw new Error('Provide --title "Article title"');
 // New drafts stay out of the public repository by default.
 const dir=path.join(root,'.studio','drafts',slug);await mkdir(path.dirname(dir),{recursive:true});await mkdir(dir);
 const today=new Date().toISOString().slice(0,10);
 await writeFile(path.join(dir,'metadata.json'),JSON.stringify({schemaVersion:1,slug,title,description:'',status:'draft',publicSafe:false,author:'Jordan Davis',category:'Engineering',createdAt:today,updatedAt:today,tags:[],coverImage:'',coverAlt:'',sourceType:'topic',publishedUrl:null},null,2)+'\n');
 await writeFile(path.join(dir,'article.md'),'## Working thesis\n\n## Evidence\n\n## Implementation\n\n## Tradeoffs\n');
 await writeFile(path.join(dir,'sources.json'),'[]\n');
 await writeFile(path.join(dir,'linkedin.md'),'{{articleUrl}}\n');
 await mkdir(path.join(dir,'assets'));await mkdir(path.join(dir,'diagrams'));
 result({created:path.relative(root,dir),privateByDefault:true,next:'Write and review here. Only move sanitized, explicitly public-safe material into articles/. Public Git branches are not private drafts.'});
}
async function plan(slug) {
 const p=await loadPackage(root,slug), current=await fingerprints(p,root);
 let previous=null;try{previous=(await readJson(path.join(root,'.studio','cache.json')))[slug];}catch{}
 result({slug,units:Object.entries(current).map(([unit,fingerprint])=>({unit,fingerprint,changed:previous?.[unit]!==fingerprint})),sideEffects:'None. Cache state is not publication approval.'});
}
async function worktree(slug) {
 assertSlug(slug);const role=option('role','article');assertSlug(role);
 const branch=`content/${slug}-${role}`, target=path.join(path.dirname(root),`${path.basename(root)}-${slug}-${role}`);
 const command=['worktree','add',target,'-b',branch];
 if(!flag('execute')){result({command:['git',...command],dryRun:true,ownership:role==='visuals'?`articles/${slug}/assets/** and diagrams/**`:role==='linkedin'?`articles/${slug}/linkedin.md`:`articles/${slug}/article.md and sources.json`});return;}
 const proc=spawnSync('git',command,{cwd:root,stdio:'inherit'});if(proc.error)throw proc.error;if(proc.status!==0)throw new Error('Git worktree creation failed');
}
try {
 if(Number(process.versions.node.split('.')[0])<22)throw new Error('Node 22 or newer is required');
 switch(cmd){
  case 'validate':await validate();break;
  case 'build':result(await build(root,{preview:flag('preview'),outDir:flag('preview')?'.studio/preview':'dist',force:flag('force')}));break;
  case 'serve':await serve();break;
  case 'new':await createDraft(argv[0]);break;
  case 'list':result((await packages(root)).map(p=>({slug:p.slug,title:p.meta.title,status:p.meta.status})));break;
  case 'plan':await plan(argv[0]);break;
  case 'prepare':result(await prepare(root,argv[0],{account:option('account','UNSELECTED')}));break;
  case 'publish':result(await publishInstructions(root,argv[0],{account:option('account','UNSELECTED')}));process.exitCode=2;break;
  case 'status':result(await publicationStatus(root,argv[0]));break;
  case 'record':if(!option('file',null))throw new Error('Provide --file for an operator-confirmed provider receipt');result(await recordReceipt(root,argv[0],path.resolve(option('file',null))));break;
  case 'worktree':await worktree(argv[0]);break;
  case 'doctor':result({node:process.version,dependencies:'No npm install required',site:canonical(await configAt(root)),hosting:'GitHub Pages; verify repository setting separately',paidGeneration:false,remoteMcp:'Not needed in V1',connections:{notion:'host-owned; not inherited by this CLI',github:'host connector or local Git credentials',gptImage:'host tool; no standalone API credential configured',zapier:'host-owned; must be discovered and verified before publishing'},safeMode:'Drafts private by default; no CLI command makes a live publishing API call'});break;
  default:console.log(`Content Studio\n\n  npm run dev                           Local review at /content/\n  npm run build                         Production build (published only)\n  npm run check                         Validate, test, production build\n  npm run studio -- new slug --title "Title"\n  npm run studio -- list\n  npm run studio -- plan slug\n  npm run studio -- prepare slug --account "Personal profile"\n  npm run studio -- status slug\n  npm run studio -- record slug --file /private/receipt.json\n  npm run studio -- worktree slug --role visuals [--execute]\n  npm run studio -- doctor\n\nPublishing is approval-gated through the host connector, not this local CLI.`);
 }
}catch(error){console.error(`Content Studio: ${error.message}`);process.exitCode=1;}
