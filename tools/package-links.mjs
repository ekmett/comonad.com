// Explicit topic mappings keep unrelated occurrences (e.g. "free", "lens")
// from becoming package recommendations merely because the words match.
export function packageNames(catalog, slug) {
  return (catalog.articles[slug] || []).map(r=>r.package);
}

export function linkPackageMentions(prose, names, catalog) {
  for (const a of prose.querySelectorAll('a[href]')) {
    const href=a.getAttribute('href');
    if(/^https?:\/\/hackage\.haskell\.org\//.test(href))a.setAttribute('href',href.replace(/^http:/,'https:').replace('/cgi-bin/hackage-scripts/package/','/package/'));
  }
  for(const name of names) {
    // Only link explicit prose references such as `lens` library or package.
    // Never rewrite code blocks, existing links, equations, or comment wording.
    for(const code of prose.querySelectorAll('p code,li code')) {
      if(code.textContent!==name || code.closest('a,pre'))continue;
      const tail=code.nextSibling?.textContent || '';
      if(!/^\s+(?:library|package)\b/.test(tail))continue;
      const a=prose.ownerDocument.createElement('a');a.setAttribute('href',catalog.packages[name].url);
      code.replaceWith(a);a.appendChild(code);break;
    }
  }
}
