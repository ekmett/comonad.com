// Restore the four authored columns from preserved publisher HTML.
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import Turndown from 'turndown';
const records=JSON.parse(fs.readFileSync('content/external-articles.json')).articles.filter(a=>a.id.includes('harmless-algorithms'));
const articles=JSON.parse(fs.readFileSync('content/articles.json'));
const edits=JSON.parse(fs.readFileSync('content/editorial-changes.json'));
const td=new Turndown({headingStyle:'atx',codeBlockStyle:'fenced',emDelimiter:'*'});
td.keep(['sup','sub']);
td.addRule('anchors',{filter:node=>node.nodeName==='A'&&node.hasAttribute('name'),replacement:(content,node)=>`<span id="${node.getAttribute('name')}"></span>${content}`});
td.addRule('code',{filter:'pre',replacement:(_,node)=>{
  let code=node.textContent.replaceAll('\r','').replaceAll('\u00a0',' ').replaceAll('\t','    ').split('\n').map(l=>l.trimEnd()).join('\n').trimEnd().replace(/^\n+/, '');
  const indent=Math.min(...code.split('\n').filter(l=>l.trim()).map(l=>l.match(/^ */)[0].length));
  if(indent)code=code.split('\n').map(l=>l.slice(indent)).join('\n');
  const language=/\b(struct|class|typedef|template|int|void|float|bool|return|if|while)\b|\/\//.test(code)?'cpp':'text';
  return '\n\n```'+language+'\n'+code+'\n```\n\n';
}});
for(const [index,record] of records.entries()){
 const slug='harmless-algorithms-'+(index+1), raw='content/original/external/'+record.id+'.html';
 const doc=parseHTML(fs.readFileSync(raw,'utf8')).document;
 const tables=[...doc.querySelectorAll('table[style]')].filter(t=>t.getAttribute('style').includes('table-layout'));
 const sections=tables.map((t,i)=>{
  const node=t.querySelector('td');
  node.querySelectorAll('img[src="line_grey.png"]').forEach(n=>n.remove());
  // Publisher HTML puts bold around LI elements and nested lists beside LI.
  node.querySelectorAll('b,strong').forEach(n=>{if(n.querySelector('li'))n.replaceWith(...n.childNodes);});
  node.querySelectorAll('ul > ul').forEach(n=>{if(n.previousElementSibling?.tagName==='LI')n.previousElementSibling.append(n);});
  for(const a of node.querySelectorAll('a[href]'))a.setAttribute('href',new URL(a.getAttribute('href'),record.url).href);
  if(i%2===0)return '## '+node.textContent.trim();
  return td.turndown(node.innerHTML);
 });
 let markdown=sections.join('\n\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
 // Only unambiguous prose spelling corrections; code tokens remain untouched.
 const corrections=[['psuedo-code','pseudo-code'],['fustrum','frustum'],['occurrance','occurrence'],['seperate','separate'],['ubiqitous','ubiquitous'],['polgyons','polygons']];
 const chunks=markdown.split(/(```[^\n]*\n[\s\S]*?```)/g);
 for(const [before,after] of corrections)for(let i=0;i<chunks.length;i+=2)if(chunks[i].includes(before)){
  chunks[i]=chunks[i].replaceAll(before,after);
  if(!edits.some(e=>e.article===slug&&e.before===before))edits.push({article:slug,before,after,reason:'Unambiguous prose spelling; historical code unchanged.',status:'applied'});
 }
 markdown=chunks.map((chunk,i)=>i%2?chunk:chunk.replace(/(?:[ \t]*\n){2,}/g,'\n\n')).join('');
 markdown=markdown.replace(/\]\((?:https?:\/\/flipcode\.com\/archives\/)?(?:harmless_)?issue0?([1-4])\.(?:shtml|htm)(#[^)]+)?\)/g,(_,n,hash)=>']('+records[Number(n)-1].url+(hash||'')+')');
 if(!fs.existsSync(`content/articles/${slug}.md`))fs.writeFileSync(`content/articles/${slug}.md`,markdown);
 if(!articles.some(a=>a.slug===slug))articles.push({slug,title:record.title.replace(' — Issue 0',' — Part '),date:record.date,dateLabel:new Date(record.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}),path:`reader/${record.date.slice(0,4)}/${slug}/`,categories:'Graphics · Algorithms · C++',origin:record.url,author:'Edward Kmett',source:'Flipcode',rawHTML:raw,rawSource:raw,rawFormat:'html',dateBasis:'Publisher publication date. The original signed date is retained in the article.',series:'harmless-algorithms'});
}
articles.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
fs.writeFileSync('content/articles.json',JSON.stringify(articles,null,2)+'\n');fs.writeFileSync('content/editorial-changes.json',JSON.stringify(edits,null,2)+'\n');
const collections=JSON.parse(fs.readFileSync('content/collections.json'));
if(!collections.some(c=>c.slug==='harmless-algorithms'))collections.push({slug:'harmless-algorithms',title:'Harmless Algorithms',origin:'https://flipcode.com/archives/articles.shtml',path:'reader/series/harmless-algorithms/',description:'Four columns on visibility, scene traversal, and graphics-engine design, originally published on Flipcode between 1999 and 2001.',links:records.map(r=>({title:r.title,origin:r.url}))});
fs.writeFileSync('content/collections.json',JSON.stringify(collections,null,2)+'\n');
console.log('Restored four Flipcode articles.');
