import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('dist/appearance.js','utf8');
for(const scenario of [
 {name:'moving',width:1600,background:'moving',reduced:false,expected:1},
 {name:'reduced motion',width:1600,background:'auto',reduced:true,expected:0},
 {name:'explicit motion override',width:1600,background:'moving',reduced:true,expected:1},
 {name:'still',width:1600,background:'still',reduced:false,expected:0},
 {name:'off',width:1600,background:'off',reduced:false,expected:0},
 {name:'phone',width:390,background:'moving',reduced:false,expected:0,layout:'drawer'},
 {name:'125% uses margins for reading',width:1600,size:125,background:'moving',reduced:false,expected:0,layout:'full'},
 {name:'200% becomes a drawer',width:1440,size:200,background:'moving',reduced:false,expected:0,layout:'drawer'},
 {name:'large browser default font',width:1600,base:24,background:'moving',reduced:false,expected:0,layout:'full'},
 {name:'wide screen still has room at 150%',width:2200,size:150,background:'moving',reduced:false,expected:1,layout:'margins'},
]){
 let id=0, fills=0;const pending=new Set(),events={},queries={};
 const properties={};const root={dataset:{},style:{setProperty:(k,v)=>properties[k]=v}};
 const elements={};const controls={hidden:true,querySelector:s=>elements[s] ||= {},addEventListener:(n,fn)=>events['control:'+n]=fn,contains:()=>true};
 const drawing=new Proxy({}, {get:(_,key)=>key==='stroke'?()=>fills++:()=>{},set:()=>true});
 const canvas={getContext:()=>drawing};
 const store=new Map([['reader-background',scenario.background],['reader-text-size',String(scenario.size||100)]]);
 const doc={documentElement:root,hidden:false,querySelector:s=>s==='.appearance'?controls:canvas,addEventListener:(n,f)=>events[n]=f};
 vm.runInNewContext(source,{
  document:doc,innerWidth:scenario.width,innerHeight:900,devicePixelRatio:1,
  getComputedStyle:()=>({fontSize:String((scenario.base||16)*(properties['--reader-text-scale']||1))}),Event:class{constructor(type){this.type=type}},
  matchMedia:q=>queries[q]={matches:q.includes('reduced')?scenario.reduced:q.includes('min-width')?scenario.width>1000:false,addEventListener:(n,f)=>events[q]=f},
  localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},
  window:{addEventListener:(n,f)=>events[n]=f,dispatchEvent:()=>{}},
  requestAnimationFrame:()=>{pending.add(++id);return id},cancelAnimationFrame:i=>pending.delete(i),
  setTimeout:()=>{pending.add(++id);return id},clearTimeout:i=>pending.delete(i),
 });
 assert.equal(pending.size,scenario.expected,scenario.name+' scheduled frames');
 assert.equal(controls.hidden,false);
 if(scenario.layout)assert.equal(root.dataset.readerLayout,scenario.layout);
 if(root.dataset.readerLayout==='margins' && scenario.background!=='off')assert.ok(fills>0,'Contours render');
 doc.hidden=true;events.visibilitychange();assert.equal(pending.size,0,'No hidden-tab animation');
 events['control:change']({target:{name:'reader-theme',value:'dark'}});
 assert.equal(root.dataset.theme,'dark');assert.equal(store.get('reader-theme'),'dark');
 events['control:change']({target:{name:'reader-theme',value:'system'}});
 assert.equal(root.dataset.theme,undefined);
 for(let i=0;i<6;i++)events['control:click']({target:{closest:s=>s==='[data-text-size]'?{dataset:{textSize:'larger'}}:null}});
 assert.equal(store.get('reader-text-size'),'200');
 assert.equal(properties['--reader-text-scale'],2);
 assert.equal(elements['[data-text-size="larger"]'].disabled,true);
 doc.hidden=false;events.visibilitychange();
 if(scenario.width<2276+192)assert.equal(pending.size,0,'No animation when enlarged text uses the margins');
 events['control:click']({target:{closest:s=>s==='[data-text-size]'?{dataset:{textSize:'reset'}}:null}});
 assert.equal(store.get('reader-text-size'),'100');
 assert.equal(properties['--reader-text-scale'],1);
 console.log(scenario.name+': passed');
}

// The saved setting is applied in the head before the first paint, even without canvas.
const html=fs.readFileSync('dist/reader/index.html','utf8');
const bootstrap=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('reader-text-size'));
assert.ok(bootstrap);
for(const [saved,expected] of [['150',1.5],['200',2],['-2',undefined],['NaN',undefined],['',undefined]]){
 const properties={};
 vm.runInNewContext(bootstrap,{localStorage:{getItem:key=>key==='reader-text-size'?saved:null},document:{documentElement:{dataset:{},style:{setProperty:(k,v)=>properties[k]=v}}}});
 assert.equal(properties['--reader-text-scale'],expected);
}
assert.doesNotThrow(()=>vm.runInNewContext(bootstrap,{localStorage:{getItem(){throw new Error('storage blocked')}},document:{documentElement:{dataset:{}}}}));
console.log('Saved text sizes, bounds, reset, pre-paint restore and blocked storage passed.');
