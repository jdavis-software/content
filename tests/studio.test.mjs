import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,rm,readFile,writeFile,readdir,symlink,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {assertSlug,configAt,loadPackage,validatePackage,fingerprints,canonical,hash,validDate} from '../lib/content.mjs';
import {renderMarkdown,inline,safeUrl} from '../lib/markdown.mjs';
import {build} from '../lib/site.mjs';
import {prepare,publicationStatus,publishInstructions,recordReceipt} from '../lib/publishing.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slug='parallel-agent-engineering';
async function fixture(t) {
 const root=await mkdtemp(path.join(tmpdir(),'content-studio-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 for(const f of ['articles','site','lib','scripts','skills','plugin.json','package.json','studio.config.json'])await cp(path.join(source,f),path.join(root,f),{recursive:true});
 for(const entry of await readdir(path.join(root,'articles')))if(entry!==slug)await rm(path.join(root,'articles',entry),{recursive:true,force:true});
 // Keep synthetic fixture state independent of the real article's release lifecycle.
 await modifyMeta(root,{status:'review',publishedUrl:null});
 return root;
}
const json=async f=>JSON.parse(await readFile(f,'utf8'));
const save=async(f,v)=>writeFile(f,JSON.stringify(v,null,2));
const metaPath=r=>path.join(r,'articles',slug,'metadata.json');
async function modifyMeta(root,patch){await save(metaPath(root),{...await json(metaPath(root)),...patch});}
async function errors(root){return validatePackage(await loadPackage(root,slug),await configAt(root));}
async function receiptFor(root) {
 return {slug,platform:'linkedin',account:'TEST ACCOUNT — fixture only',providerPostId:'test-fixture-id',url:'https://www.linkedin.com/posts/test-fixture',recordedAt:'2026-09-17T19:00:00.000Z',confirmedByHuman:true,packageHash:(await fingerprints(await loadPackage(root,slug),root)).package};
}
test('slugs reject traversal, whitespace, uppercase and empty identifiers',()=>{
 for(const value of ['','../foo','Foo','a/b','a b','a--b','a'.repeat(101),null])assert.throws(()=>assertSlug(value));
 assert.equal(assertSlug(slug),slug);
});
test('dates reject impossible calendar dates',()=>{
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2026-02-29'),false);assert.equal(validDate('2024-02-29'),true);
});
test('Markdown escapes raw HTML and script text',()=>{
 const {html}=renderMarkdown('<script>alert(1)</script>\n\n<script src=x>');
 assert.ok(!html.includes('<script'));assert.ok(html.includes('&lt;script&gt;'));
});
test('Markdown rejects executable, protocol-relative and credential URLs',()=>{
 for(const u of ['javascript:alert','//evil.example','https://user:secret@example.com','data:text/html,foo','assets/../secret','https:\\evil'])assert.equal(safeUrl(u),null);
 assert.ok(!inline('[x](javascript:alert)').includes('href='));
 assert.equal(safeUrl('https://example.com/docs'),'https://example.com/docs');
});
test('Markdown produces stable unique heading anchors and code controls',()=>{
 const a=renderMarkdown('## Same\n\nText **bold**.\n\n## Same\n\n```ts\nconst x = "<script>";\n```');
 assert.deepEqual(a.toc.map(x=>x.id),['same','same-1']);assert.match(a.html,/copy-code/);assert.ok(!a.html.includes('<script>'));
});
test('Markdown fails closed on an unclosed code block',()=>assert.throws(()=>renderMarkdown('```js\nabc'),/Unclosed/));
test('config resolves project-site canonical URLs',async t=>{
 const root=await fixture(t), c=await configAt(root);assert.equal(canonical(c,slug),`https://jdavis-software.github.io/content/articles/${slug}/`);
});
test('config rejects credentials and traversal base paths',async t=>{
 const root=await fixture(t), f=path.join(root,'studio.config.json'), c=await json(f);
 await save(f,{...c,basePath:'/../secret'});await assert.rejects(configAt(root),/basePath/);
 await save(f,{...c,origin:'https://person:secret@example.com'});await assert.rejects(configAt(root),/origin/);
});
test('the pilot package passes validation',async t=>assert.deepEqual(await errors(await fixture(t)),[]));
test('private content cannot enter the public article directory',async t=>{
 const root=await fixture(t);await modifyMeta(root,{publicSafe:false});assert.ok((await errors(root)).some(x=>x.includes('publicSafe')));
});
test('invalid statuses and dates fail validation',async t=>{
 const root=await fixture(t);await modifyMeta(root,{status:'approved',createdAt:'2026-02-30'});assert.match((await errors(root)).join('\n'),/Invalid status/);assert.match((await errors(root)).join('\n'),/Invalid createdAt/);
});
test('private Notion references are rejected in the public source ledger',async t=>{
 const root=await fixture(t), f=path.join(root,'articles',slug,'sources.json'), sources=await json(f);sources[0].url='https://app.notion.com/p/private';await save(f,sources);assert.match((await errors(root)).join('\n'),/Notion/);
});
test('secret-like values are detected',async t=>{
 const root=await fixture(t);await writeFile(path.join(root,'articles',slug,'sources.md'),'ghp_'+'A'.repeat(35));assert.match((await errors(root)).join('\n'),/Potential secret/);
});
test('SVG scripts and remote style imports are rejected',async t=>{
 const root=await fixture(t), f=path.join(root,'articles',slug,'assets','unsafe.svg');
 await writeFile(f,'<svg><style>@import "https://example.com/tracker.css";</style></svg>');assert.match((await errors(root)).join('\n'),/Unsafe SVG/);
 await writeFile(f,'<svg onload="alert(1)"></svg>');assert.match((await errors(root)).join('\n'),/Unsafe SVG/);
});
test('symlinked source artifacts are rejected',async t=>{
 const root=await fixture(t);await symlink(path.join(root,'studio.config.json'),path.join(root,'articles',slug,'assets','linked.json'));await assert.rejects(loadPackage(root,slug),/Symlink/);
});
test('images cannot escape their article package',async t=>{
 const root=await fixture(t);await writeFile(path.join(root,'articles',slug,'article.md'),'## Example\n\n![private](../../secret.png)');assert.match((await errors(root)).join('\n'),/packaged asset/);
});
test('LinkedIn character budget uses the expanded article URL',async t=>{
 const root=await fixture(t);await writeFile(path.join(root,'articles',slug,'linkedin.md'),'x'.repeat(2800)+' {{articleUrl}}');assert.match((await errors(root)).join('\n'),/character limit/);
});
test('changing LinkedIn copy does not invalidate article or visual fingerprints',async t=>{
 const root=await fixture(t), before=await fingerprints(await loadPackage(root,slug),root);
 const f=path.join(root,'articles',slug,'linkedin.md');await writeFile(f,(await readFile(f,'utf8'))+'\nA revised hook.');
 const after=await fingerprints(await loadPackage(root,slug),root);assert.equal(before.article,after.article);assert.equal(before.visuals,after.visuals);assert.notEqual(before.linkedin,after.linkedin);assert.notEqual(before.package,after.package);
});
test('production excludes review routes, assets, workspace, RSS and sitemap entries',async t=>{
 const root=await fixture(t), manifest=await build(root);assert.equal(manifest.articles.length,0);assert.ok(!manifest.outputs.some(f=>f.startsWith('articles/')||f.startsWith('studio/')));
 for(const file of ['rss.xml','sitemap.xml'])assert.ok(!(await readFile(path.join(root,'dist',file),'utf8')).includes('/articles/'+slug));
});
test('preview includes review article but never includes it in RSS',async t=>{
 const root=await fixture(t), m=await build(root,{preview:true,outDir:'.studio/preview'});assert.equal(m.articles.length,1);assert.ok(m.outputs.includes('studio/index.html'));
 const html=await readFile(path.join(root,'.studio/preview/articles',slug,'index.html'),'utf8');assert.match(html,/noindex,nofollow/);assert.match(html,/In review/);
 assert.ok(!(await readFile(path.join(root,'.studio/preview/rss.xml'),'utf8')).includes('/articles/'+slug));
 assert.ok(!m.outputs.some(f=>f.includes('sources.json')||f.includes('provenance.json')||f.includes('brief.md')));
});
test('published article is included and archiving removes stale output',async t=>{
 const root=await fixture(t);await modifyMeta(root,{status:'published'});let m=await build(root);assert.equal(m.articles.length,1);assert.match(await readFile(path.join(root,'dist/rss.xml'),'utf8'),/<item>/);
 await modifyMeta(root,{status:'archived'});m=await build(root);assert.equal(m.articles.length,0);await assert.rejects(readFile(path.join(root,'dist/articles',slug,'index.html')),/ENOENT/);
});
test('unchanged builds restore a verified article render',async t=>{
 const root=await fixture(t), options={preview:true,outDir:'.studio/preview'};const a=await build(root,options);const b=await build(root,options);assert.equal(a.cache.rendered,1);assert.equal(b.cache.reused,1);
});
test('LinkedIn-only edits reuse the article render',async t=>{
 const root=await fixture(t), options={preview:true,outDir:'.studio/preview'};await build(root,options);
 const f=path.join(root,'articles',slug,'linkedin.md');await writeFile(f,(await readFile(f,'utf8'))+'\nA revised introduction.');assert.equal((await build(root,options)).cache.reused,1);
});
test('corrupt cache bodies are rebuilt',async t=>{
 const root=await fixture(t), options={preview:true,outDir:'.studio/preview'};await build(root,options);
 const dir=path.join(root,'.studio/cache'), f=(await readdir(dir)).find(x=>x.endsWith('.html'));await writeFile(path.join(dir,f),'corrupted');const b=await build(root,options);assert.equal(b.cache.rendered,1);
 assert.ok(!(await readFile(path.join(root,'.studio/preview/articles',slug,'index.html'),'utf8')).includes('corrupted'));
});
test('build refuses output outside controlled generated directories',async t=>{
 const root=await fixture(t);await assert.rejects(build(root,{outDir:'articles'}),/Output must/);
});
test('concurrent integration builds cannot write the same output',async t=>{
 const root=await fixture(t), lock=path.join(root,'.studio/locks',hash(path.join(root,'dist'))+'.lock');await mkdir(path.dirname(lock),{recursive:true});await writeFile(lock,'test-owner');await assert.rejects(build(root),/output lock/);
});
test('alternate base paths propagate through generated navigation',async t=>{
 const root=await fixture(t), f=path.join(root,'studio.config.json'), c=await json(f);await save(f,{...c,basePath:'/notes'});await build(root,{preview:true,outDir:'.studio/preview'});
 const html=await readFile(path.join(root,'.studio/preview/index.html'),'utf8');assert.match(html,/href="\/notes\/style.css"/);assert.ok(!html.includes('href="/content/'));
});
test('prepare is deterministic and never creates publication evidence',async t=>{
 const root=await fixture(t), a=await prepare(root,slug,{account:'Test profile'}), b=await prepare(root,slug,{account:'Test profile'});assert.equal(a.idempotencyKey,b.idempotencyKey);assert.equal(a.approval,null);assert.equal(a.state,'awaiting-human-approval');assert.ok(!a.text.includes('{{articleUrl}}'));assert.equal((await publicationStatus(root,slug)).receipt,null);
});
test('publish remains blocked without an authenticated approved host action',async t=>{
 const root=await fixture(t);const p=await publishInstructions(root,slug);assert.equal(p.blocked,true);assert.equal((await publicationStatus(root,slug)).receipt,null);
});
test('receipt fails on wrong content hash or non-LinkedIn destination',async t=>{
 const root=await fixture(t), f=path.join(root,'receipt.json'), receipt=await receiptFor(root);
 await save(f,{...receipt,packageHash:'wrong'});await assert.rejects(recordReceipt(root,slug,f),/match/);
 await save(f,{...receipt,url:'https://www.linkedin.com.evil.example/posts/x'});await assert.rejects(recordReceipt(root,slug,f),/LinkedIn post/);
 await save(f,{...receipt,url:'https://user:secret@www.linkedin.com/posts/x'});await assert.rejects(recordReceipt(root,slug,f),/LinkedIn post/);
});
test('operator-attested test receipt cannot be silently replaced or republished',async t=>{
 const root=await fixture(t), f=path.join(root,'receipt.json');await save(f,await receiptFor(root));assert.equal((await recordReceipt(root,slug,f)).recorded,true);await assert.rejects(recordReceipt(root,slug,f),/EEXIST/);await assert.rejects(publishInstructions(root,slug),/duplicate/);
 assert.equal((await publicationStatus(root,slug)).needsReview,false);
 const a=path.join(root,'articles',slug,'article.md');await writeFile(a,(await readFile(a,'utf8'))+'\nAn edit.');assert.equal((await publicationStatus(root,slug)).needsReview,true);
});
test('CLI drafts are private by default and worktrees are dry-run by default',async t=>{
 const root=await fixture(t), run=args=>spawnSync(process.execPath,['scripts/content.mjs',...args],{cwd:root,encoding:'utf8'});
 const a=run(['new','test-article','--title','Test article']);assert.equal(a.status,0,a.stderr);assert.equal((await json(path.join(root,'.studio/drafts/test-article/metadata.json'))).publicSafe,false);
 const b=run(['worktree',slug,'--role','visuals']);assert.equal(b.status,0,b.stderr);assert.equal(JSON.parse(b.stdout).dryRun,true);
 const c=run(['publish',slug]);assert.equal(c.status,2);assert.equal(JSON.parse(c.stdout).blocked,true);
});
