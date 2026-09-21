// One-time, offline import. Hand-edited Markdown is the source for subsequent builds.
import fs from 'node:fs';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';

for (const slug of ['kan-extensions', 'kan-extensions-ii']) {
  const { document } = parseHTML(fs.readFileSync(`content/original/${slug}.html`, 'utf8'));
  const article = document.querySelector('.post-content');
  article.querySelectorAll('.post-info, .post-footer').forEach(node => node.remove());
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', emDelimiter: '*' });
  td.addRule('haskell', {
    filter: 'pre',
    replacement: (_, node) => {
      let code = node.textContent.replaceAll('\u00a0', ' ').replaceAll('\t', '        ');
      code = code.split('\n').map(line => line.trimEnd()).join('\n').trim();
      // Bird-style prefixes and duplicated lambda escapes are WordPress artifacts.
      code = code.replace(/^> ?/gm, '').replace(/\\\\(?=[a-z])/g, '\\');
      // Eight-column blog indentation becomes two-space Haskell layout. Preserve
      // relative alignment within a group rather than collapsing every space.
      const indents = code.split('\n').filter(line => /^ +\S/.test(line)).map(line => line.match(/^ */)[0].length);
      const indent = Math.min(...indents);
      if (Number.isFinite(indent)) code = code.replace(/^ +/gm, spaces => ' '.repeat(Math.floor(spaces.length / indent) * 2 + spaces.length % indent));
      return '\n\n```haskell\n' + code + '\n```\n\n';
    },
  });
  td.addRule('sectionHeadings', {
    filter: node => node.nodeName === 'P' && node.children.length === 1 && node.firstElementChild.nodeName === 'B' && node.textContent.trim() === node.firstElementChild.textContent.trim(),
    replacement: content => '\n\n## ' + content.replace(/^\*\*|\*\*$/g, '') + '\n\n',
  });
  td.addRule('math', {
    filter: 'img',
    replacement: (_, node) => {
      if (!node.getAttribute('src').includes('/latex/')) throw new Error('Unarchived image');
      const tex = node.getAttribute('alt').replace(/^\$|\$$/g, '').replaceAll('->', '\\to');
      return '$' + tex + '$';
    },
  });
  td.addRule('oldAnchors', {
    filter: node => node.nodeName === 'SPAN' && node.id.startsWith('more-'),
    replacement: (_, node) => `<span id="${node.id}"></span>`,
  });
  const markdown = td.turndown(article.innerHTML);
  fs.writeFileSync(`content/articles/${slug}.md`, markdown + '\n');
}
