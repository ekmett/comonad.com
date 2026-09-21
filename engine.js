import { WASI, File, OpenFile, ConsoleStdout } from './vendor/wasi/index.js';

export async function createEngine() {
  const errors = [];
  const wasi = new WASI(['crc.wasm'], [], [
    new OpenFile(new File([])),
    ConsoleStdout.lineBuffered(text => console.info(text)),
    ConsoleStdout.lineBuffered(text => errors.push(text)),
  ]);
  const response = await fetch(new URL('./crc.wasm', import.meta.url));
  if (!response.ok) throw new Error(`Cannot load Haskell module (${response.status})`);
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), {
    wasi_snapshot_preview1: wasi.wasiImport,
  });
  wasi.initialize(instance);
  const e = instance.exports;
  e.hs_init(0, 0);
  const withBytes = (bytes, operation) => {
    const pointer = e.malloc(Math.max(1, bytes.length));
    if (!pointer) throw new Error('Haskell module could not allocate an input buffer');
    try {
      new Uint8Array(e.memory.buffer, pointer, bytes.length).set(bytes);
      return operation(pointer, bytes.length);
    } finally { e.free(pointer); }
  };
  return {
    direct: bytes => withBytes(bytes, (p, n) => e.crc_direct(p, n) >>> 0),
    summarize: bytes => withBytes(bytes, (p, n) => ({
      p: e.crc_remainder(p, n) >>> 0,
      m: e.crc_factor(n) >>> 0,
    })),
    combine: (a, b) => ({
      p: e.crc_combine(a.p, b.p, b.m) >>> 0,
      m: e.crc_multiply(a.m, b.m) >>> 0,
    }),
    finish: s => e.crc_finish(s.p, s.m) >>> 0,
  };
}
