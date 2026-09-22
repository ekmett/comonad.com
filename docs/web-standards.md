# Web standards worth using

Recommendations for the static Comonad.Reader rebuild, reviewed 22 September 2026. These are proposals unless marked present.

1. **Keep stable URLs and heading anchors.** Preserve the original `/reader/year/slug/` paths and legacy fragment IDs. Relative canonical links and the root-to-reader redirect are present. Absolute feed, sitemap and metadata URLs now use one configured hosting root, currently GitHub Pages; change that root when moving domains. [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
2. **Make subscriptions boring and dependable.** RSS and HTML feed discovery are present. Add JSON Feed if useful to consumers, and separate feeds for writing, talks, and selected topics. Keep entry IDs stable and distinguish first publication from substantive revision dates; migration should not announce every old post as newly written. Atom is also an option, but publishing three equivalent formats is less valuable than correct dates, complete content, and usable topic feeds. [JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/).
3. **Provide sharing metadata.** Open Graph title, description, URL and type are present. Image cards remain optional. These describe links shared elsewhere; there are no in-page hover previews. [Open Graph](https://ogp.me/).
4. **Describe articles and papers to other software.** JSON-LD is present with actual authors, known publication dates, article identities and appropriate article, paper, video and presentation types. This also makes attribution explicit for guest writing and coauthored papers. Do not label a rebuild as a new publication. [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article).
5. **Use semantic mathematics and scalable diagrams.** KaTeX already emits MathML alongside its visual HTML, and diagrams are local SVG. Retain TikZ sources and compile at build time. Add prose descriptions of the relationships in diagrams, not just lists of letters. [MathML](https://developer.mozilla.org/en-US/docs/Web/MathML).
6. **Keep the reading experience accessible.** Native article/navigation elements, visible keyboard focus, meaningful heading levels, print styles, and content available without JavaScript. The interactive figures can enhance a complete article. Audit phone layouts and screen-reader output as part of content QA.
7. **Publish here, announce elsewhere.** Short summaries linking to the canonical article are a good fit for social accounts. A voluntary email digest is another distribution channel, but needs an external sending service. No announcements or mailing subscriptions are enabled by these recommendations. [POSSE](https://indieweb.org/POSSE).
8. **Consider Webmention later.** It lets other sites notify you that they linked to or replied to a post. A static site needs a separate receiver and a moderation/import step. Approved mentions could then become preserved static discussion, like the restored original comments. [W3C Webmention](https://www.w3.org/TR/webmention/).

I would prioritize feeds, canonical URLs, preview cards, metadata, and accessibility. I would defer an offline service worker, push notifications, and a full ActivityPub server until there is a concrete use for them; they introduce ongoing behavior beyond serving preserved files.

## Further ideas from Gwern

Borrow backlinks with a short referring passage, wide-screen margin footnotes with ordinary footnotes on phones, and readable full-size diagrams and slides. Backlinks and footnotes are the priorities. The existing archive gutter needs to coexist with margin notes. Keep preserving important external material locally with provenance. These features do not require Hakyll. See [Gwern’s design notes](https://gwern.net/design).

Do not add small hover or pop-up previews: Edward finds them awkward. Links should remain straightforward.
