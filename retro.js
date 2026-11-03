
const sleep = ms => new Promise(r => setTimeout(r, ms));

function paint(c) {
  const w = c.clientWidth, h = c.clientHeight;
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  const s = c._s;
  if (!s || !s.img) return;

  const img = s.img;
  const k  = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = Math.round(img.naturalWidth * k);
  const dh = Math.round(img.naturalHeight * k);
  const dx = (w - dw) >> 1, dy = (h - dh) >> 1;

  if (s.px <= 1) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }
  const t = document.createElement('canvas');
  t.width  = Math.max(1, Math.ceil(dw / s.px));
  t.height = Math.max(1, Math.ceil(dh / s.px));
  t.getContext('2d').drawImage(img, 0, 0, t.width, t.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(t, dx, dy, dw, dh);
}

async function progressiveLoad(c, img, onStep) {
  const token = c._tok = (c._tok || 0) + 1;
  const STEPS = [48, 24, 12, 6, 3, 1];  
  const PASS_MS = 200;                    
  const START_MS = 250;            

  c._s = null; paint(c);
  await sleep(START_MS);

  for (let i = 0; i < STEPS.length; i++) {
    if (c._tok !== token) return false;
    c._s = { img, px: STEPS[i] };
    paint(c);
    if (onStep) onStep(Math.round((i + 1) / STEPS.length * 100));
    if (i < STEPS.length - 1) await sleep(PASS_MS);
  }
  return c._tok === token;
}

function clearCanvas(c) { c._tok = (c._tok || 0) + 1; c._s = null; paint(c); }

function loadImage(src) {
  return new Promise(res => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
}

window.addEventListener('resize', () => document.querySelectorAll('canvas').forEach(paint));
