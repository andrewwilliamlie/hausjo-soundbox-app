"""Builds public/wilayah/*.json from cahyadsn/wilayah (Kepmendagri 2025, MIT) and cahyadsn/wilayah_kodepos (MIT).

Usage: python3 scripts/build-wilayah.py <path-to/wilayah.sql> <path-to/wilayah_kodepos.min.json> public/wilayah
Output:
  index.json            [[provCode, provName, [[cityCode, cityName], ...]], ...]
  <cityCode>.json       [[districtCode, districtName, [[villageCode, villageName, postalCode], ...]], ...]
Codes are the dotted Kemendagri codes (e.g. 32.73.01.1001).
"""
import json, os, re, sys

sql, kodepos_path, out = sys.argv[1:4]
rows = re.findall(r"\('([0-9.]+)','((?:[^'\\]|\\.|'')*)'\)", open(sql, encoding='utf-8').read())
names = {}
for code, name in rows:
    names[code] = name.replace("''", "'").replace("\\'", "'").strip()
kodepos = json.load(open(kodepos_path, encoding='utf-8'))

def kids(code, depth):
    return sorted(c for c in names if c.startswith(code + '.') and c.count('.') == depth)

os.makedirs(out, exist_ok=True)
by_depth = {}
for c in names:
    by_depth.setdefault(c.count('.'), []).append(c)
children = {}
for c in names:
    if '.' in c:
        children.setdefault(c.rsplit('.', 1)[0], []).append(c)
for v in children.values():
    v.sort()

index = []
for p in sorted(by_depth[0]):
    cities = children.get(p, [])
    index.append([p, names[p], [[c, names[c]] for c in cities]])
    for c in cities:
        data = []
        for d in children.get(c, []):
            data.append([d, names[d], [[v, names[v], kodepos.get(v, '')] for v in children.get(d, [])]])
        with open(os.path.join(out, c + '.json'), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
with open(os.path.join(out, 'index.json'), 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, separators=(',', ':'))
print('provinces', len(by_depth[0]), 'cities', len(by_depth[1]), 'districts', len(by_depth[2]), 'villages', len(by_depth[3]),
      'with postal', sum(1 for v in by_depth[3] if kodepos.get(v)))
