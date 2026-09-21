// Reviewed selections, not a keyword-based spam filter. Raw snapshots retain all
// records; this explicit ledger makes each publication decision reversible.
import fs from 'node:fs';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';
const selections = {
  'kan-extensions': {
    keep: {1412: 'Question about GADT encodings and the universal property.', 1419: 'Author explains discrete categories and the derivation via ends.', 105351: 'Question about constrained Kan extensions.', 123162: 'Reports the doubled lambda escapes repaired in this edition.'},
    trackbacks: [1415, 1475, 61208, 61215, 119886],
  },
  'kan-extensions-ii': {
    keep: {1418: 'Author records the historical GHC 6.8 build fix.'},
    trackbacks: [1476, 1613, 61224, 62286, 106676],
  },
};
fs.mkdirSync('content/comments', {recursive:true});
const td = new TurndownService({codeBlockStyle:'fenced'});
for (const [slug, selection] of Object.entries(selections)) {
  const document = parseHTML(fs.readFileSync(`content/original/${slug}.html`, 'utf8')).document;
  const comments = [], decisions = [];
  for (const node of document.querySelectorAll('li[id^="comment-"]')) {
    const id = Number(node.id.replace('comment-', ''));
    const disposition = selection.keep[id] ? 'include' : selection.trackbacks.includes(id) ? 'omit-trackback' : 'omit-spam';
    decisions.push({id:node.id, disposition, reason:selection.keep[id] ?? (disposition === 'omit-trackback' ? 'Automated excerpt linking to another post, not a discussion contribution.' : 'Reviewed: unrelated advertising or link spam.')});
    if (disposition !== 'include') continue;
    comments.push({id:node.id, author:node.querySelector('cite').textContent, date:node.querySelector('.commentmetadata').textContent.trim(), markdown:td.turndown([...node.children].filter(n => ['P','PRE','BLOCKQUOTE','UL','OL'].includes(n.nodeName)).map(n => n.outerHTML).join('\n'))});
  }
  fs.writeFileSync(`content/comments/${slug}.json`, JSON.stringify({reviewed:'2026-09-21', comments, decisions}, null, 2)+'\n');
  console.log(slug, comments.length, 'included of', decisions.length);
}
