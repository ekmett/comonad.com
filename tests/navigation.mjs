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
  assert.equal(doc.querySelectorAll('.calendar .selected-day').length,entry.date.length===10?1:0,'Never invent a day for imprecisely dated talks');
}
for(const month of months) {
  const file=`dist/reader/${month.replace('-','/')}/index.html`, doc=read(file);
  assert.equal(doc.querySelectorAll('.archive-entry').length,entries.filter(entry=>entry.date.startsWith(month)).length,'Month archive includes both sources and talks');
  for(const a of doc.querySelectorAll('.archive-sidebar a')) {
    const [href,fragment]=a.getAttribute('href').split('#');
    const target=path.resolve(path.dirname(file),href,'index.html');
    assert.ok(fs.existsSync(target),`Calendar destination exists: ${target}`);
    if(fragment)assert.ok(read(target).getElementById(fragment),'Multi-post days have a destination anchor');
  }
  const linkedDays=[...doc.querySelectorAll('.calendar td a')].map(a=>Number(a.textContent));
  const datedDays=[...new Set(entries.filter(entry=>entry.date.startsWith(month)&&entry.date.length===10).map(entry=>Number(entry.date.slice(-2))))].sort((a,b)=>a-b);
  assert.deepEqual(linkedDays,datedDays,'Exactly the known publication days are linked');
  const first=[...doc.querySelectorAll('.calendar tbody td')].findIndex(td=>td.textContent==='1');
  assert.equal(first,(new Date(`${month}-01T12:00:00Z`).getUTCDay()+6)%7,'Calendar weekdays align');
}
console.log(`Navigation passed: ${entries.length} chronological entries and ${months.size} month calendars.`);
