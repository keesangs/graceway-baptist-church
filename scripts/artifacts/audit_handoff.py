#!/usr/bin/env python3
"""Offline handoff integrity checks. Never reads credential files or connects to providers."""
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
DOCS = ['CLAUDE.md', 'README.md', 'docs/PROJECT_CONTEXT.md',
        'docs/operations/development-and-restoration.md', 'docs/operations/environment-variables.md',
        'docs/operations/discord-tts.md', 'docs/artifacts/README.md',
        'docs/archives/user-provided/README.md', '.claude/skills/graceway-maintenance/SKILL.md']

def main():
    failures = []
    for name in DOCS:
        file = ROOT / name
        if not file.is_file():
            failures.append('Missing document: ' + name)
            continue
        text = file.read_text()
        if not text.endswith('\n'):
            failures.append('Missing final newline: ' + name)
        for link in re.findall(r'(?<!!)\[[^\]]+\]\(([^)]+)\)', text):
            target = unquote(link.split('#')[0])
            if not target or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                continue
            if not (file.parent / target).resolve().exists():
                failures.append('Broken link in ' + name + ': ' + target)
    manifest = json.loads((ROOT / 'docs/artifacts/inventory.json').read_text())
    ids = [x['id'] for x in manifest['externalAssets']]
    if len(set(ids)) != len(ids):
        failures.append('Duplicate external asset IDs')
    for item in manifest['committedArtifacts']:
        path = ROOT / item['path']
        if not path.is_file():
            failures.append('Missing committed artifact: ' + item['path'])
            continue
        data = path.read_bytes()
        if len(data) != item['byteSize'] or hashlib.sha256(data).hexdigest() != item['sha256']:
            failures.append('Artifact integrity mismatch: ' + item['path'])
    files = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    for name in filter(None, files):
        path = Path(name)
        if (path.name.startswith('.env') or path.suffix in {'.eml', '.pem', '.key', '.dump', '.zip'}
                or path.parts[0] in {'.manus', '.manus-logs', 'node_modules', 'backups', 'dist', '.local-data'}):
            failures.append('Forbidden tracked runtime/private file: ' + name)
    skill = (ROOT / '.claude/skills/graceway-maintenance/SKILL.md').read_text()
    if not skill.startswith('---\nname: graceway-maintenance\n') or '[TODO:' in skill:
        failures.append('Incomplete project skill')
    if failures:
        print('\n'.join(failures))
        raise SystemExit(1)
    print('Handoff documents/links OK; artifacts verified:', len(manifest['committedArtifacts']),
          '; external references:', len(ids), '; forbidden tracked files: 0.')
    print('This integrity check supplements, not replaces, a dedicated secret scanner.')

if __name__ == '__main__':
    main()
