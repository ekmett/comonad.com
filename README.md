# The Comonad.Reader

A static home for the original blog and Edward Kmett’s School of Haskell writing, with a shared chronology of talks. The approved green lambda masthead, local mathematics and diagrams, and readable Haskell remain central to the design.

## Contents

- 85 Comonad.Reader posts, 25 School of Haskell articles, four Harmless Algorithms columns, and the recovered Bloodshed wavelet paper (circa 1995), plus nineteen article series and collections, the live-coding series, and the Guanxi workshop series.
- 58 talk pages and 31 live-coding stream pages: four locally preserved slide decks and 85 recordings. The recordings include the Boston Haskell channel, Monad Transformer Lenses, There and Back Again, and sessions 1–26 from Edward’s Twitch stream (including split sessions).
- 187 selected historical comments; all 12,370 original comment records remain in source snapshots.
- 1,014 linked Haskell archive resources, preserved with checksums. Parent directory links do not expand the crawl.
- 1,261 article source blocks (including typeset derivations), local KaTeX/fonts, six editable SVG category diagrams, three SVG wavelet trees, and local article images/attachments.
- Real GHC/WebAssembly figures for CRCs, cellular automata, capture avoidance, Morton order, reverse-mode AD, and growing-tree LCA. Original historical code remains alongside them. The CRC also has a native HTTP companion.

## Preview and edit

```sh
npm ci
npm run build:articles
npm run check
npm run serve
```

Open <http://127.0.0.1:4173/>. Both `/` and `/reader/` show the combined archive. Original blog article paths and retained comment anchors are preserved. Search works locally without a service.

Edit `content/articles/*.md` and `content/articles.json` to publish writing. `templates/` contains figures; `tools/build-articles.mjs` renders the site. CSS and browser JavaScript in `dist/` are maintained source files, so do not delete that directory as a build-clean step. Generated article HTML is overwritten during builds.

Normal article builds are offline after dependencies are installed. Acquisition scripts are separate, resumable operations; they preserve source bytes and do not overwrite edited Markdown. `content/corpus.json`, the asset manifests, and downloadable `source/articles/provenance.json` document origins and hashes.

## GitHub Pages

GitHub Pages serves the root of the `pages` branch. That branch contains only the prebuilt `dist/` tree, including `.nojekyll`; publication does not run our own Actions workflow or install a compiler. Source and the full archive stay on `master`.

To publish changes, build and check locally, commit the resulting files on `master`, then publish its `dist/` subtree:

```sh
npm ci
npm run build:articles
npm run check
git add .
git commit -m "Update the Reader"
git push origin master
pages_commit=$(git subtree split --prefix=dist HEAD)
git push origin "${pages_commit}:refs/heads/pages"
```

In repository Settings → Pages, use **Deploy from a branch**, **pages**, **/ (root)**. GitHub handles the final static deployment. The canonical address is <https://comonad.com/reader/>; `dist/CNAME` retains the custom domain across subtree publications. `content/site.json` controls absolute metadata, sitemap, and feed URLs. Relative navigation works under either hosting root, and the root page forwards to `reader/`. See [domain cutover](docs/domain-cutover.md) for DNS settings and deployment checks.

The local checks verify the checked-in WebAssembly artifact against its source/hash manifest. Rebuild it locally when Haskell changes:

```sh
python3 tools/setup-wasm.py
npm run build
npm run check
```

The pinned bootstrap currently targets Apple Silicon macOS; it installs only into ignored `.toolchain/`. GHC is 9.14.1.20260731 targeting wasm32-wasi. Publishing the prebuilt branch does not download that toolchain. All article pages work without JavaScript; interactive figures and search use JavaScript. Talk pages show the native YouTube player without autoplay, using the privacy-enhanced embed domain.

## Package cross-links

`content/package-links.json` records reviewed connections between articles, talks, and Hackage packages. The site includes a small related-package line, links explicit package-name mentions in prose, and provides a reverse index at `/reader/packages/`. Historical version-specific documentation URLs stay intact. The package membership source is preserved under `content/references/`; normal builds need no Hackage access. Implemented figures and their scope are recorded in `docs/demo-candidates.md`.

## Native companion

`cabal run crc-server` runs the shared CRC core through a WAI/Warp HTTP example on loopback port 8081. Dependencies are frozen. `python3 tests/server.py` tests a running server. This is a new companion, not a claim that historical Yesod examples compile today.

## Preservation and editorial policy

Original bytes are retained. Unambiguous prose typos are corrected and logged in `content/editorial-changes.json`; suspected code or mathematical mistakes stay for review. Comments preserve wording and attribution. Their explicit inclusion decisions live in `content/comment-selections.json`; unselected records are not all claimed to have received individual manual spam review.

Dates distinguish publication, presentation, revision, and upload. School dates may be revision dates. Talks use the known event day, month, or year; unknown days are visibly marked. Upload dates are fallbacks, never silently presented as event dates. Learning to Learn sits in 2014, with its 2017 mirror upload disclosed. The four Warsaw-published sessions have their own series navigation and verified June 2019 dates.

Seventeen Haskell targets and four C# attachments were already unavailable from the old server. The old Wiki is empty and its legacy endpoints partly return 404. Local notices record these gaps; no source is invented. External citations to other people’s writing remain external. See `docs/pending-migration-links.json`, `content/haskell-archive.json`, and `content/assets-manifest.json`.

Additional writing outside the two original hosts is researched in `docs/edward-kmett-research.md` and `content/external-articles.json`; the four Harmless Algorithms columns are now preserved as full articles, and ApplicativeDo is preserved as a complete local PDF with all four authors credited. Four additional talks have locally preserved slides; `content/publications.json` records their dates and materials. Remaining research candidates are not automatically included. Video metadata is preserved locally, but recordings themselves remain on YouTube. The Hello World diagram is compiled from the retained TikZ-cd source to a standalone SVG; normal site builds use the committed SVG and need no TeX installation. Arbitrary code editing and live comment submission are not part of this static implementation.

The RSS feed includes the entire dated archive: articles, talks, streams, and papers. Original dates and permanent entry IDs are retained; entries with only a known year or month omit the optional RSS publication day.

Cellular Automata II/III and Mandelbrot have inline Haskell/Wasm PNG companions, including downloadable PNGs, verified checksums, integer-line/modulo movement, and Adam7 interlacing. Their archive dates use the signed authorship dates; later School of Haskell revision dates and established URLs remain recorded. Series browsing is available in the main archive filter and at `reader/series/`.

The Appearance menu offers light, dark, and system themes, with locally remembered preferences. Text-size controls (90–200%, plus Reset) scale prose, code, metadata, and navigation; the saved size is restored before each page paints. Typography uses relative sizes and respects the browser’s default font size. The archive column and page width grow with the text; narrow diagram margins give way to a full-width page, and an archive drawer replaces the side column when the reading measure becomes too narrow. Hidden diagrams stop animating. A faint network of slowly drifting nodes and labeled diagram arrows fills the desktop margins; readers can freeze or hide it. The default follows reduced motion; Moving explicitly enables animation. Hidden tabs and narrow screens do not animate. Code highlighting and category diagrams follow the theme; print stays light.

Quine’s Dodecahedron and Generators Redux run as an inline WebGL 2 figure at `reader/2014/quine-shader-toys/`, dated to the first shader commit (28 October 2014). Original shader credits/licenses and a complete source ZIP are preserved locally. `tools/build-quine.mjs` makes the mechanical GLSL ES adaptation; the host pauses rendering off screen and caps frame rate and resolution.

The archive’s Demo filter includes Quine and the VR Test Framework recording, published on 14 September 2016, linked to `ekmett/vr`. The original YouTube title, description, and exact publication timestamp are retained.
