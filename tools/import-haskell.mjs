// Explicit acquisition step; normal site builds use the saved bytes offline.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import MarkdownIt from 'markdown-it';
import { archiveURL, archivePath, references, loadArchive, manifestPath, rawRoot } from './haskell-archive.mjs';

const md = new MarkdownIt({html:true});
const posts = JSON.parse(fs.readFileSync('content/articles.json', 'utf8'));
const seeds = new Set();
for (const post of posts) {
  const texts = [fs.readFileSync(`content/articles/${post.slug}.md`, 'utf8')];
  const comments = `content/comments/${post.slug}.json`;
  if (fs.existsSync(comments)) texts.push(...JSON.parse(fs.readFileSync(comments, 'utf8')).comments.map(c => c.markdown));
  for (const text of texts) for (const url of references(Buffer.from(md.render(text)), 'text/html', post.origin).links) seeds.add(url);
}
const old = loadArchive();
const resources = new Map(old.resources.map(r => [r.url, r]));
const aliases = new Map(old.resources.flatMap(r => [r.url, ...r.aliases].map(u => [u, r.url])));
const queue = [...seeds], seen = new Set(queue), failures = [];
let bytes = old.resources.reduce((n, r) => n + r.bytes, 0), downloads = 0, reported = 0;
function enqueue(url) { if (!seen.has(url)) { seen.add(url); queue.push(url); } }
function save() {
  fs.mkdirSync(path.dirname(manifestPath), {recursive:true});
  fs.writeFileSync(manifestPath, JSON.stringify({version:1, scope:'Links from migrated articles and retained comments, recursively within /haskell/; directory parent links excluded.', seeds:[...seeds].sort(), resources:[...resources.values()].sort((a,b) => a.url.localeCompare(b.url)), failures}, null, 2) + '\n');
}
async function retrieve(url) {
  const existing = resources.get(aliases.get(url));
  if (existing) {
    Object.assign(existing, references(fs.readFileSync(path.join(rawRoot, existing.path)), existing.type, existing.url));
    existing.links.forEach(enqueue); return;
  }
  try {
    let current = url, response;
    for (let redirects = 0; redirects < 6; redirects++) {
      response = await fetch(current, {redirect:'manual', signal:AbortSignal.timeout(30000)});
      if (![301,302,303,307,308].includes(response.status)) break;
      const next = archiveURL(response.headers.get('location'), current);
      await response.body?.cancel();
      if (!next) throw new Error('Redirect outside /haskell/');
      current = next;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    bytes += data.length;
    if (bytes > 250_000_000 || seen.size > 10000) throw new Error('Archive size review required');
    const type = response.headers.get('content-type') || 'application/octet-stream';
    const relative = archivePath(current), target = path.join(rawRoot, relative);
    const discovered = references(data, type, current);
    fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target, data);
    const record = {url:current, aliases:url === current ? [] : [url], path:relative, type, bytes:data.length, sha256:crypto.createHash('sha256').update(data).digest('hex'), retrieved:new Date().toISOString(), ...discovered};
    const previous = resources.get(current);
    if (previous) record.aliases = [...new Set([...previous.aliases, ...record.aliases])];
    resources.set(current, record); aliases.set(url, current); aliases.set(current, current);
    discovered.links.forEach(enqueue); downloads++;
  } catch (error) { failures.push({url, error:error.message}); console.error(`${url}: ${error.message}`); }
}
while (queue.length) {
  await Promise.all(queue.splice(0, 4).map(retrieve));
  save();
  if (downloads - reported >= 40) { console.log(`${resources.size} resources, ${(bytes/1e6).toFixed(1)} MB, ${queue.length} queued`); reported=downloads; }
  if (bytes > 250_000_000 || seen.size > 10000) throw new Error('Archive size review required; progress saved');
}
save();
console.log(`Archived ${resources.size} resources (${(bytes/1e6).toFixed(1)} MB); ${failures.length} unresolved URLs.`);
if (failures.length) process.exitCode = 1;
