# Static archive architecture

`content/` is the durable corpus: edited article Markdown and metadata, unchanged source snapshots, explicit comment selections, downloaded assets and their hashes, Haskell archive manifests, talk metadata, and editorial decisions.

`tools/build-articles.mjs` renders local HTML, Haskell highlighting, KaTeX, diagrams, chronology, series, feed and provenance. It never fetches original hosts. Import scripts run separately and are resumable. The generated site uses relative links for GitHub Pages project-path compatibility; feed and sitemap URLs target the eventual canonical `https://comonad.com/` host.

`dist/` contains both maintained browser assets and generated pages. It is intentionally deployable without a compiler/database/CDN. Do not remove it before building. Math and fonts are local. YouTube embeds are created only on explicit Play. The editorial source remains downloadable alongside every article.

`haskell/CRC.hs` is shared by the native server and Wasm adapter. `haskell/Automaton.hs` implements the cellular automaton kernel. JavaScript handles controls, drawing and CRC tree caching; numerical operations execute in GHC-generated Wasm. The source/hash manifest prevents deploying stale Wasm after Haskell changes.

The Pages workflow renders articles, verifies preservation and the Wasm artifact, and publishes only on manual dispatch. Changing the generator to Hakyll/Pandoc remains an independent future choice; content preservation and reader-facing design do not depend on that choice.
