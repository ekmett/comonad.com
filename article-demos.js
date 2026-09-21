import { createEngine } from './engine.js';
const ns='http://www.w3.org/2000/svg';
const svg=(name,attrs={},text)=>{const n=document.createElementNS(ns,name);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
const number=n=>Number(n.toFixed(3)).toString();
function setup(figure,engine){
  const control=n=>figure.querySelector(`[data-control="${n}"]`),view=n=>figure.querySelector(`[data-view="${n}"]`);
  const watch=(names,render)=>names.forEach(n=>control(n).addEventListener('input',render));
  const text=(n,s)=>{view(n).textContent=s;};
  const tokenNodes=term=>term.tokens.map(t=>{const span=document.createElement('span');span.className=`term-${t.kind}`;span.textContent=t.text;return span;});
  if(figure.dataset.demo==='binding'){
    const render=()=>{
      const d=engine.binding(+control('preset').value,+control('spelling').value);
      view('input').replaceChildren(...tokenNodes(d.original),document.createTextNode(`    [${d.variable} := `),...tokenNodes(d.replacement),document.createTextNode(']'));
      for(const key of ['naive','safe']){view(key).replaceChildren(...tokenNodes(d[key]));text(`${key}-free`,`Free variables: ${d[key].free.join(', ')||'none'}`);}
      text('scope',d.scope);text('status',+control('preset').value===3?'The shadowed variable is left alone.':'The safe result keeps the replacement’s free variable free.');
    };
    watch(['preset','spelling'],render);render();
  }
  if(figure.dataset.demo==='morton'){
    const render=()=>{
      const d=engine.morton(+control('x').value,+control('y').value,+control('block').value),g=view('grid'),row=control('order').value==='row';
      g.replaceChildren();g.append(svg('title',{},`${row?'Row-major':'Z-order'} path; selected cell (${d.x}, ${d.y}), key ${row?d.rowKey:d.key}`));
      const pt=([x,y])=>[40+x*40,40+y*40];
      for(let i=0;i<8;i++){g.append(svg('text',{x:40+i*40,y:15,'text-anchor':'middle',class:'axis'},i),svg('text',{x:12,y:45+i*40,class:'axis'},i));}
      for(let y=0;y<8;y++)for(let x=0;x<8;x++)g.append(svg('rect',{x:20+x*40,y:20+y*40,width:40,height:40,class:d.region.some(p=>p[0]===x&&p[1]===y)?'region-cell':'grid-cell'}));
      g.append(svg('polyline',{points:(row?d.rowPath:d.path).map(p=>pt(p).join(',')).join(' '),class:'morton-path'}));
      const [cx,cy]=pt([d.x,d.y]);g.append(svg('circle',{cx,cy,r:12,class:'selected-cell'}),svg('text',{x:cx,y:cy+4,'text-anchor':'middle',class:'selected-key'},row?d.rowKey:d.key));
      const bits=document.createElement('div');bits.className='interleaved-bits';
      [...d.keyBits].forEach((bit,i)=>{const b=document.createElement('span');b.className=i%2?'bit-y':'bit-x';b.textContent=bit;b.title=`${i%2?'y':'x'} bit ${2-Math.floor(i/2)}`;bits.append(b);});
      view('bits').replaceChildren(document.createTextNode(`x = ${d.x} (${d.xBits}) · y = ${d.y} (${d.yBits})`),bits,document.createTextNode(`x₂ y₂ x₁ y₁ x₀ y₀ → Morton key ${d.key}`));
      text('blocks',`The shaded window touches ${d.mortonBlocks} Z-order block${d.mortonBlocks===1?'':'s'} and ${d.rowBlocks} row-major block${d.rowBlocks===1?'':'s'} (${control('block').value} cells per block).`);
      text('status','');
    };
    view('grid').addEventListener('click',event=>{
      const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(view('grid').getScreenCTM().inverse());
      control('x').value=Math.max(0,Math.min(7,Math.floor((point.x-20)/40)));control('y').value=Math.max(0,Math.min(7,Math.floor((point.y-20)/40)));render();
    });
    watch(['x','y','order','block'],render);render();
  }
  if(figure.dataset.demo==='ad'){
    const positions=[[85,45],[315,45],[305,170],[85,170],[200,300]];
    const render=()=>{
      const x=+control('x').value,y=+control('y').value,d=engine.ad(x,y),step=+control('step').value,frame=d.steps[step],g=view('graph');
      text('x',number(x));text('y',number(y));g.replaceChildren();
      g.append(svg('title',{},`Step ${step+1}: ${frame.message}`));
      const defs=svg('defs'),marker=svg('marker',{id:'ad-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});marker.append(svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'currentColor'}));defs.append(marker);g.append(defs);
      for(const n of d.nodes)for(const parent of n.parents){const [px,py]=positions[parent],[nx,ny]=positions[n.id],reverse=frame.phase==='reverse';g.append(svg('line',{x1:reverse?nx:px,y1:reverse?ny-41:py+41,x2:reverse?px:nx,y2:reverse?py+41:ny-41,'marker-end':'url(#ad-arrow)',class:`tape-edge ${frame.active===n.id?'active-edge':''}`}));}
      for(const n of d.nodes){const [x,y]=positions[n.id],group=svg('g',{class:`tape-node ${frame.active===n.id?'active-node':''}`}),known=frame.phase==='reverse'||n.id<=frame.active;
        group.append(svg('rect',{x:x-75,y:y-40,width:150,height:80,rx:5}),svg('text',{x,y:y-18,'text-anchor':'middle'},n.label),svg('text',{x,y:y+4,'text-anchor':'middle'},known?`value ${number(n.value)}`:'value …'),svg('text',{x,y:y+26,'text-anchor':'middle',class:'adjoint'},frame.phase==='reverse'?`sensitivity ${number(frame.adjoints[n.id])}`:'sensitivity —'));g.append(group);
      }
      text('trace',`${step+1} / ${d.steps.length} · ${frame.phase==='forward'?'Forward':'Backward'}: ${frame.message}`);
      text('gradient',step===8?`∇f = (${number(d.gradient[0])}, ${number(d.gradient[1])}) = (y + cos(x), x)`:'The gradient is complete after both contributions reach x.');
      control('next').textContent=step===8?'Restart':'Next step';text('status','');
    };
    control('next').addEventListener('click',()=>{control('step').value=(+control('step').value+1)%9;render();});
    watch(['x','y','step'],render);render();
  }
  if(figure.dataset.demo==='lca'){
    const versions=[[-1,0,0,1,3,4,5,2,7,8,9,3,11,12,13]];
    let version=0,a=13,b=10;
    const option=(value,label)=>{const n=document.createElement('option');n.value=value;n.textContent=label;return n;};
    const render=()=>{
      const parents=versions[version],d=engine.lca(parents,a,b),g=view('tree');
      if(d.error)throw new Error(d.error);
      for(const key of ['a','b']){control(key).replaceChildren(...parents.map((_,i)=>option(i,i)));control(key).value=key==='a'?a:b;}
      control('version').replaceChildren(...versions.map((ps,i)=>option(i,`${i+1} · ${ps.length} nodes`)));control('version').value=version;
      control('grow').disabled=version!==versions.length-1||parents.length>=24;
      const children=parents.map(()=>[]),depth=parents.map(()=>0);parents.forEach((p,i)=>{if(p>=0){children[p].push(i);depth[i]=depth[p]+1;}});
      const xs=[],leaves=[];const place=i=>{if(!children[i].length){xs[i]=leaves.length;leaves.push(i);}else{children[i].forEach(place);xs[i]=children[i].reduce((s,c)=>s+xs[c],0)/children[i].length;}};place(0);
      const maxDepth=Math.max(...depth),height=Math.max(220,55+maxDepth*48),width=Math.max(400,leaves.length*48+80),point=i=>[leaves.length>1?30+xs[i]*(width-90)/(leaves.length-1):width/2,28+depth[i]*48];
      g.setAttribute('viewBox',`0 0 ${width} ${height}`);g.style.minWidth=width>400?`${width}px`:'0';g.replaceChildren();g.append(svg('title',{},`Tree version ${version+1}. A: ${a}; B: ${b}; lowest common ancestor: ${d.ancestor}.`));
      parents.forEach((p,i)=>{if(p>=0){const [x,y]=point(i),[px,py]=point(p);g.append(svg('line',{x1:x,y1:y,x2:px,y2:py,class:'tree-edge'}));}});
      const compared=new Set(d.comparisons.flat());
      parents.forEach((_,i)=>{const [x,y]=point(i),group=svg('g',{class:`tree-node ${compared.has(i)?'compared-node':''} ${i===d.ancestor?'ancestor-node':''} ${i===a||i===b?'query-node':''}`});
        group.append(svg('circle',{cx:x,cy:y,r:16}),svg('text',{x,y:y+5,'text-anchor':'middle'},i));
        if(i===a||i===b)group.append(svg('text',{x:x+22,y:y+5,class:'query-label'},i===a&&i===b?'A, B':i===a?'A':'B'));g.append(group);
      });
      text('answer',`A = ${a}, B = ${b} → lowest common ancestor = ${d.ancestor}. Green marks the answer; outlined nodes occur in the skew search.`);
      text('digits',`Skew digits: A [${d.digitsA.join(', ')}], B [${d.digitsB.join(', ')}]. Align to ${d.alignedDepth} nodes from the root.`);
      const trace=pairs=>`${pairs.length} comparisons: `+pairs.map(([x,y])=>`${x===-1?'∅':x} ${x===y?'=':'≠'} ${y===-1?'∅':y}`).join(' → ');
      text('skew',trace(d.comparisons));text('naive',trace(d.naiveComparisons));
      text('status',version===versions.length-1?'Growing makes a new persistent version.':'Viewing an earlier version; return to the latest to grow it.');
    };
    for(const key of ['a','b'])control(key).addEventListener('input',()=>{if(key==='a')a=+control(key).value;else b=+control(key).value;render();});
    control('version').addEventListener('input',()=>{version=+control('version').value;a=Math.min(a,versions[version].length-1);b=Math.min(b,versions[version].length-1);render();});
    control('grow').addEventListener('click',()=>{if(version!==versions.length-1||versions[version].length>=24)return;const next=[...versions[version],a];versions.push(next);version++;a=next.length-1;render();});render();
  }
}
const figures=[...document.querySelectorAll('[data-demo]')];
for(const figure of figures)figure.querySelectorAll('input,select,button').forEach(n=>n.disabled=true);
try{
  const engine=await createEngine();
  for(const figure of figures){figure.querySelectorAll('input,select,button').forEach(n=>n.disabled=false);setup(figure,engine);}
}catch(error){
  console.error(error);
  for(const figure of figures){figure.querySelector('[data-view="status"]').textContent='This interactive figure could not load. Its Haskell source and the article remain available.';figure.querySelectorAll('input,select,button').forEach(n=>n.disabled=true);}
}
