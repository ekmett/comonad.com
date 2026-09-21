"""Project-local Apple Silicon toolchain. Uses official, checksum-pinned bindists.

Run this once, then npm ci && npm run build. No global GHC configuration changes.
"""
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent.parent
toolchain = root / '.toolchain'
if (platform.system(), platform.machine()) != ('Darwin', 'arm64'):
    raise SystemExit('This pilot bootstrap targets Apple Silicon macOS. See README for other hosts.')
compiler = toolchain / 'ghc/bin/wasm32-wasi-ghc'
if compiler.exists() and (toolchain / 'ready').exists():
    subprocess.run([str(compiler), '--version'], check=True)
    raise SystemExit(0)
subprocess.run([sys.executable, str(root / 'tools/fetch-toolchain.py')], check=True)
for archive, folder, flags in [('wasi-sdk.tar.gz', 'wasi-sdk', 'xzf'), ('ghc.tar.xz', 'ghc', 'xJf')]:
    dest = toolchain / folder
    dest.mkdir(exist_ok=True)
    subprocess.run(['tar', flags, str(toolchain / archive), '-C', str(dest),
                    '--strip-components=1', '--exclude=*.p_hi', '--exclude=*_p.a',
                    '--exclude=*_p.thr.a', '--exclude=*.prof*', '--exclude=*/doc/*'], check=True)
subprocess.run(['unzip', '-qo', str(toolchain / 'libffi.zip'), '-d', str(toolchain / 'ffi')], check=True)
for name in ['include', 'lib']:
    shutil.copytree(toolchain / 'ffi/out/libffi-wasm' / name,
                    toolchain / 'wasi-sdk/share/wasi-sysroot' / name / 'wasm32-wasi',
                    dirs_exist_ok=True)
# The bindist runs in place; relocate its build-machine SDK paths rather than
# duplicating a multi-gigabyte installation. Package paths use ${pkgroot} already.
paths = [toolchain / 'ghc/lib/settings', *list((toolchain / 'ghc/lib/package.conf.d').glob('*.conf'))]
for path in paths:
    source = path.read_text()
    relocated = re.sub(r'/(?:private/)?tmp/ghc-wasm-ci-[^/]+/\.ghc-wasm', str(toolchain), source)
    if source != relocated:
        path.write_text(relocated)
subprocess.run([str(toolchain / 'ghc/bin/wasm32-wasi-ghc-pkg'), 'recache'], check=True)
subprocess.run([str(compiler), '--version'], check=True)
(toolchain / 'ready').write_text('Toolchain archives verified against tools/toolchain-lock.json.\n')
# These are only the downloaded, verified archives created by this script.
for name in ['ghc.tar.xz', 'wasi-sdk.tar.gz', 'libffi.zip']:
    (toolchain / name).unlink()
