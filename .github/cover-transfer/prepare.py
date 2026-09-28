"""One-time packaging of the approved colorful cover; removed before release."""
import hashlib
import io
import json
from pathlib import Path
from PIL import Image

root = Path('.')
article = root / 'articles/loops-inside-graphs'
expected = {
    'articles/loops-inside-graphs/metadata.json': '294562b8cf11a6d7587e046a4e42ba7b9c75edda34c24b0ddcaa0ab22740baca',
    'articles/loops-inside-graphs/assets/provenance.json': '5fcd8abfab3cf1dc6f255157201e6eb5d0c1848a117410b756077938d244a8e0',
    'tests/loop-graph.test.mjs': '1058078ebcec5c2c3f3a7344e76671aad7797a49e694ad3dc67549e437ea0789',
    'articles/loops-inside-graphs/article.md': 'b55492ec3b8bda203fb00fb2ec38edf33caa82c104f7fec231a99c9b00d6062f',
    'articles/loops-inside-graphs/linkedin.md': 'b99fc0eb9ef6e542e51bc7ce39528aecf81d92cd8157996613c6349f1a943193',
    'site/loop-graph-model.js': '596bb16aa7d066fb45e031a4be42aef2dd0b6c2bf55d673e1c5c9e42a8355008',
    'site/loop-graph-explorer.js': '58329c7c8889a9e74facb5bc011d532df5c50d9bcefaa3350283f87daedc4632',
    'site/loop-graph-explorer.css': 'd0941b8a9faa62ccfbd4594064ae60ac4b0a5bb255731253e0483b15f2b483e4',
    'lib/loop-graph-explorer.mjs': '5c17a637c6d74b376f1dd90837d3f75ae7055dc2325f10924c19a0cce7aca6bb',
}
for name, digest in expected.items():
    assert hashlib.sha256(Path(name).read_bytes()).hexdigest() == digest, 'Base changed: ' + name

transfer = b''.join((root / f'.github/cover-transfer/{i:02d}.bin').read_bytes() for i in range(8))
transfer_digest = 'ca0a14962569d9368a99eae7770eede6aad1bb2f1d9ff2a4c5c78d24394ebe86'
assert len(transfer) == 59675
assert hashlib.sha256(transfer).hexdigest() == transfer_digest
image = Image.open(io.BytesIO(transfer))
assert image.format == 'AVIF' and image.size == (1672, 941)
output = article / 'assets/og-loops-graphs-v2.png'
assert not output.exists()
image.convert('RGB').save(output, format='PNG', compress_level=9)
with Image.open(output) as check:
    assert check.format == 'PNG' and check.size == (1672, 941)
    check.load()
image_digest = hashlib.sha256(output.read_bytes()).hexdigest()

metadata_path = article / 'metadata.json'
metadata = json.loads(metadata_path.read_text())
alt = 'Loops Inside Graphs: cyan client and purple API repair loops share an accepted contract, converge at a green compatibility join, and pass to orange integration and separate review.'
metadata.update(coverImage='assets/og-loops-graphs-v2.png', coverAlt=alt, coverWidth=1672, coverHeight=941)
metadata['socialImage'] = dict(path='assets/og-loops-graphs-v2.png', width=1672, height=941, alt=alt)
metadata_path.write_text(json.dumps(metadata, indent=2) + '\n')

provenance_path = article / 'assets/provenance.json'
provenance = json.loads(provenance_path.read_text())
provenance.setdefault('previousCovers', []).append(provenance['cover'])
provenance['cover'] = {
    'method': 'User-approved host-generated artwork, optimized through an AVIF transfer and decoded to a self-hosted PNG. Full composition and original dimensions retained; no cropping or regeneration. Re-encoding is lossy, not byte-identical to the original PNG.',
    'file': 'og-loops-graphs-v2.png',
    'generationId': '2c6b0e58-9541-43a8-b2da-6d422c4bb94d',
    'dimensions': [1672, 941],
    'originalSha256': '683a1e78e9a89e6d7cbac239210009637250dd1e27acc73bd704d53aa64bb248',
    'transferSha256': transfer_digest,
    'sha256': image_digest,
    'note': 'Illustrative artwork, not runtime evidence; the decorative avatar is not a verified portrait. Article copy and interactive implementation are unchanged.'
}
provenance_path.write_text(json.dumps(provenance, indent=2) + '\n')

tests_path = root / 'tests/loop-graph.test.mjs'
tests = tests_path.read_text()
assert tests.count("width:1200,height:627") == 1
assert tests.count('og:image:width" content="1200"') == 1
tests = "import {createHash} from 'node:crypto';\n" + tests.replace('width:1200,height:627', 'width:1672,height:941').replace('og:image:width" content="1200"', 'og:image:width" content="1672"')
tests += '''
test('colorful cover metadata and published PNG match the approved transfer provenance',async()=>{
 const p=await loadPackage(root,slug),image=p.meta.socialImage;
 assert.equal(image.path,'assets/og-loops-graphs-v2.png');
 assert.equal(p.meta.coverImage,image.path);
 assert.equal(p.meta.coverWidth,image.width);assert.equal(p.meta.coverHeight,image.height);
 const bytes=await readFile(path.join(p.dir,image.path));
 const provenance=JSON.parse(await readFile(path.join(p.dir,'assets/provenance.json'),'utf8'));
 const digest=createHash('sha256').update(bytes).digest('hex');
 assert.equal(digest,'IMAGE_DIGEST');assert.equal(provenance.cover.sha256,digest);
 assert.equal(provenance.cover.transferSha256,'TRANSFER_DIGEST');
 assert.deepEqual(provenance.cover.dimensions,[1672,941]);
 assert.equal(provenance.previousCovers[0].file,'og-loops-graphs-v1.png');
});
'''.replace('IMAGE_DIGEST', image_digest).replace('TRANSFER_DIGEST', transfer_digest)
tests_path.write_text(tests)
for name, digest in expected.items():
    if name not in ['articles/loops-inside-graphs/metadata.json', 'articles/loops-inside-graphs/assets/provenance.json', 'tests/loop-graph.test.mjs']:
        assert hashlib.sha256(Path(name).read_bytes()).hexdigest() == digest
print('APPROVED COVER:', output, image_digest, output.stat().st_size, 'bytes; 1672x941')
print('Article text, LinkedIn text, and interactive diagram files unchanged.')
