import {validateSocialImage} from './social-image.mjs';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,writeFile,readdir,mkdir,rename,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const hash = value => createHash('sha256').update(value).digest('hex');
export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
export const readJson = async file => JSON.parse(await readFile(file,'utf8'));
export async function atomicWrite(file, content) {
  await mkdir(path.dirname(file),{recursive:true});
  const tmp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(tmp,content); await rename(tmp,file);
}
export function canonical(config,slug='') {
  return `${config.origin.replace(/\/$/,'')}${config.basePath}${slug?`/articles/${slug}/`:'/'}`;
}
export function assertSlug(slug) {
  if(typeof slug !== 'string' || !SLUG.test(slug) || slug.length>100) throw new Error('Use a lowercase, hyphen-separated article slug (maximum 100 characters)');
  return slug;
}
export async function configAt(root) {
  const c=await readJson(path.join(root,'studio.config.json'));
  const u=new URL(c.origin);
  if(u.protocol!=='https:' || u.username || u.password || u.pathname!=='/' || u.search || u.hash) throw new Error('origin must be an HTTPS origin without a path or credentials');
  if(!/^(?:\/[a-zA-Z0-9_-]+)*$/.test(c.basePath)) throw new Error('Invalid basePath');
  if(c.articleDirectory!=='articles') throw new Error('articleDirectory must be articles');
  return c;
}
export async function walk(dir, prefix='') {
  let files=[];
  for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    if(item.isSymbolicLink()) throw new Error(`Symlink not allowed: ${prefix}${item.name}`);
    const rel=prefix+item.name;
    if(item.isDirectory()) files.push(...await walk(path.join(dir,item.name),rel+'/'));
    else if(item.isFile()) files.push(rel);
  }
  return files;
}
export async function packages(root) {
  const dir=path.join(root,'articles'); const out=[];
  for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
    if(entry.isSymbolicLink()) throw new Error('Article symlinks are not permitted');
    if(!entry.isDirectory()) continue;
    out.push(await loadPackage(root,entry.name));
  }
  return out;
}
export async function loadPackage(root,slug) {
  assertSlug(slug); const dir=path.join(root,'articles',slug);
  if((await lstat(dir)).isSymbolicLink()) throw new Error('Article symlinks are not permitted');
  const files=await walk(dir);
  const meta=await readJson(path.join(dir,'metadata.json'));
  const article=await readFile(path.join(dir,'article.md'),'utf8');
  const linkedin=await readFile(path.join(dir,'linkedin.md'),'utf8');
  const sources=await readJson(path.join(dir,'sources.json'));
  return {slug,dir,meta,article,linkedin,sources,files};
}
export function scanSecrets(text) {
  return /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{24,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text);
}
export async function validatePackage(pkg,config) {
  const errors=[], m=pkg.meta;
  if(m.schemaVersion!==1) errors.push('metadata.schemaVersion must be 1');
  for(const key of ['title','description','slug','status','createdAt','updatedAt','author','category','coverImage','coverAlt']) {
    if(typeof m[key]!=='string' || !m[key].trim()) errors.push(`metadata.${key} is required`);
  }
  if(m.slug!==pkg.slug) errors.push('Slug must match folder name');
  if(!['draft','review','published','archived'].includes(m.status)) errors.push('Invalid status');
  if(m.publicSafe!==true) errors.push('publicSafe must be explicitly true before placement in this public repository');
  for(const key of ['createdAt','updatedAt']) if(!validDate(m[key])) errors.push(`Invalid ${key}`);
  if(Date.parse(m.updatedAt)<Date.parse(m.createdAt)) errors.push('updatedAt is before createdAt');
  if(!Array.isArray(m.tags) || !m.tags.length || m.tags.some(t=>typeof t!=='string'||!t.trim())) errors.push('At least one nonempty tag is required');
  if(!pkg.article.trim() || /\bTODO\b|\[INSERT/.test(pkg.article)) errors.push('Article is empty or contains placeholders');
  const prose=pkg.article.replace(/^```[^\n]*\n[\s\S]*?^```[^\n]*(?:\n|$)/gm,'');
  if(/^# /m.test(prose)) errors.push('Article body starts at H2; title belongs in metadata');
  if(!pkg.linkedin.trim() || !pkg.linkedin.includes('{{articleUrl}}')) errors.push('LinkedIn draft needs {{articleUrl}}');
  if([...pkg.linkedin.replaceAll('{{articleUrl}}',canonical(config,pkg.slug))].length>config.maxLinkedInCharacters) errors.push('LinkedIn copy exceeds configured character limit');
  if(!Array.isArray(pkg.sources)||!pkg.sources.length) errors.push('At least one public source is required');
  for(const s of Array.isArray(pkg.sources)?pkg.sources:[]) {
    if(!s.title || !s.supports || !validDate(s.checkedAt)) errors.push('Every source needs title, supports, and checkedAt');
    try { const u=new URL(s.url); if(u.protocol!=='https:'||u.username||u.password) throw new Error(); } catch {errors.push('Invalid source URL');}
    if(/(?:notion\.so|app\.notion\.com|notion\.site)/i.test(s.url||'')) errors.push('Private Notion references do not belong in the public source ledger');
  }
  if(!/^assets\/[a-zA-Z0-9_.-]+\.(svg|png|jpg|jpeg|webp)$/.test(m.coverImage||'') || !pkg.files.includes(m.coverImage)) errors.push('A local cover image is required');
  errors.push(...await validateSocialImage(pkg));
  const supported=new Set(['.md','.json','.mmd','.svg','.png','.jpg','.jpeg','.webp']);
  for(const file of pkg.files) {
    if(!supported.has(path.extname(file))) errors.push(`Unsupported public artifact: ${file}`);
    const bytes=await readFile(path.join(pkg.dir,file));
    if(bytes.length>config.maxAssetBytes) errors.push(`Asset exceeds size budget: ${file}`);
    if(['.md','.json','.svg','.mmd'].includes(path.extname(file))) {
      const text=bytes.toString('utf8');
      if(scanSecrets(text)) errors.push(`Potential secret in ${file}`);
      if(file.endsWith('.svg') && /<\s*(?:script|style|foreignObject|image|use|a)\b|\bon\w+\s*=|\b(?:href|src)\s*=|<!DOCTYPE|<!ENTITY|@import|url\(\s*['\"]?(?:https?:|\/\/|data:)/i.test(text)) errors.push(`Unsafe SVG: ${file}`);
      if(file.endsWith('.mmd') && /%%\{|\bclick\s|<script|javascript:/i.test(text)) errors.push(`Unsafe Mermaid directives: ${file}`);
    }
  }
  // Do not let a Markdown image escape its package or fetch private remote material.
  for(const match of pkg.article.matchAll(/!\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const file=match[1];
    if(!/^assets\/[a-zA-Z0-9_.-]+\.(svg|png|jpg|jpeg|webp)$/.test(file)||!pkg.files.includes(file)) errors.push(`Image must be a packaged asset: ${file}`);
  }
  return errors;
}
export async function fingerprints(pkg,root) {
  const select=async files=>hash((await Promise.all([...files].sort().map(async f=>`${f}\0${hash(await readFile(path.join(pkg.dir,f)))}`))).join('\n'));
  return {
    article:await select(['article.md','metadata.json','sources.json']),
    linkedin:await select(['linkedin.md','metadata.json']),
    visuals:await select(pkg.files.filter(f=>/^(assets|diagrams)\//.test(f))),
    package:await select(pkg.files),
    renderer:hash((await Promise.all(['lib/site.mjs',...(pkg.slug==='jev-decision-layer'?['lib/jev-explorer.mjs','site/jev-model.js','site/jev-explorer.js','site/jev-explorer.css']:[]),...(pkg.slug==='better-context-for-ai-agents'?['lib/context-explorer.mjs','site/context-model.js','site/context-explorer.js','site/context-explorer.css']:[]),'lib/social-image.mjs','lib/markdown.mjs','site/style.css','site/client.js','lib/devops-flow.mjs','site/devops-model.js','site/devops-flow.js','site/devops-flow.css','lib/agent-flow.mjs','site/agent-flow-model.js','site/agent-flow.js','site/agent-flow.css','site/vendor/anime-4.5.0.esm.min.js','studio.config.json'].map(f=>readFile(path.join(root,f))))).map(b=>hash(b)).join(':'))
  };
}
export async function safeAsset(root,relative) {
  const absolute=await realpath(path.join(root,relative)); const base=await realpath(root);
  if(!absolute.startsWith(base+path.sep)) throw new Error('Path escaped root');
  return absolute;
}
