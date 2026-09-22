import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {createEngine} from '../dist/engine.js';
globalThis.fetch=async url=>new Response(await readFile(url));
const engine=await createEngine();let checks=0;
function decode(result){
 const bytes=Buffer.from(result.pngHex,'hex');assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 let header,compressed=[];
 for(let p=8;p<bytes.length;){const n=bytes.readUInt32BE(p),tag=bytes.toString('ascii',p+4,p+8);assert.equal(engine.direct(bytes.subarray(p+4,p+8+n)),bytes.readUInt32BE(p+8+n),'PNG chunk checksum');if(tag==='IHDR')header=bytes.subarray(p+8,p+8+n);if(tag==='IDAT')compressed.push(bytes.subarray(p+8,p+8+n));p+=n+12;}
 const w=header.readUInt32BE(0),h=header.readUInt32BE(4),interlace=header[12];assert.equal(w,result.width);assert.equal(h,result.height);assert.equal(header[8],8);assert.equal(header[9],0);
 const raw=inflateSync(Buffer.concat(compressed));const pixels=Array.from({length:h},()=>Array(w));let at=0;
 for(const [sx,sy,dx,dy] of interlace?[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]]:[[0,0,1,1]]){
  if(sx>=w||sy>=h)continue;
  for(let y=sy;y<h;y+=dy){assert.equal(raw[at++],0);for(let x=sx;x<w;x+=dx)pixels[y][x]=raw[at++];}
 }
 assert.equal(at,raw.length);assert.ok(pixels.flat().every(p=>p!==undefined));checks++;return pixels;
}
// Independent full-world scalar reference, including rules with live backgrounds.
for(const r of [0,1,30,90,110,170,204,240,255]){
 const w=17,h=12,seed=8;let cells=new Map(Array.from({length:w+2*h},(_,i)=>[i-h,i-h===seed?1:0]));const expected=[];
 for(let t=0;t<h;t++){expected.push(Array.from({length:w},(_,x)=>cells.get(x)?0:255));const next=new Map();for(let x=-h+t+1;x<w+h-t-1;x++){const code=4*cells.get(x-1)+2*cells.get(x)+cells.get(x+1);next.set(x,(r>>code)&1);}cells=next;}
 assert.deepEqual(decode(engine.image(0,r,w,h,seed)),expected);
}
for(const r of [1,90,110,170,204,240,255]){
 const w=21,h=15,m=7,start=-10;let cells=new Map(Array.from({length:w},(_,i)=>[i+start,i+start===0?1:0]));const expected=[];
 for(let t=0;t<h;t++){expected.push(Array.from({length:w},(_,x)=>cells.get(x+start)?0:255));cells=new Map([...cells].map(([x,c])=>[x,(r>>(4*cells.get(((x-1)%m+m)%m)+2*c+cells.get(((x+1)%m+m)%m)))&1]));}
 assert.deepEqual(decode(engine.image(1,r,w,h,m)),expected,'Part III action including non-wrapping stay');
}
function mandel(w,h,n){return Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>{const cr=x/w*3-2,ci=y/h*2-1;let r=0,i=0;for(let k=0;k<n;k++){if(r*r+i*i>4)return Math.floor(k/n*255);[r,i]=[r*r-i*i+cr,2*r*i+ci];}return 0;}));}
for(const [w,h] of [[1,1],[3,2],[19,13],[300,200]])for(const interlace of [0,1])assert.deepEqual(decode(engine.image(2,32,w,h,interlace)),mandel(w,h,32),'Adam7 and plain PNG decode to the article’s escape-time pixels');
decode(engine.image(1,110,280,280,30)); // Multiple DEFLATE blocks and the default article view.
console.log(`${checks} PNG fixtures passed: decoded pixels, checksums, zlib blocks, Adam7, flat and modulo actions.`);
