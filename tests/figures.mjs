import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEngine } from '../dist/engine.js';
globalThis.fetch = async url => new Response(await readFile(url));
const e = await createEngine();
let checks=0;
const eq=(a,b,msg)=>{assert.deepEqual(a,b,msg);checks++;};
const close=(a,b,tol=1e-10)=>{assert.ok(Math.abs(a-b)<tol,`${a} ≈ ${b}`);checks++;};
function canonical(t,env=[]){
  if(t[0]==='var') return env.includes(t[1])?['bound',env.indexOf(t[1])]:['free',t[1]];
  if(t[0]==='lam') return ['lam',canonical(t[2],[t[1],...env])];
  return ['app',canonical(t[1],env),canonical(t[2],env)];
}
const expected=[['lam',['free','x']],['lam',['lam',['free','y']]],['lam',['app',['free','x'],['bound',0]]],['lam',['bound',0]]];
for(let p=0;p<4;p++) for(let s=0;s<3;s++){
  const d=e.binding(p,s);
  eq(canonical(d.safe.ast),expected[p],'capture avoidance and alpha equivalence');
  eq(d.safe.free,p===3?[]:[p===1?'y':'x'],'free variables survive substitution');
  eq(d.naive.free,[],'naive substitution captures, except already-bound case');
}
const morton=(x,y)=>{let n=0;for(let i=0;i<3;i++)n+=((x>>i)&1)<<(2*i+1),n+=((y>>i)&1)<<(2*i);return n;};
for(let x=0;x<8;x++)for(let y=0;y<8;y++)for(const block of [1,2,4,8,16,64]){
  const d=e.morton(x,y,block);
  eq(d.key,morton(x,y));eq(d.path[d.key],[x,y]);eq(new Set(d.path.map(p=>p.join(','))).size,64);
  eq(d.keyBits,Array.from({length:3},(_,i)=>d.xBits[i]+d.yBits[i]).join(''));
  eq(d.mortonBlocks,new Set(d.region.map(([a,b])=>Math.floor(morton(a,b)/block))).size);
  eq(d.rowBlocks,new Set(d.region.map(([a,b])=>Math.floor((b*8+a)/block))).size);
}
for(const x of [-3,-1,0,.3,1,3])for(const y of [-3,-.1,0,2.1,3]){
  const d=e.ad(x,y),h=1e-5,f=(a,b)=>a*b+Math.sin(a);
  close(d.gradient[0],y+Math.cos(x));close(d.gradient[1],x);
  close(d.gradient[0],(f(x+h,y)-f(x-h,y))/(2*h),1e-8);
  close(d.gradient[1],(f(x,y+h)-f(x,y-h))/(2*h),1e-8);
  close(d.nodes[4].value,f(x,y));close(d.steps[7].adjoints[0],Math.cos(x));
  close(d.steps[8].adjoints[0],d.steps[7].adjoints[0]+y);
}
function ancestors(parents,a){const result=[];for(;a>=0;a=parents[a])result.push(a);return result;}
function checkTree(parents){
  for(let a=0;a<parents.length;a++)for(let b=0;b<parents.length;b++){
    const aa=ancestors(parents,a),bb=ancestors(parents,b),ancestor=aa.find(n=>bb.includes(n)),d=e.lca(parents,a,b);
    eq(d.ancestor,ancestor,`LCA ${a},${b} in ${parents}`);
    eq(d.path,ancestors(parents,ancestor));eq(d.size,d.path.length,'skew size metadata');
  }
}
const trees=[[-1],[-1,...Array.from({length:63},(_,i)=>i)],[-1,...Array(63).fill(0)],[-1,...Array.from({length:63},(_,i)=>Math.floor(i/2))]];
let seed=173;for(let t=0;t<4;t++)trees.push([-1,...Array.from({length:63},(_,i)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%(i+1);})]);
for(const tree of trees)checkTree(tree);
const old=[-1,0,0,1,2],snapshot=e.lca(old,3,4);e.lca([...old,3,5],6,4);eq(e.lca(old,3,4),snapshot,'persistent old query');
for(const args of [[[],0,0],[[-1,2],0,1],[[-1],-1,0],[[-1],0,1]])assert.ok(e.lca(...args).error);
console.log(`${checks} figure checks passed: substitution, bit interleaving, reverse-mode derivatives, and skew-binary LCA against independent oracles.`);
