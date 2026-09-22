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
function resize() {
  width = innerWidth;
  height = innerHeight;
  gutter = Math.max(0, (width - 1138) / 2);
  const scale = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  restart();
}

// Slowly travelling contour lines. The paper masks their inner edges.
function draw() {
  context.clearRect(0,0,width,height);
  if (background === 'off' || !wideScreen.matches || gutter < 1) return;
  const dark = theme === 'dark' || (theme === 'system' && systemTheme.matches);
  const color = dark ? '156,183,140' : '90,116,65';
  const phase = elapsed / 9000;
  for (const side of [0,1]) {
    context.save();
    if (side) { context.translate(width,0); context.scale(-1,1); }
    for (let line = -3; line < gutter / 23 + 4; line++) {
      context.beginPath();
      for (let y = -8; y <= height+8; y += 8) {
        const bend = 32*Math.sin(y/210-phase+side*1.8+line*.13)
          + 13*Math.sin(y/105+phase*.65+line*.11);
        const x = line*23+bend;
        if(y===-8)context.moveTo(x,y);else context.lineTo(x,y);
      }
      context.strokeStyle = `rgba(${color},${dark?.19:.14})`;
      context.lineWidth = line % 4 === 0 ? 1.1 : .65;
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
