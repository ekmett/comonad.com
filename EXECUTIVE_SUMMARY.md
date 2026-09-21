# Comonad.Reader migration pilot

This directory is a new website project, not the Cult engine checkout described
by the inherited workspace instructions. It was empty on 2026-09-21.

## Agreed direction

- Collect Comonad.Reader and Edward Kmett's School of Haskell articles.
- Preserve original source and metadata, including historical active snippets.
- Compile fixed Haskell examples to WebAssembly for interactive demonstrations.
  Readers change inputs, not program source. No compiler or server emulation.
- Retain historical/server examples alongside browser versions; share algorithm
  code where practical and label newly written adapters clearly.
- Category theory diagrams should support Quiver/TikZ and build-time SVG output.
- Ultimate hosting target is GitHub Pages. This turn requests a local CRC pilot
  shown in the Codex in-session browser; no public deployment or DNS change.

## Original article

Downloaded the original Markdown and preserved all five active Haskell blocks.
The CRC article itself contains console programs, not a Yesod server. Any HTTP
adapter in this pilot is new, not recovered historical code. Provenance and the
unchanged article are in dist/source/original/.

## Verified checkpoint

The static pilot works at http://127.0.0.1:4173/ and is presented in the Codex
in-session browser. `dist/` is self-contained, including the actual 1.6 MB GHC
WebAssembly reactor and browser WASI shim. There is no JavaScript CRC fallback.

- Two experiments: arbitrary message split/composition and a cached four-leaf
  incremental tree, with real Haskell arithmetic and a separate full-scan check.
- Four source views: current shared core, Wasm adapter, new native HTTP adapter,
  and the original 2013 monoidal snippet; all five historical blocks preserved.
- Native WAI/Warp companion compiled with GHC 9.10.1 and verified at loopback
  port 8081. Browser module compiled with GHC 9.14.1.20260731.
- 409 Wasm assertions against 24 independent zlib fixtures; 20 native HTTP checks.
- In-app browser controls, source tabs, Unicode, empties, incremental edits,
  console, and desktop/mobile appearance checked. See docs/verification.md.

The pilot uses a plain static shell, not Astro yet, to isolate the hard runtime
work. No GitHub repository, public deployment, or DNS change has been made.
The full article migration and Quiver/TikZ pipeline remain subsequent work.
All local build instructions and limitations are in README.md. Project-local
toolchain archives are pinned and verified; no global GHC changes were made.
