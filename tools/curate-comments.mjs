// Publication decisions are explicit; discovery heuristics never publish comments.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseHTML} from 'linkedom';
import TurndownService from 'turndown';
const posts=JSON.parse(fs.readFileSync('content/articles.json'));
const selections=JSON.parse(fs.readFileSync('content/comment-selections.json'));
const formatting=JSON.parse(fs.readFileSync('content/comment-formatting.json'));
const td=new TurndownService({codeBlockStyle:'fenced'});
td.addRule('code',{filter:'pre',replacement:(_,node)=>'\n\n```haskell\n'+node.textContent.trimEnd()+'\n```\n\n'});
let included=0,total=0;
for(const post of posts.filter(p=>p.source==='Comonad.Reader')) {
  const doc=parseHTML(fs.readFileSync(post.rawHTML||`content/original/${post.slug}.html`,'utf8')).document;
  const comments=[],decisions=[];
  for(const node of doc.querySelectorAll('li[id^="comment-"]')) {
    const reason=selections[post.slug]?.[node.id];
    const content=[...node.children].filter(n=>['P','PRE','BLOCKQUOTE','UL','OL'].includes(n.nodeName)).map(n=>n.outerHTML).join('\n');
    decisions.push({id:node.id,disposition:reason?'include':'not-selected',reason:reason||'Not selected during screening. Raw snapshot retained; no claim of individual manual spam classification.'});
    if(reason) {
      let markdown=td.turndown(content).replace(/^(\d+)\)/gm,'$1\\)');
      const formatted=formatting[post.slug]?.[node.id];
      if(formatted) {
        const hash=crypto.createHash('sha256').update(markdown).digest('hex');
        if(hash!==formatted.sourceMarkdownSha256)throw new Error(`Review comment formatting after source changes: ${post.slug}/${node.id}`);
        markdown=formatted.markdown;
      }
      comments.push({id:node.id,author:node.querySelector('cite')?.textContent||'Anonymous',date:node.querySelector('.commentmetadata')?.textContent.trim()||'',markdown});
    }
  }
  included+=comments.length;total+=decisions.length;
  fs.writeFileSync(`content/comments/${post.slug}.json`,JSON.stringify({reviewed:'2026-09-21',method:'Explicit reviewed selections; all unselected records preserved in the raw source.',comments,decisions},null,2)+'\n');
}
console.log(`${included} selected comments; ${total} original records preserved.`);
