import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,mkdtemp,cp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {rasterInfo,validateSocialImage,socialImageFor,socialImageTags} from '../lib/social-image.mjs';
import {configAt,loadPackage,hash} from '../lib/content.mjs';
import {build} from '../lib/site.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const slug='parallel-agent-engineering';
const imagePath=`articles/${slug}/assets/og-linkedin-v1.png`;
async function fixture(t) {
 const dir=await mkdtemp(path.join(tmpdir(),'social-preview-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 for(const file of ['articles','site','lib','scripts','skills','plugin.json','package.json','studio.config.json'])await cp(path.join(root,file),path.join(dir,file),{recursive:true});
 for(const entry of await readdir(path.join(dir,'articles')))if(entry!==slug)await rm(path.join(dir,'articles',entry),{recursive:true,force:true});
  return dir;
}
test('the generated social PNG has pinned bytes and real 1200x627 dimensions',async()=>{
 const bytes=await readFile(path.join(root,imagePath));
 assert.equal(hash(bytes),'45869bd494411d7c05298b3e1f106e0010711277a037b70b56c3e48184453156');
 assert.deepEqual(rasterInfo(bytes),{type:'image/png',width:1200,height:627});
 assert.ok(bytes.length<1024*1024);
});
test('raster header reader fails closed and reads a JPEG frame',()=>{
 assert.throws(()=>rasterInfo(Buffer.from('<svg/>')));
 assert.throws(()=>rasterInfo(Buffer.from([255,216,255,192,0,20])));
 const jpeg=Buffer.from([255,216,255,192,0,11,8,2,115,4,176,1,1,17,0,255,217]);
 assert.deepEqual(rasterInfo(jpeg),{type:'image/jpeg',width:1200,height:627});
});
test('social metadata validates paths, alt text, and actual dimensions',async()=>{
 const pkg=await loadPackage(root,slug);
 assert.deepEqual(await validateSocialImage(pkg),[]);
 for(const patch of [{path:'https://example.com/card.png'},{path:'assets/../secret.png'},{path:'assets/cover.svg'},{path:'assets/missing.png'},{width:1201},{height:0},{alt:''}]) {
  const changed={...pkg,meta:{...pkg.meta,socialImage:{...pkg.meta.socialImage,...patch}}};
  assert.ok((await validateSocialImage(changed)).length,JSON.stringify(patch));
 }
});
test('cards have absolute HTTPS metadata, matching Twitter image, and escaped alt text',async()=>{
 const pkg=await loadPackage(root,slug),c=await configAt(root);
 const image=socialImageFor(c,pkg);
 const tags=socialImageTags({...image,alt:'A "test" & description'});
 assert.equal(image.url,`https://jdavis-software.github.io/content/${imagePath}`);
 assert.match(tags,/property="og:image:type" content="image\/png"/);
 assert.match(tags,/property="og:image:width" content="1200"/);
 assert.match(tags,/property="og:image:height" content="627"/);
 assert.ok(tags.includes('name="twitter:image"'));
 assert.ok(tags.includes('A &quot;test&quot; &amp; description'));
 assert.equal(socialImageTags(null),'');
});
test('production advertises one raster card and preserves both interactive diagrams',async t=>{
 const dir=await fixture(t);await build(dir);
 const html=await readFile(path.join(dir,'dist/articles',slug,'index.html'),'utf8');
 assert.equal((html.match(/property="og:image"/g)||[]).length,1);
 assert.match(html,/name="twitter:card" content="summary_large_image"/);
 assert.ok(html.includes(`https://jdavis-software.github.io/content/${imagePath}`));
 assert.ok(!/<meta[^>]*content="[^"]*cover\.svg"/.test(html));
 assert.ok(html.includes('id="parallel-agent-flow"')&&html.includes('id="devops-invalidation"'));
 assert.ok(!html.includes('DriftGate'));
 assert.deepEqual(await readFile(path.join(dir,'dist',imagePath)),await readFile(path.join(root,imagePath)));
});
test('homepage thumbnail and social card use the same raster with matching dimensions',async t=>{
 const dir=await fixture(t);await build(dir);
 const html=await readFile(path.join(dir,'dist/index.html'),'utf8');
 assert.match(html,/src="\/content\/articles\/parallel-agent-engineering\/assets\/og-linkedin-v1.png"[^>]*width="1200" height="627"/);
 assert.ok(html.includes(`property="og:image" content="https://jdavis-software.github.io/content/${imagePath}"`));
 assert.ok(!html.includes('type="module"'));
});
test('a review-only package never leaks its raster social card into production',async t=>{
 const dir=await fixture(t),f=path.join(dir,'articles',slug,'metadata.json');
 const m=JSON.parse(await readFile(f,'utf8'));m.status='review';await writeFile(f,JSON.stringify(m));
 const manifest=await build(dir);
 assert.ok(!manifest.outputs.includes(imagePath));
 const html=await readFile(path.join(dir,'dist/index.html'),'utf8');
 assert.ok(!html.includes('og-linkedin-v1.png'));
 assert.ok(!html.includes('property="og:image"'));
});
