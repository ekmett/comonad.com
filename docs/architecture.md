# CRC pilot architecture

- `haskell/CRC.hs`: pure CRC-32/ISO-HDLC arithmetic. Reflected polynomial
  representation, with one represented by 0x80000000. A summary contains the
  zero-initialized remainder and x^(8*byte_length). Semigroup composition is
  `(p,m) <> (q,n) = (p*n + q,m*n)`. Addition is XOR.
- `haskell/Browser.hs`: C-FFI exports compiled by GHC as a WASI reactor. Explicit
  `_initialize` and `hs_init` calls precede any Haskell exports. JavaScript owns
  input buffers through malloc/free; Haskell results are unsigned Word32 values.
- `dist/engine.js`: WASI initialization, byte copying, and wrappers. No CRC math.
- `dist/app.js`: input encoding, presentation, two-way split and cached four-leaf
  tree. One leaf edit recalculates one leaf and two compositions, reusing four
  existing summaries. A separate full scan provides an independent path check.
- `haskell/Server.hs`: new native WAI/Warp companion, same pure core, UTF-8 query
  bytes. Historical School of Haskell snippets are separately preserved unchanged.
- `dist/index.html`, `style.css`: static article shell. GHC/Wasm and WASI assets
  are same-origin; no CDN or external runtime is required. Standard links to
  original sources are navigation only.
- `tools/build.py`: compiles the reactor, copies current Haskell source and WASI
  assets, extracts the composition excerpt, and records hashes in build-info.json.

The current native build has been verified with GHC 9.10.1. The browser build has
been verified with the pinned 9.14.1.20260731 wasm cross-compiler. The version
difference is deliberate: source-level and numerical agreement are tested.
