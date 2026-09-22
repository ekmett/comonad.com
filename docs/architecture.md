# Static archive architecture

`content/` is the durable corpus: edited article Markdown and metadata, unchanged source snapshots, explicit comment selections, downloaded assets and their hashes, Haskell archive manifests, talk metadata, and editorial decisions.

`tools/build-articles.mjs` renders local HTML, Haskell highlighting, KaTeX, diagrams, chronology, series, feed and provenance. It never fetches original hosts. Import scripts run separately and are resumable. The generated site uses relative links for GitHub Pages project-path compatibility; absolute feed, sitemap, Open Graph and structured-data URLs use `content/site.json` (currently the GitHub Pages hosting root). `READER_SITE_URL` can override the root at build time. When moving domains, set it to `https://comonad.com/`, not `/reader/`. Canonical links are relative, the root redirects to `reader/`, and RSS entry identities remain stable across the move.

`dist/` contains both maintained browser assets and generated pages. It is intentionally deployable without a compiler/database/CDN. Do not remove it before building. Math and fonts are local. Talk pages include the native YouTube player with no autoplay, using the privacy-enhanced embed domain. The editorial source remains downloadable alongside every article.

`haskell/CRC.hs` is shared by the native server and Wasm adapter. `haskell/Automaton.hs` implements the cellular automaton kernel. JavaScript handles controls, drawing and CRC tree caching; numerical operations execute in GHC-generated Wasm. The source/hash manifest prevents deploying stale Wasm after Haskell changes.

Local builds render articles and verify preservation and the Wasm artifact. GitHub Pages serves the prebuilt `pages` branch (the `dist/` subtree of `master`) with `.nojekyll`; no custom Actions workflow runs. Changing the generator to Hakyll/Pandoc remains an independent future choice; content preservation and reader-facing design do not depend on that choice.

## Additional preserved publications

`content/publications.json` adds the ApplicativeDo paper and four slide presentations to the same dated archive and neighboring-entry navigation. Complete PDFs or every publicly visible slide image are stored under `content/assets/`. `content/external-preservation.json` records source URLs, hashes, retrieval dates, and unsuccessful retrievals. SlideShare publication dates are explicitly distinguished from talk dates; month-only paper dates remain month-only.

`tools/import-flipcode.mjs` restores the four complete Harmless Algorithms columns, fixes malformed legacy lists, retains named anchors and inter-column links, and highlights C++ examples. Tests compare all article text and code with the original snapshots, allowing only recorded prose corrections and whitespace restoration.

`tools/restore-legacy-code.mjs` repairs flattened old code spans and unmarked paragraphs using the preserved HTML line breaks and indentation. Applied changes are logged in `content/code-formatting.json`. Original source snapshots remain unchanged.

The Hello World lifting square has a retained TikZ-cd source at `content/figures/lifting-square.tex`. Its committed SVG was generated with Tectonic 0.17.0 and PyMuPDF 1.28.2. To regenerate, compile the standalone TeX to PDF, use `Page.get_svg_image()` with paths for glyphs, and retain the SVG title describing the arrows. Normal site builds copy the SVG and require neither dependency.

The collapsible archive sidebar shows a whole year, with twelve month links and expandable dated article lists underneath. Phones use a collapsed archive drawer. Month-only and year-only dates are labeled without inventing a day.
