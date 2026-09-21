# Comonad.Reader — CRC pilot

A self-contained static article with actual GHC-compiled WebAssembly. No editor,
compiler download, remote computation, or server emulation in the reader's browser.

## Preview

The built site is checked in. Python 3 alone is enough to serve it:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173/. The local server only serves files. CRC arithmetic is
implemented in Haskell, including the direct reference, polynomial multiplication,
chunk summaries, composition, and finalization. JavaScript handles input, display,
and caching of the composition tree. It does not contain a fallback CRC algorithm.

## Build browser example

```sh
python3 tools/setup-wasm.py
npm ci
npm run build
npm test
```

The provided bootstrap targets Apple Silicon macOS and installs entirely into
ignored `.toolchain/`. Official GHC/WASI archives are pinned by URL and SHA-256
in `tools/toolchain-lock.json`. GHC version: 9.14.1.20260731, target wasm32-wasi.
It relocates the unpacked bindist in place to avoid duplicate installation space.
It does not change your normal GHC. Allow roughly 3 GB during setup.

Other build hosts can use ghc-wasm-meta with equivalent reactor flags recorded in
`tools/build.py`; the pilot bootstrap is intentionally limited to the verified host.
The static output is suitable for GitHub Pages. No publishing or DNS change has
been performed. Astro integration is deferred until this example is reviewed;
the pilot uses plain static HTML/CSS/modules to isolate the Haskell/Wasm work.

## Build the native HTTP companion

```sh
cabal run crc-server
```

Then open http://127.0.0.1:8081/ or query
http://127.0.0.1:8081/crc?message=123456789&split=4.
The server binds loopback only, accepts GET requests, limits messages to 4096
bytes, and uses exactly the same `CRC.hs`. It is a new WAI/Warp example, not an
original Yesod example. Dependencies are locked in `cabal.project.freeze`.

## Historical source

`dist/source/original/parallel-crc.md` is the unchanged School of Haskell article.
Its five active Haskell blocks are preserved separately. `provenance.json`
records the URL, original date, revision URL, retrieval date, and article hash.
The originals used console output, not Yesod. They are archival source and are
not represented as compiling with modern dependencies. The first original
example uses `12345689` (missing 7); that source is deliberately unchanged.

## Validation

- `npm test`: 409 checks against 24 Python-zlib vectors, exercising real Wasm
  through the same browser WASI shim. Includes all byte values, empty inputs,
  non-ASCII UTF-8, split boundaries, associativity, identities, and cached updates.
- `python3 tools/make-vectors.py` regenerates the independent fixtures.
- With the native server running, `python3 tests/server.py` checks its HTTP API.
- Manual in-session browser checks cover controls, Unicode, empty inputs, source
  tabs, cached edits, and desktop/mobile layout. See `docs/verification.md`.

## Scope

This is a two-experiment pilot, not a complete migration of the article or blog.
It demonstrates composability and incremental updates, not multicore execution
or native performance. The tree separately recomputes a direct CRC to verify the
cached result after each edit. Source excerpts are copied from the built modules.
The diagram is a functional composition tree; the future Quiver/TikZ authoring
pipeline has not yet been added.
