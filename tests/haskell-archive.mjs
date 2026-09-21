import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadArchive, archiveLookup, archiveURL, archiveDocument, attributes, cssURLs, references, isListing, isParent, rawRoot } from '../tools/haskell-archive.mjs';

const archive = loadArchive(), lookup = archiveLookup(archive);
assert.ok(archive.resources.length, 'Haskell archive is populated');
const unavailable = new Set(archive.failures.map(f => f.url));
for (const seed of archive.seeds) assert.ok(lookup.has(seed), `article dependency saved: ${seed}`);
assert.ok(!lookup.has('http://comonad.com/haskell/'), 'parent directory did not expand the crawl');
const html = new Map(), broken = [], brokenAnchors = [];
let links = 0;
function document(file) {
  if (!html.has(file)) html.set(file, archiveDocument(fs.readFileSync(file, 'utf8')));
  return html.get(file);
}
function check(href, file) {
  if (/^(?:[a-z]+:|\/\/)/i.test(href)) {
    assert.ok(!archiveURL(href), `old Haskell host dependency remains: ${href}`);
    return;
  }
  const url = new URL(href, 'http://archive.test/' + file.slice(5));
  let target = path.join('dist', decodeURIComponent(url.pathname));
  if (target.endsWith('/')) target += 'index.html';
  links++;
  if (!fs.existsSync(target)) { broken.push({file, href}); return; }
  if (url.hash && target.endsWith('.html')) {
    const doc = document(target), hash = url.hash.slice(1);
    if (![hash, decodeURIComponent(hash)].some(id => doc.getElementById(id) || [...doc.querySelectorAll('a[name]')].some(n => n.getAttribute('name') === id))) brokenAnchors.push({file, href});
  }
}
for (const record of archive.resources) {
  const raw = fs.readFileSync(path.join(rawRoot, record.path)), file = 'dist/' + record.path;
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), record.sha256, `original preserved: ${record.path}`);
  assert.ok(fs.existsSync(file), `output exists: ${file}`);
  for (const url of references(raw, record.type, record.url).links) assert.ok(lookup.has(url) || unavailable.has(url), `unaccounted dependency: ${url}`);
  if (record.type.includes('html')) {
    const doc = document(file);
    for (const [selector, attr] of attributes) for (const node of doc.querySelectorAll(selector)) check(node.getAttribute(attr), file);
    if (isListing(doc)) assert.ok(![...doc.querySelectorAll('a')].some(n => isParent(n, record.url)), 'no transitive directory parents');
  } else if (record.type.includes('css')) cssURLs(fs.readFileSync(file, 'utf8'), href => { check(href, file); return href; });
  else assert.deepEqual(fs.readFileSync(file), raw, `source/binary copied unchanged: ${file}`);
}
assert.deepEqual(broken, [], 'all local archive files exist');
assert.deepEqual(brokenAnchors, [], 'all local archive anchors resolve');
console.log(`Archive checks passed: ${archive.resources.length} original checksums, ${links} local references, ${unavailable.size} explicitly recorded unavailable file(s).`);
