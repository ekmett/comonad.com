# Verified 2026-09-21

## Browser kernel

- Compiler: GHC 9.14.1.20260731, wasm32-wasi.
- Actual module size: 1,644,489 bytes, no compiler shipped to readers.
- Module and source checksums: `dist/build-info.json`.
- `npm test`: 409 assertions pass against 24 independent Python-zlib fixtures.
- UTF-8, all 256 byte values, zero bytes, empty inputs, varied sizes through
  4096 bytes, multiple boundaries, associativity, left/right identity, cached edit.
- Browser uses the exact engine and WASI shim exercised by the Node checks.
- GHC compilation and JavaScript syntax checks pass.

## Native companion

- GHC 9.10.1 / Cabal 3.16.0.0, frozen WAI/Warp dependencies.
- `cabal build crc-server` succeeds. macOS linker emits a redundant -U warning.
- `python3 tests/server.py`: 20 HTTP checks pass against zlib, including Unicode,
  empty input, split limits, invalid parameters, and 404 responses.
- Binds `127.0.0.1:8081` only.

## In-session browser

- Opened the static pilot at http://127.0.0.1:4173/ in Codex's in-app browser.
- Standard input `123456789` gives `CBF43926` through both calculation paths.
- Unicode preset gives `C57D2569`; split zero works with an empty left summary.
- Empty input gives `00000000` with identity summaries on both sides.
- Editing chunk B from `45` to `λ` gives `712B0DAA`; right branch retained,
  one leaf and two compositions updated, matching the direct scan.
- Editing chunk C afterwards also updates only its ancestor path.
- Original, server, and browser source panels checked; keyboard tab navigation
  exercised. Historical code is labelled as historical, not modernized in place.
- Browser console had no errors/warnings during the interactions checked.
- Desktop screenshot inspected. Mobile layout inspected at 390 × 844; after
  fixing a preformatted code overflow, page scrollWidth = clientWidth = 390.
- Temporary viewport override restored before handoff.

This is one browser environment, not a full cross-browser conformance matrix.
No multicore or native-performance claims are made by the pilot.
