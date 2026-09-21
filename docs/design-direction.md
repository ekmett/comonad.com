# Proposed typography and publishing direction

Research date: 21 September 2026. These are recommendations, not a completed
font or generator migration. The user likes Gwern.net and wants the content
itself, including mathematical prose and code, to be carefully typeset.

Gwern's [design essay](https://gwern.net/design) describes a static Hakyll/Pandoc
site, pre-rendered mathematics, optional reading aids, and local archives.
His [font documentation](https://gwern.net/style-guide#font-stack) specifies
Source Serif 4, Source Sans 3, and IBM Plex Mono. The published
[stylesheet](https://gwern.net/static/css/default.css) and
[Hakyll program](https://gwern.net/static/build/app/hakyll.hs) were also inspected.

## What to adopt

- Try that three-font family locally: Source Serif 4 for prose, Source Sans 3
  for navigation/captions, IBM Plex Mono for Haskell. Include licenses and
  needed Greek/math characters. Use small caps deliberately, italic forms,
  kerning, and tabular figures for data. Font downloads must not hide the text.
- Give technical prose a comfortable measure, with room for wider code and
  diagrams. Start at roughly 70–80 characters and 1.5–1.6 line spacing, then
  judge actual Kan/CRC pages. Test desktop justification with hyphenation;
  keep narrow screens ragged-right. Never justify or hyphenate code.
- Add restrained Haskell highlighting and distinct confusable glyphs. Keep
  operators literal, preserving spacing and copy/paste. Avoid programming
  ligatures that conceal the characters of custom operators.
- Typeset mathematical notation as mathematics, with superscripts, subscripts,
  aligned equations, and appropriate operator spacing. Keep code as code.
  Pre-render math and diagrams locally; retain editable TeX/diagram sources.
- Turn short footnotes into margin notes when space permits, with usable
  footnote fallbacks on narrow screens and without JavaScript. Curated comment
  corrections can link to the relevant paragraph while retaining author/date.
- Keep demos, proofs, and explanations in the article's reading flow. Put
  optional implementation bulk behind simple disclosures. Link previews for
  definitions and cross-article references can come later.
- Preserve every old route and useful fragment ID. Archive required assets,
  sources, and selected discussion locally. Treat a reference inventory as part
  of migration, not as evidence that the missing targets have been preserved.

## What to postpone

Recursive popups, a site-wide annotation/transclusion system, ornate dropcaps,
automatic link icons, and a large customized typography language can wait until
their reading benefit is demonstrated on this corpus. Keep article markup
portable enough to render in another tool.

## Generator recommendation

Lean toward **Hakyll + Pandoc** for the finished site. Its
[documented Pandoc integration](https://jaspervdj.be/hakyll/) supports Markdown,
TeX, and highlighting, and a Haskell transformation pipeline is a natural home
for the corpus-specific import rules, mathematical notation, cross-references,
and comment processing. Hakyll does not provide the visual design by itself.

The tradeoff is the GHC/Pandoc build dependency and maintenance of custom rules.
Keep that complexity at build time: normal article edits should not rebuild
the Wasm toolchain, and readers should receive ordinary static HTML, CSS,
fonts, SVGs, and optional Wasm. GitHub hosting does not require a JavaScript
site generator. The current small Node builder is a reviewable migration pilot;
it is not a commitment to that permanent architecture.
