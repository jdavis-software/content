import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,cp,rm,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from '../lib/site.mjs';
import {loadPackage,validatePackage,configAt,hash} from '../lib/content.mjs';
import {rasterInfo} from '../lib/social-image.mjs';
import {prepare} from '../lib/publishing.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const first='parallel-agent-engineering',second='keeping-parallel-development-fast';
async function fixture(t){
 const dir=await mkdtemp(path.join(tmpdir(),'content-series-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 for(const name of ['articles','lib','site','studio.config.json'])await cp(path.join(root,name),path.join(dir,name),{recursive:true});
 for(const name of await readdir(path.join(dir,'articles')))if(![first,second].includes(name))await rm(path.join(dir,'articles',name),{recursive:true,force:true});
 for(const slug of [first,second])await status(dir,slug,'published');
 return dir;
}
async function status(dir,slug,status){const file=path.join(dir,'articles',slug,'metadata.json'),m=JSON.parse(await readFile(file,'utf8'));m.status=status;await writeFile(file,JSON.stringify(m));}
async function html(dir,slug){return readFile(path.join(dir,'dist/articles',slug,'index.html'),'utf8');}
test('second article validates with an evidence ledger and an unchanged original PNG',async()=>{
 const pkg=await loadPackage(root,second);assert.deepEqual(await validatePackage(pkg,await configAt(root)),[]);
 assert.equal(pkg.sources.length,20);assert.ok(pkg.article.includes('not a PostgreSQL integration test or a performance benchmark'));
 const image=await readFile(path.join(pkg.dir,pkg.meta.socialImage.path));
 assert.equal(hash(image),'519ffa6191cfa134e57613e40cd08dd746f34dab732a67cfeaa17aa9f973e680');
 assert.deepEqual(rasterInfo(image),{width:1734,height:907,type:'image/png'});
});
test('Markdown code comments are not confused with body H1 headings',async()=>{
 const pkg=await loadPackage(root,second),config=await configAt(root);
 pkg.article='## Example\n\n```dockerfile\n# syntax=docker/dockerfile:1\nRUN echo test\n```\n';
 assert.deepEqual(await validatePackage(pkg,config),[]);
 pkg.article+='\n# A real forbidden heading\n';assert.match((await validatePackage(pkg,config)).join(' '),/body starts at H2/);
});
test('a two-article release preserves both pages, RSS, and sitemap and features part two',async t=>{
 const dir=await fixture(t),m=await build(dir);assert.deepEqual(m.articles.map(a=>a.slug),[second,first]);
 const home=await readFile(path.join(dir,'dist/index.html'),'utf8');
 assert.ok(home.includes(`src="/content/articles/${second}/assets/og-cache-delivery-v1.png"`));
 assert.ok(home.includes(`og:image" content="https://jdavis-software.github.io/content/articles/${second}/assets/og-cache-delivery-v1.png"`));
 assert.ok(!home.includes('type="module"'));
 for(const slug of [first,second])for(const file of ['rss.xml','sitemap.xml'])assert.ok((await readFile(path.join(dir,'dist',file),'utf8')).includes(`/articles/${slug}/`));
});
test('part two reuses only DevOps modules and leaves the first article animations intact',async t=>{
 const dir=await fixture(t);await build(dir);const a=await html(dir,first),b=await html(dir,second);
 assert.ok(a.includes('id="parallel-agent-flow"')&&a.includes('id="devops-invalidation"'));
 assert.ok(b.includes('id="devops-invalidation"'));assert.ok(!b.includes('id="parallel-agent-flow"'));
 assert.ok(b.includes('src="/content/devops-flow.js"'));assert.ok(!b.includes('src="/content/agent-flow.js"'));
 assert.ok(b.indexOf('id="follow-one-change-through-the-system"')<b.indexOf('id="devops-invalidation"'));
 assert.ok(b.indexOf('id="devops-invalidation"')<b.indexOf('id="docker-has-two-different-cache-mechanisms"'));
 assert.ok(!b.includes('DriftGate'));assert.ok(b.includes('width="1734" height="907"'));
 assert.equal((b.match(/property="og:image"/g)||[]).length,1);
 assert.ok(b.includes('og:image:width" content="1734"'));assert.ok(b.includes('twitter:image"'));
});
test('part two remains independently deployable without Anime.js or part one',async t=>{
 const dir=await fixture(t);await status(dir,first,'review');const m=await build(dir);
 assert.deepEqual(m.articles.map(a=>a.slug),[second]);
 for(const name of ['devops-flow.js','devops-flow.css','devops-model.js'])assert.ok(m.outputs.includes(name));
 assert.ok(!m.outputs.some(x=>x.startsWith('agent-flow')||x.startsWith('vendor/')));
});
test('unpublishing part two removes its route and image but preserves part one',async t=>{
 const dir=await fixture(t);await build(dir);await status(dir,second,'review');const m=await build(dir);
 assert.deepEqual(m.articles.map(a=>a.slug),[first]);assert.ok(!m.outputs.some(x=>x.includes(second)));
 await assert.rejects(readFile(path.join(dir,'dist/articles',second,'index.html')),/ENOENT/);
 const home=await readFile(path.join(dir,'dist/index.html'),'utf8');assert.ok(!home.includes(second));
});
test('both articles restore their own render results when inputs are unchanged',async t=>{
 const dir=await fixture(t);const a=await build(dir),b=await build(dir);assert.equal(a.cache.rendered,2);assert.equal(b.cache.reused,2);
 const file=path.join(dir,'articles',second,'linkedin.md');await writeFile(file,(await readFile(file,'utf8'))+'\n');
 assert.equal((await build(dir)).cache.reused,2);
});
test('the second LinkedIn handoff is a draft pointing to the correct new URL',async t=>{
 const dir=await fixture(t),request=await prepare(dir,second);
 assert.equal(request.approval,null);assert.equal(request.state,'awaiting-human-approval');
 assert.equal(request.articleUrl,`https://jdavis-software.github.io/content/articles/${second}/`);
 assert.ok(request.text.includes(request.articleUrl));assert.ok(!request.text.includes('{{articleUrl}}'));
});


test('database roles distinguish durable ownership from optional document-derived indexing',async t=>{
  const dir=await fixture(t);await build(dir);
  const body=await html(dir,second);
  assert.match(body,/id="not-every-database-is-another-source-of-truth"/);
  for(const label of ['Application PostgreSQL','Temporal-owned PostgreSQL persistence','Optional SQLite FTS index','Build caches'])assert.ok(body.includes(label));
  assert.ok(body.includes('approved documents → a versioned knowledge package → an optional SQLite index'));
  assert.ok(body.includes('Temporal persistence is not a replica derived from application rows'));
  assert.ok(body.includes('The SQLite index is optional too'));
  assert.ok(body.includes('https://www.sqlite.org/fts5.html'));
  assert.ok(body.indexOf('id="not-every-database-is-another-source-of-truth"')<body.indexOf('id="application-data-invalidation-is-a-different-problem"'));
});
