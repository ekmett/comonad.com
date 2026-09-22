const figure = document.querySelector('.quine-demo');
const canvas = figure.querySelector('canvas');
const shaderChoice = figure.querySelector('[data-shader]');
const quality = figure.querySelector('[data-quality]');
const play = figure.querySelector('[data-play]');
const reset = figure.querySelector('[data-reset]');
const scrub = figure.querySelector('[data-time]');
const clock = figure.querySelector('[data-time-label]');
const status = figure.querySelector('[data-status]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const gl = canvas.getContext('webgl2', {alpha:false, antialias:false, depth:false, stencil:false});
const descriptions = {
  dodecahedron:'Quine’s dodecahedron example: twenty triangular frames, ray-marched with shadows and ambient occlusion.',
  generators:'Generators Redux by Kali, optimized by eiffie: a flight through a fractal structure following a reflective ball. CC BY-NC-SA 3.0.',
};
let running = !reducedMotion.matches, visible = false, ready = false, frame = 0;
let time = 0, last = 0, drawn = 0, selected = null, request = 0, lost = false;
let camera = [0,0], pointer = null;
const sources = new Map(), programs = new Map();
const vertex = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

function compile(kind, source) {
  const shader = gl.createShader(kind);
  gl.shaderSource(shader,source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}
function program(source) {
  const vs = compile(gl.VERTEX_SHADER,vertex);
  let fs, p;
  try {
    fs=compile(gl.FRAGMENT_SHADER,source); p=gl.createProgram();
    gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return {program:p, resolution:gl.getUniformLocation(p,'iResolution'),
      time:gl.getUniformLocation(p,'iGlobalTime'), mouse:gl.getUniformLocation(p,'iMouse')};
  } catch(error) { if(p)gl.deleteProgram(p); throw error; }
  finally { gl.deleteShader(vs); if(fs)gl.deleteShader(fs); }
}
function updateClock() {
  scrub.max = String(Math.max(120,Math.ceil(time/60)*60));
  scrub.value = String(time); clock.value = `${time.toFixed(1)} s`;
}
function draw() {
  if (!ready || lost) return;
  gl.viewport(0,0,canvas.width,canvas.height);
  gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(selected.program);
  gl.uniform2f(selected.resolution,canvas.width,canvas.height);
  gl.uniform1f(selected.time,time);
  if(selected.mouse)gl.uniform4f(selected.mouse,(camera[0]/3+.5)*canvas.width,(camera[1]/3+.5)*canvas.height,1,1);
  gl.drawArrays(gl.TRIANGLES,0,3);
  figure.dataset.renderState='ready';
  updateClock();
}
function animate(now) {
  if(last)time+=(now-last)/1000;
  last=now;
  if(now-drawn>=1000/30){ draw(); drawn=now; }
  frame=requestAnimationFrame(animate);
}
function schedule() {
  cancelAnimationFrame(frame); last=0;
  play.textContent=running?'Pause':'Play';
  if(ready)status.textContent=running?'Runs locally in your browser. Pauses when out of view.':
    reducedMotion.matches&&time===0?'Paused for reduced motion. Play or move the time slider to explore.':'Paused. Play or move the time slider to explore.';
  if(ready && running && visible && !document.hidden && !lost)frame=requestAnimationFrame(animate);
}
function resize() {
  const width=Math.max(1,Math.round(Math.min(canvas.getBoundingClientRect().width,Number(quality.value))));
  canvas.width=width; canvas.height=Math.round(width*5/8);
  draw();
}
async function load() {
  if(!gl || lost)return;
  const revision=++request, name=shaderChoice.value;
  ready=false; schedule(); play.disabled=true; reset.disabled=true;
  status.textContent='Loading the shader…'; figure.dataset.renderState='loading';
  try {
    if(!sources.has(name)){
      const response=await fetch(new URL(`./assets/quine/${name}.frag`,import.meta.url));
      if(!response.ok)throw new Error(`Shader source returned ${response.status}`);
      sources.set(name,await response.text());
    }
    if(revision!==request || lost)return;
    if(!programs.has(name))programs.set(name,program(sources.get(name)));
    selected=programs.get(name); ready=true; camera=[0,0];
    figure.querySelector('[data-description]').textContent=descriptions[name];
    canvas.setAttribute('aria-label',descriptions[name]);
    for(const [selector,path] of [['[data-source]',`${name}.frag`],['[data-original]',`original/${name}.frag`]])
      figure.querySelector(selector).href=new URL(`./assets/quine/${path}`,import.meta.url).href;
    figure.querySelector('#quine-camera-help').hidden=name!=='generators';
    canvas.style.touchAction=name==='generators'?'none':'auto';
    play.disabled=false; reset.disabled=false;
    resize();
    if(gl.getError()!==gl.NO_ERROR)throw new Error('WebGL could not draw this shader.');
    schedule();
  } catch(error) {
    if(revision!==request)return;
    ready=false; schedule(); figure.dataset.renderState='error';
    status.textContent='This shader could not run here. Try the other shader; both sources are available below.';
    console.error('Quine shader:',error);
  }
}
play.addEventListener('click',()=>{running=!running;schedule();});
reset.addEventListener('click',()=>{time=0;camera=[0,0];last=0;draw();});
scrub.addEventListener('input',()=>{running=false;time=Number(scrub.value);schedule();draw();});
quality.addEventListener('change',resize);
shaderChoice.addEventListener('change',()=>{time=0;load();});
canvas.addEventListener('pointerdown',event=>{
  if(shaderChoice.value!=='generators')return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY}; canvas.setPointerCapture(event.pointerId);canvas.focus();
});
canvas.addEventListener('pointermove',event=>{
  if(!pointer || pointer.id!==event.pointerId)return;
  const size=canvas.getBoundingClientRect();
  camera[0]+=(event.clientX-pointer.x)/size.width*3;
  camera[1]-=(event.clientY-pointer.y)/size.height*3;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY};draw();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{pointer=null;});
canvas.addEventListener('keydown',event=>{
  if(shaderChoice.value!=='generators')return;
  const moves={ArrowLeft:[-.08,0],ArrowRight:[.08,0],ArrowUp:[0,.08],ArrowDown:[0,-.08]};
  if(event.key==='Home')camera=[0,0];
  else if(moves[event.key])camera=camera.map((v,i)=>v+moves[event.key][i]);
  else return;
  event.preventDefault();draw();
});
reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)running=false;schedule();});
document.addEventListener('visibilitychange',schedule);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();},{threshold:.01}).observe(canvas);
new ResizeObserver(resize).observe(canvas);
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();lost=true;ready=false;++request;schedule();
  play.disabled=true;reset.disabled=true;
  status.textContent='Graphics paused while the browser recovers its drawing context.';
});
canvas.addEventListener('webglcontextrestored',()=>{lost=false;programs.clear();load();});
if(gl)load();
else{
  figure.dataset.renderState='unavailable';
  status.textContent='WebGL 2 is unavailable in this browser. You can still read and download the shaders below.';
  canvas.hidden=true;figure.querySelector('.quine-time').hidden=true;
}
