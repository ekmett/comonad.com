import { createEngine } from './engine.js';
const $ = id => document.getElementById(id);
const encode = text => new TextEncoder().encode(text);
const byteCount = n => `${n} ${n === 1 ? 'byte' : 'bytes'}`;
const hex = word => (word >>> 0).toString(16).padStart(8, '0').toUpperCase();
const byteHex = bytes => bytes.length ? Array.from(bytes, b => b.toString(16).padStart(2, '0')).join(' ') : '∅  empty';
const originalChunks = ['123', '45', '67', '89'];
const leaves = originalChunks.map((value, index) => {
  const div = document.createElement('div');
  div.className = 'leaf';
  const name = 'ABCD'[index];
  div.innerHTML = `<label for="chunk-${index}">${name}</label><input id="chunk-${index}" aria-label="Chunk ${name}" maxlength="256" spellcheck="false" disabled><code>—</code><span class="leaf-bytes"></span>`;
  div.querySelector('input').value = value;
  $('tree-leaves').append(div);
  return div;
});

try {
  const engine = await createEngine();
  const known = engine.direct(encode('123456789'));
  if (known !== 0xcbf43926) throw new Error('Haskell startup check failed');
  $('runtime').textContent = 'Haskell → WebAssembly · ready';
  $('runtime').className = 'ready';
  document.querySelectorAll('input, textarea, #reset-tree').forEach(input => input.disabled = false);

  function updateSplit() {
    const bytes = encode($('message').value);
    const split = Math.min(Number($('split').value), bytes.length);
    $('split').max = bytes.length;
    $('split').value = split;
    $('split-position').textContent = split;
    $('byte-count').textContent = `${bytes.length} UTF-8 bytes`;
    const a = bytes.slice(0, split), b = bytes.slice(split);
    const sa = engine.summarize(a), sb = engine.summarize(b);
    for (const [id, value, summary] of [['a', a, sa], ['b', b, sb]]) {
      $(`${id}-count`).textContent = byteCount(value.length);
      $(`${id}-bytes`).textContent = byteHex(value);
      $(`${id}-p`).textContent = hex(summary.p);
      $(`${id}-m`).textContent = hex(summary.m);
    }
    const direct = engine.direct(bytes), combined = engine.finish(engine.combine(sa, sb));
    $('direct').textContent = hex(direct);
    $('combined').textContent = hex(combined);
    $('match').textContent = direct === combined ? '✓ Equal' : 'Mismatch';
    $('match').className = direct === combined ? 'match' : 'match failed';
  }
  $('message').addEventListener('input', updateSplit);
  $('split').addEventListener('input', updateSplit);
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    $('message').value = button.dataset.preset;
    const length = encode(button.dataset.preset).length;
    $('split').max = length;
    $('split').value = Math.floor(length / 2);
    updateSplit();
  }));
  const summaries = new Array(4), branches = new Array(2);
  function updateTree(changed = null) {
    const changedLeaves = changed === null ? [0, 1, 2, 3] : [changed];
    const changedBranches = changed === null ? [0, 1] : [Math.floor(changed / 2)];
    for (const i of changedLeaves) {
      const bytes = encode(leaves[i].querySelector('input').value);
      summaries[i] = engine.summarize(bytes);
      leaves[i].querySelector('code').textContent = hex(engine.finish(summaries[i]));
      leaves[i].querySelector('.leaf-bytes').textContent = byteCount(bytes.length);
    }
    for (const i of changedBranches) {
      branches[i] = engine.combine(summaries[i * 2], summaries[i * 2 + 1]);
      $(`branch-${i}`).querySelector('code').textContent = hex(engine.finish(branches[i]));
    }
    const root = engine.combine(branches[0], branches[1]);
    const result = engine.finish(root);
    $('tree-root').querySelector('code').textContent = hex(result);
    leaves.forEach((leaf, i) => leaf.classList.toggle('changed', changedLeaves.includes(i)));
    [0, 1].forEach(i => $(`branch-${i}`).classList.toggle('changed', changedBranches.includes(i)));
    $('tree-root').classList.add('changed');
    const direct = engine.direct(encode(leaves.map(leaf => leaf.querySelector('input').value).join('')));
    $('tree-check').textContent = direct === result ? '✓ Matches direct CRC' : 'Mismatch with direct CRC';
    $('work-count').textContent = changed === null
      ? 'Initial build: 4 leaf summaries + 3 compositions.'
      : `Chunk ${'ABCD'[changed]} edited: 1 leaf + 2 compositions. 4 of 7 summaries reused.`;
  }
  leaves.forEach((leaf, i) => leaf.querySelector('input').addEventListener('input', () => updateTree(i)));
  $('reset-tree').addEventListener('click', () => {
    leaves.forEach((leaf, i) => leaf.querySelector('input').value = originalChunks[i]);
    updateTree();
  });
  updateSplit();
  updateTree();

  function updateAssociativity() {
    const chunks = ['a', 'b', 'c'].map(name => encode($(`assoc-${name}`).value));
    const [a, b, c] = chunks.map(bytes => engine.summarize(bytes));
    const ab = engine.combine(a, b);
    const left = engine.combine(ab, c);
    const bc = engine.combine(b, c);
    const right = engine.combine(a, bc);
    for (const [id, summary] of [['ab', ab], ['bc', bc], ['left', left], ['right', right]]) {
      $(`assoc-${id}-p`).textContent = hex(summary.p);
      $(`assoc-${id}-m`).textContent = hex(summary.m);
    }
    const leftCRC = engine.finish(left), rightCRC = engine.finish(right);
    $('assoc-left-crc').textContent = hex(leftCRC);
    $('assoc-right-crc').textContent = hex(rightCRC);
    const joined = new Uint8Array(chunks.reduce((n, bytes) => n + bytes.length, 0));
    let offset = 0;
    for (const bytes of chunks) { joined.set(bytes, offset); offset += bytes.length; }
    const direct = engine.direct(joined);
    const samePair = left.p === right.p && left.m === right.m;
    const matches = leftCRC === direct && rightCRC === direct;
    $('assoc-match').textContent = samePair ? '✓ Same remainder and shift in both groupings' : 'Different summaries';
    $('assoc-match').classList.toggle('failed', !samePair);
    $('assoc-direct').textContent = `Direct CRC-32 of A ++ B ++ C: ${hex(direct)} · ${matches ? 'matches both' : 'mismatch'}. Fragment lengths: ${chunks.map(b => b.length).join(', ')} UTF-8 bytes.`;
    $('assoc-direct').classList.toggle('failed', !matches);
  }
  for (const name of ['a', 'b', 'c']) $(`assoc-${name}`).addEventListener('input', updateAssociativity);
  updateAssociativity();
} catch (error) {
  console.error(error);
  $('runtime').textContent = `Could not start Haskell: ${error.message}`;
  $('runtime').className = 'failed';
  $('match').textContent = 'Example unavailable';
  $('match').className = 'match failed';
  $('assoc-match').textContent = 'Interactive example unavailable; see the algebra below.';
  document.querySelectorAll('input, textarea, #reset-tree, [data-preset]').forEach(input => input.disabled = true);
}
