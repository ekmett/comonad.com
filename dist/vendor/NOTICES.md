# Third-party runtime notices

The Haskell CRC code is adapted from Edward Kmett's own 2013 article, preserved
with attribution in source/original/. The article and historical source remain
Edward Kmett's work; no new license is asserted for that material.

The WebAssembly executable includes components of GHC and its runtime. See
GHC-LICENSE and https://www.haskell.org/ghc/license.html. Compiler/toolchain
versions and upstream download hashes are recorded in tools/toolchain-lock.json
in the source repository. The toolchain is not distributed with this website.

The browser WASI shim is @bjorn3/browser_wasi_shim 0.4.2, used under its MIT or
Apache-2.0 license. Both license texts are included in wasi/. Its source is
https://github.com/bjorn3/browser_wasi_shim.

The WASI toolchain uses wasi-libc (https://github.com/WebAssembly/wasi-libc),
including musl and compiler runtime components. Refer to upstream LICENSE and
per-file notices. This pilot is a local preview; distribution license aggregation
for statically linked toolchain libraries should be completed before publication.
