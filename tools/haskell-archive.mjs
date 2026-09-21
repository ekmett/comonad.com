import fs from 'node:fs';
import path from 'node:path';
import { parseHTML } from 'linkedom';

export const manifestPath = 'content/haskell-archive.json';
export const rawRoot = 'content/archive';
export function archiveDocument(html) {
  const doc = parseHTML(html).document;
  // Old Haddock emits uppercase HTML attributes; normalize them for the parser.
  for (const node of doc.querySelectorAll('*')) for (const attr of [...node.attributes]) {
    if (attr.name !== attr.name.toLowerCase()) {
      node.removeAttribute(attr.name); node.setAttribute(attr.name.toLowerCase(), attr.value);
    }
  }
  return doc;
}
export function archiveURL(href, base = 'http://comonad.com/') {
  try {
    if (/^[^\s/:@]+@[^\s/]+\.[^\s/]+$/.test(href)) return null;
    const url = new URL(href, base);
    if (!['http:', 'https:'].includes(url.protocol) || !['comonad.com', 'www.comonad.com'].includes(url.hostname) || !url.pathname.startsWith('/haskell/')) return null;
    url.protocol = 'http:'; url.host = 'comonad.com'; url.hash = ''; url.search = '';
    return url.href;
  } catch { return null; }
}
export function archivePath(url) {
  const pathname = decodeURIComponent(new URL(url).pathname).slice(1);
  if (pathname.split('/').some(p => p === '..' || p === '.' || p.includes('\\') || p.includes('\0'))) throw new Error(`Unsafe archive path: ${url}`);
  return pathname + (pathname.endsWith('/') ? 'index.html' : '');
}
export function isListing(doc) { return /^Index of \/haskell\//.test(doc.querySelector('h1')?.textContent || ''); }
export function isParent(node, base) {
  if (node.tagName !== 'A') return false;
  if (node.textContent.trim() === 'Parent Directory') return true;
  const target = archiveURL(node.getAttribute('href'), base);
  return target && base.startsWith(target) && target !== base && target.endsWith('/');
}
export const attributes = [['a[href]', 'href'], ['img[src],script[src],iframe[src],source[src]', 'src'], ['link[href]', 'href'], ['object[data]', 'data']];
export function cssURLs(css, visit) {
  return css.replace(/url\(\s*(['"]?)([^'"\s)]+)\1\s*\)|@import\s+(['"])([^'"]+)\3/g, (whole, quote, url, importQuote, imported) => {
    const href = url || imported;
    return whole.replace(href, visit(href));
  });
}
export function references(bytes, type, url) {
  const found = new Set(), skippedParents = new Set();
  const add = href => { const target = archiveURL(href, url); if (target) found.add(target); return href; };
  if (type.includes('html')) {
    const doc = archiveDocument(bytes.toString('utf8')), listing = isListing(doc);
    for (const [selector, attr] of attributes) for (const node of doc.querySelectorAll(selector)) {
      if (listing && isParent(node, url)) { skippedParents.add(new URL(node.getAttribute(attr), url).href); continue; }
      add(node.getAttribute(attr));
    }
    for (const node of doc.querySelectorAll('style,[style]')) cssURLs(node.getAttribute('style') || node.textContent, add);
  } else if (type.includes('css')) cssURLs(bytes.toString('utf8'), add);
  else if (url.endsWith('/haddock-util.js')) {
    // Old Haddock swaps these images when a module/instance group is toggled.
    for (const match of bytes.toString('utf8').matchAll(/\.src\s*=\s*(['"])([^'"]+)\1/g)) add(match[2]);
  }
  return {links:[...found].sort(), skippedParents:[...skippedParents].sort()};
}
export function loadArchive() {
  return fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {resources:[]};
}
export function archiveLookup(archive) {
  return new Map([...archive.resources.flatMap(r => [r.url, ...r.aliases].map(url => [url, r])), ...(archive.failures||[]).map((f,i)=>[f.url,{path:`source/unavailable/haskell-${i}.html`,unavailable:true}])]);
}
export function localArchiveLink(href, base, lookup, fromFile) {
  const key = archiveURL(href, base), record = lookup.get(key);
  if (!record) return null;
  const hash = record.unavailable ? '' : new URL(href, base).hash;
  const target = record.path.endsWith('/index.html') ? record.path.slice(0, -10) : record.path;
  let relative = path.posix.relative(path.posix.dirname(fromFile), target) || '.';
  if (target.endsWith('/') && !relative.endsWith('/')) relative += '/';
  return relative + hash;
}
export function buildArchive(archive) {
  const lookup = archiveLookup(archive);
  const unavailable = new Map((archive.failures || []).map(f => [f.url, f.error]));
  const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  fs.mkdirSync('dist/source/unavailable',{recursive:true});
  (archive.failures||[]).forEach((f,i)=>fs.writeFileSync(`dist/source/unavailable/haskell-${i}.html`,`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Historical source unavailable</title><h1>Historical source unavailable</h1><p>This article linked to <code>${escape(f.url)}</code>.</p><p>The original server returned ${escape(f.error)} during preservation. No replacement has been invented.</p><p><a href="../../reader/">Return to the archive</a></p></html>`));
  for (const record of archive.resources) {
    const original = fs.readFileSync(path.join(rawRoot, record.path));
    let output = original;
    const rewrite = href => localArchiveLink(href, record.url, lookup, record.path) ?? href;
    if (record.type.includes('html')) {
      const doc = archiveDocument(original.toString('utf8')), listing = isListing(doc);
      // Apache's sorting controls and decorative icons require the original server.
      if (listing) {
        for (const node of doc.querySelectorAll('a[href]')) {
          if (isParent(node, record.url)) { node.closest('tr')?.remove(); continue; }
          if (node.getAttribute('href').startsWith('?')) node.replaceWith(node.textContent);
        }
        doc.querySelectorAll('img[src^="/icons/"],address').forEach(n => n.remove());
      }
      for (const node of doc.querySelectorAll('a[href]')) {
        if (/^\/(?:usr|home)\//.test(node.getAttribute('href'))) {
          const label=doc.createElement('span');
          label.textContent=node.textContent;
          label.setAttribute('title','Original Haddock link points into the publisher’s local filesystem: '+node.getAttribute('href'));
          node.replaceWith(label);continue;
        }
        if (/^[^\s/:@]+@[^\s/]+\.[^\s/]+$/.test(node.getAttribute('href'))) node.setAttribute('href', 'mailto:' + node.getAttribute('href'));
        const error = unavailable.get(archiveURL(node.getAttribute('href'), record.url));
        if (error) {
          node.replaceWith(`${node.textContent} — unavailable from the original server (${error})`);
        }
      }
      for (const node of doc.querySelectorAll('a[name]')) {
        const id = decodeURIComponent(node.getAttribute('name'));
        if (!doc.getElementById(id)) node.setAttribute('id', id);
      }
      for (const [selector, attr] of attributes) for (const node of doc.querySelectorAll(selector)) node.setAttribute(attr, rewrite(node.getAttribute(attr)));
      for (const node of doc.querySelectorAll('style,[style]')) {
        if (node.hasAttribute('style')) node.setAttribute('style', cssURLs(node.getAttribute('style'), rewrite));
        else node.textContent = cssURLs(node.textContent, rewrite);
      }
      output = doc.toString();
    } else if (record.type.includes('css')) output = cssURLs(original.toString('utf8'), rewrite);
    const destination = path.join('dist', record.path);
    fs.mkdirSync(path.dirname(destination), {recursive:true}); fs.writeFileSync(destination, output);
  }
  // Several old Haddock pages link to symbol anchors never emitted by HsColour.
  // Keep the source-page link, record the missing fragment, and avoid dead jumps.
  const docs=new Map(), repairs=[];
  for(const r of archive.resources.filter(r=>r.type.includes('html')))docs.set(r.path,archiveDocument(fs.readFileSync('dist/'+r.path,'utf8')));
  const cata=docs.get('haskell/catamorphisms.html');
  if(cata?.getElementById('ref-section'))cata.getElementById('ref-section').insertAdjacentHTML('afterbegin','<span id="references"></span>');
  for(const [file,doc] of docs) {
    for(const a of doc.querySelectorAll('a[href*="#"]')) {
      const href=a.getAttribute('href');
      if(/^[a-z]+:/i.test(href))continue;
      const url=new URL(href,'http://local/'+file),target=docs.get(decodeURIComponent(url.pathname.slice(1))),id=decodeURIComponent(url.hash.slice(1));
      if(!target || !id || target.getElementById(id) || [...target.querySelectorAll('a[name]')].some(n=>n.getAttribute('name')===id))continue;
      repairs.push({file,href,reason:'Historical source page has no matching symbol anchor.'});
      a.setAttribute('href',href.split('#')[0]);a.setAttribute('title','Source page; the original symbol anchor was missing.');
    }
    fs.writeFileSync('dist/'+file,doc.toString());
  }
  fs.writeFileSync('docs/archive-link-repairs.json',JSON.stringify(repairs,null,2)+'\n');
}
