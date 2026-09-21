"""Build the actual GHC/Wasm reactor and copy its source/runtime assets."""
from pathlib import Path
import json
import hashlib
import html
import re
import shutil
import subprocess

root = Path(__file__).resolve().parent.parent
toolchain = root / '.toolchain'
ghc = toolchain / 'ghc/bin/wasm32-wasi-ghc'
build = root / 'build/wasm'
build.mkdir(parents=True, exist_ok=True)
wasm = root / 'dist/crc.wasm'
exports = ['hs_init', 'malloc', 'free', 'crc_direct', 'crc_remainder',
           'crc_factor', 'crc_multiply', 'crc_combine', 'crc_finish']
command = [str(ghc), '-O2', '-Wall', '-ihaskell', 'haskell/Browser.hs',
           '-outputdir', str(build), '-no-hs-main', '-optl-mexec-model=reactor',
           '-optl-Wl,' + ','.join('--export=' + name for name in exports),
           '-o', str(wasm)]
subprocess.run(command, cwd=root, check=True)
runtime = root / 'dist/vendor/wasi'
shutil.copytree(root / 'node_modules/@bjorn3/browser_wasi_shim/dist', runtime,
                dirs_exist_ok=True, ignore=shutil.ignore_patterns('*.tsbuildinfo'))
for license_name in ['LICENSE-MIT', 'LICENSE-APACHE']:
    shutil.copyfile(root / 'node_modules/@bjorn3/browser_wasi_shim' / license_name,
                    runtime / license_name)
for path in (root / 'haskell').glob('*.hs'):
    shutil.copyfile(path, root / 'dist/source' / path.name)
# Keep the featured excerpt tied to the code that actually runs.
source = (root / 'haskell/CRC.hs').read_text()
excerpt = source[source.index('combine (Summary'):source.index('\nbyteStep ::')].strip()
page = root / 'dist/index.html'
page.write_text(re.sub(r'(<pre class="featured-code"><code>).*?(</code></pre>)',
    lambda match: match[1] + html.escape(excerpt) + match[2], page.read_text(), flags=re.S))
version = subprocess.check_output([str(ghc), '--numeric-version'], text=True).strip()
metadata = {'compiler': 'GHC ' + version, 'target': 'wasm32-wasi',
            'wasm_bytes': wasm.stat().st_size,
            'wasm_sha256': hashlib.file_digest(wasm.open('rb'), 'sha256').hexdigest(),
            'source_sha256': {p.name: hashlib.file_digest(p.open('rb'), 'sha256').hexdigest()
                              for p in (root / 'haskell').glob('*.hs')},
            'exports': exports}
(root / 'dist/build-info.json').write_text(json.dumps(metadata, indent=2) + '\n')
print(json.dumps(metadata, indent=2))
