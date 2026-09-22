// Appearance is entirely local: no account, cookies, or external resources.
const root = document.documentElement;
const systemTheme = matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const wideScreen = matchMedia('(min-width: 1001px)');
const controls = document.querySelector('.appearance');
const canvas = document.querySelector('.margin-cells');
const context = canvas.getContext('2d');
const read = (key, fallback) => { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
let theme = read('reader-theme', 'system');
let background = read('reader-background', 'auto');
if (!['system','light','dark'].includes(theme)) theme = 'system';
if (!['auto','moving','still','off'].includes(background)) background = 'auto';
controls.hidden = false;
controls.querySelector(`[name="reader-theme"][value="${theme}"]`).checked = true;
controls.querySelector('[name="reader-background"]').value = background;

let width = 0, height = 0, gutter = 0, timer = 0, frame = 0, elapsed = 0, lastTime = 0;
let graphs = [];
function resize() {
  width = innerWidth;
  height = innerHeight;
  gutter = Math.max(0, (width - 1138) / 2);
  const scale = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  graphs = [makeGraph(0),makeGraph(1)];
  restart();
}

// A sparse geometric graph with fixed edges and gently drifting vertices.
// Stable adjacency avoids flicker as neighboring points move past one another.
function makeGraph(side) {
  const nodes = [], edges = new Set();
  const random = n => { const v=Math.sin(n*127.1+side*311.7)*43758.5453;return v-Math.floor(v); };
  for(let row=-1;row<=Math.ceil(height/105);row++){
    for(let column=0;column<=Math.ceil(gutter/95);column++){
      const id=(row+2)*97+column*17;
      nodes.push({x:column*95+20+(random(id)-.5)*58,
        y:row*105+(random(id+1)-.5)*65,phase:random(id+2)*Math.PI*2});
    }
  }
  for(let i=0;i<nodes.length;i++){
    const nearest=nodes.map((node,j)=>({j,distance:Math.hypot(node.x-nodes[i].x,node.y-nodes[i].y)}))
      .filter(n=>n.j!==i && n.distance<175).sort((a,b)=>a.distance-b.distance).slice(0,2);
    for(const {j} of nearest)edges.add([Math.min(i,j),Math.max(i,j)].join(','));
  }
  return {nodes,edges:[...edges].map(edge=>edge.split(',').map(Number))};
}
function draw() {
  context.clearRect(0,0,width,height);
  if (background === 'off' || !wideScreen.matches || gutter < 1) return;
  const dark = theme === 'dark' || (theme === 'system' && systemTheme.matches);
  const color = dark ? '156,183,140' : '90,116,65';
  for (const [side,graph] of graphs.entries()) {
    const points=graph.nodes.map(node=>({
      x:node.x+11*Math.sin(elapsed/13000+node.phase),
      y:node.y+14*Math.cos(elapsed/17000+node.phase*1.7),
    }));
    context.save();
    if (side) { context.translate(width,0); context.scale(-1,1); }
    context.strokeStyle=`rgba(${color},${dark?.26:.21})`;
    context.lineWidth=.8;
    const labels=['f','g','h','η','μ','α'];
    for(const [edge,[a,b]] of graph.edges.entries()){
      const from=points[a],to=points[b],dx=to.x-from.x,dy=to.y-from.y;
      const length=Math.hypot(dx,dy);
      if(length<20)continue;
      const ux=dx/length,uy=dy/length;
      // Leave room around the vertices, as in a typeset diagram.
      const start={x:from.x+ux*6,y:from.y+uy*6};
      const end={x:to.x-ux*7,y:to.y-uy*7};
      const bend=edge%5===0?13:0;
      const control={x:(start.x+end.x)/2-uy*bend,y:(start.y+end.y)/2+ux*bend};
      context.beginPath();context.moveTo(start.x,start.y);
      context.quadraticCurveTo(control.x,control.y,end.x,end.y);
      const angle=Math.atan2(end.y-control.y,end.x-control.x);
      // Open arrow tips keep the weight close to a TikZ-cd arrow.
      for(const wing of [-.43,.43]){
        context.moveTo(end.x-5.5*Math.cos(angle+wing),end.y-5.5*Math.sin(angle+wing));
        context.lineTo(end.x,end.y);
      }
      context.stroke();
      if(edge%3!==2 && length>50){
        // Put the label beside the curve, never over its shaft.
        const x=(start.x+2*control.x+end.x)/4-uy*10;
        const y=(start.y+2*control.y+end.y)/4+ux*10;
        context.save();
        // The right panel's graph is mirrored, but its lettering is not.
        context.translate(x,y);if(side)context.scale(-1,1);
        context.font='italic 13px Georgia, serif';
        context.textAlign='center';context.textBaseline='middle';
        context.fillStyle=`rgba(${color},${dark?.37:.30})`;
        context.fillText(labels[(edge+side*2)%labels.length],0,0);
        context.restore();
      }
    }
    for(const [i,point] of points.entries()){
      context.beginPath();
      context.arc(point.x,point.y,i%4===0?2.8:1.7,0,Math.PI*2);
      context.fillStyle=`rgba(${color},${i%4===0?.07:dark?.43:.34})`;
      context.fill();
      if(i%4===0){context.strokeStyle=`rgba(${color},${dark?.43:.34})`;context.stroke();}
    }
    context.restore();
  }
}
function animate(now) {
  if (lastTime) elapsed += now-lastTime;
  lastTime = now;
  draw();
  // Ten frames per second is enough for this nearly stationary decoration.
  timer = setTimeout(()=>{ frame=requestAnimationFrame(animate); },100);
}
function restart() {
  clearTimeout(timer); cancelAnimationFrame(frame); lastTime=0;
  draw();
  if ((background==='moving' || (background==='auto' && !reducedMotion.matches)) && wideScreen.matches && gutter>0 && !document.hidden) {
    frame=requestAnimationFrame(animate);
  }
}
controls.addEventListener('change', event => {
  if (event.target.name === 'reader-theme') {
    theme = event.target.value;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    save('reader-theme',theme);
  } else if (event.target.name === 'reader-background') {
    background = event.target.value;
    save('reader-background',background);
  }
  restart();
});
controls.addEventListener('keydown', event => {
  if (event.key === 'Escape') { controls.open=false; controls.querySelector('summary').focus(); }
});
document.addEventListener('click', event => { if (!controls.contains(event.target)) controls.open=false; });
for (const query of [systemTheme,reducedMotion,wideScreen]) query.addEventListener('change',restart);
document.addEventListener('visibilitychange',restart);
window.addEventListener('resize',resize);
resize();
