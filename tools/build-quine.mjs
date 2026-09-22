import fs from 'node:fs';
import assert from 'node:assert/strict';

// A mechanical GLSL 3.30 → GLSL ES 3.00 port. Keep the originals byte-for-byte.
export function portQuine(name, source) {
  assert.ok(['dodecahedron','generators'].includes(name));
  assert.match(source,/^#version 330(?: core)?\n/);
  let result=source.replace(/^#version 330(?: core)?\n/,
    '#version 300 es\nprecision highp float;\nprecision highp int;\n// Browser port: GLSL ES header, host-supplied uniforms; original attribution below.\n');
  result=result.replace(/^(uniform (?:vec[24]|float) \w+) = [^;]+;/gm,'$1;');
  if(name==='generators'){
    assert.ok(result.includes('float vibration=sin(iGlobalTime*60.)*.0013;'));
    // ES requires constant global initializers. Evaluate this once per fragment.
    result=result.replace('float vibration=sin(iGlobalTime*60.)*.0013;','float vibration=0.;');
    result=result.replace('void main(void)\n{','void main(void)\n{\n#ifdef ENABLE_VIBRATION\n    vibration=sin(iGlobalTime*60.)*.0013;\n#endif');
    // Avoid shadowing GLSL ES 3's built-in texture overloads.
    result=result.replace(/\btexture\(/g,'proceduralTexture(');
  }
  return result;
}

export function buildQuine(){
  for(const name of ['dodecahedron','generators']){
    const original=fs.readFileSync(`content/assets/quine/original/${name}.frag`,'utf8');
    fs.writeFileSync(`content/assets/quine/${name}.frag`,portQuine(name,original));
  }
}
