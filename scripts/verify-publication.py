"""Read-only verification of published article HTML and exact raster/static assets."""
import hashlib
import json
from pathlib import Path
import struct
import time
import urllib.request
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'studio.config.json').read_text())
BASE = CONFIG['origin'].rstrip('/') + CONFIG['basePath'] + '/'

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = {}
        self.canonical = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            key = attrs.get('property', attrs.get('name'))
            if key:
                self.tags.setdefault(key, []).append(attrs.get('content'))
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')

def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'ContentStudio-Publication-Verification/1.0'})
    with urllib.request.urlopen(request, timeout=20) as response:
        assert response.status == 200, (url, response.status)
        return response.read(), response.headers.get_content_type()

def verify():
    articles = []
    for file in (ROOT / 'articles').glob('*/metadata.json'):
        meta = json.loads(file.read_text())
        if meta['status'] == 'published' and meta['publicSafe']:
            articles.append((file.parent, meta))
    articles.sort(key=lambda item: (item[1]['createdAt'], item[1].get('seriesOrder', 0)), reverse=True)
    assert articles, 'No release-selected article'
    for directory, meta in articles:
        url = BASE + 'articles/' + meta['slug'] + '/'
        body, content_type = fetch(url)
        assert content_type == 'text/html'
        parser = Metadata(); parser.feed(body.decode('utf-8'))
        assert parser.canonical == url, 'Incorrect canonical URL'
        assert parser.tags.get('og:title') == [meta['title']], 'Incorrect title'
        assert parser.tags.get('og:description') == [meta['description']], 'Incorrect description'
        image = meta.get('socialImage')
        if image:
            image_url = url + image['path']
            for key in ['og:image', 'og:image:secure_url', 'twitter:image']:
                assert parser.tags.get(key) == [image_url], 'Incorrect social image: ' + key
            assert parser.tags.get('og:image:width') == [str(image['width'])]
            assert parser.tags.get('og:image:height') == [str(image['height'])]
            image_bytes, mime = fetch(image_url)
            assert mime == 'image/png'
            assert image_bytes[:8] == b'\x89PNG\r\n\x1a\n'
            assert struct.unpack('>II', image_bytes[16:24]) == (image['width'], image['height'])
            assert hashlib.sha256(image_bytes).digest() == hashlib.sha256((directory / image['path']).read_bytes()).digest(), 'Stale social image'
        if meta['slug'] in ['parallel-agent-engineering','keeping-parallel-development-fast']:
            assert b'id="devops-invalidation"' in body
        if meta['slug'] == 'better-context-for-ai-agents':
            assert b'id="context-packet-explorer"' in body
            assert b'Declared requirements satisfied' in body
            assert b'fictional' in body
            assert b'id="devops-invalidation"' not in body
        if meta['slug'] == 'parallel-agent-engineering':
            assert b'id="parallel-agent-flow"' in body
        if meta['slug'] == 'keeping-parallel-development-fast':
            assert b'id="docker-has-two-different-cache-mechanisms"' in body
            assert b'id="parallel-agent-flow"' not in body
        print('VERIFIED article, canonical metadata, raster dimensions and exact bytes:', url)
    home, _ = fetch(BASE)
    home_meta = Metadata(); home_meta.feed(home.decode('utf-8'))
    featured = articles[0][1]
    assert home_meta.tags.get('og:image') == [BASE + 'articles/' + featured['slug'] + '/' + featured['socialImage']['path']]
    for directory, meta in articles:
        assert ('/articles/' + meta['slug'] + '/').encode() in home
    for feed in ['rss.xml', 'sitemap.xml']:
        body, _ = fetch(BASE + feed)
        for directory, meta in articles:
            assert ('/articles/' + meta['slug'] + '/').encode() in body
    for relative in ['context-model.js','context-explorer.js','context-explorer.css','style.css','client.js','devops-flow.js','devops-model.js','devops-flow.css','agent-flow.js','agent-flow-model.js','agent-flow.css','vendor/anime-4.5.0.esm.min.js']:
        data, _ = fetch(BASE + relative)
        assert hashlib.sha256(data).digest() == hashlib.sha256((ROOT / 'site' / relative).read_bytes()).digest(), 'Stale browser asset: ' + relative
    print('VERIFIED homepage, both feeds, and exact browser assets. LinkedIn crawler not invoked.')

if __name__ == '__main__':
    for attempt in range(10):
        try:
            verify()
            break
        except Exception as error:
            if attempt == 9:
                raise
            print('Waiting for public propagation:', type(error).__name__, str(error))
            time.sleep(5)
