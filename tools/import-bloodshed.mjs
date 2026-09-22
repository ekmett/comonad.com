// Restore the complete paper from its archived preformatted HTML.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {parseHTML} from 'linkedom';
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const save=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const slug='wavelets-in-3d-graphics';
const raw='content/original/external/bloodshed-haar.html';
const origin='https://web.archive.org/web/20010526225638/http://www.bloodshed.com:80/wavelets/haar.shtml';
const pre=parseHTML(fs.readFileSync(raw,'utf8')).document.querySelector('pre');
pre.querySelectorAll('b').forEach(n=>n.replaceWith('\n\n## '+n.textContent.trim()+'\n\n'));
// The title and author contact lines are represented by page metadata/source.
let text=pre.textContent.slice(pre.textContent.indexOf('Wavelets have become')).trim();
const edits=json('content/editorial-changes.json');
for(const [before,after] of [['mutliresolution','multiresolution'],['teture','texture'],['coeffients','coefficients'],['exract','extract'],['occured','occurred'],['occurance','occurrence'],['conpression','compression'],['noticable','noticeable'],['futher','further'],['tesselation','tessellation'],['didnt',"didn’t"],['isnt',"isn’t"]]){
 if(text.includes(before)){
  text=text.replaceAll(before,after);
  if(!edits.some(e=>e.article===slug&&e.before===before))edits.push({article:slug,before,after,status:'applied',reason:'Unambiguous prose spelling.'});
 }
}
let markdown=text.split(/\n\s*\n/).map(block=>{
 const lines=block.split('\n').map(line=>line.trimEnd());
 if(block.startsWith('## '))return block;
 // Preserve tabular examples and tree drawings, not the old fixed-width prose.
 if(lines.some(line=>/ {6,}\S|^ {2,}[\\/\d]/.test(line)))return '```text\n'+lines.join('\n')+'\n```';
 return lines.map(line=>line.trim()).join(' ').replace(/2\^([nm])/g,'2<sup>$1</sup>');
}).join('\n\n')+'\n';
for(const figure of json('content/figures/wavelet-diagrams.json').figures)markdown=markdown.replace('```text\n'+figure.originalText+'\n```',figure.markup);
if(!fs.existsSync(`content/articles/${slug}.md`))fs.writeFileSync(`content/articles/${slug}.md`,markdown);
for(const [before,after,reason] of [
 ['The scaling value                     { 6 }','The scaling value                     { 5 }','The preceding reduction gives 5; possible mathematical typo, retained for review.'],
 ['This is don\'t to normalize','This is done to normalize','Likely wording error, retained for review.'],
 ['provides the sample number of values','provides the same number of values','Likely wording error, retained for review.']
])if(!edits.some(e=>e.article===slug&&e.before===before))edits.push({article:slug,before,after,status:'review',reason});
save('content/editorial-changes.json',edits);
const articles=json('content/articles.json');
if(!articles.some(a=>a.slug===slug))articles.push({slug,title:'Wavelets in 3D Graphics',date:'1995',dateLabel:'Circa 1995',datePrecision:'year',dateApproximate:true,path:`reader/1995/${slug}/`,categories:'Graphics · Wavelets · Compression',origin,author:'Edward Kmett',source:'Bloodshed / Harmless Entertainment',rawHTML:raw,rawSource:raw,rawFormat:'html',dateBasis:'Circa 1995, recalled by Edward Kmett on 22 September 2026. The preserved 26 May 2001 snapshot contains references dated through 1997; its revision history is unknown. The archive capture is not a publication date.'});
save('content/articles.json',articles);
const research=json('content/external-articles.json');
const record=research.articles.find(a=>a.id==='kmett-pre2001-wavelets-3d-graphics');
Object.assign(record,{dateValue:'1995',datePrecision:'year',dateApproximate:true,dateBasis:'Circa 1995, author recollection on 2026-09-22',dateConfidence:'Approximate author recollection; captured version may contain later revisions'});
record.dates=record.dates.filter(d=>d.type!=='author_recollection');record.dates.unshift({value:'1995',type:'author_recollection',precision:'year',approximate:true,evidence:'Edward Kmett: “it was written circa 1995” (2026-09-22).'});
record.uncertainty=['The author recalls writing it circa 1995. The surviving 2001 snapshot includes bibliography entries dated through 1997; revision dates are unknown. The adjacent dsp.zip date does not date the paper.'];
save('content/external-articles.json',research);
const manifest=json('content/external-preservation.json');
for(const [file,url] of [[raw,origin],['content/original/external/bloodshed-wavelets-introduction.html','https://web.archive.org/web/20011121083059/http://www.bloodshed.com:80/wavelets/start.shtml']]){
 const data=fs.readFileSync(file);
 if(!manifest.some(a=>a.path===file))manifest.push({url,path:file,sha256:crypto.createHash('sha256').update(data).digest('hex'),bytes:data.length,mime:'text/html',retrieved:'2026-09-22'});
}
save('content/external-preservation.json',manifest);
console.log('Restored Wavelets in 3D Graphics, approximately 1995.');
