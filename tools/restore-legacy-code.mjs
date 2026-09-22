// Recover block structure from preserved HTML, matching the existing Markdown
// by code tokens so prose edits and inline references are left in place.
import fs from 'node:fs';
import MarkdownIt from 'markdown-it';
import {parseHTML} from 'linkedom';
const md=new MarkdownIt();
const compact=s=>s.replace(/\s/g,'');
const ledger=JSON.parse(fs.readFileSync('content/code-formatting.json'));
const selected={
 'generalizing-dot':'haskell',
 'parameterized-monads-in-haskell':'haskell',
 'unnatural-transformations-and-quantifiers':'haskell',
 'introducing-speculation':'haskell',
 'hackage-mirror':'text',
 'some-rough-notes-on-univalent-foundations-and-b-systems-part-i':'text'
};
for(const a of JSON.parse(fs.readFileSync('content/articles.json')).filter(a=>a.slug in selected)){
 const original=parseHTML(fs.readFileSync(a.rawHTML,'utf8')).document.querySelector('.post-content');
 const candidates=[...original.querySelectorAll('code,p')].filter(n=>!n.closest('pre')&&n.querySelector('br')&&(n.tagName==='CODE'||(!n.querySelector('code,pre,a,img')&&/^(?:class |instance |newtype |data |type |-- |\w+ ::)/.test(n.textContent.trim()))));
 const file=`content/articles/${a.slug}.md`,source=fs.readFileSync(file,'utf8'),lines=source.split('\n'),changes=[];
 for(const t of md.parse(source,{})){
  if(t.type!=='inline')continue;
  const text=parseHTML('<p>'+md.renderInline(t.content)+'</p>').document.querySelector('p').textContent;
  const match=candidates.find(n=>compact(n.textContent)===compact(text));if(!match)continue;
  // Source BRs are generally followed by literal newlines; avoid doubling them.
  const clone=match.cloneNode(true);clone.querySelectorAll('br').forEach(br=>br.replaceWith(br.nextSibling?.textContent.startsWith('\n')?'':'\n'));
  let code=clone.textContent.replaceAll('\u00a0',' ').replaceAll('\t','    ').split('\n').map(l=>l.trimEnd()).join('\n').replace(/^\n+|\n+$/g,'');
  const indent=Math.min(...code.split('\n').filter(l=>l.trim()).map(l=>l.match(/^ */)[0].length));
  if(indent)code=code.split('\n').map(l=>l.slice(indent)).join('\n');
  changes.push({map:t.map,code});
 }
 for(const {map,code} of changes.reverse())lines.splice(map[0],map[1]-map[0],'```'+selected[a.slug],code,'```');
 if(changes.length){fs.writeFileSync(file,lines.join('\n'));ledger.push({article:a.slug,change:'Restore '+changes.length+' flattened code blocks from original HTML line breaks; preserve tokens and relative indentation.',language:selected[a.slug],blocks:changes.length});}
}
for(const slug of ['snippets-fmap','snippets-mandelbrot']){
 const file=`content/articles/${slug}.md`,s=fs.readFileSync(file,'utf8'),lines=s.split('\n');let count=0;
 for(const t of md.parse(s,{}))if(t.type==='fence'&&['text',''].includes(t.info)&&!t.content.startsWith('<edwardk>')&&(/fmap|putChunk/.test(t.content))){lines[t.map[0]]=lines[t.map[0]].replace(/```.*$/, '```haskell');count++;}
 if(count){fs.writeFileSync(file,lines.join('\n'));ledger.push({article:slug,change:'Label '+count+' unambiguous Haskell examples for highlighting; content unchanged.'});}
}
fs.writeFileSync('content/code-formatting.json',JSON.stringify(ledger,null,2)+'\n');
