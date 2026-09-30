// Shared by published articles and local drafts; navigation needs no JavaScript.
export function articleContents(prose) {
  const headings = [...prose.querySelectorAll('h2,h3,h4,h5,h6')];
  if (!headings.length) return '';
  const used = new Set([...prose.querySelectorAll('[id]')].filter(n => !headings.includes(n)).map(n => n.id));
  const roots = [], stack = [];
  for (const heading of headings) {
    const base = heading.id || heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'section';
    let id = base, suffix = 2;
    while (used.has(id)) id = base + '-' + suffix++;
    used.add(id);
    heading.id = id;
    const entry = {heading, level:Number(heading.tagName.slice(1)), children:[]};
    while (stack.length && stack.at(-1).level >= entry.level) stack.pop();
    (stack.at(-1)?.children || roots).push(entry);
    stack.push(entry);
  }
  const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const list = entries => `<ol>${entries.map(({heading, children}) => `<li><a href="#${escape(encodeURIComponent(heading.id))}">${escape(heading.textContent)}</a>${children.length ? list(children) : ''}</li>`).join('')}</ol>`;
  return `<details class="contents" open><summary>On this page</summary><nav aria-label="Article sections">${list(roots)}</nav></details>`;
}
