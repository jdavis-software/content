import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {build} from '../lib/site.mjs';
import {loadPackage,configAt,validatePackage} from '../lib/content.mjs';
import {rasterSize,socialTags} from '../lib/social.mjs';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slug='parallel-agent-engineering';
const file='og-parallel-agents-v1.png';
async function fixture(t) {
  const root=await mkdtemp(path.join(tmpdir(),'social-preview-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  for(const f of ['articles','site','lib','studio.config.json'])await cp(path.join(source,f),path.join(root,f),{recursive:true});
  return root;
}
async function patch(root,changes) {
  const p=path.join(root,'articles',slug,'metadata.json');
  const m=JSON.parse(await readFile(p,'utf8'));
  Object.assign(m,changes);await writeFile(p,JSON.stringify(m));
}
async function errors(root){return validatePackage(await loadPackage(root,slug),await configAt(root));}

test('the dedicated PNG has real 1200x627 image headers',async()=>{
  const bytes=await readFile(path.join(source,'articles',slug,'assets',file));
  assert.deepEqual(rasterSize(bytes),{type:'image/png',width:1200,height:627});
  assert.ok(bytes.length<1000000);
});
test('social image headers reject SVG and truncated binary content',()=>{
  assert.throws(()=>rasterSize(Buffer.from('<svg/>')));
  assert.throws(()=>rasterSize(Buffer.from([255,216,255])));
});
test('social metadata rejects remote files, traversal and non-raster input',async t=>{
  const root=await fixture(t), m=(await loadPackage(root,slug)).meta;
  for(const candidate of ['https://example.com/image.png','assets/../metadata.json','assets/cover.svg']) {
    await patch(root,{socialImage:{...m.socialImage,path:candidate}});
    assert.match((await errors(root)).join('\n'),/packaged PNG or JPEG/);
  }
});
test('social metadata dimensions, alt text and type are validated against bytes',async t=>{
  const root=await fixture(t), m=(await loadPackage(root,slug)).meta;
  await patch(root,{socialImage:{...m.socialImage,width:600,type:'image/jpeg',alt:''}});
  const output=(await errors(root)).join('\n');
  assert.match(output,/alt is required/);assert.match(output,/type does not match/);assert.match(output,/does not match image bytes/);
});
test('image tags escape alt text and contain no executable markup',()=>{
  const tags=socialTags('https://example.com/image.png',{alt:'" onload="alert(1) <script>',width:1200,height:627,type:'image/png'});
  assert.ok(!tags.includes('<script>'));assert.ok(!tags.includes(' onload="'));assert.match(tags,/&quot;/);
});
test('initial HTML has absolute raster metadata and retains both interactive diagrams',async t=>{
  const root=await fixture(t);await build(root);
  const html=await readFile(path.join(root,'dist/articles',slug,'index.html'),'utf8');
  const head=html.split('</head>')[0], url=`https://jdavis-software.github.io/content/articles/${slug}/assets/${file}`;
  for(const key of ['og:image','og:image:secure_url'])assert.ok(head.includes(`property="${key}" content="${url}"`));
  assert.ok(head.includes(`name="twitter:image" content="${url}"`));
  for(const [key,value] of [['type','image/png'],['width','1200'],['height','627']])assert.ok(head.includes(`property="og:image:${key}" content="${value}"`));
  assert.ok(head.includes(`"image":["${url}"]`));
  assert.match(html,/id="parallel-agent-flow"/);assert.match(html,/id="devops-invalidation"/);
  assert.ok(!html.includes('DriftGate'));
  assert.deepEqual(await readFile(path.join(root,'dist/articles',slug,'assets',file)),await readFile(path.join(root,'articles',slug,'assets',file)));
  const home=await readFile(path.join(root,'dist/index.html'),'utf8');
  assert.ok(home.includes(file));assert.ok(home.includes('width="1200" height="627"'));
});
test('raster social assets stay out of production for review-only packages',async t=>{
  const root=await fixture(t);await patch(root,{status:'review'});const m=await build(root);
  assert.ok(!m.outputs.some(f=>f.includes(file)));
  await assert.rejects(readFile(path.join(root,'dist/articles',slug,'assets',file)),/ENOENT/);
});
test('social metadata changes invalidate cached article output without changing the article body',async t=>{
  const root=await fixture(t);await build(root);
  const p=await loadPackage(root,slug), body=p.article;
  await patch(root,{socialImage:{...p.meta.socialImage,alt:'Revised social illustration description'}});
  const second=await build(root);assert.equal(second.cache.rendered,1);
  assert.equal((await loadPackage(root,slug)).article,body);
});
