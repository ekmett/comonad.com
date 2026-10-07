// Local-only drafts reuse the built site's shell without entering its catalog.
import fs from 'node:fs';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import {parseHTML} from 'linkedom';
import {articleContents} from './article-contents.mjs';

const file = process.argv[2] || 'drafts/turbo-haskell.md';
const slug = path.basename(file, '.md');
const md = new MarkdownIt({typographer:true});
const {document: content} = parseHTML(`<article class="prose">${md.render(fs.readFileSync(file, 'utf8'))}</article>`);
const title = content.querySelector('h1');
if (!title) throw new Error('A draft needs an H1 title.');
const titleText = title.textContent;
title.remove();
const toc = articleContents(content.querySelector('article'));

const {document} = parseHTML(fs.readFileSync('dist/reader/index.html', 'utf8'));
document.title = `${titleText} · Draft · The Comonad Reader`;
for (const node of document.querySelectorAll('link[rel="canonical"],link[rel="alternate"],meta[name="description"],meta[property],script[type="application/ld+json"],script[src*="archive.js"]')) node.remove();
document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex, nofollow">');
// Resolve the existing shell's links against its original location.
for (const node of document.querySelectorAll('[href],[src]')) {
  for (const attr of ['href','src']) {
    const value = node.getAttribute(attr);
    if (!value || value.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(value)) continue;
    const url = new URL(value, 'http://preview.local/reader/');
    node.setAttribute(attr, url.pathname + url.search + url.hash);
  }
}
const main = document.querySelector('#main-content');
main.innerHTML = '<header class="article-header"><div class="article-meta"><span>Draft · Not published</span><span>Edward Kmett</span></div><h1></h1></header>';
main.querySelector('h1').textContent = titleText;
main.insertAdjacentHTML('beforeend', toc);
main.appendChild(content.querySelector('article'));

// Assets and existing pages are shared read-only; the draft is outside dist.
const root = 'build/draft-preview';
fs.mkdirSync(`${root}/drafts/${slug}`, {recursive:true});
if (fs.existsSync('dist/drafts')) throw new Error('Reserved draft path exists in dist.');
for (const name of fs.readdirSync('dist')) {
  const target = path.join(root, name);
  if (!fs.existsSync(target)) fs.symlinkSync(path.resolve('dist', name), target);
}
fs.writeFileSync(`${root}/drafts/${slug}/index.html`, '<!doctype html>\n' + document.documentElement.outerHTML);
console.log(`Local draft: ${root}/drafts/${slug}/index.html`);
console.log(`Serve with: python3 -m http.server 4173 --bind 127.0.0.1 --directory ${root}`);
