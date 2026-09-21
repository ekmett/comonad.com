import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const info=JSON.parse(fs.readFileSync('dist/build-info.json'));
assert.equal(hash('dist/crc.wasm'),info.wasm_sha256,'Published WebAssembly checksum');
for(const [name,sha] of Object.entries(info.source_sha256))assert.equal(hash('haskell/'+name),sha,'Rebuild WebAssembly after changing '+name);
console.log('Published WebAssembly matches its Haskell source manifest.');
