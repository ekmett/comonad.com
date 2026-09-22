// All rendering happens at build time. Serving dist needs no compiler, database,
// CDN, or access to either original host.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import haskell from 'highlight.js/lib/languages/haskell';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import ocaml from 'highlight.js/lib/languages/ocaml';
import scheme from 'highlight.js/lib/languages/scheme';
import katex from 'katex';
import { parseHTML } from 'linkedom';
import { readerNavigation } from './reader-navigation.mjs';
import { createSite } from './site-metadata.mjs';
import { crcMath } from './article-math.mjs';
import { packageNames, linkPackageMentions } from './package-links.mjs';
const packageCatalog = JSON.parse(fs.readFileSync('content/package-links.json','utf8'));
const siteConfig=JSON.parse(fs.readFileSync('content/site.json','utf8'));
if(process.env.READER_SITE_URL)siteConfig.baseUrl=process.env.READER_SITE_URL;
const publicSite=createSite(siteConfig);
import { loadArchive, archiveLookup, buildArchive, localArchiveLink } from './haskell-archive.mjs';

hljs.registerLanguage('haskell', haskell);
for (const [name, grammar] of Object.entries({c,cpp,ocaml,scheme})) hljs.registerLanguage(name,grammar);
const articles = JSON.parse(fs.readFileSync('content/articles.json', 'utf8'));
const newestFirst=(a,b)=>b.date.localeCompare(a.date)||((a.series&&a.series===b.series)?(b.seriesOrder||0)-(a.seriesOrder||0):0)||a.title.localeCompare(b.title);
articles.sort(newestFirst);
const collections = JSON.parse(fs.readFileSync('content/collections.json','utf8'));
const videoSources=['content/boston-haskell-videos.json','content/external-talks.json'].filter(f=>fs.existsSync(f)).flatMap(f=>{const data=JSON.parse(fs.readFileSync(f,'utf8'));return data.videos || data;});
function dateLabel(date) {
  if(date.length===4)return date+' · day unknown';
  if(date.length===7)return new Date(date+'-01T12:00:00Z').toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'UTC'})+' · day unknown';
  return new Date(date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
}
const videos=[...new Map(videoSources.map(v=>[v.videoId || v.id,v])).values()].map(v=>{
  const date=v.eventDate||v.eventMonth||v.eventYear||v.date;
  const dateNote=v.eventDate||v.eventMonth||v.eventYear?'':v.dateBasis==='publication'?' · published':' · uploaded';
  return {...v,title:v.displayTitle||v.title,originalTitle:v.title,date,dateNote,path:`reader/talks/${v.id}/`,author:(v.speakers||[]).join(', '),source:v.publisher||v.event||'Talk',dateLabel:dateLabel(date),kind:v.archiveType==='stream'?'Stream':'Talk'};
});
const publications=JSON.parse(fs.readFileSync('content/publications.json','utf8')).map(p=>({...p,author:p.authors.join(', '),dateLabel:dateLabel(p.date)}));
const talkThumbnails=JSON.parse(fs.readFileSync('content/talk-thumbnails.json','utf8'));
const externalPreservation=JSON.parse(fs.readFileSync('content/external-preservation.json','utf8'));
const timeline=[...articles.map(a=>({...a,kind:'Article'})),...videos,...publications].sort(newestFirst);
const navigation=readerNavigation(timeline);
const importedAssets = fs.existsSync('content/assets-manifest.json') ? JSON.parse(fs.readFileSync('content/assets-manifest.json','utf8')) : [];
function sourceKey(href, base='http://comonad.com/') {
  try {
    const url=new URL(href,base);let host=url.hostname.replace(/^www\./,'');
    if(['schoolofhaskell.com','fpcomplete.com'].includes(host)) host='school';
    let pathname=url.pathname.replace(/\/$/,'');
    if(host==='school') pathname=pathname.replace('/tutorial-edit/','/user/edwardk/');
    if(host==='school') pathname=pathname.replace(/(revisiting-matrix-multiplication)-part-(\d+)$/, '$1/part-$2');
    return host+pathname;
  } catch {return href;}
}
const haskellArchive = loadArchive();
const haskellLookup = archiveLookup(haskellArchive);
buildArchive(haskellArchive);
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(p), {recursive:true}); fs.writeFileSync(p, s); };
const archiveScriptHash=crypto.createHash('sha256').update(read('dist/archive.js')).digest('hex').slice(0,12);
const articleStyleHash=crypto.createHash('sha256').update(read('dist/article.css')).digest('hex').slice(0,12);
const highlight = code => hljs.highlight(code, {language:'haskell'}).value;
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const md = new MarkdownIt({html:true, highlight:(code, lang) => lang === 'haskell' ? highlight(code) : esc(code)});
md.inline.ruler.before('escape', 'math', (state, silent) => {
  if (state.src[state.pos] !== '$') return false;
  const display = state.src[state.pos+1] === '$';
  const delimiter = display ? '$$' : '$';
  const start = state.pos + delimiter.length;
  const end = state.src.indexOf(delimiter, start);
  if (end < start) return false;
  if (!silent) {
    const token = state.push('math', '', 0);
    token.content = state.src.slice(start, end);
    token.meta = {display};
  }
  state.pos = end + delimiter.length;
  return true;
});
md.renderer.rules.math = (tokens, index) => katex.renderToString(tokens[index].content.replaceAll('\\mathbin{\\text{⦶}}','\\mathbin{\\htmlClass{vertical-operator}{\\ominus}}'), {displayMode:tokens[index].meta.display, throwOnError:true, trust:context=>context.command==='\\htmlClass', strict:code=>code==='htmlExtension'?'ignore':'warn', output:'htmlAndMathml'});
md.renderer.rules.fence = (tokens, index) => {
  const token = tokens[index], lang = token.info.trim() || 'text';
  if (lang === 'crc-math') return `<div class="math-derivation" data-original-text="${esc(token.content).replaceAll('\n', '&#10;')}">${katex.renderToString(crcMath(token.content), {displayMode:true, throwOnError:true, trust:false})}</div>\n`;
  return `<pre tabindex="0" aria-label="${lang === 'haskell' ? 'Haskell code' : esc(lang)+' code'}"><code class="language-${esc(lang)}">${hljs.getLanguage(lang) ? hljs.highlight(token.content,{language:lang}).value : esc(token.content)}</code></pre>\n`;
};
const commentMd = new MarkdownIt({html:false, highlight:code=>highlight(code)});

fs.mkdirSync('dist/vendor/katex', {recursive:true});
fs.copyFileSync('node_modules/katex/dist/katex.min.css', 'dist/vendor/katex/katex.min.css');
fs.copyFileSync('node_modules/katex/LICENSE', 'dist/vendor/katex/LICENSE');
fs.cpSync('node_modules/katex/dist/fonts', 'dist/vendor/katex/fonts', {recursive:true});
fs.cpSync('content/figures', 'dist/figures', {recursive:true});
fs.cpSync('content/assets', 'dist/assets', {recursive:true});
for(const asset of importedAssets.filter(a=>a.path && new URL(a.url).hostname==='comonad.com')) {
  const target=new URL(asset.url).pathname.slice(1);
  if(!target.split('/').includes('..')) write('dist/'+target,fs.readFileSync('content/'+asset.path));
}
for(const [i,a] of importedAssets.entries())if(a.error)write(`dist/source/unavailable/asset-${i}.html`,shell({title:'Historical attachment unavailable',base:'../../',main:`<h1>Historical attachment unavailable</h1><p>The original server returned ${esc(a.error)} when preserving <code>${esc(a.url)}</code>. No replacement has been invented.</p>`}));
write('dist/.nojekyll', '');
for (const [name, file] of [['highlight.js','node_modules/highlight.js/LICENSE'], ['markdown-it','node_modules/markdown-it/LICENSE']]) {
  fs.copyFileSync(file, `dist/vendor/${name}-LICENSE`);
}

const figureCaptions = {
  'adjunction': '$F$ is left adjoint to $G$, with unit $\\eta : 1_{\\mathcal C} \\Rightarrow GF$ and counit $\\varepsilon : FG \\Rightarrow 1_{\\mathcal D}$.',
  'right-kan': 'The right Kan extension, with $\\varepsilon : (\\operatorname{Ran}_G H) \\circ G \\Rightarrow H$.',
};
function relative(route, target) {
  return path.posix.relative(route || '.', target) || './';
}
function shell({title, base, main, script = '', date, route, entry}) {
  const doc=parseHTML(`<div>${main}</div>`).document;
  const lead=doc.querySelector('.prose > p')?.textContent||entry?.description||entry?.context||'Types, (co)monads, substructural logic. Writing, papers, and talks from Edward Kmett and guests.';
  const description=lead.replace(/\s+/g,' ').trim().slice(0,240);
  const metadata=route===undefined?null:publicSite.metadata({title,route,entry,description});
  const head=metadata?`<link rel="canonical" href="${route?'./':siteConfig.readerPath}"><meta name="description" content="${esc(description)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(metadata.pageUrl)}"><meta property="og:type" content="${entry&&!entry.videoId&&entry.kind!=='Talk'?'article':'website'}"><meta property="og:site_name" content="The Comonad.Reader"><script type="application/ld+json">${JSON.stringify(metadata.data).replaceAll('<','\\u003c')}</script>`:'';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · The Comonad.Reader</title>
${head}
<link rel="alternate" type="application/rss+xml" title="The Comonad.Reader" href="${base}feed.xml"><link rel="stylesheet" href="${base}style.css"><link rel="stylesheet" href="${base}article.css?v=${articleStyleHash}"><link rel="stylesheet" href="${base}vendor/katex/katex.min.css">
</head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="masthead reader-masthead"><a class="site-identity" href="${base}reader/"><span class="lambda-mark" aria-hidden="true">λ</span><span class="site-wording"><span class="wordmark">The Comonad.Reader</span><span class="tagline">types, (co)monads, substructural logic</span></span></a><div class="masthead-links"><nav class="profile-links" aria-label="Edward Kmett elsewhere"><a href="https://github.com/ekmett" rel="me">GitHub</a><a href="https://x.com/kmett" rel="me">X</a><a href="https://www.linkedin.com/in/ekmett" rel="me">LinkedIn</a><a href="https://positron.ai/">Positron</a></nav><nav aria-label="Site navigation"><a href="${base}reader/">Home</a><a href="${base}reader/packages/">Packages</a><a href="${base}feed.xml">RSS</a><a href="mailto:ekmett@gmail.com">Contact</a></nav></div></header>
<div class="reader-layout">${navigation.calendar(base,date)}<main class="reading" id="main-content" tabindex="-1">${main}</main></div><script src="${base}reader-sidebar.js"></script>${script}</body></html>\n`;
}
function packageLine(names,root) {
  if(!names.length)return '';
  return `<aside class="package-links" aria-label="Related Hackage packages"><span>Related on Hackage</span> ${names.map(name=>`<a href="${packageCatalog.packages[name].url}"><code>${esc(name)}</code></a>`).join(' · ')} <a class="package-index-link" href="${root}reader/packages/">Browse by package →</a></aside>`;
}
function renderArticle(article, route = article.path) {
  const root = (path.posix.relative(route || '.', '.') || '.') + '/';
  let source = read(`content/articles/${article.slug}.md`);
  source = source.replace(/<!-- figure:([\w-]+) -->/g, (_, id) => {
    if (!(id in figureCaptions)) throw new Error(`Unknown figure: ${id}`);
    return `<figure class="category-diagram" id="${id}"><img src="${root}figures/${id}.svg" alt="${id === 'adjunction' ? 'F from C to D is left adjoint to G from D to C.' : 'G maps C to D; H maps C to E; Ran G H maps D to E, with counit from its composite with G to H.'}"><figcaption>${md.renderInline(figureCaptions[id])}</figcaption></figure>`;
  });
  const hasInlineDemo = /<!-- demo:(binding|morton|ad|lca) -->/.test(source);
  source = source.replace(/<!-- demo:(binding|morton|ad|lca) -->/g, (_, name) => read(`templates/${name}.html`).replaceAll('{{root}}', root));
  source = source.replace('<!-- demo:automaton -->', read('templates/automaton.html').replace('../../../../source/',root+'source/'));
  source = source.replace(/<!-- demo:(split|tree) -->/g, (_, name) => {
    if (name === 'split') return read('templates/crc-split.html');
    const proof = String.raw`\begin{aligned}
      (A \otimes B) \otimes C
        &= ((pn + q)s + r,\;(mn)s) \\
        &= (pns + qs + r,\;mns) \\[6pt]
      A \otimes (B \otimes C)
        &= (p(ns) + (qs + r),\;m(ns)) \\
        &= (pns + qs + r,\;mns)
    \end{aligned}`;
    return read('templates/crc-associativity.html').replace('<!-- associativity-proof -->', katex.renderToString(proof, {displayMode:true, throwOnError:true, trust:false}))
      + '<details class="incremental-detail"><summary>Using associativity to update a cached tree</summary>\n' + read('templates/crc-tree.html') + '</details>\n';
  });
  let body = md.render(source);
  const document = parseHTML(`<article class="prose">${body}</article>`).document;
  const prose = document.querySelector('article');
  const headings = [...prose.querySelectorAll('h2,h3,h4')];
  const used = new Set();
  for (const heading of headings) {
    let id = heading.id || slugify(heading.textContent), suffix = 2;
    while (used.has(id)) id = slugify(heading.textContent) + '-' + suffix++;
    used.add(id); heading.id = id;
  }
  // Preserve old inbound jump links; new links to imported posts stay on-site.
  if (article.legacyId && !prose.querySelector(`[id="more-${article.legacyId}"]`)) prose.insertAdjacentHTML('afterbegin', `<span id="more-${article.legacyId}"></span>`);
  function localLinks(container) {
    for (const a of container.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
    const imported = [...articles,...collections,...publications].find(post => sourceKey(href,article.origin) === sourceKey(post.origin) || (post.aliases || []).some(alias=>sourceKey(href,article.origin)===sourceKey(alias)) || (post.legacyId && /comonad.com/.test(href) && new URL(href,article.origin).searchParams.get('p')===post.legacyId));
      if (imported) a.setAttribute('href', root + imported.path + (href.includes('#') ? '#' + href.split('#')[1] : ''));
      else if (/^https?:\/\/comonad\.com\/reader\/(?:wiki|source)(?:[/?;]|$)/.test(href)) a.setAttribute('href',root+'reader/wiki/');
      else {
        const local = localArchiveLink(href, article.origin, haskellLookup, route + 'index.html');
        if (local) a.setAttribute('href', local);
      }
    }
  }
  localLinks(prose);
  for(const a of prose.querySelectorAll('a[href]'))if(a.getAttribute('href')==='http://comonad.com/')a.setAttribute('href',root);
  for(const node of prose.querySelectorAll('img[src],a[href]')) {
    const attr=node.tagName==='IMG'?'src':'href', href=node.getAttribute(attr);
    if(href.startsWith('/figures/')) {node.setAttribute(attr,root+href.slice(1));continue;}
    const asset=importedAssets.find(a=>sourceKey(a.url)===sourceKey(href,article.origin));
    if(asset?.path) node.setAttribute(attr,root+asset.path);
    else if(asset?.error && node.tagName==='A') {
      const index=importedAssets.indexOf(asset);node.setAttribute('href',root+`source/unavailable/asset-${index}.html`);
    } else if(node.tagName==='IMG') {
      const local=localArchiveLink(href,article.origin,haskellLookup,route+'index.html');
      if(local) node.setAttribute(attr,local);
    }
    if(node.tagName==='IMG') { node.setAttribute('loading','lazy'); if(!node.hasAttribute('alt'))node.setAttribute('alt','Illustration from '+article.title); }
  }
  linkPackageMentions(prose, packageNames(packageCatalog,article.slug), packageCatalog);
  body = prose.outerHTML;
  const toc = `<details class="contents"><summary>On this page</summary><ol>${headings.map(h => `<li><a href="#${h.id}">${esc(h.textContent)}</a></li>`).join('')}</ol></details>`;
  let comments = '';
  const commentPath = `content/comments/${article.slug}.json`;
  if (fs.existsSync(commentPath)) {
    const data = JSON.parse(read(commentPath));
    const items = data.comments.map(c => `<article class="comment" id="${c.id}"><header><strong>${esc(c.author)}</strong><a href="#${c.id}">${esc(c.date)}</a></header>${commentMd.render(c.markdown)}</article>`).join('');
    const doc = parseHTML(`<section class="comments" id="comments"><h2>From the original discussion</h2><p class="editorial">Selected questions, explanations, and corrections. Original wording and dates; spam and automated trackbacks omitted.</p>${items}</section>`).document;
    localLinks(doc); comments = data.comments.length ? doc.querySelector('section').outerHTML : ''; 
  }
  let companions = '';
  if (article.slug === 'parallel-crc') {
    companions = read('templates/crc-source.html').replace('<!-- sources -->', ['CRC.hs','Browser.hs','Server.hs'].map(file => `<details><summary>${file === 'CRC.hs' ? 'Shared core' : file === 'Browser.hs' ? 'WebAssembly adapter' : 'HTTP server'}</summary><a href="${root}source/${file}" download>Download Haskell</a>${file==='Browser.hs'?` · <a href="${root}source/browser-sources.zip">All modules used by the shared browser adapter</a>`:''}<pre tabindex="0" aria-label="Haskell code"><code class="language-haskell">${highlight(read('haskell/' + file))}</code></pre></details>`).join(''));
  }
  const historical = (hasInlineDemo ? 'The interactive figure is a new companion to the article. ' : '') + (article.slug === 'parallel-crc' ? 'The original article is reproduced in full. The two interactive figures and companion implementations are new. Historical code is preserved; it has not been updated to current library APIs.' : 'Original article and historical code, with restored code formatting and locally typeset mathematics. Historical library APIs remain as published. Obvious prose typos may be corrected; changes are recorded with the archived source.');
  const footer = `<aside class="edition-note"><details><summary>About this edition</summary><p>${historical}</p><p>First home: ${esc(article.source || 'Comonad.Reader')}.${article.dateBasis?' '+esc(article.dateBasis):''}</p><p><a href="${root}source/articles/${article.slug}.md" download>Article Markdown</a> · <a href="${root}source/articles/${article.slug}.original.${article.rawFormat === 'md' ? 'md' : 'html.txt'}" download>Archived original source</a> · <a href="${root}source/articles/provenance.json">Provenance</a> · <a href="${root}source/articles/editorial-changes.json">Editorial changes</a></p></details></aside>
${navigation.neighbors(article,root)}
<footer><span>The Comonad.Reader</span><p>Writing and code © ${esc(article.author || 'Edward Kmett')}.<br>Comments attributed to their original authors.</p></footer>`;
  const series=collections.find(c=>c.slug===article.series);
  const seriesNav=series ? `<nav class="series-navigation" aria-label="Article series"><p>In <a href="${root+series.path}">${esc(series.title)}</a></p><ol>${series.links.map(link=>articles.find(a=>sourceKey(a.origin)===sourceKey(link.origin))).filter(Boolean).map(a=>`<li><a href="${root+a.path}"${a.slug===article.slug?' aria-current="page"':''}>${esc(a.originalTitle||a.title)}</a></li>`).join('')}</ol></nav>` : '';
  const main = `<header class="article-header"><div class="article-meta"><span>${esc(article.categories)}</span><span>${esc(article.author || 'Edward Kmett')} · <time datetime="${article.date}">${article.dateLabel}</time></span></div><h1>${esc(article.title)}</h1></header>${seriesNav}${headings.length?toc:''}${body}${packageLine(packageNames(packageCatalog,article.slug),root)}${companions}${comments}${footer}`;
  const script = hasInlineDemo ? `<script type="module" src="${root}article-demos.js"></script>` : article.slug === 'parallel-crc' ? `<script type="module" src="${root}app.js"></script>` : article.slug==='cellular-automata-part-1' ? `<script type="module" src="${root}automaton.js"></script>` : '';
  write('dist/' + route + 'index.html', shell({title:article.title, base:root, main, script, date:article.date,route,entry:article}));
}

const provenance = [];
for (const article of articles) {
  renderArticle(article);
  const raw = article.rawSource || (article.slug === 'parallel-crc' ? 'dist/source/original/parallel-crc.md' : `content/original/${article.slug}.html`);
  const bytes = fs.readFileSync(raw);
  const archived = `dist/source/articles/${article.slug}.original.${article.rawFormat === 'md' ? 'md' : 'html.txt'}`;
  write(archived, bytes);
  write(`dist/source/articles/${article.slug}.md`, read(`content/articles/${article.slug}.md`));
  provenance.push({...article, retrieved:externalPreservation.find(p=>p.path===raw)?.retrieved||'2026-09-21', sha256:crypto.createHash('sha256').update(bytes).digest('hex'), archive:archived.replace('dist/','')});
}
write('dist/source/articles/provenance.json', JSON.stringify(provenance, null, 2)+'\n');
// References to the old hosts are migration work, not a permanent escape hatch.
// Preserve a reviewable inventory before the domain is pointed at this build.
const pending = new Map();
for (const article of articles) {
  const doc = parseHTML(read('dist/' + article.path + 'index.html')).document;
  for (const link of doc.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href');
    if (!/^https?:\/\/(?:www\.)?(?:comonad\.com|schoolofhaskell\.com|fpcomplete\.com)\//.test(href)) continue;
    const key = href.split('#')[0];
    if (!pending.has(key)) pending.set(key, {url:key, referencedBy:[]});
    const entry = pending.get(key);
    if (!entry.referencedBy.includes(article.slug)) entry.referencedBy.push(article.slug);
  }
}
write('docs/pending-migration-links.json', JSON.stringify([...pending.values()], null, 2)+'\n');
for(const collection of collections) {
  const root=(path.posix.relative(collection.path,'.')||'.')+'/';
  const members=collection.links.map(link=>articles.find(a=>sourceKey(a.origin)===sourceKey(link.origin))).filter(Boolean);
  write('dist/'+collection.path+'index.html',shell({title:collection.title,base:root,route:collection.path,main:`<header class="article-header"><p class="article-meta">A series by Edward Kmett</p><h1>${esc(collection.title)}</h1></header><div class="prose">${md.render(collection.description)}</div><div class="article-list">${members.map(a=>`<article><time datetime="${a.date}">${a.dateLabel}</time><h2><a href="${root+a.path}">${esc(a.title)}</a></h2></article>`).join('') || '<p>No articles were published in this collection.</p>'}</div><nav class="related"><a href="${root}reader/">All writing</a></nav>`}));
}
for(const video of videos) {
  const root=(path.posix.relative(video.path,'.')||'.')+'/';
  const main=`<header class="article-header"><div class="article-meta"><span>${esc(video.source)} · ${video.kind}</span><span><time datetime="${video.date}">${esc(video.dateLabel)}</time>${video.dateNote}</span></div><h1>${esc(video.title)}</h1><p class="talk-speakers">${esc(video.author)}</p></header><div class="prose"><figure class="talk-video" data-video-id="${esc(video.videoId)}"><iframe src="https://www.youtube-nocookie.com/embed/${esc(video.videoId)}?playsinline=1" title="${esc(video.title)}" loading="eager" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe><figcaption><a href="${esc(video.videoUrl)}">Watch on YouTube</a>${video.durationSeconds?' · '+Math.floor(video.durationSeconds/60)+' minutes':''}</figcaption></figure>${video.seriesId?videoSeriesNavigation(video,root):''}${video.editorialNote?'<p class="editorial">'+esc(video.editorialNote)+'</p>':''}${(video.description||video.context||'').split(/\n\s*\n/).filter(Boolean).map(p=>'<p>'+esc(p).replaceAll('\n','<br>')+'</p>').join('')}${video.materials?.length?'<h2>Materials</h2><ul>'+video.materials.map(m=>`<li><a href="${esc(typeof m==='string'?m:m.url)}">${esc(typeof m==='string'?m:m.title||m.label||m.kind?.replaceAll('_',' ')||'Related material')}</a></li>`).join('')+'</ul>':''}</div>${(video.relatedRecordings||[]).map(id=>videos.find(v=>v.id===id)).filter(Boolean).map(v=>`<p class="related-recording">Related recording: <a href="${root+v.path}">${esc(v.title)}</a></p>`).join('')}${video.discussion?.length?'<section class="comments"><h2>From the original discussion</h2>'+video.discussion.map(c=>`<article class="comment"><header><strong>${esc(c.author)}</strong> · <a href="${esc(c.source)}">Original reply</a></header><p class="editorial">${esc(c.selection)}</p>${commentMd.render(c.markdown)}</article>`).join('')+'</section>':''}${packageLine(packageCatalog.talks[video.id]||[],root)}<aside class="edition-note"><details><summary>Recording details</summary><p>${video.eventDate?'Talk date: '+esc(video.eventDate)+'. ':''}${video.eventYear&&!video.eventDate?'Presentation year: '+esc(video.eventYear)+'. ':''}Uploaded: ${esc(video.uploadDate||'not established')}. ${esc(video.dateBasis||'')}</p>${(video.uncertainty||[]).map(s=>'<p>'+esc(s)+'</p>').join('')}<p>The recording is hosted on YouTube. Its description, credits, and dating evidence are preserved here.</p></details></aside>${navigation.neighbors(video,root)}`;
  write('dist/'+video.path+'index.html',shell({title:video.title,base:root,main,date:video.date,route:video.path,entry:video}));
}
for(const publication of publications) {
  const root=(path.posix.relative(publication.path,'.')||'.')+'/';
  const slides=publication.deck?externalPreservation.filter(p=>p.deck===publication.deck&&p.path).sort((a,b)=>a.slide-b.slide):[];
  const material=publication.pdf ? `<p><a class="document-download" href="${root+publication.pdf}">Read the ${publication.kind==='Paper'?'paper':'slides'} (PDF · ${publication.pages} pages)</a> · <a href="${root+publication.pdf}" download>Download</a></p><object class="document-preview" data="${root+publication.pdf}" type="application/pdf" aria-label="${esc(publication.title)}"><p><a href="${root+publication.pdf}">Open the PDF</a></p></object>` : `<section class="slide-deck" aria-label="Presentation slides"><p>${slides.length} slides · <a href="#slide-1">Start reading</a></p>${slides.map(s=>`<figure id="slide-${s.slide}"><img src="${root+s.path.replace(/^content\//,'')}" alt="${esc(s.alt.replaceAll('\\n','\n').trim())}" loading="lazy" width="2048" height="1536"><figcaption>Slide ${s.slide} of ${slides.length}${s.slide>1?` · <a href="#slide-${s.slide-1}" aria-label="Previous slide">←</a>`:''}${s.slide<slides.length?` · <a href="#slide-${s.slide+1}" aria-label="Next slide">→</a>`:''}</figcaption></figure>`).join('')}</section>`;
  const related=articles.find(a=>a.slug===publication.relatedArticle);
  const main=`<header class="article-header"><div class="article-meta"><span>${esc(publication.source)} · ${publication.kind}</span><span><time datetime="${publication.date}">${esc(publication.dateLabel)}</time>${esc(publication.dateNote||'')}</span></div><h1>${esc(publication.title)}</h1><p class="talk-speakers">${esc(publication.author)}</p></header><div class="prose"><p>${esc(publication.description)}</p>${related?`<p>Related article: <a href="${root+related.path}">${esc(related.title)}</a>.</p>`:''}${material}</div>${packageLine(publication.packages||[],root)}<aside class="edition-note"><details><summary>About this edition</summary><p>${esc(publication.dateBasis)}</p><p>${publication.pdf?'The complete original PDF is preserved locally.':'All publicly displayed slide images and their supplied text are preserved locally.'}</p><p><a href="${esc(publication.origin)}">Source record</a></p></details></aside>${navigation.neighbors(publication,root)}`;
  write('dist/'+publication.path+'index.html',shell({title:publication.title,base:root,main,date:publication.date,route:publication.path,entry:publication}));
}
const countLabel=(count,singular,plural=singular+'s')=>`${count} ${count===1?singular:plural}`;
function videoSeriesNavigation(video,root){
  const members=videos.filter(v=>v.seriesId===video.seriesId).sort((a,b)=>a.sequence-b.sequence);
  if(video.archiveType!=='stream')return '<nav aria-label="Talk series">'+members.map(v=>`<a href="${root+v.path}"${v.id===video.id?' aria-current="page"':''}>Part ${v.sequence}</a>`).join(' · ')+'</nav>';
  const index=members.findIndex(v=>v.id===video.id);
  const adjacent=[members[index-1],members[index+1]].filter(Boolean).map(v=>`<a href="${root+v.path}">${esc(v.sequenceLabel)}</a>`).join(' · ');
  return `<nav class="series-navigation" aria-label="Live coding series"><p><a href="${root}reader/series/live-coding/">Live Coding</a> · ${esc(video.sequenceLabel)}${adjacent?' · '+adjacent:''}</p><details><summary>All sessions</summary><ol>${members.map(v=>`<li><a href="${root+v.path}"${v.id===video.id?' aria-current="page"':''}>${esc(v.title)}</a></li>`).join('')}</ol></details></nav>`;
}
function archivePage(route, period) {
  const base=(path.posix.relative(route||'.','.')||'.')+'/';
  let year='';
  const selected=timeline.filter(item=>!period || item.date.startsWith(period));
  const seenDates=new Set();
  const title=period ? period.length===7 ? navigation.monthLabel(period) : period : 'Writing & talks';
  const entries=selected.map(a=>{
    const nextYear=a.date.slice(0,4),heading=year!==nextYear?`<h2 class="archive-year" id="year-${nextYear}">${nextYear}</h2>`:'';year=nextYear;
    const dayId=seenDates.has(a.date)?'':` id="day-${a.date}"`;seenDates.add(a.date);
    const thumbnail=talkThumbnails[a.videoId]?.path?talkThumbnails[a.videoId]:null;
    const image=thumbnail?`<span class="talk-thumbnail" aria-hidden="true"><img src="${base+thumbnail.path}" alt="" width="320" height="180" loading="lazy" decoding="async"></span>`:'';
    return heading+`<article${dayId} class="archive-entry" data-kind="${a.kind}" data-search="${esc([a.title,a.slug,a.author,a.categories,a.date,a.source,a.kind].join(' ').toLowerCase())}"><div class="entry-date"><time datetime="${a.date}">${esc(a.dateLabel)}${a.dateNote||''}</time><span>${a.kind!=='Article'?a.kind+' · ':''}${esc(a.source)}</span></div><h3><a${thumbnail?' class="talk-title-thumbnail"':''} href="${base+a.path}"><span>${esc(a.title)}</span>${image}</a></h3><p class="entry-author">${esc(a.author||'Edward Kmett')}</p></article>`;
  }).join('');
  return shell({title,base,date:period,route,main:`<header class="archive-header"><p class="article-meta">Edward Kmett &amp; guests</p><h1>${esc(title)}</h1><p>${period?`<a href="${base}reader/">All writing &amp; talks</a>`:"Types, programs, and the structures between them."}</p></header><div class="archive-tools"><label for="archive-search">Explore the archive</label><div class="archive-search-row"><input id="archive-search" type="search" placeholder="Title, topic, speaker, or year…"><select id="archive-kind" aria-label="Content type"><option value="">Everything</option><option>Article</option><option>Talk</option><option>Stream</option><option>Paper</option></select></div><p id="archive-count" aria-live="polite">${countLabel(selected.filter(a=>a.kind==='Article').length,'article')} · ${countLabel(selected.filter(a=>a.kind==='Talk').length,'talk')} · ${countLabel(selected.filter(a=>a.kind==='Paper').length,'paper')}${selected.some(a=>a.kind==='Stream')?' · '+countLabel(selected.filter(a=>a.kind==='Stream').length,'stream'):''}</p></div><div class="article-list chronological">${entries}</div><p id="archive-empty" hidden>No matching entries.</p><details class="series-list"><summary>Browse series</summary><ul><li><a href="${base}reader/series/live-coding/">Live Coding</a></li>${collections.filter(c=>c.links.length).map(c=>`<li><a href="${base+c.path}">${esc(c.title)}</a></li>`).join('')}</ul></details><footer><span>The Comonad.Reader</span><p>Writing and recordings together in date order.<br>Articles and talks credited to their authors and speakers.</p></footer>`,script:`<script type="module" src="${base}archive.js?v=${archiveScriptHash}"></script>`});
}
const packageSections=Object.entries(packageCatalog.packages).map(([name,pkg])=>{
  const writing=articles.filter(a=>packageNames(packageCatalog,a.slug).includes(name));
  const talks=[...videos,...publications].filter(v=>(v.packages||packageCatalog.talks[v.id]||[]).includes(name));
  return `<section class="package-section" id="${name}"><h2><a href="${pkg.url}">${esc(name)}</a></h2><ul>${[...writing,...talks].sort((a,b)=>b.date.localeCompare(a.date)).map(a=>`<li><a href="../../${a.path}">${esc(a.title)}</a> <span class="package-date">${a.date.slice(0,4)}</span></li>`).join('')}</ul></section>`;
}).join('');
write('dist/reader/packages/index.html',shell({title:'Packages & writing',base:'../../',route:'reader/packages/',main:`<header class="article-header"><h1>Packages &amp; writing</h1><p>Follow an idea from the article to its Haskell library.</p></header><p class="editorial">These links connect the writing to relevant packages on Hackage. Historical examples may use different APIs; their original version-specific documentation links are preserved.</p><nav class="package-jump" aria-label="Package index">${Object.keys(packageCatalog.packages).map(n=>`<a href="#${n}">${esc(n)}</a>`).join(' · ')}</nav>${packageSections}`}));
write('dist/source/articles/talk-thumbnails.json',JSON.stringify(talkThumbnails,null,2)+'\n');
write('dist/source/articles/package-links.json',JSON.stringify(packageCatalog,null,2)+'\n');
const streamSeries=videos.filter(v=>v.archiveType==='stream').sort((a,b)=>a.sequence-b.sequence);
write('dist/reader/series/live-coding/index.html',shell({title:'Live Coding',base:'../../../',route:'reader/series/live-coding/',main:`<header class="article-header"><h1>Live Coding</h1><p>Edward Kmett · Twitch recordings</p></header><div class="prose"><p>Sessions 1–26, including split recordings. Follow the session numbers here; the dated archive uses the known YouTube release dates where original broadcast dates are unavailable.</p><ol>${streamSeries.map(v=>`<li><a href="../../../${v.path}">${esc(v.title)}</a></li>`).join('')}</ol></div>`}));
write('dist/reader/index.html',archivePage('reader/'));
write('dist/index.html',`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Comonad.Reader</title><link rel="canonical" href="${siteConfig.readerPath}"><meta http-equiv="refresh" content="0;url=${siteConfig.readerPath}"></head><body><p><a href="${siteConfig.readerPath}">Continue to The Comonad.Reader</a></p></body></html>\n`);
write('dist/reader/wiki/index.html',shell({title:'Historical Wiki',base:'../../',main:'<h1>Historical Wiki</h1><p>The original Wiki page was empty when this archive was preserved. Its older item and source endpoints either returned that empty page or HTTP 404.</p><p><a href="../../source/articles/wiki.original.html.txt">Archived page source</a> · <a href="../../source/articles/legacy-link-status.json">Retrieval details</a></p>'}));
write('dist/source/articles/wiki.original.html.txt',read('content/original/wiki.html'));
for(const name of ['editorial-changes','math-migration','code-formatting','legacy-link-status','external-talks','boston-haskell-videos','publications','external-preservation'])write(`dist/source/articles/${name}.json`,read(`content/${name}.json`));
for(const year of new Set(timeline.map(a=>a.date.slice(0,4))))write(`dist/reader/${year}/index.html`,archivePage(`reader/${year}/`,year));
for(const month of navigation.months)write('dist/'+navigation.monthPath(month)+'index.html',archivePage(navigation.monthPath(month),month));
const site=siteConfig.baseUrl;
write('dist/source/articles/site.json',JSON.stringify(siteConfig,null,2)+'\n');
function feedBody(entry){
 const url=publicSite.url(entry.path);
 const prose=parseHTML(read('dist/'+entry.path+'index.html')).document.querySelector('.prose');
 // Keep prose and static figures; embedded applications and slide decks need the page.
 for(const demo of prose.querySelectorAll('.experiment,.interactive-figure,.automaton'))demo.outerHTML=`<p><a href="${url}${demo.id?'#'+demo.id:''}">Try the interactive example</a></p>`;
 prose.querySelectorAll('script,button,input,select,iframe,object,.slide-deck,.series-navigation').forEach(n=>n.remove());
 for(const n of prose.querySelectorAll('[href],[src]'))for(const attr of ['href','src'])if(n.hasAttribute(attr))n.setAttribute(attr,new URL(n.getAttribute(attr),url).href);
 const date=entry.dateLabel||dateLabel(entry.date);
 return `<p>${esc(entry.author)} · ${esc(date)}${esc(entry.dateNote||'')}</p>`+prose.innerHTML+`<p><a href="${url}">${entry.deck?'Read the slides':'Read on The Comonad.Reader'}</a></p>`;
}
const feed=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The Comonad.Reader</title><link>${site}reader/</link><description>Writing, talks, live coding, and papers: types, (co)monads, substructural logic</description>${timeline.map(a=>`<item><title>${esc(a.title)}</title><link>${esc(publicSite.url(a.path))}</link><guid isPermaLink="false">${esc(siteConfig.permanentIdentityBaseUrl+a.path)}</guid>${/^\d{4}-\d{2}-\d{2}$/.test(a.date)?`<pubDate>${new Date(a.date+'T12:00:00Z').toUTCString()}</pubDate>`:''}<category>${a.kind}</category><description>${esc(feedBody(a))}</description></item>`).join('')}</channel></rss>`;
write('dist/reader/feed/index.xml',feed);
write('dist/reader/feed/index.html',feed);
write('dist/feed.xml',feed);
write('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['reader/','reader/packages/','reader/series/live-coding/',...articles.map(a=>a.path),...collections.map(a=>a.path),...videos.map(v=>v.path),...publications.map(p=>p.path)].map(p=>`<url><loc>${site+p}</loc></url>`).join('')}</urlset>`);
console.log(`Built ${articles.length} complete articles, local math and diagrams, curated comments, and ${videos.length} recording pages, and ${publications.length} preserved publications.`);
