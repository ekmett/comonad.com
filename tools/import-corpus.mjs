// One-time conversion. Existing, hand-edited article Markdown is never overwritten.
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import TurndownService from 'turndown';
import MarkdownIt from 'markdown-it';

const catalog = JSON.parse(fs.readFileSync('content/corpus.json','utf8'));
const articles = JSON.parse(fs.readFileSync('content/articles.json','utf8'));
const collections = JSON.parse(fs.readFileSync('content/collections.json','utf8')); // Preserve curated membership and ordering.
const td = new TurndownService({headingStyle:'atx',codeBlockStyle:'fenced',emDelimiter:'*',bulletListMarker:'-'});
td.keep(['sup','sub','table','details','summary']);
export function cleanCode(text) {
  let code = text.replaceAll('\u00a0',' ').replaceAll('\r','').replaceAll('\t','        ').replace(/^> ?/gm,'').replace(/\\\\(?=[a-z])/g,'\\');
  code = code.split('\n').map(s=>s.trimEnd()).join('\n').replace(/^\n+|\n+$/g,'');
  const indent = Math.min(...code.split('\n').filter(s=>/^ +\S/.test(s)).map(s=>s.match(/^ */)[0].length));
  if (indent >= 8 && Number.isFinite(indent)) code=code.replace(/^ +/gm,s=>' '.repeat(Math.floor(s.length/8)*2+s.length%8));
  return code;
}
td.addRule('sourceCode', {filter:'pre', replacement:(_,node)=>{
  let language = ['haskell','ocaml','scheme'].find(s=>node.classList.contains(s)) || 'haskell';
  const code=cleanCode(node.textContent);
  return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
}});
td.addRule('mathImages', {filter:node=>node.nodeName==='IMG' && /\/latex\//.test(node.getAttribute('src')||''),replacement:(_,node)=> '$'+node.getAttribute('alt').replace(/^\$|\$$/g,'').replaceAll('->','\\to')+'$'});
td.addRule('preserveAnchors', {filter:node=>['SPAN','A'].includes(node.nodeName) && (node.id || node.getAttribute('name')) && !node.textContent.trim(),replacement:(_,node)=>`<span id="${node.id || node.getAttribute('name')}"></span>`});
td.addRule('paragraphHeading', {filter:node=>node.nodeName==='P' && node.children.length===1 && ['B','STRONG'].includes(node.firstElementChild.nodeName) && node.textContent.trim()===node.firstElementChild.textContent.trim(),replacement:content=>'\n\n## '+content.replace(/^\*\*|\*\*$/g,'')+'\n\n'});
const dateLabel = date => new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const identity = url => url.replace(/^https?:\/\/(?:www\.)?(?:schoolofhaskell|fpcomplete)\.com/,'school:').replace(/\/$/,'');
for (const item of [...catalog.blog,...catalog.school]) {
  if (!item.raw) throw new Error('Missing snapshot: '+item.origin);
  const doc=parseHTML(fs.readFileSync(item.raw,'utf8')).document;
  const isBlog=item.origin.includes('comonad.com/reader/');
  const slug=isBlog?new URL(item.origin).pathname.split('/').filter(Boolean).at(-1):new URL(item.origin).pathname.replace('/user/edwardk/','').replaceAll('/','-');
  if (item.kind==='collection') {
    const main=doc.querySelector('.main-content');
    const body=main.querySelector('[itemprop="desc"] article');
    const links=[...main.querySelectorAll('.media-heading a')].filter(a=>!a.classList.contains('author-name')).map(a=>({title:a.textContent.trim(),origin:a.getAttribute('href')}));
    if(!collections.some(c=>c.slug===slug)) collections.push({slug,title:item.title,origin:item.origin,path:`reader/series/${slug}/`,description:body?td.turndown(body.innerHTML):'',links,raw:item.raw});
    continue;
  }
  const existing=articles.find(a=>identity(a.origin)===identity(item.origin));
  const record=existing || {slug,title:item.title,date:item.date,dateLabel:dateLabel(item.date),path:`reader/${item.date.slice(0,4)}/${slug}/`,categories:item.categories||'Haskell',origin:item.origin};
  record.author=item.author;record.source=isBlog?'Comonad.Reader':'School of Haskell';record.rawHTML=item.raw;
  record.rawSource=item.markdown||item.raw;record.rawFormat=item.markdown?'md':'html';
  if(isBlog) record.legacyId=doc.querySelector('[name="comment_post_ID"]')?.getAttribute('value') || doc.querySelector('[id^="more-"]')?.id.replace('more-','');
  else {record.rawURL=item.rawURL;record.dateBasis='Date displayed by School of Haskell; may reflect a later revision.';}
  if(!existing) articles.push(record);
  const target=`content/articles/${record.slug}.md`;
  if(fs.existsSync(target)) continue;
  let markdown;
  if(isBlog) {
    const body=doc.querySelector('.post-content').cloneNode(true);
    body.querySelectorAll('.post-info,.post-footer').forEach(n=>n.remove());
    // Preserve content assets with explicit origins before relocating the article.
    for(const node of body.querySelectorAll('[href],[src]')) for(const attr of ['href','src']) if(node.hasAttribute(attr)) {
      const value=node.getAttribute(attr); if(!value.startsWith('#')) node.setAttribute(attr,new URL(value,item.origin).href);
    }
    markdown=td.turndown(body.innerHTML);
  } else {
    markdown=fs.readFileSync(item.markdown,'utf8');
    // School directives control its old editor. Keep the program, remove UI directives.
    markdown=markdown.replace(/^```\s*(?:active\s+)?haskell(?:\s+web)?\s*$/gm,'```haskell').replace(/^-- \/?show\s*$/gm,'').replace(/^@@@.*$/gm,'');
    const tokens=new MarkdownIt({html:true}).parse(markdown,{});
    const lines=markdown.split('\n');
    for(const t of tokens) if(t.type==='heading_open' && t.tag==='h1') {
      const start=t.map[0]; if(/^# /.test(lines[start])) lines[start]='#'+lines[start];
      else if(/^=+\s*$/.test(lines[start+1]||'')) lines[start+1]='---';
    }
    markdown=lines.join('\n');
  }
  fs.writeFileSync(target,markdown.trim()+'\n');
}
articles.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
fs.writeFileSync('content/articles.json',JSON.stringify(articles,null,2)+'\n');
fs.writeFileSync('content/collections.json',JSON.stringify(collections,null,2)+'\n');
console.log(`Imported ${articles.length} articles and ${collections.length} collections; existing Markdown preserved.`);
