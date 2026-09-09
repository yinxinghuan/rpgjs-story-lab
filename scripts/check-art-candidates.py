#!/usr/bin/env python3
"""Read-only checks against an exported runtime art contract. Requires Pillow.

Exit 0 means mechanical checks passed, never visual approval. Candidate files
are not copied into runtime. Use --candidate ID=PATH to test a replacement.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image


def inspect(manifest, root, replacements):
    known = {a['id'] for a in manifest['assets']}
    unknown = set(replacements) - known
    if unknown:
        raise ValueError('Unknown asset IDs: ' + ', '.join(sorted(unknown)))
    results = []
    for asset in manifest['assets']:
        ident = asset['id']
        if replacements and ident not in replacements:
            continue
        candidate = ident in replacements
        path = Path(replacements[ident]) if candidate else root / asset['path']
        row = dict(id=ident, path=str(path), candidate=candidate, errors=[], frames=[])
        errors = row['errors']
        try:
            row['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
            if not candidate and row['sha256'] != asset['sha256']:
                errors.append('runtime-hash-drift: export the actual inventory again')
            with Image.open(path) as source:
                row.update(size=list(source.size), mode=source.mode)
                expected = (asset.get('imageWidth'), asset.get('imageHeight'))
                if all(expected) and source.size != expected:
                    errors.append(f'dimensions: expected {expected}, got {source.size}')
                has_alpha = 'A' in source.getbands() or 'transparency' in source.info
                alpha = source.convert('RGBA').getchannel('A') if has_alpha else None
                row['alpha'] = list(alpha.getextrema()) if alpha else None
                if asset.get('requiresAlpha') and (alpha is None or alpha.getextrema()[0] != 0 or alpha.getextrema()[1] == 0):
                    errors.append('transparency: need real transparent pixels and a visible subject')
                actor = manifest.get('actors', {}).get(ident)
                for i, c in enumerate(asset.get('crops', [])):
                    x, y, w, h = [c[k] for k in ('x', 'y', 'w', 'h')]
                    if min(x, y) < 0 or min(w, h) <= 0 or x+w > source.width or y+h > source.height:
                        errors.append(f'crop-{i}: outside actual image')
                        continue
                    if alpha is None or not asset.get('requiresAlpha'):
                        continue
                    cell = alpha.crop((x, y, x+w, y+h))
                    bbox = cell.point(lambda v: 255 if v > 200 else 0).getbbox()
                    row['frames'].append(dict(index=i, opaqueBounds=bbox))
                    if bbox is None:
                        errors.append(f'crop-{i}: empty visible subject')
                    elif actor:
                        r, col = divmod(i, actor['columns'])
                        if abs(bbox[3] - actor['baselines'][r][col]) > 2:
                            errors.append(f'frame-{i}: feet differ from approved baseline by more than 2 source pixels')
                        if bbox[0] <= 0 or bbox[1] <= 0 or bbox[2] >= w or bbox[3] >= h:
                            errors.append(f'frame-{i}: subject touches cell boundary')
        except (OSError, ValueError) as exc:
            errors.append(str(exc))
        row['mechanicalPass'] = not errors
        row['status'] = 'needs-visual-review' if not errors else 'rejected'
        results.append(row)
    return dict(version=1, direction=manifest['artDirection'], mechanicalPass=all(r['mechanicalPass'] for r in results), visualApproval=False, results=results)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--root', type=Path, default=Path('.'))
    parser.add_argument('--candidate', action='append', default=[], metavar='ID=PATH')
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    replacements = {}
    for item in args.candidate:
        ident, sep, path = item.partition('=')
        if not sep or not path or ident in replacements:
            parser.error('Use each --candidate ID=PATH once')
        replacements[ident] = path
    try:
        report = inspect(json.loads(args.manifest.read_text()), args.root, replacements)
    except (OSError, ValueError, KeyError) as exc:
        parser.error(str(exc))
    output = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.write_text(output)
    print(output)
    raise SystemExit(0 if report['mechanicalPass'] else 1)


if __name__ == '__main__':
    main()
