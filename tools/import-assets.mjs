import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import MarkdownIt from 'markdown-it';
import {parseHTML} from 'linkedom';
const manifest='content/assets-manifest.json';
const records=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):[];
const md=new MarkdownIt({html:true}), wanted=new Set();
for(const article of JSON.parse(fs.readFileSync('content/articles.json','utf8'))) {
  const doc=parseHTML(md.render(fs.readFileSync(`content/articles/${article.slug}.md`,'utf8'))).document;
  for(const node of doc.querySelectorAll('img[src],a[href]')) {
    const href=node.getAttribute('src')||node.getAttribute('href');
    if(href.startsWith('#') || href.startsWith('/figures/')) continue;
    const url=new URL(href,article.origin);
    if(url.hostname==='comonad.com' && url.pathname.startsWith('/haskell/')) continue;
    if(node.tagName==='IMG' || (url.hostname==='comonad.com' && /\.(?:pdf|png|gif|jpg|jpeg|svg|hs|lhs|cs|zip|gz|key|ppt|pptx)$/i.test(url.pathname))) {url.hash='';wanted.add(url.href);}
  }
}
for(const url of wanted) {
  if(records.some(r=>r.url===url && r.path)) continue;
  const record={url,retrieved:new Date().toISOString()};
  try {
    let retrieval=url.replace('http://ekmett.github.com/','https://ekmett.github.io/').replace('http://ekmett.github.io/','https://ekmett.github.io/').replace('http://upload.wikimedia.org/','https://upload.wikimedia.org/');
    const response=await fetch(retrieval,{signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    const data=Buffer.from(await response.arrayBuffer());
    const hash=crypto.createHash('sha256').update(data).digest('hex');
    const name=decodeURIComponent(new URL(url).pathname.split('/').at(-1)).replace(/[^a-zA-Z0-9._-]/g,'-');
    const output=`assets/imported/${hash.slice(0,12)}-${name}`;
    fs.mkdirSync('content/assets/imported',{recursive:true});
    fs.writeFileSync('content/'+output,data);
    Object.assign(record,{retrieval:response.url,path:output,sha256:hash,bytes:data.length,type:response.headers.get('content-type')});
  }catch(error){record.error=error.message;console.error(url,error.message);}
  const index=records.findIndex(r=>r.url===url);if(index<0)records.push(record);else records[index]=record;
  fs.writeFileSync(manifest,JSON.stringify(records,null,2)+'\n');
}
console.log(`${records.filter(r=>r.path).length} local assets; ${records.filter(r=>r.error).length} unresolved.`);
