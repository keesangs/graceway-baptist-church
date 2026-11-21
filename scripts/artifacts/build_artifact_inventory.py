#!/usr/bin/env python3
"""Update the repository's safe artifact inventory without reading secrets or private records."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/artifacts/inventory.json'

def main():
    archive = json.loads((ROOT / 'docs/artifacts/branding-source-archive.json').read_text())
    references = {}
    for directory in ['client/src', 'server', 'shared', 'docs']:
        for path in (ROOT / directory).rglob('*'):
            if (not path.is_file() or path.suffix not in {'.ts', '.tsx', '.md', '.json'}
                    or path.name == 'inventory.json' or 'archives' in path.parts):
                continue
            for storage in re.findall(r'/manus-storage/[A-Za-z0-9][A-Za-z0-9_./%+\-]*', path.read_text()):
                if not re.search(r'\.(?:png|jpe?g|webp|svg|gif|mp4|pdf|zip)$', storage, re.I):
                    continue
                references.setdefault(storage, set()).add(path.relative_to(ROOT).as_posix())
    known = {}
    for name in ['docs/brand-assets-manifest.json', 'docs/navbar-logo-asset-manifest.json']:
        values = json.loads((ROOT / name).read_text())
        def visit(value):
            if isinstance(value, dict):
                if value.get('storagePath'):
                    known[value['storagePath']] = value
                for child in value.values(): visit(child)
            elif isinstance(value, list):
                for child in value: visit(child)
        visit(values)
    external = [{'id': 'branding-source-archive', 'storagePath': archive['storagePath'],
                 'byteSize': archive['byteSize'], 'sha256': archive['sha256'],
                 'purpose': '14 original branding/export iteration files; CONTENTS.json verifies each file.',
                 'referencedBy': ['docs/artifacts/branding-source-archive.json']}]
    for storage, users in sorted(references.items()):
        if storage == archive['storagePath']:
            continue
        item = {'id': 'public-' + hashlib.sha256(storage.encode()).hexdigest()[:12],
                'storagePath': storage, 'referencedBy': sorted(users)}
        for field in ['byteSize', 'sha256', 'mediaType']:
            if field in known.get(storage, {}): item[field] = known[storage][field]
        external.append(item)
    artifacts = []
    roots = ['docs/benchmarks', 'docs/artifacts/newsletter-icons', 'docs/archives/user-provided',
             'docs/branding/logos', 'scripts/artifacts', '.claude/skills/graceway-maintenance']
    candidates = set()
    for name in roots:
        candidates.update(p for p in (ROOT / name).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    candidates.add(ROOT / 'docs/artifacts/branding-source-archive.json')
    for path in sorted(candidates):
        data = path.read_bytes()
        artifacts.append({'path': path.relative_to(ROOT).as_posix(), 'byteSize': len(data),
                          'sha256': hashlib.sha256(data).hexdigest()})
    docs = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'docs').rglob('*.md'))
    payload = {
        'manifestVersion': 1, 'recordedAt': '2026-11-21',
        'publicOrigin': 'https://graceway-baptist.org',
        'scope': 'Available reviewed project-owned artifacts and static public references; not private data or a platform export.',
        'codeBaseline': 'b10db9c7; GitHub main already matched before this handoff commit.',
        'committedArtifacts': artifacts, 'projectDocuments': ['CLAUDE.md', 'README.md', 'todo.md'] + docs,
        'externalAssets': external,
        'excluded': [
            {'category': 'Credentials and sessions', 'reason': 'Environment values, API keys, OAuth/Discord/session/webhook tokens, browser profile and shell history are not public repository artifacts.'},
            {'category': 'Private application and mailbox data', 'reason': 'DB dumps, member QT notes, contact/subscriber records, raw sermon transcripts, OAuth state and supplied .eml files require separate private retention.'},
            {'category': 'Raw screenshots and tool/browser captures', 'reason': 'Generic/timestamped pasted images and raw page/console/terminal captures may expose credentials or personal data; useful decisions and verification are summarized in project docs.'},
            {'category': 'Platform internals', 'reason': 'Platform-provided system instructions, internal skill library and private tool/session metadata are excluded; the repository includes an original project-specific maintenance skill.'},
            {'category': 'Reinstallable runtime/cache/build files', 'reason': 'node_modules, dist, virtual environments, model weights, caches and logs are not source artifacts. Qwen benchmark script/results are retained instead.'},
            {'category': 'Large branding binaries in Git', 'reason': 'Preserve prior ignore policy; 14 available originals/iterations are saved in the externally referenced integrity-checked source ZIP.'},
            {'category': 'External provider state', 'reason': 'DNS/MX, Workspace, Resend domain/webhook, Photos OAuth, scheduler identity and live Discord state require the restoration runbook, not a Git clone.'},
        ],
        'availabilityNote': 'Static storage references are not guarantees of current availability. Dynamic uploaded DB/media keys are not exported. The branding ZIP and selected newsletter images are verified separately during this handoff.'
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n')
    print('Updated inventory:', len(artifacts), 'committed artifacts;', len(external), 'external references;', len(docs), 'docs.')

if __name__ == '__main__':
    main()
