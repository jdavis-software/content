"""Verify public delivery, not LinkedIn's proprietary preview cache."""
import argparse
import hashlib
import json
from html.parser import HTMLParser
from pathlib import Path
import time
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SLUG = 'parallel-agent-engineering'

class HeadParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}
        self.canonical = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta':
            name = attrs.get('property') or attrs.get('name')
            if name:
                self.meta.setdefault(name, []).append(attrs.get('content'))
        elif tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')

def fetch(url, user_agent):
    with urlopen(Request(url, headers={'User-Agent': user_agent}), timeout=15) as response:
        assert response.status == 200, f'HTTP {response.status}'
        assert response.geturl() == url, 'Unexpected redirect'
        return response.headers.get_content_type(), response.read()

def verify(base):
    config = json.loads((ROOT / 'studio.config.json').read_text())
    package = ROOT / 'articles' / SLUG
    meta = json.loads((package / 'metadata.json').read_text())
    image = meta['socialImage']
    canonical = f"{config['origin']}{config['basePath']}/articles/{SLUG}/"
    route = f'{base}/articles/{SLUG}/'
    image_url = canonical + image['path']
    for agent in ['ContentStudio-ReleaseVerifier/1.0', 'LinkedInBot/1.0']:
        content_type, html = fetch(route, agent)
        assert content_type == 'text/html', 'Wrong HTML MIME type'
        text = html.decode('utf-8')
        parser = HeadParser()
        parser.feed(text.split('</head>')[0])
        assert parser.canonical == canonical, 'Canonical URL changed'
        expected = {
            'og:image': image_url, 'og:image:secure_url': image_url,
            'og:image:type': image['type'], 'og:image:width': str(image['width']),
            'og:image:height': str(image['height']), 'og:image:alt': image['alt'],
            'twitter:image': image_url, 'twitter:image:alt': image['alt'],
            'twitter:card': 'summary_large_image', 'og:title': meta['title'],
        }
        for name, value in expected.items():
            assert parser.meta.get(name) == [value], f'Missing, stale, or duplicate metadata: {name}'
        assert 'id="parallel-agent-flow"' in text
        assert 'id="devops-invalidation"' in text
        assert 'DriftGate' not in text
        image_type, data = fetch(route + image['path'], agent)
        assert image_type == image['type'], 'Wrong image MIME type'
        assert hashlib.sha256(data).digest() == hashlib.sha256((package / image['path']).read_bytes()).digest(), 'Stale image bytes'
        print(f'VERIFIED {agent}: article head + exact PNG ({len(data)} bytes)')
    print('Public delivery verified. LinkedIn Post Inspector/composer acceptance is a separate check.')

if __name__ == '__main__':
    c = json.loads((ROOT / 'studio.config.json').read_text())
    args = argparse.ArgumentParser()
    args.add_argument('--base-url', default=c['origin'] + c['basePath'])
    args.add_argument('--attempts', type=int, default=6)
    options = args.parse_args()
    if not 1 <= options.attempts <= 6:
        raise SystemExit('attempts must be between 1 and 6')
    for attempt in range(options.attempts):
        try:
            verify(options.base_url.rstrip('/'))
            break
        except Exception as error:
            if attempt + 1 == options.attempts:
                raise
            print(f'Waiting for Pages propagation: {error}', flush=True)
            time.sleep(5)
