/* =========================================================================
   Hertzscher Dipol – interaktive Simulation
   Teil 1: Kern (Mathematik, 3D-Projektion, Bedienelemente, Tab-System)
   ========================================================================= */
'use strict';

const TAU = Math.PI * 2;
const C0 = 299792458;            // Lichtgeschwindigkeit in m/s
const D2R = Math.PI / 180;
const HALF_FOV = 23 * D2R;                       // halber vertikaler Öffnungswinkel
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);

function num(x, d = 2) { return x.toFixed(d).replace('.', ','); }
function hzStr(f) {
  if (f >= 1e9) return num(f / 1e9, 2) + ' GHz';
  if (f >= 1e6) return num(f / 1e6, f / 1e6 < 10 ? 2 : 1) + ' MHz';
  if (f >= 1e3) return num(f / 1e3, 0) + ' kHz';
  return num(f, 0) + ' Hz';
}
function pct(x) { return num(clamp(x * 100, 0, 999), x * 100 < 10 ? 1 : 0) + ' %'; }
/* Frequenzangabe aus Text lesen: "100", "100 MHz", "433mhz", "2,4 GHz" */
function parseHz(s) {
  const t = String(s).toLowerCase().replace(',', '.').replace(/\s/g, '');
  const m = t.match(/(-?[0-9]*\.?[0-9]+)(ghz|mhz|khz|hz)?/);
  if (!m) return NaN;
  const v = parseFloat(m[1]);
  const u = m[2] || 'mhz';
  return v * (u === 'ghz' ? 1e9 : u === 'mhz' ? 1e6 : u === 'khz' ? 1e3 : 1);
}

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const $ = s => document.querySelector(s);

/* ================= 3D-Vektor-Mathematik ================= */
const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
};

/* ================= Physik: Feld eines Hertz-Dipols =================
   Dipol entlang der y-Achse. Standardformeln des kurzen Dipols mit
   Nahfeld- (1/r^3), Induktions- (1/r^2) und Fernfeldanteil (1/r).
   k = 2*pi/lambda, t = Phasenwinkel (omega*t) in rad.                 */
function dipoleField(x, y, z, t, k) {
  let r = Math.hypot(x, y, z); if (r < 1e-3) r = 1e-3;
  const rho = Math.hypot(x, z);
  const cost = y / r;
  const sint = Math.min(1, rho / r);
  const u = t - k * r;
  const cu = Math.cos(u), su = Math.sin(u);
  const i1 = 1 / r, i2 = i1 * i1, i3 = i2 * i1;
  const Er = 2 * cost * (cu * i3 - k * su * i2);
  const Et = sint * (cu * (i3 - k * k * i1) - k * su * i2);
  const Bp = sint * (k * k * cu * i1 + k * su * i2);
  const rh = [x / r, y / r, z / r];
  const cosf = rho > 1e-9 ? x / rho : 1, sinf = rho > 1e-9 ? z / rho : 0;
  const th = [cost * cosf, -sint, cost * sinf];       // theta-Dach
  const phv = [-sinf, 0, cosf];                       // phi-Dach
  const E = [Er * rh[0] + Et * th[0], Er * rh[1] + Et * th[1], Er * rh[2] + Et * th[2]];
  const B = [Bp * phv[0], Bp * phv[1], Bp * phv[2]];
  return { E, B, Er, Et, Bp, r, cost, sint, th, ph: phv, rh };
}
/* Amplituden der Feldkomponenten (Quadratur der Terme) */
function ampTheta(r, sint, k) {
  const i1 = 1 / r, i2 = i1 * i1, i3 = i2 * i1;
  return Math.abs(sint) * Math.hypot(i3 - k * k * i1, k * i2);
}
function ampBphi(r, sint, k) {
  const i1 = 1 / r, i2 = i1 * i1;
  return Math.abs(sint) * Math.hypot(k * k * i1, k * i2);
}
function ampEr(r, cost, k) {
  const i1 = 1 / r, i2 = i1 * i1, i3 = i2 * i1;
  return Math.abs(2 * cost) * Math.hypot(i3, k * i2);
}
/* Phasendifferenz zwischen E_θ und B_φ in Grad (90° im Nahfeld, 0° im Fernfeld) */
function fieldPhaseDiff(r, k) {
  const i1 = 1 / r, i2 = i1 * i1, i3 = i2 * i1;
  const AE = i3 - k * k * i1, BE = -k * i2;
  const AB = k * k * i1, BB = k * i2;
  const pE = Math.atan2(-BE, AE), pB = Math.atan2(-BB, AB);
  let d = (pE - pB) * 180 / Math.PI;
  d = ((d % 180) + 180) % 180;          // Phasendifferenz modulo 180°
  if (d > 90) d = 180 - d;              // 90° = Quadratur (Nahfeld), 0° = in Phase (Fernfeld)
  return d;
}
/* Dominierender Term: 0 = 1/r³ (Nahfeld), 1 = 1/r², 2 = 1/r (Fernfeld) */
function termDominance(r, k) {
  const i1 = 1 / r, i2 = i1 * i1, i3 = i2 * i1;
  const t = [i3, k * i2, k * k * i1];
  let m = 0; for (let i = 1; i < 3; i++) if (t[i] > t[m]) m = i;
  return m;
}
/* Wie stark ist der Energiefluss "gleichgerichtet"?   0 % = pendelt (Nahfeld),
   ~80 % = strahlt nach außen (Fernfeld) */
function fluxRatio(r, sint, k) {
  const i1 = 1 / r, i2 = i1 * i1, i3 = i2 * i1;
  let sum = 0, sq = 0;
  const N = 36;
  for (let i = 0; i < N; i++) {
    const u = i / N * TAU;
    const Et = sint * ((i3 - k * k * i1) * Math.cos(u) - k * i2 * Math.sin(u));
    const Bp = sint * (k * k * i1 * Math.cos(u) + k * i2 * Math.sin(u));
    const s = Et * Bp;
    sum += s; sq += s * s;
  }
  const mean = sum / N, rms = Math.sqrt(sq / N);
  return rms > 1e-30 ? Math.abs(mean) / rms : 0;
}

/* ================= Anzeige-Grundformen (2D) ================= */
function sLine(c, a, b, color, w, dash) {
  c.save(); c.strokeStyle = color; c.lineWidth = w;
  c.lineCap = 'round';
  if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); c.restore();
}
function sArrow(c, a, b, color, w, head) {
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  if (L < 1.2) { c.save(); c.fillStyle = color; c.beginPath(); c.arc(a.x, a.y, w * .9, 0, TAU); c.fill(); c.restore(); return; }
  const ux = dx / L, uy = dy / L;
  const hs = Math.min(head, L * 0.75);
  c.save(); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x - ux * hs * .7, b.y - uy * hs * .7); c.stroke();
  c.beginPath();
  c.moveTo(b.x, b.y);
  c.lineTo(b.x - ux * hs - uy * hs * .45, b.y - uy * hs + ux * hs * .45);
  c.lineTo(b.x - ux * hs + uy * hs * .45, b.y - uy * hs - ux * hs * .45);
  c.closePath(); c.fill(); c.restore();
}
function sText(c, x, y, txt, color, size, align, baseline) {
  c.save(); c.fillStyle = color; c.font = (size || 11) + 'px -apple-system,system-ui,sans-serif';
  c.textAlign = align || 'center'; c.textBaseline = baseline || 'middle';
  c.fillText(txt, x, y); c.restore();
}
function sGlow(c, x, y, r, color, alpha) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')');
  g.addColorStop(0.25, color.replace('A', (alpha * 0.85).toFixed(3)));
  g.addColorStop(1, color.replace('A', '0'));
  c.save(); c.globalCompositeOperation = 'lighter';
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = g; c.fill(); c.restore();
}

/* ================= Tab-System ================= */
const mainEl = document.getElementById('main');
const tabsEl = document.getElementById('tabs');
const views = [];
let cur = null, now = 0;

function addView(id, title, build) {
  const sec = el('section', 'view');
  sec.id = 'view-' + id;
  const stage = el('div', 'stage');
  const canvas = el('canvas');
  stage.append(canvas);
  stage.append(el('div', 'badges'));
  const panel = el('div', 'panel');
  sec.append(stage, panel);
  mainEl.append(sec);

  const view = {
    id, title, sec, stage, canvas, panel,
    ctx: canvas.getContext('2d'),
    W: 1, H: 1,
    cam: { yaw: -0.72, pitch: 0.30, dist: 8, target: [0, 0, 0] },
    homeCam: { yaw: -0.72, pitch: 0.30, dist: 8 },
    sprites: [], badges: [], phase: 0, t: 0,
    begin() {
      const cam = this.cam, cp = Math.cos(cam.pitch);
      const e = [cam.target[0] + cam.dist * cp * Math.sin(cam.yaw),
                 cam.target[1] + cam.dist * Math.sin(cam.pitch),
                 cam.target[2] + cam.dist * cp * Math.cos(cam.yaw)];
      const f = v3.norm(v3.sub(cam.target, e));
      let r = v3.cross(f, [0, 1, 0]); if (v3.len(r) < 1e-6) r = [1, 0, 0]; r = v3.norm(r);
      const u = v3.cross(r, f);
      this._F = { e, f, r, u, fpx: (this.H * 0.5) / Math.tan(HALF_FOV) };
      this.sprites.length = 0;
    },
    proj(p) {
      const F = this._F, d = v3.sub(p, F.e), z = v3.dot(d, F.f);
      return { x: this.W * 0.5 + F.fpx * v3.dot(d, F.r) / z,
               y: this.H * 0.5 - F.fpx * v3.dot(d, F.u) / z, z };
    },
    push(z, fn) { this.sprites.push({ z, fn }); },
    flush() { this.sprites.sort((a, b) => b.z - a.z); for (const s of this.sprites) s.fn(); this.sprites.length = 0; },
    resetCam() { Object.assign(this.cam, this.homeCam); },
    /* Nötiger Kameraabstand, damit ein Radius "rad" in beiden Richtungen passt */
    needDist(rad) {
      const tanV = Math.tan(HALF_FOV) * 0.92;
      const tanH = tanV * (this.W / Math.max(1, this.H));
      return clamp(rad / Math.max(0.02, Math.min(tanV, tanH)), 1.2, 60);
    },
    fit(rad) { this.cam.dist = this.needDist(rad); },
    setBadges(list) {
      this.badges = list;
      const box = this.stage.querySelector('.badges');
      if (!box) return;
      const key = list.join('|');
      if (box._key === key) return;
      box._key = key;
      box.innerHTML = '';
      list.forEach(t => box.append(el('div', 'badge', t)));
    },
    addBadgeBox() {
      if (!this.stage.querySelector('.badges')) {
        const b = el('div', 'badges'); this.stage.append(b);
      }
    },
    resize() {
      const r = this.canvas.getBoundingClientRect();
      const W = r.width, H = r.height;
      if (W < 4 || H < 4) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round(W * dpr), h = Math.round(H * dpr);
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      this.W = W; this.H = H;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.onResize) this.onResize();
    }
  };

  /* Bedienung: Ziehen = drehen, zwei Finger = zoomen */
  const pts = new Map(); let pinch = 0, moved = 0;
  const cv = canvas;
  cv.addEventListener('pointerdown', e => {
    try { cv.setPointerCapture(e.pointerId); } catch (_) { }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
  });
  cv.addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (pts.size === 1) {
      if (!(view.onDrag && view.onDrag(dx, dy))) {
        view.cam.yaw -= dx * 0.0065;
        view.cam.pitch = clamp(view.cam.pitch + dy * 0.006, -1.32, 1.42);
        if (view.onOrbit) view.onOrbit();
      }
    } else if (pts.size >= 2) {
      const a = [...pts.values()];
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      if (pinch > 0) {
        view.cam.dist = clamp(view.cam.dist * (pinch / d), 1.2, 60);
        if (view.onZoom) view.onZoom();
      }
      pinch = d;
    }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => {
    e.preventDefault();
    view.cam.dist = clamp(view.cam.dist * Math.exp(e.deltaY * 0.0012), 1.2, 60);
    if (view.onZoom) view.onZoom();
  }, { passive: false });
  cv.addEventListener('touchstart', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  views.push(view);
  const btn = el('button', 'tab', title);
  btn.onclick = () => showView(view);
  tabsEl.append(btn);
  view.btn = btn;

  build(view);
  return view;
}

function showView(v) {
  views.forEach(x => {
    const on = x === v;
    x.sec.classList.toggle('on', on);
    x.btn.classList.toggle('on', on);
  });
  cur = v;
  if (history.replaceState) history.replaceState(null, '', '#' + v.id);
  requestAnimationFrame(() => { v.resize(); if (v.onShow) v.onShow(); });
  window.scrollTo(0, 0);
}

/* ================= Bedienelemente ================= */
function grid(parent, title) {
  const g = el('div', 'grid');
  parent.append(g);
  if (title) g.append(el('h2', 'sec', title));
  return g;
}
function slider(parent, o) {
  const w = el('div', 'ctrl');
  const top = el('div', 'ctrl-top');
  const lab = el('label', null, o.label);
  const e = o.entry;
  let out = null, nInp = null;
  if (e) {
    const box = el('span', 'nbox');
    nInp = el('input');
    nInp.type = 'text'; nInp.inputMode = 'decimal'; nInp.className = 'nentry';
    nInp.autocomplete = 'off'; nInp.spellcheck = false;
    box.append(nInp);
    if (typeof e.unit === 'string') box.append(el('span', 'nunit', e.unit));
    top.append(lab, box);
  } else {
    out = el('output');
    top.append(lab, out);
  }
  w.append(top);
  const inp = el('input'); inp.type = 'range';
  inp.min = o.min; inp.max = o.max; inp.step = o.step; inp.value = o.value;
  w.append(inp); parent.append(w);
  const fmt = o.fmt || (v => num(v, 2));
  const toPhys = p => (e && e.toPhys) ? e.toPhys(p) : p * (e ? (e.scale || 1) : 1);
  const toPos = ph => (e && e.toPos) ? e.toPos(ph) : ph / (e ? (e.scale || 1) : 1);
  const sync = () => {
    const p = +inp.value;
    if (e) {
      if (document.activeElement !== nInp)
        nInp.value = e.display ? e.display(p) : num(toPhys(p) / (e.scale || 1), e.dec != null ? e.dec : 2);
    } else out.textContent = fmt(p);
  };
  const commit = () => {
    let ph;
    try { ph = e.parse ? e.parse(nInp.value) : parseFloat(String(nInp.value).replace(',', '.')) * (e.scale || 1); }
    catch (_) { ph = NaN; }
    if (!isFinite(ph)) { sync(); return; }
    const p = clamp(toPos(ph), +inp.min, +inp.max);
    inp.value = p; sync();
    if (o.on) o.on(p);
  };
  if (e) {
    nInp.addEventListener('change', commit);
    nInp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { commit(); nInp.blur(); } });
  }
  inp.addEventListener('input', () => { sync(); o.on && o.on(+inp.value); });
  sync();
  return { el: w, input: inp, entry: nInp, get: () => +inp.value, set(v, fire) { inp.value = v; sync(); if (fire) o.on && o.on(+inp.value); } };
}
function seg(parent, o) {
  const w = el('div', 'ctrl');
  if (o.label) w.append(el('label', null, o.label));
  const row = el('div', 'seg' + (o.wide === false ? '' : ' wide'));
  w.append(row); parent.append(w);
  const items = o.options.map(op => {
    const b = el('button', null, op.label);
    b.onclick = () => { sel(op.v); o.on && o.on(op.v); };
    row.append(b); return { b, v: op.v, c: op.color };
  });
  function sel(v) { items.forEach(it => { it.b.classList.toggle('on', it.v === v); if (it.c) it.b.style.color = it.v === v ? it.c : ''; }); }
  sel(o.value);
  return { el: w, set: sel, get: () => items.find(i => i.b.classList.contains('on')).v };
}
function note(parent, html) {
  const n = el('div', 'note'); n.innerHTML = html; parent.append(n); return n;
}
function readouts(parent) {
  const r = el('div', 'readouts'); parent.append(r);
  const map = {};
  return {
    el: r,
    add(key, label, cls) { const d = el('div', 'ro' + (cls ? ' ' + cls : '')); d.innerHTML = label + ' <b>–</b>';
      r.append(d); map[key] = d.querySelector('b'); return map[key]; },
    set(key, v) { const b = map[key]; if (b && b._last !== v) { b.textContent = v; b._last = v; } }
  };
}
function pole(parent, o) {
  const w = el('div', 'ctrl');
  const lab = el('div', 'ctrl-top'); lab.append(el('label', null, o.label), el('output', null, ''));
  w.append(lab);
  const inp = el('input'); inp.type = 'range';
  inp.min = o.min; inp.max = o.max; inp.step = o.step; inp.value = o.value;
  w.append(inp); parent.append(w);
  const sync = () => { lab.querySelector('output').textContent = (o.fmt || (v => num(v, 0) + '°'))(+inp.value); };
  inp.addEventListener('input', () => { sync(); o.on && o.on(+inp.value); });
  sync();
  return { el: w, get: () => +inp.value, set(v, fire) { inp.value = v; sync(); if (fire) o.on && o.on(+inp.value); } };
}

/* ================= Diagramme ================= */
function polarPlot(cv, o) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 150, H = cv.clientHeight || 118;
  if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  else if (cv.height !== H * dpr) { cv.height = H * dpr; }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.40;
  c.strokeStyle = '#1e2942'; c.lineWidth = 1;
  for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(cx, cy, R * i / 3, 0, TAU); c.stroke(); }
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8;
    c.beginPath(); c.moveTo(cx + Math.cos(a) * R * 0.08, cy + Math.sin(a) * R * 0.08);
    c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke();
  }
  /* Kurve: fn(alpha) -> 0..1, alpha gemessen ab oben, im Uhrzeigersinn */
  c.beginPath();
  for (let i = 0; i <= 180; i++) {
    const a = i / 180 * TAU;
    const rr = clamp(o.fn(a), 0, 1.15) * R;
    const x = cx + Math.sin(a) * rr, y = cy - Math.cos(a) * rr;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.strokeStyle = o.color || '#4fc3f7'; c.lineWidth = 2; c.stroke();
  if (o.markerAngle != null) {
    const ang = o.markerAngle;
    const rr = clamp(o.fn(ang), 0, 1.15) * R;
    const x = cx + Math.sin(ang) * rr, y = cy - Math.cos(ang) * rr;
    c.strokeStyle = 'rgba(255,213,79,.45)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke();
    c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(x, y, 4.5, 0, TAU); c.fill();
  }
  sText(c, cx, 9, o.top || '', '#7d8db0', 10);
  sText(c, W - 6, cy + R + 8, o.lab || '', '#61708f', 9.5, 'right');
}
function curvePlot(cv, o) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 150, H = cv.clientHeight || 118;
  if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const L = 26, B = 20, T = 14, R = 8;
  const pw = W - L - R, ph = H - B - T;
  c.strokeStyle = '#1e2942'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(L, T); c.lineTo(L, T + ph); c.lineTo(L + pw, T + ph); c.stroke();
  c.beginPath();
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const x = L + u * pw, y = T + ph - clamp(o.fn(u), 0, 1) * ph;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.strokeStyle = o.color || '#ffb74d'; c.lineWidth = 2; c.stroke();
  if (o.marker != null) {
    const u = clamp(o.marker, 0, 1);
    const x = L + u * pw, y = T + ph - clamp(o.fn(u), 0, 1) * ph;
    c.strokeStyle = '#2b3a5c'; c.beginPath(); c.moveTo(x, T); c.lineTo(x, T + ph); c.stroke();
    c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill();
  }
  sText(c, L, 8, o.top || '', '#7d8db0', 10, 'left');
  sText(c, W - 6, H - 6, o.xlab || '', '#61708f', 9.5, 'right');
  sText(c, L - 4, T + 4, o.ylab || '', '#61708f', 9.5, 'right');
}

/* ================= Hauptschleife ================= */
let lastT = 0;
function frame(ts) {
  const dt = lastT ? Math.min(0.05, (ts - lastT) / 1000) : 0;
  lastT = ts; now += dt;
  const v = cur;
  if (v) {
    if (!v.sec.classList.contains('on')) { /* nichts */ }
    else if (v.draw) {
      v.t += dt;
      try { v.draw(dt); }
      catch (e) { if (!v._err) { v._err = 1; console.error('Zeichenfehler in Ansicht ' + v.id + ':', e); } }
    }
  }
  requestAnimationFrame(frame);
}
function setVH() {
  document.documentElement.style.setProperty('--vh', window.innerHeight + 'px');
}
window.addEventListener('resize', () => { setVH(); views.forEach(v => v.resize()); });
window.addEventListener('orientationchange', () => setTimeout(() => { setVH(); views.forEach(v => v.resize()); }, 250));
