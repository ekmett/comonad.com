# Verification — 21 September 2026

`npm run check` verifies:

- 149 source snapshot hashes, all acquisition catalog entries represented, and 162 correctly ordered article/talk entries.
- Published Wasm hash and matching Haskell source hashes.
- 409 CRC checks against 24 independently generated Python zlib vectors: empty/Unicode/all-byte inputs, splitting, composition, both summary fields, associativity, identities and cached edits.
- 16 automaton checks: constant rules, identity, both directional shifts, and eleven Pascal-triangle parity generations under rule 90. The displayed window uses a shrinking padded domain, so no arbitrary boundary can reach the picture.
- 88,570 additional Wasm checks: capture avoidance and alpha-equivalence under binder renaming; all 64 grid cells and six block widths against bit-by-bit Morton encoding; AD gradients against analytic derivatives and central finite differences, including accumulation at shared x; all node pairs in chain, star, balanced, and four deterministic random 64-node trees against ancestor lists, with cached path sizes and old-version queries. Invalid trees are rejected.
- All 110 article pages: 1,202 source blocks survive highlighting, no unwanted tabs/NBSP padding, one page title, local rendering assets, and resolving local links/anchors. Every original blog code block is compared token-for-token modulo documented whitespace and lambda-escape restoration. All 187 published comments preserve original wording. The original three pilot articles also retain their stronger prose comparisons.
- 1,014 raw archive checksums, binary/source byte equality, and 15,341 local archive references. Seventeen unavailable historical targets are explicitly accounted for. Old Haddock links into local `/usr` trees are labeled as such; absent historical symbol anchors link to the surviving source page and are recorded in `archive-link-repairs.json`.

In-session browser checks exercise archive search and talk navigation, the inline automaton controls and rendered output, and article/header layout. The four new figures were exercised in the browser, including capture/binder controls, both Morton traversal orders, both AD input sliders and sweep controls, and LCA growth, earlier versions, and equal-node queries. A 390-pixel viewport check confirmed no document overflow and readable graph labels. Earlier CRC checks covered empty strings, Unicode and both association orders. GitHub-hosted workflow execution and production DNS are not tested because nothing has been deployed.

Acquisition inventories and unchanged source snapshots provide the audit trail. Full semantic recompilation of historical examples against modern libraries is not claimed.
