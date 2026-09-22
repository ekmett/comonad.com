import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import MarkdownIt from 'markdown-it';
const read = p => fs.readFileSync(p, 'utf8');
const document = p => parseHTML(read(p)).document;
const posts = JSON.parse(read('content/articles.json'));
const md = new MarkdownIt({html:true});
const compact = text => text.replace(/\s+/g, '');
let totalBlocks = 0;
for (const post of posts) {
  const file = 'dist/' + post.path + 'index.html';
  const doc = document(file);
  const blocks = [...doc.querySelectorAll('.prose pre code')];
  const source = read(`content/articles/${post.slug}.md`);
  const allFences = md.parse(source, {}).filter(t => t.type === 'fence');
  const expected = allFences.filter(t => t.info !== 'crc-math');
  assert.equal(blocks.length, expected.length, `${post.slug}: no lost code blocks`);
  expected.forEach((token, i) => {
    assert.equal(blocks[i].textContent, token.content, `${post.slug}: highlighting preserves code ${i+1}`);
    assert.equal(blocks[i].className, 'language-' + (token.info || 'text'));
    assert.ok(!/[\u00a0\t]/.test(blocks[i].textContent), 'no blog padding or tabs');
  });
  totalBlocks += allFences.length;
  if(post.source==='Flipcode') {
    const original=document(post.rawHTML);
    const tables=[...original.querySelectorAll('table[style]')].filter(t=>t.getAttribute('style').includes('table-layout'));
    let before=tables.map(t=>t.querySelector('td').textContent).join('');
    for(const change of JSON.parse(read('content/editorial-changes.json')).filter(e=>e.article===post.slug&&e.status==='applied'&&!e.field))before=before.replaceAll(change.before,change.after);
    assert.equal(compact(doc.querySelector('.prose').textContent),compact(before),post.slug+': complete column, including code and headings');
    const oldBlocks=tables.flatMap(t=>[...t.querySelectorAll('pre')]);
    assert.equal(oldBlocks.length,blocks.length);
    oldBlocks.forEach((b,i)=>assert.equal(compact(b.textContent),compact(blocks[i].textContent),post.slug+': unchanged code tokens'));
  }
  if(post.source==='Comonad.Reader') {
    const original=document(post.rawHTML), oldProse=original.querySelector('.post-content');
    const restored=JSON.parse(read('content/code-formatting.json')).some(e=>e.article===post.slug&&e.blocks);
    const candidates=[...oldProse.querySelectorAll('pre,code,p')].filter(n=>n.tagName==='PRE'||(restored&&!n.closest('pre')&&n.querySelector('br')&&(n.tagName==='CODE'||(!n.querySelector('code,pre,a,img')&&/^(?:class |instance |newtype |data |type |-- |\w+ ::)/.test(n.textContent.trim())))));
    const before=candidates.filter(n=>n.tagName==='PRE'||blocks.some(b=>compact(b.textContent)===compact(n.textContent)));
    const restoredCount=JSON.parse(read('content/code-formatting.json')).filter(e=>e.article===post.slug).reduce((sum,e)=>sum+(e.blocks||0),0);
    assert.equal(blocks.length,oldProse.querySelectorAll('pre').length+restoredCount,post.slug+': every restored block retained');
    assert.equal(before.length,blocks.length,`${post.slug}: every historical code block retained`);
    before.forEach((block,i)=>assert.equal(compact(blocks[i].textContent),compact(block.textContent.replace(/^> ?/gm,'').replace(/\\\\(?=[a-z])/g,'\\')),`${post.slug}: historical code tokens ${i+1}`));
    const ledger=JSON.parse(read(`content/comments/${post.slug}.json`));
    assert.equal(ledger.decisions.length,original.querySelectorAll('li[id^="comment-"]').length);
    assert.equal(ledger.comments.length,doc.querySelectorAll('.comment').length);
    for(const comment of ledger.comments) {
      const old=original.getElementById(comment.id);
      const text=[...old.children].filter(n=>['P','PRE','BLOCKQUOTE','UL','OL'].includes(n.nodeName)).map(n=>n.textContent).join('');
      const current=doc.getElementById(comment.id).cloneNode(true);current.querySelector('header').remove();
      assert.equal(compact(current.textContent),compact(text),`${post.slug}: verbatim comment ${comment.id}`);
    }
  }
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.ok(!/@@@|```|<!-- (demo|figure):/.test(doc.querySelector('.prose').innerHTML),post.slug+': no unrendered markup');
  for (const asset of doc.querySelectorAll('img[src], script[src], link[rel="stylesheet"]')) {
    const url = asset.getAttribute('src') || asset.getAttribute('href');
    assert.ok(!/^(https?:)?\/\//.test(url), `no remote rendering dependency: ${url}`);
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), url.split(/[?#]/)[0])), `missing local asset: ${url}`);
  }
  for (const link of doc.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href');
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
    const [target, hash] = href.split('#');
    let targetFile = target ? path.resolve(path.dirname(file), decodeURI(target)) : path.resolve(file);
    if (targetFile.endsWith('/') || (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory())) targetFile = path.join(targetFile, 'index.html');
    assert.ok(fs.existsSync(targetFile), `missing link: ${href}`);
    if (hash && targetFile.endsWith('.html')) {
      const targetDoc = document(targetFile);
      assert.ok([hash, decodeURIComponent(hash)].some(id => targetDoc.getElementById(id) || [...targetDoc.querySelectorAll('a[name]')].some(a => a.getAttribute('name') === id)), `missing anchor: ${href}`);
    }
  }
  if (['kan-extensions','kan-extensions-ii'].includes(post.slug)) {
    const original = document(`content/original/${post.slug}.html`);
    const old = original.querySelector('.post-content');
    const originals = [...old.querySelectorAll('pre')];
    assert.equal(originals.length, blocks.length);
    originals.forEach((block, i) => {
      const repaired = block.textContent.replace(/^> ?/gm, '').replace(/\\\\(?=[a-z])/g, '\\');
      assert.equal(compact(blocks[i].textContent), compact(repaired), `historical code tokens preserved: ${post.slug} #${i+1}`);
    });
    // Compare prose and section headings independently of code, equations, or new figures.
    const normalize = container => {
      container.querySelectorAll('pre, figure, .post-info, .post-footer').forEach(n => n.remove());
      container.querySelectorAll('img').forEach(n => {
        n.replaceWith(n.getAttribute('alt').replace(/^\$|\$$/g, '').replaceAll('->', '\\to'));
      });
      container.querySelectorAll('.katex').forEach(n => n.replaceWith(n.querySelector('annotation').textContent));
      let text=container.textContent;
      for(const change of JSON.parse(read('content/editorial-changes.json')).filter(c=>c.status==='applied'&&c.article===post.slug))text=text.replaceAll(change.before,change.after);
      return compact(text);
    };
    assert.equal(normalize(doc.querySelector('.prose')), normalize(old), `${post.slug}: complete original prose`);
    const ledger = JSON.parse(read(`content/comments/${post.slug}.json`));
    assert.equal(ledger.decisions.length, original.querySelectorAll('li[id^="comment-"]').length);
    assert.equal(ledger.comments.length, doc.querySelectorAll('.comment').length);
    for (const c of ledger.comments) {
      const originalNode = original.getElementById(c.id);
      const before = [...originalNode.children].filter(n => ['P','PRE','BLOCKQUOTE','UL','OL'].includes(n.nodeName)).map(n => n.textContent).join('');
      const after = doc.getElementById(c.id).cloneNode(true); after.querySelector('header').remove();
      assert.equal(compact(after.textContent), compact(before), `comment wording: ${c.id}`);
    }
  } else if (post.slug === 'parallel-crc') {
    const original = read('dist/source/original/parallel-crc.md');
    const originalBlocks = md.parse(original, {}).filter(t => t.type === 'fence');
    const rendered = [...doc.querySelectorAll('.prose pre code, .prose .math-derivation')];
    assert.equal(originalBlocks.length, rendered.length);
    originalBlocks.forEach((block, i) => assert.equal(rendered[i].getAttribute('data-original-text') ?? rendered[i].textContent, block.content.replace(/^-- \/?show\n/gm,'').split('\n').map(line => line.trimEnd()).join('\n')));
    // Compare all prose outside fenced code, ignoring only the old collapse controls.
    const prose = text => compact(text.replace(/```[^\n]*\n[\s\S]*?```/g,'').replace(/<!-- demo:(split|tree) -->/g,'').replace(/<details>\n<summary>Expanded implementation<\/summary>|<\/details>|@@@/g,'').replace(/^## /gm,'').replace(/^=+$/gm,''));
    let typesetOriginal = original.replace('<code>CRC(a) = crc(INIT,a) `xor` FINAL</code>', '``CRC(a) = crc(INIT,a) `xor` FINAL``');
    const typography = JSON.parse(read('content/typography.json'))[post.slug];
    for (const [before, after] of Object.entries(typography)) typesetOriginal = typesetOriginal.replaceAll(before, after);
    assert.equal(prose(source), prose(typesetOriginal), 'CRC: all original prose retained with explicit notation improvements');
    assert.ok([...doc.querySelectorAll('.prose p code')].some(n => n.textContent === 'CRC(a) = crc(INIT,a) `xor` FINAL'), 'inline Haskell keeps its backticks');
  }
}
console.log(`Preservation checks passed: ${posts.length} complete articles, ${totalBlocks} source blocks (including typeset derivations), selected comments, and local rendering assets.`);
