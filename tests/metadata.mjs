import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML,DOMParser} from 'linkedom';
import {createSite} from '../tools/site-metadata.mjs';
const json=p=>JSON.parse(fs.readFileSync(p));
const config=json('content/site.json'),site=createSite(config);
const read=p=>parseHTML(fs.readFileSync('dist/'+p,'utf8')).document;
const articles=json('content/articles.json');
const pubs=json('content/publications.json');
const videos=[...json('content/boston-haskell-videos.json').videos,...json('content/external-talks.json').videos];
for(const entry of [...articles,...pubs,...videos.map(v=>({...v,path:`reader/talks/${v.id}/`}))]){
 const doc=read(entry.path+'index.html'),absolute=site.url(entry.path);
 assert.equal(new URL(doc.querySelector('[rel=canonical]').getAttribute('href'),absolute).href,absolute);
 const metadata=JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent);
 assert.equal(metadata.url,absolute);
 assert.equal(metadata.name,entry.displayTitle||entry.title);
 assert.equal(metadata.isPartOf.url,site.readerUrl);
 assert.deepEqual(metadata.author.map(a=>a.name),entry.authors||entry.speakers||[entry.author]);
 assert.equal(metadata['@type'],entry.videoId?'VideoObject':entry.kind==='Paper'?'ScholarlyArticle':entry.slug?'BlogPosting':'PresentationDigitalDocument');
 if(entry.date?.length<10&&!entry.videoId)assert.ok(!metadata.datePublished,'Do not invent a publication day');
 assert.equal(doc.querySelector('[property="og:url"]').getAttribute('content'),absolute);
}
const root=read('index.html');
assert.equal(root.querySelector('[http-equiv="refresh"]').getAttribute('content'),'0;url=reader/');
assert.equal(root.querySelector('[rel=canonical]').getAttribute('href'),'reader/');
for(const baseUrl of ['https://comonad.com/','https://ekmett.github.io/comonad.com/']){
 const configured=createSite({...config,baseUrl});
 assert.equal(configured.readerUrl,baseUrl+'reader/');
 assert.equal(new URL(root.querySelector('a').getAttribute('href'),baseUrl).href,configured.readerUrl);
 assert.equal(configured.url('reader/2006/hello-world/'),baseUrl+'reader/2006/hello-world/');
 // The same navigation href resolves under both hosting roots.
 const article=articles.find(a=>a.slug==='hello-world');
 const doc=read(article.path+'index.html');
 assert.equal(new URL(doc.querySelector('.site-identity').getAttribute('href'),configured.url(article.path)).href,configured.readerUrl);
 assert.equal(new URL(doc.querySelector('[rel=canonical]').getAttribute('href'),configured.url(article.path)).href,configured.url(article.path));
}
const feed=new DOMParser().parseFromString(fs.readFileSync('dist/feed.xml','utf8'),'text/xml');
for(const item of feed.querySelectorAll('item')){
 assert.ok(item.querySelector('link').textContent.startsWith(site.readerUrl));
 assert.equal(item.querySelector('guid').getAttribute('isPermaLink'),'false');
 const description=parseHTML('<div>'+item.querySelector('description').textContent+'</div>').document;
 for(const a of description.querySelectorAll('[href],[src]'))for(const attr of ['href','src'])if(a.hasAttribute(attr))assert.match(a.getAttribute(attr),/^[a-z][a-z\d+.-]*:/i,'Feed references are absolute');
}
assert.ok(!fs.readFileSync('dist/sitemap.xml','utf8').includes('<loc>https://comonad.com/'),'Sitemap uses the currently deployed origin');
console.log('Metadata passed: author credits, structured types, relative canonicals/redirects at both hosting roots, feed and sitemap URLs.');
