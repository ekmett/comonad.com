"""Download verified, pinned GHC/WASI archives into a project-local directory."""
import base64
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent / '.toolchain'
root.mkdir(exist_ok=True)
manifest = json.loads((Path(__file__).parent / 'toolchain-lock.json').read_text())
for key, filename in [
    ('wasi-sdk-aarch64-darwin', 'wasi-sdk.tar.gz'),
    ('libffi-wasm', 'libffi.zip'),
    ('wasm32-wasi-ghc-gmp-aarch64-darwin-9.14', 'ghc.tar.xz'),
]:
    entry = manifest[key]
    dest = root / filename
    if not dest.exists():
        subprocess.run(['curl', '-LfsS', '--retry', '2', entry['url'], '-o', str(dest)], check=True)
    digest = base64.b64encode(hashlib.file_digest(dest.open('rb'), 'sha256').digest()).decode()
    if 'sha256-' + digest != entry['hash']:
        raise RuntimeError(f'Checksum mismatch: {filename}')
    print(f'Verified {filename}: {dest.stat().st_size // 1024 // 1024} MiB', flush=True)
