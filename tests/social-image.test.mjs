import test from 'node:test';
import assert from 'node:assert/strict';
import {cp,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {pngDimensions,validateSocialImage,socialImageTags} from '../lib/social-image.mjs';
import {configAt,loadPackage,fingerprints} from '../lib/content.mjs';
import {build} from '../lib/site.mjs';

const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slug='parallel-agent-engineering';
const url=`https://jdavis-software.github.io/content/articles/${slug}/`;
const imageUrl=url+'assets/og-linkedin-v1.png';
async function fixture(t) {
  const root=await mkdtemp(path.join(tmpdir(),'social-card-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  for(const name of ['articles','site','lib','studio.config.json']) await cp(path.join(source,name),path.join(root,name),{recursive:true});
  return root;
}

test('the real social card is a 1200x627 PNG with the reviewed digest',async()=>{
  const bytes=await readFile(path.join(source,'articles',slug,'assets/og-linkedin-v1.png'));
  assert.deepEqual(pngDimensions(bytes),{width:1200,height:627});
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'3544eead1440283b4730b7d2d73510e80eba96900b0b23112b0247f54e1e19a2');
});
test('PNG dimensions reject truncated and mislabeled non-PNG images',()=>{
  assert.throws(()=>pngDimensions(Buffer.from('<svg></svg>')),/PNG/);
  assert.throws(()=>pngDimensions(Buffer.alloc(24)),/PNG/);
});
test('dedicated social metadata validates and remains optional for older packages',async()=>{
  const p=await loadPackage(source,slug);
  assert.deepEqual(await validateSocialImage(p),[]);
  delete p.meta.socialImage;
  assert.deepEqual(await validateSocialImage(p),[]);
  assert.match(socialImageTags(p.meta,url),/cover\.svg/);
});
test('social-image validation rejects remote, traversal and SVG references',async()=>{
  const p=await loadPackage(source,slug);
  for(const src of ['https://example.com/image.png','assets/../private.png','assets/cover.svg','assets/missing.png']) {
    p.meta.socialImage.src=src;
    assert.match((await validateSocialImage(p)).join(' '),/packaged PNG/);
  }
});
test('social-image dimensions, MIME type and alternative text must be accurate',async()=>{
  const p=await loadPackage(source,slug);
  p.meta.socialImage={...p.meta.socialImage,width:640,type:'image/jpeg',alt:''};
  const errors=(await validateSocialImage(p)).join(' ');
  assert.match(errors,/dimensions do not match/);assert.match(errors,/type must/);assert.match(errors,/alt is required/);
});
test('social tags escape descriptive text without injecting markup',async()=>{
  const p=await loadPackage(source,slug);
  p.meta.socialImage.alt='" ><script>alert(1)</script>';
  const tags=socialImageTags(p.meta,url);
  assert.ok(!tags.includes('<script>'));
  assert.match(tags,/&lt;script&gt;/);
  assert.equal((tags.match(/property="og:image"/g)||[]).length,1);
});
test('production renders static PNG metadata, preserves both interactive diagrams, and uses the new thumbnail',async t=>{
  const root=await fixture(t), manifest=await build(root);
  const html=await readFile(path.join(root,'dist/articles',slug,'index.html'),'utf8');
  const head=html.split('</head>')[0];
  for(const field of ['og:image','og:image:secure_url','twitter:image']) assert.ok(head.includes(`${field}" content="${imageUrl}"`));
  assert.match(head,/property="og:image:type" content="image\/png"/);
  assert.match(head,/property="og:image:width" content="1200"/);
  assert.match(head,/property="og:image:height" content="627"/);
  assert.ok(!head.includes('cover.svg'));
  assert.match(html,/id="parallel-agent-flow"/);assert.match(html,/id="devops-invalidation"/);
  assert.ok(!html.includes('DriftGate'));
  assert.ok(manifest.outputs.includes(`articles/${slug}/assets/og-linkedin-v1.png`));
  const home=await readFile(path.join(root,'dist/index.html'),'utf8');
  assert.match(home,/og-linkedin-v1\.png/);assert.match(home,/width="1200" height="627"/);
});
test('unpublished social assets remain excluded from production',async t=>{
  const root=await fixture(t), file=path.join(root,'articles',slug,'metadata.json');
  const meta=JSON.parse(await readFile(file,'utf8'));meta.status='review';await writeFile(file,JSON.stringify(meta));
  const manifest=await build(root);
  assert.ok(!manifest.outputs.some(p=>p.endsWith('og-linkedin-v1.png')));
});
test('social renderer changes invalidate the cached article renderer',async t=>{
  const root=await fixture(t), pkg=await loadPackage(root,slug), first=await fingerprints(pkg,root);
  const file=path.join(root,'lib/social-image.mjs');await writeFile(file,(await readFile(file,'utf8'))+'\n// fixture revision\n');
  const next=await fingerprints(pkg,root);
  assert.notEqual(first.renderer,next.renderer);
  assert.equal(first.article,next.article);
});
