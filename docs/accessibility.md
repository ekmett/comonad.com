# Accessibility follow-up

Reviewed 22 September 2026. This is a focused review, not a conformance certification.

## Present

- A first-focus “Skip to content” link bypasses both the header and archive sidebar. Its target receives focus without entering the ordinary tab sequence.
- Consistent visible focus outlines on links, controls and disclosures.
- Static article content works without JavaScript; semantic main/navigation landmarks, language metadata and heading structure are present.
- KaTeX emits MathML. The redrawn wavelet trees have SVG titles/descriptions and equivalent image alternative text, including the numerical operations and relationships.
- Talk thumbnails also appear on keyboard focus, can be dismissed with Escape, and remain reachable when the pointer moves onto them. Touch layouts use inline thumbnails.
- Code blocks can be focused and scrolled. Original source files remain downloadable.

## Highest-value remaining work

1. Preserve transcripts and reviewed captions for recordings. Automatic captions need review for names, Haskell identifiers and mathematics. Show caption/transcript availability without implying every recording has them.
2. Add text or table equivalents for changing graphical demos, especially the cellular automaton, Morton grid and LCA tree. Provide keyboard interaction for any pointer-only selections and announce concise results rather than every animation frame.
3. Audit small metadata text, highlighted code and interactive states for contrast; verify 200–400% zoom and 320 CSS-pixel reflow. The wavelet figures stack at narrow widths.
4. Test representative articles, archive filters, disclosures, equations and demos with VoiceOver and another screen reader. Browser accessibility-tree inspection alone is not enough.
5. Check supplied PDFs for selectable text, tags and reading order; keep improving HTML alternatives and slide descriptions.

References: [Bypass blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html), [hover/focus content](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), [complex images](https://www.w3.org/WAI/tutorials/images/complex/).
