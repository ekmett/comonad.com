// Explicit, resumable acquisition. Building the site never contacts old hosts.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parseHTML} from 'linkedom';

const root = 'content/original/corpus';
fs.mkdirSync(root, {recursive:true});
const catalogFile = 'content/corpus.json';
const previous = fs.existsSync(catalogFile) ? JSON.parse(fs.readFileSync(catalogFile, 'utf8')) : {downloads:{}};
const catalog = {retrieved:new Date().toISOString(), downloads:previous.downloads, blog:[], school:[], failures:[]};
const write = () => fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2)+'\n');
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
async function get(url) {
  const existing = catalog.downloads[url];
  if (existing && fs.existsSync(existing.file)) return fs.readFileSync(existing.file, 'utf8');
  const response = await fetch(url, {signal:AbortSignal.timeout(45000)});
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  const file = `${root}/${digest(url).slice(0,24)}.${url.includes('/tutorial-raw/') ? 'md' : 'html'}`;
  fs.writeFileSync(file, data);
  catalog.downloads[url] = {file, sha256:digest(data), bytes:data.length, retrieved:new Date().toISOString()};
  return data.toString('utf8');
}
function dateISO(text) {
  const value = new Date(text.trim() + ' UTC');
  if (!Number.isFinite(value.getTime())) throw new Error('Unrecognized article date: '+text);
  return value.toISOString().slice(0,10);
}
const indexQueue = ['http://comonad.com/reader/'], seenIndexes = new Set(indexQueue), blog = new Map();
while (indexQueue.length) {
  const url = indexQueue.shift(), doc = parseHTML(await get(url)).document;
  for (const post of doc.querySelectorAll('.post')) {
    const title = post.querySelector('.post-title a');
    if (!title) continue;
    const origin = title.getAttribute('href');
    if (!/^http:\/\/comonad.com\/reader\/\d{4}\/[^/]+\/$/.test(origin)) continue;
    const info = post.querySelector('.post-info');
    const author = info.textContent.match(/Posted by (.*?) under/)?.[1]?.trim();
    blog.set(origin, {origin, title:title.textContent.trim(), author, date:dateISO(post.querySelector('.post-date').textContent), categories:[...info.querySelectorAll('[rel="category tag"]')].map(n=>n.textContent.trim()).join(' · ')});
  }
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (/^http:\/\/comonad.com\/reader\/page\/\d+\/$/.test(href) && !seenIndexes.has(href)) { seenIndexes.add(href); indexQueue.push(href); }
  }
  write(); console.log(`Blog inventory: ${blog.size} posts, ${seenIndexes.size} index pages`);
}
catalog.blog = [...blog.values()];
for (let i=0; i<catalog.blog.length; i+=4) {
  await Promise.all(catalog.blog.slice(i,i+4).map(async post => {
    try { await get(post.origin); post.raw = catalog.downloads[post.origin].file; }
    catch(error) { catalog.failures.push({url:post.origin,error:error.message}); }
  }));
  write(); console.log(`Blog snapshots: ${Math.min(i+4,catalog.blog.length)}/${catalog.blog.length}`);
}
const schoolRoot = 'https://www.schoolofhaskell.com/user/edwardk';
const schoolQueue = [schoolRoot], seenSchool = new Set(schoolQueue);
while (schoolQueue.length) {
  const batch = schoolQueue.splice(0,4);
  await Promise.all(batch.map(async url => {
    try {
      const doc = parseHTML(await get(url)).document;
      const main = doc.querySelector('.main-content');
      const rawURL = main?.querySelector('.view-source-link')?.getAttribute('href');
      if (url !== schoolRoot) {
        const entry = {origin:url, title:main?.querySelector('[itemprop="name"]')?.textContent.trim(), kind:rawURL?'article':'collection', raw:catalog.downloads[url].file};
        if (rawURL) {
          entry.date = dateISO(main.querySelector('.date').textContent);
          entry.author = main.querySelector('.author')?.textContent.trim() || 'Edward Kmett';
          entry.rawURL = rawURL; await get(rawURL); entry.markdown = catalog.downloads[rawURL].file;
        }
        catalog.school.push(entry);
      }
      for (const a of main?.querySelectorAll('a[href]') || []) {
        let href = new URL(a.getAttribute('href'), url);
        if (!['www.schoolofhaskell.com','schoolofhaskell.com','www.fpcomplete.com','fpcomplete.com'].includes(href.hostname) || !/^\/user\/edwardk(?:\/|$)/.test(href.pathname)) continue;
        href = 'https://www.schoolofhaskell.com' + href.pathname.replace(/\/$/,'');
        if (!seenSchool.has(href)) { seenSchool.add(href); schoolQueue.push(href); }
      }
    } catch (error) { catalog.failures.push({url,error:error.message}); }
  }));
  write(); console.log(`School snapshots: ${catalog.school.length}, ${schoolQueue.length} queued`);
}
write(); console.log(JSON.stringify({blog:catalog.blog.length, school:catalog.school.length, failures:catalog.failures},null,2));
if (catalog.failures.length) process.exitCode=1;
