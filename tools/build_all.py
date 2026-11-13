"""Stamp asset versions and generate the English pages in /en/ from the Bangla pages at the root.
Run after any change:  python3 tools/build_all.py"""
import glob, hashlib, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
h = hashlib.sha1()
for f in sorted(glob.glob('assets/**/*.*', recursive=True)):
    if f.endswith(('.js', '.css', '.json', '.svg')): h.update(open(f, 'rb').read())
ver = h.hexdigest()[:8]
pages = sorted(p for p in glob.glob('*.html') if not p.startswith('_'))
os.makedirs('en', exist_ok=True)
for p in pages:
    s = open(p, encoding='utf8').read()
    s = re.sub(r'((?:href|src)="assets/[^"?]+\.(?:css|js))(?:\?v=[\w]+)?"', r'\1?v=' + ver + '"', s)
    open(p, 'w', encoding='utf8').write(s)
    e = s.replace('<html lang="bn">', '<html lang="en">', 1)
    e = re.sub(r'((?:href|src)=")assets/', r'\1../assets/', e)
    for a, b in [('data/guides.js', 'data/guides.en.js'), ('data/atlas.js', 'data/atlas.en.js'), ('data/hotels.js', 'data/hotels.en.js')]:
        e = e.replace(a + '?', b + '?')
    open(os.path.join('en', p), 'w', encoding='utf8').write(e)
for old in glob.glob('en/*.html'):
    if os.path.basename(old) not in pages: os.remove(old)
print('version', ver, '·', len(pages), 'pages, English copies in en/')
