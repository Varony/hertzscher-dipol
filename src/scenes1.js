/* =========================================================================
   Teil 2: Szenen – Feldvisualisierung, Sender, Empfänger
   ========================================================================= */

const HALF = 0.75;                 // halbe Dipollänge [m]  (λ/2 bei 100 MHz)
const F0 = 100e6;                  // Bezugsfrequenz
const LAM0 = C0 / F0;              // 3,0 m

const WARM = [255, 112, 67], COOL = [86, 138, 255], CYAN = [72, 214, 232], LAMPC = [255, 214, 90];
function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a.toFixed(3) + ')'; }

/* ---------- 3D-Zeichenprimitive mit Tiefensortierung ---------- */
function P3(V, a, b, color, w, dash) {
  const A = V.proj(a), B = V.proj(b); if (A.z < 0.06 || B.z < 0.06) return;
  V.push((A.z + B.z) * .5, () => sLine(V.ctx, A, B, color, w, dash));
}
function A3(V, a, b, color, w, head) {
  const A = V.proj(a), B = V.proj(b); if (A.z < 0.06 || B.z < 0.06) return;
  const d = Math.hypot(A.x - B.x, A.y - B.y); if (d < 1.1) return;
  V.push((A.z + B.z) * .5, () => sArrow(V.ctx, A, B, color, w, head || 8));
}
function T3(V, p, txt, color, size, dy, align) {
  const A = V.proj(p); if (A.z < 0.06) return;
  V.push(A.z, () => sText(V.ctx, A.x, A.y + (dy || 0), txt, color || '#cfe3ff', size || 11.5, align));
}
function SEG3(V, pts, color, w, dash) { for (let i = 0; i + 1 < pts.length; i++)P3(V, pts[i], pts[i + 1], color, w, dash); }
function bg(V) {
  const c = V.ctx, H = V.H;
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a1025'); g.addColorStop(.55, '#070c19'); g.addColorStop(1, '#04060d');
  c.fillStyle = g; c.fillRect(0, 0, V.W, H);
}

/* ---------- Hintergrundraster in der Äquatorebene ---------- */
function equatorGrid(V, ext) {
  const step = ext > 4 ? 1 : 0.5;
  for (let r = step; r <= ext * 1.02; r += step) {
    const pts = [];
    for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU; pts.push([r * Math.cos(a), 0, r * Math.sin(a)]); }
    for (let i = 0; i + 1 < pts.length; i++) P3(V, pts[i], pts[i + 1], 'rgba(60,80,120,.42)', 1);
  }
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    P3(V, [0, 0, 0], [ext * Math.cos(a), 0, ext * Math.sin(a)], 'rgba(60,80,120,.22)', 1);
  }
}

/* ---------- Nahfeldgrenze (Kugel r = λ) ---------- */
function nearSphere(V, lam) {
  const C = 'rgba(79,195,247,.55)';
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 72; i++) {
      const a = i / 72 * TAU, s = Math.sin(a) * lam, c = Math.cos(a) * lam;
      pts.push(k === 0 ? [s, c, 0] : k === 1 ? [s, 0, c] : [0, s, c]);
    }
    for (let i = 0; i + 1 < pts.length; i++) P3(V, pts[i], pts[i + 1], C, 1.2, [5, 5]);
  }
  T3(V, [0, lam, 0], 'r = λ  (Nahfeldgrenze)', 'rgba(120,200,255,.85)', 11.5, -6);
}

/* ---------- Abstrahlkeule (Toroid) ---------- */
function donut(V, R) {
  const col = 'rgba(255,150,80,.34)';
  for (let th = 15; th < 180; th += 15) {
    const a = th * D2R, pts = [];
    for (let i = 0; i <= 48; i++) {
      const p = i / 48 * TAU;
      pts.push([R * Math.sin(a) * Math.sin(a) * Math.cos(p), R * Math.sin(a) * Math.cos(a), R * Math.sin(a) * Math.sin(a) * Math.sin(p)]);
    }
    for (let i = 0; i + 1 < pts.length; i++) P3(V, pts[i], pts[i + 1], col, 1.2);
  }
  for (let p = 0; p < 12; p++) {
    const pp = p / 12 * TAU, pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * Math.PI;
      pts.push([R * Math.sin(a) * Math.sin(a) * Math.cos(pp), R * Math.sin(a) * Math.cos(a), R * Math.sin(a) * Math.sin(a) * Math.sin(pp)]);
    }
    for (let i = 0; i + 1 < pts.length; i++) P3(V, pts[i], pts[i + 1], col, 1.2);
  }
}

/* ---------- Amplitudenskalierung (logarithmisch, damit Nah- und Fernfeld
     gleichzeitig sichtbar bleiben; Angabe im Bild vermerkt) ---------- */
const LOGK = 9;
function ampScale(a, aRef) { return clamp(Math.log10(1 + LOGK * a / aRef), 0, 1); }

/* ---------- E-Feld: Vertikalschnitt (x-y-Ebene) ---------- */
function quiverVertical(V, st, lam, k, t, ext) {
  const ctx = V.ctx;
  const aref = 2 * (k * k) / lam;
  const NR = 12, NA = 32, rmax = ext * 0.97, rmin = clamp(0.22 * ext, 0.10, 0.42);
  for (let i = 0; i < NR; i++) {
    const r = rmin * Math.pow(rmax / rmin, i / (NR - 1));
    const na = i < 2 ? 8 : (i < 4 ? 16 : (i < 6 ? 24 : 32));
    const Lmax = Math.min(0.13 * r + 0.02 * ext, ext * 0.085);
    for (let j = 0; j < na; j++) {
      const th = j * TAU / na + (NA / na - 1) * Math.PI / NA;
      const x = r * Math.sin(th), y = r * Math.cos(th);
      const f = dipoleField(x, y, 0, t, k);
      const a = Math.hypot(f.E[0], f.E[1]);
      if (a < 1e-9) continue;
      const len = Lmax * ampScale(a, aref);
      const ux = f.E[0] / a, uy = f.E[1] / a;
      const A = V.proj([x - ux * len * .5, y - uy * len * .5, 0]);
      const B = V.proj([x + ux * len * .5, y + uy * len * .5, 0]);
      if (A.z < 0.06 || B.z < 0.06) continue;
      const scr = Math.hypot(A.x - B.x, A.y - B.y);
      if (scr < 2.0) continue;
      const vert = Math.min(1, Math.abs(f.E[1]) / a + 0.15);
      const col = rgba(mixc(COOL, WARM, f.E[1] > 0 ? 1 : 0), 0.22 + 0.62 * Math.max(vert, ampScale(a, aref) * .8));
      V.push((A.z + B.z) * .5, () => sArrow(ctx, A, B, col, Math.max(1.05, scr * .07), Math.min(6.5, 1.5 + scr * .45)));
    }
  }
}
/* ---------- B-Feld: Vertikalschnitt (Symbole aus/in der Ebene) ---------- */
function quiverBVertical(V, st, lam, k, t, ext) {
  const ctx = V.ctx, fwd = V._F.f;
  const aref = 2 * (k * k) / lam;
  const NR = 6, NA = 14, rmax = ext * 0.95, rmin = clamp(0.26 * ext, 0.18, 0.7);
  for (let i = 0; i < NR; i++) {
    const r = rmin * Math.pow(rmax / rmin, i / (NR - 1));
    for (let j = 0; j < NA; j++) {
      const th = j * TAU / NA;
      const x = r * Math.sin(th), y = r * Math.cos(th);
      const f = dipoleField(x, y, 0, t, k);
      const b = Math.abs(f.Bp); if (b < 1e-12) continue;
      const s = ampScale(b, aref); if (s < 0.04) continue;
      const A = V.proj([x, y, 0]); if (A.z < 0.06) continue;
      const rad = 2 + 7 * s;
      const away = v3.dot(f.B, fwd) < 0;        // zeigt das Feld zum Betrachter?
      const col = rgba(CYAN, 0.3 + 0.6 * s);
      V.push(A.z, () => {
        ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(A.x, A.y, rad, 0, TAU); ctx.stroke();
        if (away) {
          ctx.beginPath(); ctx.arc(A.x, A.y, Math.max(1.1, rad * .28), 0, TAU); ctx.fill();
        } else {
          const q = rad * .72;
          ctx.beginPath(); ctx.moveTo(A.x - q, A.y - q); ctx.lineTo(A.x + q, A.y + q);
          ctx.moveTo(A.x + q, A.y - q); ctx.lineTo(A.x - q, A.y + q); ctx.stroke();
        }
        ctx.restore();
      });
    }
  }
}
/* ---------- Felder im Horizontalschnitt (y = 0) ---------- */
function quiverHorizontal(V, st, lam, k, t, ext) {
  const ctx = V.ctx;
  const aref = 2 * (k * k) / lam;
  const NR = 5, NA = 24, rmin = 0.5, rmax = ext * 0.95;
  for (let i = 0; i < NR; i++) {
    const r = rmin * Math.pow(rmax / rmin, i / (NR - 1));
    const Lmax = Math.min(0.16 * r + 0.02 * ext, ext * 0.1);
    for (let j = 0; j < NA; j++) {
      const ph = j * TAU / NA + (i % 2) * (TAU / NA / 2);
      const x = r * Math.cos(ph), z = r * Math.sin(ph);
      const f = dipoleField(x, 0, z, t, k);
      /* E (senkrecht) */
      if (st.showE) {
        const a = Math.hypot(f.E[0], f.E[1], f.E[2]); if (a > 1e-9) {
          const len = Lmax * ampScale(a, aref);
          const uy = f.E[1] / a;
          const A = V.proj([x, -uy * len * .5, z]), B = V.proj([x, uy * len * .5, z]);
          if (A.z > .06 && B.z > .06) {
            const scr = Math.hypot(A.x - B.x, A.y - B.y);
            if (scr > 2) {
              const col = rgba(f.E[1] > 0 ? WARM : COOL, 0.25 + 0.6 * Math.abs(uy));
              V.push((A.z + B.z) * .5, () => sArrow(ctx, A, B, col, Math.max(1.05, scr * .07), Math.min(6.5, 1.5 + scr * .4)));
            }
          }
        }
      }
      /* B (tangential) */
      if (st.showB) {
        const b = Math.abs(f.Bp); if (b > 1e-12) {
          const len = Lmax * 1.1 * ampScale(b, aref);
          const ux = f.B[0] / b, uz = f.B[2] / b;
          const A = V.proj([x - ux * len * .5, 0, z - uz * len * .5]);
          const B = V.proj([x + ux * len * .5, 0, z + uz * len * .5]);
          if (A.z > .06 && B.z > .06) {
            const scr = Math.hypot(A.x - B.x, A.y - B.y);
            if (scr > 2) V.push((A.z + B.z) * .5, () => sArrow(ctx, A, B, rgba(CYAN, .6), 1.4, 6));
          }
        }
      }
    }
  }
}

/* ---------- Kleines Diagramm: E und B in Phase (Folie 11) ---------- */
function phasePlot(cv, ph, delta) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 150, H = cv.clientHeight || 118;
  if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const L = 20, B = 18, T = 16, R = 26;
  const pw = W - L - R, phh = H - B - T, mid = T + phh / 2;
  c.strokeStyle = '#1e2942'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(L, T); c.lineTo(L, T + phh); c.lineTo(L + pw, T + phh); c.stroke();
  c.beginPath(); c.moveTo(L, mid); c.lineTo(L + pw, mid); c.stroke();
  const N = 120;
  const curves = [[WARM, 1, 0], [CYAN, 0.78, delta || 0]];
  curves.forEach(([col, sc, off]) => {
    c.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = i / N, x = L + u * pw;
      const y = mid - sc * (phh * 0.40) * Math.sin(u * TAU * 2 - ph + off);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.strokeStyle = rgba(col, .95); c.lineWidth = 1.8; c.stroke();
  });
  const u0 = 0.58, x0 = L + u0 * pw;
  c.save(); c.setLineDash([3, 3]); c.strokeStyle = 'rgba(150,175,215,.55)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(x0, T); c.lineTo(x0, T + phh); c.stroke(); c.restore();
  curves.forEach(([col, sc, off]) => {
    const y = mid - sc * (phh * 0.40) * Math.sin(u0 * TAU * 2 - ph + off);
    c.fillStyle = rgba(col, 1); c.beginPath(); c.arc(x0, y, 3.4, 0, TAU); c.fill();
  });
  sText(c, L, 8, delta ? 'Δφ = ' + Math.round(Math.abs(delta) * 180 / Math.PI) + '°' : 'E und B in Phase', '#7d8db0', 10, 'left');
  sText(c, W - 6, T + 6, 'E', '#ff7043', 11, 'right');
  sText(c, W - 6, T + phh - 6, 'B', '#48d6e8', 11, 'right');
  sText(c, L + pw, H - 5, '→ x', '#61708f', 9.5, 'right');
}

/* ---------- Phasendifferenz E/B über dem Abstand (log. Achse) ---------- */
function phaseDiffPlot(cv, k, lam, rNow) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 150, H = cv.clientHeight || 118;
  if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const L = 26, B = 20, T = 16, R = 10;
  const pw = W - L - R, phh = H - B - T;
  const X = u => L + u * pw, Y = d => T + phh * (1 - d / 90);
  c.strokeStyle = '#1e2942'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(L, T); c.lineTo(L, T + phh); c.lineTo(L + pw, T + phh); c.stroke();
  c.strokeStyle = 'rgba(34,48,78,.9)';
  [0.1, 1].forEach(rl => {
    const u = Math.log10(rl / 0.03) / 2;
    c.beginPath(); c.moveTo(X(u), T); c.lineTo(X(u), T + phh); c.stroke();
    sText(c, X(u), T + phh + 10, rl < 1 ? '0,1λ' : 'λ', '#61708f', 9);
  });
  c.beginPath();
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    const r = 0.03 * Math.pow(100, u) * lam;
    const d = fieldPhaseDiff(Math.max(r, 1e-3), k);
    i ? c.lineTo(X(u), Y(d)) : c.moveTo(X(u), Y(d));
  }
  c.strokeStyle = '#7c5cff'; c.lineWidth = 2; c.stroke();
  const uNow = clamp(Math.log10(Math.max(rNow / lam, 0.0301) / 0.03) / 2, 0, 1);
  const dNow = fieldPhaseDiff(Math.max(rNow, 1e-3), k);
  c.save(); c.setLineDash([3, 3]); c.strokeStyle = 'rgba(255,213,79,.5)';
  c.beginPath(); c.moveTo(X(uNow), T); c.lineTo(X(uNow), T + phh); c.stroke(); c.restore();
  c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(X(uNow), Y(dNow), 4, 0, TAU); c.fill();
  sText(c, L, 8, 'Phasendifferenz E–B', '#7d8db0', 10, 'left');
  sText(c, L - 3, T + 4, '90°', '#61708f', 9.5, 'right');
  sText(c, L - 3, T + phh + 4, '0°', '#61708f', 9.5, 'right');
  sText(c, W - 6, H - 6, 'r / λ →', '#61708f', 9.5, 'right');
}

/* ---------- Speisung: die Spannung liegt in der Mitte am Spalt an ----------
   Der Generator speist die beiden Dipolhälften an ihren inneren Enden.
   Damit ist klar: die beiden Hälften sind die beiden "Platten" des
   aufgebogenen Kondensators, die Ladungen sitzen an den äußeren Enden. */
const GAP = 0.055;
function drawGenerator(V) {
  /* kleiner Speiseblock im Spalt zwischen den Dipolhälften */
  const hx = 0.075, hy = 0.085, hz = 0.075;
  const c = 'rgba(190,205,235,.8)';
  const bot = [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]];
  const top = [[-hx, hy, -hz], [hx, hy, -hz], [hx, hy, hz], [-hx, hy, hz]];
  for (let i = 0; i < 4; i++) {
    P3(V, bot[i], bot[(i + 1) % 4], c, 1.4);
    P3(V, top[i], top[(i + 1) % 4], c, 1.4);
    P3(V, bot[i], top[i], c, 1.4);
  }
  /* zwei Zuführungen zum Generatorgehäuse */
  P3(V, [hx, -hy, 0], [0.085, -0.98, 0], 'rgba(150,170,205,.55)', 1.5);
  P3(V, [-hx, -hy, 0], [-0.085, -0.98, 0], 'rgba(150,170,205,.55)', 1.5);

  /* Gehäuse des Hochfrequenzgenerators unten */
  const x0 = -0.44, x1 = 0.44, z0 = -0.28, z1 = 0.28, y0 = -1.80, y1 = -1.00;
  const bc = 'rgba(140,160,200,.5)';
  const bot2 = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]];
  const top2 = [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
  for (let i = 0; i < 4; i++) {
    P3(V, bot2[i], bot2[(i + 1) % 4], bc, 1.2);
    P3(V, top2[i], top2[(i + 1) % 4], bc, 1.2);
    P3(V, bot2[i], top2[i], bc, 1.2);
  }
  T3(V, [0, y0 - 0.20, 0], 'Hochfrequenzgenerator', 'rgba(185,205,235,.85)', 11);
}

/* ---------- Sendedipol mit Ladungen und Strom ---------- */
function drawRod(V, st, t) {
  [[-HALF, -GAP], [GAP, HALF]].forEach(([a, b]) => {
    P3(V, [0, a, 0], [0, b, 0], 'rgba(120,140,175,.30)', 9);
    P3(V, [0, a, 0], [0, b, 0], '#c9d6ef', 3.4);
  });
  if (!st.showCharges) return;
  const N = 17;
  const A = V.proj([0, -HALF, 0]), B = V.proj([0, HALF, 0]);
  for (let i = 0; i < N; i++) {
    const s = i / (N - 1), y = -HALF + 2 * HALF * s;
    const q = -Math.cos(Math.PI * s) * Math.cos(t);
    const cur = Math.sin(Math.PI * s) * Math.sin(t);
    const px = lerp(A.x, B.x, s), py = lerp(A.y, B.y, s);
    const zz = A.z + (B.z - A.z) * s;
    if (zz < .06) continue;
    const rq = Math.abs(q);
    if (rq > .04) {
      const col = rgba(mixc(COOL, WARM, q > 0 ? 1 : 0), .25 + .7 * rq);
      const rad = 1.6 + 10 * rq;
      V.push(zz, () => {
        const c = V.ctx; c.save();
        c.fillStyle = col; c.beginPath(); c.arc(px, py, rad, 0, TAU); c.fill();
        if (rad > 7.5) {
          c.fillStyle = '#08101f'; c.font = 'bold ' + (rad * 1.35).toFixed(0) + 'px system-ui';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(q > 0 ? '+' : '–', px, py + rad * .06);
        }
        c.restore();
      });
    }
    if (i % 2 === 0 && Math.abs(cur) > .12) {
      const dir = cur > 0 ? 1 : -1;
      const dy = (B.y - A.y) * 0.035 * dir;
      const col = 'rgba(255,235,180,' + (.3 + .55 * Math.abs(cur)) + ')';
      V.push(zz - .01, () => {
        const c = V.ctx; c.save(); c.strokeStyle = col; c.lineWidth = 1.8; c.lineCap = 'round';
        c.beginPath(); c.moveTo(px + 9, py - dy * Math.abs(cur)); c.lineTo(px + 9, py + dy * Math.abs(cur)); c.stroke();
        c.beginPath(); c.moveTo(px + 5, py + dy * Math.abs(cur) * .45); c.lineTo(px + 9, py + dy * Math.abs(cur));
        c.lineTo(px + 13, py + dy * Math.abs(cur) * .45); c.stroke(); c.restore();
      });
    }
  }
}

/* ---------- Empfangsdipol / Induktionsschleife ---------- */
function circle3(V, c, axis, rad, color, w, dash) {
  const a = v3.norm(axis);
  let u = Math.abs(a[1]) < .9 ? v3.norm(v3.cross(a, [0, 1, 0])) : v3.norm(v3.cross(a, [1, 0, 0]));
  const v = v3.cross(a, u);
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const q = i / 48 * TAU;
    pts.push([c[0] + rad * (u[0] * Math.cos(q) + v[0] * Math.sin(q)),
              c[1] + rad * (u[1] * Math.cos(q) + v[1] * Math.sin(q)),
              c[2] + rad * (u[2] * Math.cos(q) + v[2] * Math.sin(q))]);
  }
  SEG3(V, pts, color, w, dash);
}

function reception(st, k) {
  const R = st.receiver; if (!R) return null;
  const th = R.theta * D2R, ph = R.phi * D2R;
  const pos = [R.r * Math.sin(th) * Math.cos(ph), R.r * Math.cos(th), R.r * Math.sin(th) * Math.sin(ph)];
  const f = dipoleField(pos[0], pos[1], pos[2], 0, k);
  const r = Math.max(R.r, 0.06);
  const sint = Math.min(1, Math.hypot(pos[0], pos[2]) / r);
  const Aref = (k * k) / 0.5;                     // Bezug: Fernfeld bei r = 0,50 m
  let A, G, kind = R.mode;
  if (kind === 'loop') {
    G = Math.abs(Math.cos(R.gamma * D2R));
    A = ampBphi(r, sint, k) / Aref * G * (st.f / F0);
  } else {
    if (st.gridOn) { const a = st.gridA * D2R, b = R.beta * D2R; G = Math.abs(Math.sin(a) * Math.sin(a - b)); }
    else { const b = R.beta * D2R; G = Math.abs(Math.cos(b)); }
    A = ampTheta(r, sint, k) / Aref * G;
  }
  return { pos, that: f.th, phv: f.ph, amp: A, P: A * A, G, r, sint, f };
}
function ampFrom(st, k, r, thetaDeg, betaDeg, gridOn, gridA) {
  const th = thetaDeg * D2R, rho = r * Math.sin(th);
  const sint = Math.min(1, Math.abs(rho) / Math.max(r, .06));
  const Aref = (k * k) / 0.5;
  const rr = Math.max(r, .06);
  if (st.receiver && st.receiver.mode === 'loop') {
    return ampBphi(rr, sint, k) / Aref * Math.abs(Math.cos(st.receiver.gamma * D2R)) * (st.f / F0);
  }
  let G;
  if (gridOn) { const a = gridA * D2R, b = betaDeg * D2R; G = Math.abs(Math.sin(a) * Math.sin(a - b)); }
  else G = Math.abs(Math.cos(betaDeg * D2R));
  return ampTheta(rr, sint, k) / Aref * G;
}

function drawReceiver(V, st, k, t, res) {
  const R = st.receiver;
  const pos = res.pos, that = res.that, phv = res.phv;
  const b = R.beta * D2R;
  const ext = st.extent || 3;
  const lam = C0 / st.f, aref = 2 * (k * k) / lam;
  const Lref = 0.14 * ext;

  /* Sichtlinie Sender → Empfänger */
  P3(V, [0, 0, 0], pos, 'rgba(120,150,200,.28)', 1, [4, 6]);

  /* Empfänger */
  if (R.mode === 'probe') {
    const Ap = V.proj(pos);
    if (Ap.z > 0.06) V.push(Ap.z, () => {
      const c2 = V.ctx; c2.save();
      c2.beginPath(); c2.arc(Ap.x, Ap.y, 11, 0, TAU); c2.fillStyle = 'rgba(120,220,255,.16)'; c2.fill();
      c2.beginPath(); c2.arc(Ap.x, Ap.y, 4.5, 0, TAU); c2.fillStyle = '#8fe0ff'; c2.fill();
      c2.strokeStyle = 'rgba(255,255,255,.85)'; c2.lineWidth = 1.4; c2.stroke();
      c2.restore();
    });
    T3(V, v3.add(pos, [0, 0.24, 0]), 'Messpunkt', 'rgba(160,220,255,.9)', 11.5, -6);
  } else if (R.mode === 'loop') {
    const g = R.gamma * D2R;
    const n = v3.add(v3.mul(that, Math.sin(g)), v3.mul(phv, Math.cos(g)));
    circle3(V, pos, n, 0.26, '#d8e4ff', 2.6);
    A3(V, pos, v3.add(pos, v3.mul(n, 0.42)), 'rgba(140,220,255,.85)', 1.6, 7);
    T3(V, v3.add(pos, v3.mul(n, .5)), 'n̂', 'rgba(140,220,255,.9)', 11);
  } else {
    const d = v3.add(v3.mul(that, Math.cos(b)), v3.mul(phv, Math.sin(b)));
    const e1 = v3.add(pos, v3.mul(d, -0.26)), e2 = v3.add(pos, v3.mul(d, 0.26));
    P3(V, e1, e2, 'rgba(120,140,175,.35)', 11);
    P3(V, e1, e2, '#e7eeff', 4);
  }
  if (R.mode !== 'probe')
    T3(V, v3.add(pos, [0, 0.46, 0]), R.mode === 'loop' ? 'Induktionsschleife' : 'Empfangsdipol', 'rgba(220,230,255,.85)', 12, -8);
  /* momentane Feldvektoren am Empfänger (durch das Gitter ggf. gefiltert) */
  const loc = dipoleField(pos[0], pos[1], pos[2], t, k);
  let vecT = v3.mul(that, v3.dot(loc.E, that));
  if (st.gridOn) {
    const A = st.gridA * D2R;
    const bt = v3.add(v3.mul(that, Math.cos(A)), v3.mul(phv, Math.sin(A)));
    vecT = v3.sub(vecT, v3.mul(bt, v3.dot(vecT, bt)));
  }
  if (st.showFieldArrows) {
    const mT = v3.len(vecT);
    if (mT > 1e-9) {
      const l = Lref * ampScale(mT, aref);
      const u = v3.mul(vecT, 1 / mT);
      A3(V, pos, v3.add(pos, v3.mul(u, l)), rgba(mixc(COOL, WARM, u[1] > 0 ? 1 : 0), .92), 2.2, 10);
      T3(V, v3.add(pos, v3.mul(u, l * 1.2)), 'E', '#ff8f6a', 12);
    }
    const mB = v3.len(loc.B);
    if (mB > 1e-9) {
      const l = Lref * 0.85 * ampScale(mB, aref);
      const u = v3.mul(loc.B, 1 / mB);
      A3(V, pos, v3.add(pos, v3.mul(u, l)), 'rgba(72,214,232,.9)', 2, 9);
      T3(V, v3.add(pos, v3.mul(u, l * 1.25)), 'B', '#48d6e8', 12);
    }
  }

  /* Metallgitter */
  if (st.gridOn) {
    const gc = v3.mul(pos, 0.68);
    const A = st.gridA * D2R;
    const bt = v3.add(v3.mul(that, Math.cos(A)), v3.mul(phv, Math.sin(A)));
    const ct = v3.add(v3.mul(that, -Math.sin(A)), v3.mul(phv, Math.cos(A)));
    const S = 0.56;
    const cor = [
      v3.add(gc, v3.add(v3.mul(bt, -S), v3.mul(ct, -S))),
      v3.add(gc, v3.add(v3.mul(bt, S), v3.mul(ct, -S))),
      v3.add(gc, v3.add(v3.mul(bt, S), v3.mul(ct, S))),
      v3.add(gc, v3.add(v3.mul(bt, -S), v3.mul(ct, S)))
    ];
    SEG3(V, [cor[0], cor[1], cor[2], cor[3], cor[0]], 'rgba(150,170,205,.75)', 1.6);
    for (let u = -0.42; u < 0.421; u += 0.075) {
      const o = v3.add(gc, v3.mul(ct, u));
      P3(V, v3.add(o, v3.mul(bt, S)), v3.add(o, v3.mul(bt, -S)), 'rgba(190,205,230,.85)', 1.3);
    }
    T3(V, v3.add(gc, v3.mul(ct, -0.86)), 'Gitter α = ' + num(st.gridA, 0) + '°', 'rgba(170,200,235,.9)', 11);
    /* Zerlegung des E-Feldes am Gitter */
    const loc2 = dipoleField(gc[0], gc[1], gc[2], t, k);
    const peak = ampTheta(Math.max(v3.len(gc), 0.06), res.sint, k);
    const sc = peak > 1e-9 ? 0.5 / peak : 0;
    const Ev = v3.mul(that, v3.dot(loc2.E, that) * sc);
    const parV = v3.mul(bt, v3.dot(Ev, bt));
    const perV = v3.sub(Ev, parV);
    A3(V, gc, v3.add(gc, Ev), 'rgba(233,238,251,.85)', 2, 9);
    A3(V, gc, v3.add(gc, parV), 'rgba(255,110,110,.6)', 2, 8);
    A3(V, gc, v3.add(gc, perV), 'rgba(255,180,80,.95)', 2.4, 10);
    T3(V, v3.add(gc, perV), 'E⊥', '#ffb74d', 11.5, -8);
    T3(V, v3.add(gc, parV), 'E∥', 'rgba(255,150,150,.9)', 11.5, 8);
  }
}

/* ---------- Gesamtszene ---------- */
function renderDipole(V, st, dt) {
  const ctx = V.ctx;
  st.phase += TAU * st.slow * dt;
  const lam = C0 / st.f, k = TAU / lam, t = st.phase;
  const ext = st.extFixed || Math.max(lam * 1.05, st.receiver ? st.receiver.r * 1.12 : 0, 1.35);
  st.extent = ext;
  if (st.autoFit) V.cam.dist = lerp(V.cam.dist, V.needDist(ext), 0.07);
  V.begin();
  bg(V);
  if (st.showEqGrid !== false) equatorGrid(V, ext);
  if (st.showFronts) waveFronts(V, lam, st.phase, ext);
  if (st.showDonut) donut(V, ext * 0.86);
  if (st.showNear) nearSphere(V, lam);
  if (st.cut === 'vertical') {
    if (st.showE) quiverVertical(V, st, lam, k, t, ext);
    if (st.showB) quiverBVertical(V, st, lam, k, t, ext);
    if (st.showS) quiverS(V, st, lam, k, t, ext);
  } else {
    quiverHorizontal(V, st, lam, k, t, ext);
  }
  const res = reception(st, k);
  if (res) drawReceiver(V, st, k, t, res);
  if (st.showGenerator) drawGenerator(V);
  drawRod(V, st, t);
  P3(V, [0.10, HALF - 0.10, 0], [0.42, HALF + 0.30, 0], 'rgba(160,180,215,.5)', 1, [3, 4]);
  T3(V, [0.46, HALF + 0.34, 0], 'Sendedipol', 'rgba(220,230,255,.85)', 12, 0);
  V.flush();
  st.result = res;
  return { lam, k, t, res };
}

function drawLamp(V, st, res) {
  if (!res) return;
  if (st.receiver && st.receiver.mode === 'probe') return;
  const A = V.proj(res.pos); if (A.z < .06) return;
  const P = clamp(res.P, 0, 4);
  const g = Math.pow(clamp(P, 0, 1.4), 0.34);
  const R = 9 + 34 * g;
  if (g > 0.02) sGlow(V.ctx, A.x, A.y, R, 'rgba(255,205,80,A)', Math.min(1, .35 + g));
  const c = V.ctx;
  c.save();
  c.beginPath(); c.arc(A.x, A.y, 6.5, 0, TAU);
  c.fillStyle = rgba(mixc([70,70,80], LAMPC, Math.min(1, g * 1.2)), 1); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.stroke();
  c.restore();
}
