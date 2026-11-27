#!/usr/bin/env python3
"""Copy templates from the Post-Meeting One-Pager design canvas into this folder and rebuild manifest.json.

    python3 onepager-templates/sync.py <folder with the canvas's project/ files>

The folder holds the canvas's *.dc.html files and canvas.json (the design artifact's project/ folder, downloaded).
What it does:
  - picks the templates (Recap*, Tpl-*, Main*); skips filled-in samples, live merchant pages and boards that only
    <dc-import> another board;
  - rewrites each /_blob/<id> image to its onepager-assets/ file using blobs.json, and stops if an image is new
    (download it into ../onepager-assets/dc/, add it to blobs.json, run again);
  - writes the files that changed and rebuilds manifest.json, which the One-Pager's Template dropdown and its
    "Update templates" button read. "<name>-Landscape" boards become the Landscape version of <name>.
"""
import datetime, hashlib, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
INCLUDE = re.compile(r'^(Recap(-[\w-]+)?|Tpl-[\w-]+|Main(-Landscape)?)$')
GROUPS = ['Meeting recap', 'One-sheeters', 'Topic pages', 'Draft orders']


def group_of(base):
    if base.startswith('Recap') or base == 'Tpl-PreCallAgenda':
        return 'Meeting recap'
    if 'OneSheet' in base or base == 'Tpl-ABResults':
        return 'One-sheeters'
    if base == 'Main':
        return 'Draft orders'
    return 'Topic pages'


def label_of(title, tid):
    t = re.sub(r'\s*\((landscape|horizontal)\)\s*$', '', title or tid).strip()
    m = re.match(r'^Master (V\d+) · Recap$', t)
    if m:
        return 'Meeting recap · Master ' + m.group(1)
    return re.sub(r'^Template · ', '', t)


def main(src):
    canvas = json.load(open(os.path.join(src, 'canvas.json')))
    boards, order = canvas.get('boards', {}), canvas.get('order', [])
    blobs = json.load(open(os.path.join(HERE, 'blobs.json')))
    old = {}
    if os.path.exists(os.path.join(HERE, 'manifest.json')):
        old = {t['id']: t for t in json.load(open(os.path.join(HERE, 'manifest.json'))).get('templates', [])}
    today = datetime.date.today().isoformat()

    files = [f for f in order if f.endswith('.dc.html')] + sorted(f for f in os.listdir(src) if f.endswith('.dc.html') and f not in order)
    picked, missing, skipped = [], {}, []
    for f in files:
        tid = f[:-len('.dc.html')]
        path = os.path.join(src, f)
        if not os.path.exists(path):
            continue
        text = open(path, encoding='utf-8').read()
        if not INCLUDE.match(tid) or '<dc-import' in text:
            skipped.append(tid)
            continue
        for b in re.findall(r'/_blob/([0-9a-f]{32})', text):
            if b not in blobs:
                missing.setdefault(b, []).append(tid)
        picked.append((tid, text))
    if missing:
        print('New images, not in blobs.json yet (download each into onepager-assets/dc/, add it to blobs.json, run again):')
        for b, ids in missing.items():
            print('  ', b, 'in', ', '.join(ids))
        sys.exit(1)

    ids = {tid for tid, _ in picked}
    out, changed = [], []
    for tid, text in picked:
        text = re.sub(r'/_blob/([0-9a-f]{32})', lambda m: blobs[m.group(1)], text)
        dest = os.path.join(HERE, tid + '.dc.html')
        if not os.path.exists(dest) or open(dest, encoding='utf-8').read() != text:
            open(dest, 'w', encoding='utf-8').write(text)
            changed.append(tid)
        b = boards.get(tid + '.dc.html', {})
        land = tid.endswith('-Landscape') and tid[:-len('-Landscape')] in ids
        base = tid[:-len('-Landscape')] if land else tid
        prev = old.get(tid, {})
        item = {
            'id': tid,
            'label': prev.get('label') or label_of(b.get('title'), tid),
            'group': prev.get('group') or group_of(base),
            'w': b.get('w', 816), 'h': b.get('h', 1056),
            'hash': hashlib.sha256(text.encode('utf-8')).hexdigest()[:12],
            'added': prev.get('added') or today,
        }
        if land:
            item['landscapeOf'] = base
        out.append(item)
    labels = {t['id']: t['label'] for t in out}
    for t in out:
        if t.get('landscapeOf'):
            t['label'] = labels[t['landscapeOf']] + ' · landscape'
    out.sort(key=lambda t: (GROUPS.index(t['group']) if t['group'] in GROUPS else 99, order.index(t['id'] + '.dc.html') if t['id'] + '.dc.html' in order else 999))
    manifest = {
        'source': canvas.get('title', 'Post-Meeting One-Pager'),
        'synced': datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat(),
        'groups': GROUPS,
        'templates': out,
    }
    json.dump(manifest, open(os.path.join(HERE, 'manifest.json'), 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    gone = sorted(set(old) - ids)
    print('Templates:', len(out), '| written:', ', '.join(changed) or 'none', '| no longer on the canvas:', ', '.join(gone) or 'none')
    print('Skipped (samples, merchant pages, imports):', ', '.join(skipped) or 'none')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
