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
let background = read('reader-background', 'moving');
if (!['system','light','dark'].includes(theme)) theme = 'system';
if (!['moving','still','off'].includes(background)) background = 'moving';
controls.hidden = false;
controls.querySelector(`[name="reader-theme"][value="${theme}"]`).checked = true;
controls.querySelector('[name="reader-background"]').value = background;

let width = 0, height = 0, gutter = 0, timer = 0, frame = 0, elapsed = 0, lastTime = 0;
let sites = [];
function resize() {
  width = innerWidth;
  height = innerHeight;
  gutter = Math.max(0, (width - 1138) / 2);
  const scale = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  // A deterministic, gently perturbed lattice keeps reloads visually quiet.
  sites = [];
  const columns = Math.max(2, Math.ceil(gutter / 130));
  const rows = Math.ceil(height / 150) + 2;
  for (let y = -1; y < rows; y++) for (let x = -1; x <= columns; x++) {
    const n = (x + 3) * 127.1 + (y + 3) * 311.7;
    const noise = Math.sin(n) * 43758.5453;
    const jitter = noise - Math.floor(noise);
    sites.push({x:x * 130 + jitter * 80, y:y * 150 + (1-jitter) * 95, phase:n, tint:jitter});
  }
  restart();
}

// Clip each cell against the perpendicular bisector of every other site.
// These are actual Voronoi cells; no triangulation library or GPU is needed.
function cell(points, index) {
  const a = points[index];
  let polygon = [[0,0],[gutter,0],[gutter,height],[0,height]];
  for (let j = 0; j < points.length && polygon.length; j++) {
    if (j === index) continue;
    const b = points[j], dx = b.x-a.x, dy = b.y-a.y;
    const limit = (b.x*b.x+b.y*b.y-a.x*a.x-a.y*a.y)/2;
    const clipped = [];
    for (let k = 0; k < polygon.length; k++) {
      const p = polygon[k], q = polygon[(k+1)%polygon.length];
      const dp = p[0]*dx+p[1]*dy-limit, dq = q[0]*dx+q[1]*dy-limit;
      if (dp <= 0) clipped.push(p);
      if ((dp <= 0) !== (dq <= 0)) {
        const t = dp/(dp-dq);
        clipped.push([p[0]+t*(q[0]-p[0]), p[1]+t*(q[1]-p[1])]);
      }
    }
    polygon = clipped;
  }
  return polygon;
}
function draw() {
  context.clearRect(0,0,width,height);
  if (background === 'off' || !wideScreen.matches || gutter < 1) return;
  const dark = theme === 'dark' || (theme === 'system' && systemTheme.matches);
  const color = dark ? '156,183,140' : '90,116,65';
  for (const side of [0,1]) {
    const points = sites.map(s => ({
      x:s.x+19*Math.sin(elapsed/43000+s.phase+side),
      y:s.y+23*Math.cos(elapsed/57000+s.phase*.7+side),
    }));
    context.save();
    if (side) { context.translate(width,0); context.scale(-1,1); }
    for (let i = 0; i < points.length; i++) {
      const polygon = cell(points,i);
      if (!polygon.length) continue;
      context.beginPath();
      polygon.forEach(([x,y],k)=>k?context.lineTo(x,y):context.moveTo(x,y));
      context.closePath();
      context.fillStyle = `rgba(${color},${.025+sites[i].tint*.065})`;
      context.fill();
      context.strokeStyle = `rgba(${color},${dark?.19:.15})`;
      context.lineWidth = .7;
      context.stroke();
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
  if (background==='moving' && !reducedMotion.matches && wideScreen.matches && gutter>0 && !document.hidden) {
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
