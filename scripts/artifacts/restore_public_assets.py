#!/usr/bin/env python3
"""Restore selected public handoff artifacts outside the repository, with integrity checks."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[2]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list', action='store_true', help='List assets without network calls.')
    parser.add_argument('--id', action='append', default=[], help='Exact asset ID; repeat to select more.')
    parser.add_argument('--output', type=Path, default=Path.home() / 'graceway-restored-assets')
    args = parser.parse_args()
    inventory = json.loads((ROOT / 'docs/artifacts/inventory.json').read_text())
    remote = {a['id']: a for a in inventory['externalAssets']}
    if args.list:
        for key, asset in sorted(remote.items()):
            print(key, asset.get('byteSize', 'unknown bytes'), asset['storagePath'])
        return
    if not args.id:
        parser.error('Select --id or use --list; no implicit bulk download.')
    if not shutil.which('curl'):
        parser.error('Install curl before downloading public artifacts.')
    output = args.output.expanduser().resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error('Choose an output directory outside the repository for large binaries.')
    unknown = set(args.id) - remote.keys()
    if unknown:
        parser.error('Unknown IDs: ' + ', '.join(sorted(unknown)))
    output.mkdir(parents=True, exist_ok=True)
    for key in dict.fromkeys(args.id):
        asset = remote[key]
        path = asset['storagePath']
        if not path.startswith('/manus-storage/') or '?' in path or '..' in path.split('/'):
            raise ValueError('Unsafe or non-immutable storage path: ' + key)
        url = urljoin(inventory['publicOrigin'], path)
        if urlparse(url).hostname != urlparse(inventory['publicOrigin']).hostname:
            raise ValueError('Unexpected asset host: ' + key)
        target = output / (key + '--' + Path(urlparse(url).path).name)
        temporary = target.with_suffix(target.suffix + '.partial')
        print('Downloading', key, flush=True)
        try:
            subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                            '--max-time', '180', '--proto', '=https', '--proto-redir', '=https',
                            '--output', str(temporary), url], check=True)
            data = temporary.read_bytes()
            if asset.get('byteSize') is not None and len(data) != asset['byteSize']:
                raise ValueError('Byte size mismatch: ' + key)
            digest = hashlib.sha256(data).hexdigest()
            if asset.get('sha256') and digest != asset['sha256']:
                raise ValueError('SHA256 mismatch: ' + key)
            temporary.replace(target)
            print('Restored', target, 'sha256=' + digest, flush=True)
        finally:
            temporary.unlink(missing_ok=True)
    print('No files extracted, no repository/DB changes, no deployment performed.')

if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
