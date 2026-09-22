import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {parseHTML} from 'linkedom';
const read = file => parseHTML(fs.readFileSync(file,'utf8')).document;
const root = 'dist/reader/index.html';
const entries = [...read(root).querySelectorAll('.archive-entry')].map(entry=>({
  file:path.resolve(path.dirname(root),entry.querySelector('h3 a').getAttribute('href'),'index.html'),
  date:entry.querySelector('time').getAttribute('datetime')
}));
const months = new Set(entries.filter(entry=>entry.date.length>=7).map(entry=>entry.date.slice(0,7)));
for(const [index,entry] of entries.entries()) {
  const doc=read(entry.file);
  for(const [rel,neighbor] of [['prev',entries[index+1]],['next',entries[index-1]]]) {
    const link=doc.querySelector(`.post-navigation [rel=${rel}]`);
    assert.equal(Boolean(link),Boolean(neighbor),'No wraparound at chronology endpoints');
    if(link)assert.equal(path.resolve(path.dirname(entry.file),link.getAttribute('href'),'index.html'),neighbor.file,'Neighbor follows the combined timeline');
  }
  assert.equal(doc.querySelector('.calendar-year>a:not([aria-label])').textContent,entry.date.slice(0,4),'Sidebar uses the entry year');
}
for(const month of months) {
  const file=`dist/reader/${month.replace('-','/')}/index.html`, doc=read(file);
  assert.equal(doc.querySelectorAll('.archive-entry').length,entries.filter(entry=>entry.date.startsWith(month)).length,'Month archive includes both sources and talks');
 }
const years=[...new Set(entries.map(entry=>entry.date.slice(0,4)))];
for(const year of years){
 const file=`dist/reader/${year}/index.html`,doc=read(file);
 assert.equal(doc.querySelectorAll('.archive-month-grid > *').length,12,'Year overview shows twelve months');
 for(const a of doc.querySelectorAll('.archive-sidebar a')){
   const [href,fragment]=a.getAttribute('href').split('#');
   const target=href?path.resolve(path.dirname(file),href,'index.html'):path.resolve(file);
   assert.ok(fs.existsSync(target),`Archive destination exists: ${target}`);
   if(fragment)assert.ok(read(target).getElementById(fragment),'Month overview links to its article list');
 }
 const listed=[...doc.querySelectorAll('.calendar-day li a')].map(a=>path.resolve(path.dirname(file),a.getAttribute('href'),'index.html')).sort();
 assert.deepEqual(listed,entries.filter(entry=>entry.date.startsWith(year)).map(entry=>entry.file).sort(),'Every entry in the year is listed exactly once, including imprecise dates');
 assert.ok(doc.querySelector('.archive-disclosure > summary'),'Archive can be toggled without JavaScript');
 for(const a of doc.querySelectorAll('.archive-month-grid a'))assert.ok(doc.querySelector(a.getAttribute('href'))?.querySelector('li a'),'Populated months lead to articles');
}
console.log(`Navigation passed: ${entries.length} chronological entries and ${months.size} month archives and ${years.length} yearly sidebars.`);

const articles=JSON.parse(fs.readFileSync('content/articles.json'));
const collections=JSON.parse(fs.readFileSync('content/collections.json'));
for(const article of articles.filter(a=>a.series)){
 const doc=read('dist/'+article.path+'index.html');
 const members=collections.find(c=>c.slug===article.series).links.map(l=>articles.find(a=>a.origin===l.origin)).filter(Boolean);
 const links=[...doc.querySelectorAll('.series-navigation li a')];
 assert.equal(links.length,members.length,'Series lists all articles');
 links.forEach((a,i)=>assert.ok(a.getAttribute('href').endsWith(members[i].path),'Original series order'));
 assert.equal(doc.querySelector('.series-navigation [aria-current="page"]').textContent,article.originalTitle||article.title);
}
for(const slugs of [['free-monads-for-less','free-monads-for-less-2','free-monads-for-less-3'],['2019-monadic-party-guanxi-1','2019-monadic-party-guanxi-2','2019-monadic-party-guanxi-3','2019-monadic-party-guanxi-4']]){
 const ascending=[...entries].reverse().filter(e=>slugs.some(s=>e.file.endsWith('/'+s+'/index.html')));
 assert.deepEqual(ascending.map(e=>e.file.split('/').at(-2)),slugs,'Reading chronology follows numbered parts');
}
