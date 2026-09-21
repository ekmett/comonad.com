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

const sources = {
  core: ['CRC.hs', 'Modern Haskell core shared by both adapters. The composition law is preserved; Semigroup is explicit, multiplication is strict, and the byte step is written without extra packages.'],
  wasm: ['Browser.hs', 'The browser adapter exports small Haskell functions through GHC’s C FFI. The JavaScript UI passes UTF-8 bytes and displays results; all CRC arithmetic runs in the compiled WebAssembly module.'],
  server: ['Server.hs', 'A new WAI/Warp adapter for the same core. Run locally and visit /crc?message=123456789&split=4. This is a companion example, not recovered Yesod code and not a dependency of this page.'],
  original: ['original/MonoidalCRC.hs', 'Unchanged “The Story So Far” snippet from the 2013 article, including its original imports and pre-Semigroup Monoid instance. It is preserved as historical source, not claimed to compile against current packages.'],
};
let selectedSource = '';
async function showSource(key) {
  selectedSource = key;
  const [file, description] = sources[key];
  document.querySelectorAll('[data-source]').forEach(button => {
    const selected = button.dataset.source === key;
    button.setAttribute('aria-selected', selected);
    button.tabIndex = selected ? 0 : -1;
  });
  $('source-panel').setAttribute('aria-labelledby', `tab-${key}`);
  $('source-description').textContent = description;
  $('source-download').href = `./source/${file}`;
  $('source-code').textContent = 'Loading source…';
  try {
    const response = await fetch(`./source/${file}`);
    if (!response.ok) throw new Error('Source unavailable');
    const text = await response.text();
    if (selectedSource === key) $('source-code').textContent = text;
  } catch (error) { if (selectedSource === key) $('source-code').textContent = error.message; }
}
const tabs = [...document.querySelectorAll('[data-source]')];
tabs.forEach((button, index) => {
  button.addEventListener('click', () => showSource(button.dataset.source));
  button.addEventListener('keydown', event => {
    let target;
    if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) {
      event.preventDefault(); tabs[target].focus(); showSource(tabs[target].dataset.source);
    }
  });
});
showSource('core');

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
} catch (error) {
  console.error(error);
  $('runtime').textContent = `Could not start Haskell: ${error.message}`;
  $('runtime').className = 'failed';
  $('match').textContent = 'Example unavailable';
  $('match').className = 'match failed';
  document.querySelectorAll('input, textarea, #reset-tree, [data-preset]').forEach(input => input.disabled = true);
}
