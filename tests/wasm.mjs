import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEngine } from '../dist/engine.js';

// Use the same WASI shim and engine wrapper as the page, loading local assets.
globalThis.fetch = async url => new Response(await readFile(url));
const engine = await createEngine();
const fixtures = JSON.parse(await readFile(new URL('./vectors.json', import.meta.url)));
let checks = 0;
for (const fixture of fixtures) {
  const bytes = new Uint8Array(fixture.bytes);
  assert.equal(engine.direct(bytes), fixture.crc, 'independent Python zlib oracle'); checks++;
  const whole = engine.summarize(bytes);
  assert.equal(engine.finish(whole), fixture.crc, 'whole monoidal summary'); checks++;
  const splits = [...new Set([0, 1, 2, 3, bytes.length >>> 1, bytes.length - 1, bytes.length])]
    .filter(n => n >= 0 && n <= bytes.length);
  for (const at of splits) {
    const a = engine.summarize(bytes.slice(0, at));
    const b = engine.summarize(bytes.slice(at));
    assert.deepEqual(engine.combine(a, b), whole, 'summary composition'); checks++;
    assert.equal(engine.finish(engine.combine(a, b)), fixture.crc, 'final CRC'); checks++;
  }
  const a = engine.summarize(bytes.slice(0, bytes.length / 3));
  const b = engine.summarize(bytes.slice(bytes.length / 3, 2 * bytes.length / 3));
  const c = engine.summarize(bytes.slice(2 * bytes.length / 3));
  assert.deepEqual(engine.combine(engine.combine(a, b), c), engine.combine(a, engine.combine(b, c)), 'associativity'); checks++;
  assert.deepEqual(engine.combine(a, engine.summarize(new Uint8Array())), a, 'right identity'); checks++;
  assert.deepEqual(engine.combine(engine.summarize(new Uint8Array()), a), a, 'left identity'); checks++;
}
// Simulate a cached leaf edit: reuse three leaves and one internal branch.
const leaves = ['123', '45', '67', '89'].map(s => engine.summarize(new TextEncoder().encode(s)));
const right = engine.combine(leaves[2], leaves[3]);
leaves[1] = engine.summarize(new TextEncoder().encode('λ'));
assert.equal(engine.finish(engine.combine(engine.combine(leaves[0], leaves[1]), right)), engine.direct(new TextEncoder().encode('123λ6789'))); checks++;
console.log(`${checks} checks passed against ${fixtures.length} independent zlib vectors; real GHC/Wasm + browser WASI shim.`);
// Independent identities of elementary automata, including asymmetric bit order.
const cells=Uint8Array.from([0,0,1,1,0,1,0,0,1,0,1,1,1]);
assert.deepEqual(engine.automatonStep(0,cells),new Uint8Array(cells.length-2));
assert.deepEqual(engine.automatonStep(255,cells),new Uint8Array(cells.length-2).fill(1));
assert.deepEqual(engine.automatonStep(204,cells),cells.slice(1,-1),'rule 204 is identity');
assert.deepEqual(engine.automatonStep(240,cells),cells.slice(0,-2),'rule 240 copies left');
assert.deepEqual(engine.automatonStep(170,cells),cells.slice(2),'rule 170 copies right');
let row=new Uint8Array(41);row[20]=1;
for(let t=0;t<=10;t++){
  // Rule 90 equals Pascal's triangle modulo two (Lucas's theorem).
  const expected=new Uint8Array(41-2*t),centre=20-t;
  for(let k=0;k<=t;k++)if((k&t)===k)expected[centre-t+2*k]=1;
  assert.deepEqual(row,expected,`rule 90 Pascal row ${t}`);
  row=engine.automatonStep(90,row);
}
console.log('16 automaton checks passed: constant rules, identity, both shifts, and Pascal triangle parity.');
