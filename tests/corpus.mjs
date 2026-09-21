import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
const json=p=>JSON.parse(fs.readFileSync(p));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const corpus=json('content/corpus.json'),articles=json('content/articles.json'),collections=json('content/collections.json');
for(const [url,record] of Object.entries(corpus.downloads))assert.equal(hash(record.file),record.sha256,`Snapshot unchanged: ${url}`);
for(const asset of json('content/assets-manifest.json').filter(a=>a.path))assert.equal(hash('content/'+asset.path),asset.sha256,`Asset unchanged: ${asset.url}`);
for(const source of [...corpus.blog,...corpus.school])assert.ok([...articles,...collections].some(a=>a.origin===source.origin||a.aliases?.includes(source.origin)),`Catalog item imported: ${source.origin}`);
const doc=parseHTML(fs.readFileSync('dist/index.html','utf8')).document;
const entries=[...doc.querySelectorAll('.archive-entry')];
const videos=[...json('content/boston-haskell-videos.json').videos,...json('content/external-talks.json').videos];
assert.equal(entries.length,articles.length+new Set(videos.map(v=>v.videoId)).size);
const dates=entries.map(a=>a.querySelector('time').getAttribute('datetime'));
assert.deepEqual(dates,[...dates].sort((a,b)=>b.localeCompare(a)),'Interleaved archive date order');
for(const v of videos){
  const file=`dist/reader/talks/${v.id}/index.html`,d=parseHTML(fs.readFileSync(file,'utf8')).document;
  assert.equal(d.querySelector('[data-video-id]').getAttribute('data-video-id'),v.videoId);
  assert.equal(d.querySelectorAll('iframe').length,0,'No video network load before Play');
  assert.ok(d.querySelector('.talk-speakers').textContent.includes(''+v.speakers[0]),'Speaker attribution');
}
const learning=entries.find(e=>e.textContent.includes('Learning to Learn'));
assert.equal(learning.querySelector('time').getAttribute('datetime'),'2014','Use presentation year, not mirror upload');
console.log(`Corpus checks passed: ${Object.keys(corpus.downloads).length} source hashes, all catalog items represented, ${entries.length} dated entries and ${videos.length} local talk pages.`);
