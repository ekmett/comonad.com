# The Comonad.Reader

A static home for the original blog and Edward Kmett’s School of Haskell writing, with a shared chronology of talks. The approved green lambda masthead, local mathematics and diagrams, and readable Haskell remain central to the design.

## Contents

- 85 Comonad.Reader posts and 25 School of Haskell articles, plus eight series pages.
- 52 talk pages: 33 Boston Haskell recordings and 19 additional recordings, including Learning to Learn, Discrimination Is Wrong, and the four Monadic Party/Guanxi sessions published by Monadic Warsaw.
- 187 selected historical comments; all 12,370 original comment records remain in source snapshots.
- 1,014 linked Haskell archive resources, preserved with checksums. Parent directory links do not expand the crawl.
- 1,202 article code blocks, local KaTeX/fonts, six editable SVG category diagrams, and local article images/attachments.
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
git push origin "$pages_commit:refs/heads/pages"
```

In repository Settings → Pages, use **Deploy from a branch**, **pages**, **/ (root)**. GitHub handles the final static deployment. The preview address is <https://ekmett.github.io/comonad.com/>; custom-domain configuration and DNS changes remain separate.

The local checks verify the checked-in WebAssembly artifact against its source/hash manifest. Rebuild it locally when Haskell changes:

```sh
python3 tools/setup-wasm.py
npm run build
npm run check
```

The pinned bootstrap currently targets Apple Silicon macOS; it installs only into ignored `.toolchain/`. GHC is 9.14.1.20260731 targeting wasm32-wasi. Publishing the prebuilt branch does not download that toolchain. All article pages work without JavaScript; interactive figures and search use JavaScript. Videos load YouTube only after a reader selects Play.

## Package cross-links

`content/package-links.json` records reviewed connections between articles, talks, and Hackage packages. The site includes a small related-package line, links explicit package-name mentions in prose, and provides a reverse index at `/reader/packages/`. Historical version-specific documentation URLs stay intact. The package membership source is preserved under `content/references/`; normal builds need no Hackage access. Implemented figures and their scope are recorded in `docs/demo-candidates.md`.

## Native companion

`cabal run crc-server` runs the shared CRC core through a WAI/Warp HTTP example on loopback port 8081. Dependencies are frozen. `python3 tests/server.py` tests a running server. This is a new companion, not a claim that historical Yesod examples compile today.

## Preservation and editorial policy

Original bytes are retained. Unambiguous prose typos are corrected and logged in `content/editorial-changes.json`; suspected code or mathematical mistakes stay for review. Comments preserve wording and attribution. Their explicit inclusion decisions live in `content/comment-selections.json`; unselected records are not all claimed to have received individual manual spam review.

Dates distinguish publication, presentation, revision, and upload. School dates may be revision dates. Talks use the known event day, month, or year; unknown days are visibly marked. Upload dates are fallbacks, never silently presented as event dates. Learning to Learn sits in 2014, with its 2017 mirror upload disclosed. The four Warsaw-published sessions have their own series navigation and verified June 2019 dates.

Seventeen Haskell targets and four C# attachments were already unavailable from the old server. The old Wiki is empty and its legacy endpoints partly return 404. Local notices record these gaps; no source is invented. External citations to other people’s writing remain external. See `docs/pending-migration-links.json`, `content/haskell-archive.json`, and `content/assets-manifest.json`.

Additional writing outside the two original hosts is researched in `docs/edward-kmett-research.md` and `content/external-articles.json`; those 16 candidates are not represented as migrated article bodies. Video metadata is preserved locally, but recordings themselves remain on YouTube. General TikZ-cd compilation, arbitrary code editing, and live comment submission are not needed by this static implementation.
