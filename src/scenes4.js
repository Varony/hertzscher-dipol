/* =========================================================================
   Teil 5: Maxwell, Interferenz, Zeiger, Röntgen, Bragg, Thomson
   ========================================================================= */

/* ---------- kleine 2D-Hilfen ---------- */
function roundRectPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.lineTo(x + w - rr, y);
  c.quadraticCurveTo(x + w, y, x + w, y + rr);
  c.lineTo(x + w, y + h - rr);
  c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  c.lineTo(x + rr, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - rr);
  c.lineTo(x, y + rr);
  c.quadraticCurveTo(x, y, x + rr, y);
  c.closePath();
}
function fillRound(c, x, y, w, h, r, fill, stroke, lw) {
  roundRectPath(c, x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
}
function wrapText(c, text, x, y, maxW, lineH, color, size, align) {
  c.save();
  c.fillStyle = color || '#cfe3ff';
  c.font = (size || 10.5) + 'px -apple-system,system-ui,sans-serif';
  c.textAlign = align || 'left';
  c.textBaseline = 'top';
  const words = String(text).split(/\s+/);
  let line = '', yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i];
    if (c.measureText(test).width > maxW && line) {
      c.fillText(line, x, yy); yy += lineH; line = words[i];
    } else line = test;
  }
  if (line) c.fillText(line, x, yy);
  c.restore();
  return yy + lineH;
}
function fitCanvas(cv) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 300, H = cv.clientHeight || 180;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  return { c, W, H };
}
/* Wellenlänge im sichtbaren Bereich -> RGB */
function wlRGB(nm) {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 780) { r = 1; }
  let f = 1;
  if (nm >= 380 && nm < 420) f = 0.30 + 0.70 * (nm - 380) / 40;
  else if (nm > 700 && nm <= 780) f = 0.30 + 0.70 * (780 - nm) / 80;
  return [Math.round(255 * r * f), Math.round(255 * g * f), Math.round(255 * b * f)];
}
function wlCss(nm, a) {
  const q = wlRGB(nm);
  return 'rgba(' + q[0] + ',' + q[1] + ',' + q[2] + ',' + (a == null ? 1 : a) + ')';
}
function drawArrow2(c, x1, y1, x2, y2, color, w, head) {
  sArrow(c, { x: x1, y: y1 }, { x: x2, y: y2 }, color, w, head || 8);
}
function drawDoubleArrow(c, x1, y1, x2, y2, color, w) {
  sLine(c, { x: x1, y: y1 }, { x: x2, y: y2 }, color, w || 1.2);
  drawArrow2(c, (x1 + x2) / 2, (y1 + y2) / 2, x1, y1, color, w || 1.2, 6);
  drawArrow2(c, (x1 + x2) / 2, (y1 + y2) / 2, x2, y2, color, w || 1.2, 6);
}

/* ==================== 10 · Maxwell ==================== */
addView('maxwell', '10 · Maxwell', V => {
  const st = { phase: 0, speed: 0.85, showE: true, showB: true, mode: 'wave' };
  const G = grid(V.panel);
  seg(G, {
    label: 'Darstellung', value: 'wave',
    options: [{ v: 'wave', label: 'Welle im Fernfeld' }, { v: 'cards', label: 'Die vier Aussagen' }],
    on: v => { st.mode = v; }
  });
  slider(G, { label: 'Zeitlupe', min: 0.15, max: 2.5, step: 0.05, value: 0.85, fmt: v => num(v, 2) + ' Hz', on: v => st.speed = v });
  seg(G, { label: 'E-Feld zeigen', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showE = !!v });
  seg(G, { label: 'B-Feld zeigen', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showB = !!v });
  const RO = readouts(G);
  RO.add('fern', 'Fernfeld');
  RO.add('nah', 'Nahfeld');
  RO.add('richtung', 'Ausbreitung');
  note(G, '<b>Vier Aussagen in Worten:</b><br>' +
    '① <b>Ladungen sind die Quellen und Senken des E-Feldes.</b> Feldlinien beginnen bei positiven und enden bei negativen Ladungen.<br>' +
    '② <b>Es gibt keine magnetischen Monopole.</b> Magnetische Feldlinien sind immer in sich geschlossen.<br>' +
    '③ <b>Ein sich änderndes B-Feld erzeugt ein elektrisches Feld</b>, dessen Feldlinien die Fläche umschließen (Induktion).<br>' +
    '④ <b>Ein Strom und ein sich änderndes E-Feld erzeugen ein magnetisches Feld</b>, dessen Feldlinien die Fläche umschließen.');
  note(G, '<b>Kausalkette:</b> Ein veränderliches E-Feld erzeugt ein veränderliches B-Feld. Dieses veränderliche B-Feld erzeugt wieder ein veränderliches E-Feld, und so läuft die Störung als elektromagnetische Welle durch den Raum. ' +
    'Beim Dipol sind die Ladungen im Stab die Quelle: Sie schwingen, dadurch ändert sich das Feld am Dipol, und die Störung löst sich als Welle ab.');
  note(G, '<b>Dipol und Fernfeld:</b> Im Nahfeld (Abstand kleiner als λ) hängt das Feld noch eng am Dipol. Im Fernfeld (Abstand größer als λ) hat sich die Welle abgelöst: E und B stehen senkrecht aufeinander und auf der Ausbreitungsrichtung, sie schwingen in Phase, und die Amplitude nimmt mit 1/r ab.');
  note(G, '<b>Merke:</b> Elektromagnetische Wellen brauchen kein Medium. Das sich ändernde Feld trägt die Energie selbst weiter.');
  V.setBadges(['E ⊥ B ⊥ c', 'Im Fernfeld: E und B in Phase']);

  function drawWave() {
    const c = V.ctx, W = V.W, H = V.H;
    c.clearRect(0, 0, W, H); bg(V);
    const x0 = Math.max(54, W * 0.10), x1 = W - Math.max(22, W * 0.04);
    const y0 = H * 0.50;
    const A = Math.max(24, Math.min(H * 0.22, 110));
    const lamPx = Math.max(90, (x1 - x0) / 3.4);
    const k = TAU / lamPx;
    const t = st.phase;
    const chainH = H > 430 ? 54 : 0;

    /* Achse und Ausbreitungsrichtung */
    sLine(c, { x: x0 - 28, y: y0 }, { x: x1, y: y0 }, 'rgba(90,110,150,.55)', 1, [5, 5]);
    drawArrow2(c, x0, y0 - A - 34, x1, y0 - A - 34, 'rgba(180,205,245,.85)', 1.6, 9);
    sText(c, (x0 + x1) / 2, y0 - A - 46, 'Ausbreitungsrichtung c', 'rgba(200,220,250,.9)', 11.5);
    sText(c, x1, y0 - A - 26, 'x', 'rgba(180,205,245,.8)', 11, 'right');

    /* Dipol links */
    const dx = x0 - 24, half = Math.max(20, A * 0.42);
    sLine(c, { x: dx, y: y0 - half }, { x: dx, y: y0 - 5 }, '#c9d6ef', 4);
    sLine(c, { x: dx, y: y0 + 5 }, { x: dx, y: y0 + half }, '#c9d6ef', 4);
    sText(c, dx, y0 - half - 12, '+', '#ff8a70', 16);
    sText(c, dx, y0 + half + 12, '−', '#7fb3ff', 16);
    sText(c, dx, y0 + half + 30, 'Dipol', 'rgba(210,225,250,.85)', 10.5);
    c.save(); c.setLineDash([3, 4]); c.strokeStyle = 'rgba(120,160,220,.35)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(dx + 6, y0 - half); c.lineTo(dx + 6, y0 + half); c.stroke(); c.restore();

    /* Felder */
    if (st.showE) {
      c.beginPath();
      for (let x = x0; x <= x1; x += 2) {
        const e = Math.sin(t - k * (x - x0));
        const y = y0 - A * 0.88 * e;
        x === x0 ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      c.strokeStyle = 'rgba(255,112,67,.55)'; c.lineWidth = 1.8; c.stroke();
      for (let x = x0 + 12; x <= x1; x += 20) {
        const e = Math.sin(t - k * (x - x0));
        const yy = y0 - A * 0.88 * e;
        if (Math.abs(yy - y0) < 3) continue;
        drawArrow2(c, x, y0, x, yy, rgba(WARM, 0.35 + 0.55 * Math.abs(e)), 1.3, 6);
      }
    }
    if (st.showB) {
      c.beginPath();
      for (let x = x0; x <= x1; x += 2) {
        const b = Math.sin(t - k * (x - x0));
        const xx = x + A * 0.30 * b, yy = y0 - A * 0.22 * b;
        x === x0 ? c.moveTo(xx, yy) : c.lineTo(xx, yy);
      }
      c.strokeStyle = 'rgba(72,214,232,.45)'; c.lineWidth = 1.6; c.stroke();
      for (let x = x0 + 12; x <= x1; x += 20) {
        const b = Math.sin(t - k * (x - x0));
        if (Math.abs(b) < 0.04) continue;
        const xx = x + A * 0.30 * b, yy = y0 - A * 0.22 * b;
        drawArrow2(c, x, y0, xx, yy, rgba(CYAN, 0.30 + 0.55 * Math.abs(b)), 1.2, 6);
      }
    }

    /* λ und Nah-/Fernfeld */
    const lx = x0 + 22;
    drawDoubleArrow(c, lx, y0 + A + 24, lx + lamPx, y0 + A + 24, 'rgba(170,195,235,.8)', 1.2);
    sText(c, lx + lamPx / 2, y0 + A + 38, 'λ (schematisch)', 'rgba(190,210,240,.85)', 10.5);
    sLine(c, { x: x0 + lamPx, y: y0 - A - 18 }, { x: x0 + lamPx, y: y0 + A + 18 }, 'rgba(120,180,255,.35)', 1, [4, 5]);
    sText(c, x0 + lamPx * 0.5, y0 - A - 6, 'Nahfeld r < λ', 'rgba(140,190,255,.8)', 10);
    sText(c, x0 + lamPx * 2.0, y0 - A - 6, 'Fernfeld r > λ', 'rgba(140,190,255,.8)', 10);

    /* Koordinatensystem */
    const tx = x1 - 64, ty = y0 + A + 10;
    drawArrow2(c, tx, ty, tx + 38, ty, 'rgba(190,210,245,.8)', 1.4, 7);
    drawArrow2(c, tx, ty, tx, ty - 38, 'rgba(190,210,245,.8)', 1.4, 7);
    drawArrow2(c, tx, ty, tx + 25, ty - 23, 'rgba(190,210,245,.8)', 1.4, 7);
    sText(c, tx + 44, ty + 2, 'c', 'rgba(210,225,250,.9)', 11, 'left');
    sText(c, tx + 2, ty - 46, 'E', '#ff8f6a', 11, 'left');
    sText(c, tx + 28, ty - 26, 'B', '#48d6e8', 11, 'left');

    /* Kausalkette */
    if (chainH > 0) {
      const y = H - chainH - 4, h = chainH - 8;
      const items = ['E ändert sich', 'B entsteht', 'B ändert sich', 'E entsteht', 'Welle läuft'];
      const gap = 6, bw = (W - 40 - gap * (items.length - 1)) / items.length;
      sText(c, 20, y - 12, 'Kausalkette', 'rgba(160,180,215,.85)', 10.5, 'left');
      items.forEach((t2, i) => {
        const x = 20 + i * (bw + gap);
        fillRound(c, x, y, bw, h, 8, 'rgba(18,27,47,.9)', 'rgba(40,60,95,.9)', 1);
        wrapText(c, t2, x + bw / 2, y + 7, bw - 10, 13, 'rgba(205,220,245,.95)', 10, 'center');
        if (i < items.length - 1) sText(c, x + bw + gap / 2, y + h / 2, '→', 'rgba(120,180,255,.8)', 12);
      });
    }

    RO.set('fern', 'E ⊥ B, in Phase');
    RO.set('nah', 'r < λ, E und B nicht in Phase');
    RO.set('richtung', 'c = λ · f');
    V.setBadges(['E-Feld: rot · B-Feld: türkis', 'Beide Felder stehen senkrecht auf c']);
  }

  function drawCardPanel(c, x, y, w, h, numText, title, caption, kind) {
    fillRound(c, x, y, w, h, 10, 'rgba(14,20,36,.92)', 'rgba(38,56,90,.95)', 1);
    c.save();
    c.fillStyle = '#1c2b48'; c.beginPath(); c.arc(x + 18, y + 18, 11, 0, TAU); c.fill();
    sText(c, x + 18, y + 18, numText, '#8fd0ff', 10.5);
    c.restore();
    wrapText(c, title, x + 36, y + 10, w - 44, 13, '#e9eefb', 10.5);
    const cx = x + w / 2, cy = y + h * 0.47, R = Math.min(w * 0.22, h * 0.20);
    c.save();
    if (kind === 0) {
      const q1 = { x: cx - R * 0.42, y: cy }, q2 = { x: cx + R * 0.42, y: cy };
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU;
        drawArrow2(c, q1.x + Math.cos(a) * R * 0.18, q1.y + Math.sin(a) * R * 0.18,
          q1.x + Math.cos(a) * R * 0.70, q1.y + Math.sin(a) * R * 0.70, 'rgba(255,130,90,.65)', 1.2, 4);
        drawArrow2(c, q2.x + Math.cos(a) * R * 0.70, q2.y + Math.sin(a) * R * 0.70,
          q2.x + Math.cos(a) * R * 0.18, q2.y + Math.sin(a) * R * 0.18, 'rgba(120,170,255,.65)', 1.2, 4);
      }
      c.fillStyle = '#ff7043'; c.beginPath(); c.arc(q1.x, q1.y, 6, 0, TAU); c.fill();
      c.fillStyle = '#7fb3ff'; c.beginPath(); c.arc(q2.x, q2.y, 6, 0, TAU); c.fill();
      sText(c, q1.x, q1.y, '+', '#08101f', 10);
      sText(c, q2.x, q2.y, '−', '#08101f', 10);
    } else if (kind === 1) {
      c.fillStyle = 'rgba(160,180,215,.85)'; c.fillRect(cx - R * 1.1, cy - R * 0.28, R * 2.2, R * 0.56);
      c.fillStyle = '#ff7043'; c.fillRect(cx - R * 1.1, cy - R * 0.28, R * 0.55, R * 0.56);
      sText(c, cx - R * 0.78, cy, 'N', '#08101f', 10);
      sText(c, cx + R * 0.78, cy, 'S', '#08101f', 10);
      for (let i = 0; i < 3; i++) {
        const rr = R * (0.55 + i * 0.24);
        c.beginPath(); c.ellipse(cx, cy, rr, rr * 0.48, 0, 0, TAU);
        c.strokeStyle = 'rgba(72,214,232,.65)'; c.lineWidth = 1.3; c.stroke();
        drawArrow2(c, cx + rr * 0.75, cy - rr * 0.22, cx + rr * 0.95, cy - rr * 0.33, 'rgba(72,214,232,.8)', 1.2, 5);
      }
    } else if (kind === 2) {
      c.save(); c.translate(cx, cy); c.rotate(-0.18);
      c.beginPath(); c.ellipse(0, 0, R * 1.0, R * 0.46, 0, 0, TAU);
      c.strokeStyle = 'rgba(210,225,250,.85)'; c.lineWidth = 2; c.stroke();
      c.restore();
      drawArrow2(c, cx - R * 0.4, cy - R * 0.9, cx + R * 0.4, cy - R * 0.9, 'rgba(72,214,232,.85)', 2, 7);
      sText(c, cx + R * 0.5, cy - R * 0.95, 'B', '#48d6e8', 11, 'left');
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + 0.3;
        const x1 = cx + Math.cos(a) * R * 0.70, y1 = cy + Math.sin(a) * R * 0.32;
        const x2 = cx + Math.cos(a + 0.55) * R * 0.70, y2 = cy + Math.sin(a + 0.55) * R * 0.32;
        drawArrow2(c, x1, y1, x2, y2, 'rgba(255,130,90,.75)', 1.4, 5);
      }
    } else {
      c.save();
      c.strokeStyle = 'rgba(210,225,250,.8)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx - R * 0.8, cy - R * 0.7); c.lineTo(cx - R * 0.8, cy + R * 0.7); c.stroke();
      c.beginPath(); c.moveTo(cx + R * 0.8, cy - R * 0.7); c.lineTo(cx + R * 0.8, cy + R * 0.7); c.stroke();
      c.restore();
      for (let i = 0; i < 5; i++) {
        const yy = cy - R * 0.55 + i * R * 0.28;
        drawArrow2(c, cx - R * 0.5, yy, cx + R * 0.5, yy, 'rgba(255,130,90,.7)', 1.4, 5);
      }
      c.beginPath(); c.ellipse(cx, cy, R * 1.25, R * 0.62, 0, 0, TAU);
      c.strokeStyle = 'rgba(72,214,232,.65)'; c.lineWidth = 1.4; c.stroke();
      drawArrow2(c, cx + R * 0.95, cy - R * 0.25, cx + R * 1.15, cy - R * 0.40, 'rgba(72,214,232,.8)', 1.2, 5);
    }
    c.restore();
    wrapText(c, caption, x + 8, y + h - 34, w - 16, 12.5, '#a9b8d8', 9.5);
  }

  function drawCards() {
    const c = V.ctx, W = V.W, H = V.H;
    c.clearRect(0, 0, W, H); bg(V);
    const margin = 14, gap = 10, top0 = 62;
    const cols = W > 860 ? 4 : 2, rows = 4 / cols;
    const pw = (W - 2 * margin - gap * (cols - 1)) / cols;
    const ph = (H - top0 - margin - gap * (rows - 1)) / rows;
    const cards = [
      ['1', 'Ladungen als Quellen', 'Feldlinien beginnen bei + und enden bei −.', 0],
      ['2', 'Keine Monopole', 'Magnetische Feldlinien sind geschlossen.', 1],
      ['3', 'Induktion', 'Ein änderndes B-Feld erzeugt ein E-Feld.', 2],
      ['4', 'Maxwell-Term', 'Strom oder änderndes E-Feld erzeugt B.', 3]
    ];
    cards.forEach((cd, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      drawCardPanel(c, margin + col * (pw + gap), top0 + row * (ph + gap), pw, ph, cd[0], cd[1], cd[2], cd[3]);
    });
    RO.set('fern', 'vier Grundaussagen');
    RO.set('nah', 'Bilder zeigen nur Ausschnitte');
    RO.set('richtung', 'Felder sind Vektoren');
    V.setBadges(['Die vier Maxwell-Aussagen als Bild', 'Worte und Bilder gehören zusammen']);
  }

  V.draw = dt => {
    st.phase += TAU * st.speed * dt;
    if (st.mode === 'cards') drawCards();
    else drawWave();
  };
});

/* ==================== 11 · Interferenz ==================== */
addView('interf', '11 · Interferenz', V => {
  const st = { mode: 'double', lam: 532, g: 0.20, b: 0.080, l: 2.40, phase: 0 };
  const G = grid(V.panel);
  const H = {};
  H.mode = seg(G, {
    label: 'Spalt', value: 'double',
    options: [{ v: 'double', label: 'Doppelspalt' }, { v: 'single', label: 'Einzelspalt' }],
    on: v => {
      st.mode = v;
      H.g.el.style.display = v === 'double' ? '' : 'none';
    }
  });
  H.lam = slider(G, {
    label: 'Wellenlänge λ', min: 380, max: 780, step: 1, value: 532,
    fmt: v => num(v, 0) + ' nm', on: v => st.lam = v
  });
  H.g = slider(G, {
    label: 'Spaltmittenabstand g', min: 0.10, max: 0.50, step: 0.005, value: 0.20,
    fmt: v => num(v, 3) + ' mm', on: v => st.g = v
  });
  H.b = slider(G, {
    label: 'Spaltbreite b', min: 0.020, max: 0.150, step: 0.001, value: 0.080,
    fmt: v => num(v, 3) + ' mm', on: v => st.b = v
  });
  H.l = slider(G, {
    label: 'Abstand Schirm l', min: 0.5, max: 5.0, step: 0.05, value: 2.40,
    fmt: v => num(v, 2) + ' m', on: v => st.l = v
  });
  const RO = readouts(G);
  RO.add('lam', 'Wellenlänge λ');
  RO.add('da', 'Abstand benachbarter Maxima Δa');
  RO.add('a1', 'Lage des Maximums 1. Ordnung');
  RO.add('sin', 'Doppelspalt: sin α₁ = λ / g');
  RO.add('sinb', 'Einzelspalt: sin α₁ = λ / b');
  RO.add('b1', 'Einzelspalt: b · sin α₁ (erstes Minimum)');
  RO.add('s1', 'Einzelspalt: Lage des 1. Minimums');
  const plots = el('div', 'plots'); G.append(plots);
  const cvP = el('canvas'); plots.append(cvP);
  note(G, '<b>Doppelspalt:</b> Der Gangunterschied ist <span class="formula">Δs = g · sin α</span>. ' +
    'Maxima liegen bei <span class="formula">|Δs| = k · λ</span> mit k = 0, 1, 2, …, Minima bei ' +
    '<span class="formula">|Δs| = (2k − 1) · λ/2</span> mit k = 1, 2, … ' +
    'Für kleine Winkel gilt <span class="formula">sin α ≈ tan α = a/l</span>. Damit wird ' +
    '<span class="formula">a_k = k · λ · l / g</span> und der Abstand benachbarter Maxima ' +
    '<span class="formula">Δa = λ · l / g</span>.');
  note(G, '<b>Einfluss der Größen:</b> Ein größerer Spaltabstand g verkleinert den Abstand der Maxima, ein größerer Schirmabstand l vergrößert ihn. ' +
    'Eine größere Wellenlänge λ vergrößert den Abstand ebenfalls. Im Bild siehst du das Muster auf dem Schirm; die Geometrie ist schematisch, nicht maßstäblich.');
  note(G, '<b>Einzelspalt:</b> Jeder Punkt des Spalts sendet eine Elementarwelle. In der Mitte haben alle Wege die gleiche Länge, deshalb ist das Maximum 0. Ordnung hell. ' +
    'Minima entstehen bei <span class="formula">b · sin α = k · λ</span> mit k = 1, 2, …; Maxima höherer Ordnung bei ' +
    '<span class="formula">b · sin α = (2k + 1) · λ/2</span>. ' +
    'Für das erste Minimum löschen sich je zwei Elementarwellen aus den beiden Spalthälften aus, weil ihr Gangunterschied λ/2 beträgt. Die hellen Maxima liegen in der Mitte und an den Rändern des Musters; zu den Rändern hin werden sie schnell schwächer.');
  note(G, '<b>Merke:</b> Beim Doppelspalt bestimmt der Spaltmittenabstand g die Lage der Maxima, beim Einzelspalt bestimmt die Spaltbreite b die Lage der Minima. ' +
    'Die endliche Spaltbreite b moduliert auch das Doppelspaltmuster: Sie bildet die Einhüllende.');
  V.setBadges(['Muster auf dem Schirm', 'Geometrie schematisch']);

  const SCREEN_HALF_D = 0.020;   // m
  const SCREEN_HALF_S = 0.040;   // m

  function intensity(y, half) {
    const lam = st.lam * 1e-9, g = st.g * 1e-3, b = st.b * 1e-3, l = st.l;
    const sinA = y / Math.hypot(l, y);
    const argG = Math.PI * g * sinA / lam;
    const argB = Math.PI * b * sinA / lam;
    const env = Math.abs(argB) < 1e-9 ? 1 : Math.sin(argB) / argB;
    return Math.max(0, Math.cos(argG) ** 2 * env * env);
  }
  function singleIntensity(y, half) {
    const lam = st.lam * 1e-9, b = st.b * 1e-3, l = st.l;
    const sinA = y / Math.hypot(l, y);
    const argB = Math.PI * b * sinA / lam;
    const env = Math.abs(argB) < 1e-9 ? 1 : Math.sin(argB) / argB;
    return Math.max(0, env * env);
  }
  function patternAt(y) { return st.mode === 'double' ? intensity(y, SCREEN_HALF_D) : singleIntensity(y, SCREEN_HALF_S); }

  function drawScreen(c, x, yTop, h, half) {
    const sw = 30, cy = yTop + h / 2;
    fillRound(c, x - sw / 2, yTop, sw, h, 5, '#05070d', 'rgba(70,90,130,.8)', 1);
    const rgb = wlRGB(st.lam);
    c.save();
    for (let yy = yTop + 1; yy < yTop + h - 1; yy += 1) {
      const phys = ((cy - yy) / (h / 2)) * half;
      const I = patternAt(phys);
      const a = Math.pow(clamp(I, 0, 1), 0.60);
      if (a < 0.015) continue;
      c.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (0.10 + 0.90 * a) + ')';
      c.fillRect(x - sw / 2 + 2, yy, sw - 4, 1.2);
    }
    c.restore();
    sLine(c, { x: x - sw / 2 - 4, y: cy }, { x: x + sw / 2 + 4, y: cy }, 'rgba(180,200,240,.35)', 1, [3, 4]);
    sText(c, x, yTop - 10, 'Schirm', 'rgba(210,225,250,.9)', 10.5);
    sText(c, x, yTop + h + 12, '0', 'rgba(160,180,215,.8)', 9.5);
    sText(c, x, yTop + h + 24, half > 0.03 ? '±40 mm' : '±20 mm', 'rgba(160,180,215,.7)', 9);
  }

  function drawDouble(c, W, Hh) {
    const barX = Math.max(90, W * 0.30), screenX = W * 0.84;
    const top = Hh * 0.16, bot = Hh * 0.78, cy = (top + bot) / 2;
    const sep = clamp(18 + 34 * ((st.g - 0.10) / 0.40), 16, 48);
    const screenHalf = SCREEN_HALF_D;
    const scH = bot - top;
    const scale = (scH / 2) / screenHalf;

    /* einfallende ebene Welle */
    c.save();
    for (let i = 0; i < 8; i++) {
      const x = barX - 10 - ((i * 14 + st.phase * 14) % 96);
      sLine(c, { x, y: top + 6 }, { x, y: bot - 6 }, wlCss(st.lam, 0.16), 1.1);
    }
    c.restore();

    /* Blende mit zwei Spalten */
    const bx = barX - 6, bw = 12;
    c.fillStyle = 'rgba(150,170,205,.88)';
    c.fillRect(bx, top, bw, cy - sep / 2 - top);
    c.fillRect(bx, cy - sep / 2 + 3, bw, sep - 6);
    c.fillRect(bx, cy + sep / 2, bw, bot - (cy + sep / 2));
    sText(c, barX, top - 12, 'Doppelspalt', 'rgba(220,230,255,.9)', 11);
    sText(c, barX - 10, cy, 'g', 'rgba(200,220,250,.9)', 11, 'right');
    drawDoubleArrow(c, barX - 14, cy - sep / 2, barX - 14, cy + sep / 2, 'rgba(180,205,245,.8)', 1.1);

    /* Kreiswellen aus den beiden Spalten */
    c.save();
    c.beginPath(); c.rect(barX + 8, top, screenX - barX - 10, bot - top); c.clip();
    [-1, 1].forEach(sg => {
      const sy = cy + sg * sep / 2;
      for (let j = 0; j < 8; j++) {
        const r = 8 + ((j * 16 + st.phase * 17) % 116);
        c.beginPath(); c.arc(barX + 6, sy, r, -Math.PI / 2, Math.PI / 2);
        c.strokeStyle = wlCss(st.lam, 0.09 + 0.05 * (1 - j / 8)); c.lineWidth = 1.2; c.stroke();
      }
    });
    c.restore();

    /* Schirmmuster */
    drawScreen(c, screenX, top, scH, screenHalf);
    sText(c, screenX - 18, cy - 8, '0. Ordnung', 'rgba(180,205,245,.75)', 9, 'right');

    /* Maximum 1. Ordnung und Gangunterschied */
    const a1 = st.lam * 1e-9 * st.l / (st.g * 1e-3);
    const y1 = cy - a1 * scale;
    if (y1 > top + 4 && y1 < bot - 4) {
      const sx1 = barX + 6, sy1 = cy - sep / 2, sy2 = cy + sep / 2;
      sLine(c, { x: sx1, y: sy1 }, { x: screenX, y: y1 }, 'rgba(255,213,79,.45)', 1, [4, 5]);
      sLine(c, { x: sx1, y: sy2 }, { x: screenX, y: y1 }, 'rgba(255,213,79,.45)', 1, [4, 5]);
      sText(c, screenX - 10, y1 - 8, '1. Maximum', 'rgba(255,213,79,.9)', 9.5, 'right');
      sText(c, (sx1 + screenX) / 2, y1 + 12, 'Δs = g · sin α', 'rgba(255,213,79,.85)', 9.5);
    }
    /* Schirmabstand l */
    drawDoubleArrow(c, barX + 18, bot + 14, screenX, bot + 14, 'rgba(160,190,235,.7)', 1.1);
    sText(c, (barX + screenX) / 2, bot + 28, 'l = ' + num(st.l, 2) + ' m', 'rgba(180,205,240,.85)', 10);

    /* Formeln */
    fillRound(c, 8, 82, Math.min(260, W * 0.46), 62, 8, 'rgba(7,10,20,.72)', 'rgba(40,60,95,.55)', 1);
    sText(c, 12, 88, 'Δs = g · sin α', '#ffd9a8', 11.5, 'left');
    sText(c, 12, 104, 'Maxima: Δs = k · λ', '#9fd8ff', 10.5, 'left');
    sText(c, 12, 119, 'Minima: Δs = (2k−1) · λ/2', '#9fd8ff', 10.5, 'left');
    sText(c, 12, 134, 'Kleinwinkel: sin α ≈ tan α = a/l', 'rgba(160,190,235,.8)', 9.5, 'left');
    V.setBadges(['g = ' + num(st.g, 3) + ' mm · b = ' + num(st.b, 3) + ' mm', 'λ = ' + num(st.lam, 0) + ' nm · l = ' + num(st.l, 2) + ' m']);
  }

  function drawPhasorBundle(c, cx, cy, R, closed) {
    const N = 12;
    if (!closed) {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.045;
        drawArrow2(c, cx, cy, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 'rgba(255,180,80,' + (0.45 + i * 0.1) + ')', 1.6, 5);
      }
      sText(c, cx, cy + R + 12, 'alle Zeiger gleich', 'rgba(200,220,245,.85)', 9, 'center');
    } else {
      for (let i = 0; i < N; i++) {
        const a1 = i / N * TAU - Math.PI / 2, a2 = (i + 1) / N * TAU - Math.PI / 2;
        drawArrow2(c, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R,
          cx + Math.cos(a2) * R, cy + Math.sin(a2) * R, 'rgba(255,180,80,.8)', 1.4, 4);
      }
      sText(c, cx, cy + R + 12, 'Kreis schließt sich', 'rgba(200,220,245,.85)', 9, 'center');
    }
  }

  function drawSingle(c, W, Hh) {
    const barX = Math.max(86, W * 0.28), screenX = W * 0.83;
    const top = Hh * 0.14, bot = Hh * 0.72, cy = (top + bot) / 2;
    const bw = clamp(14 + 46 * ((st.b - 0.020) / 0.130), 12, 60);
    const screenHalf = SCREEN_HALF_S;
    const scH = bot - top;
    const scale = (scH / 2) / screenHalf;

    for (let i = 0; i < 8; i++) {
      const x = barX - 10 - ((i * 14 + st.phase * 14) % 96);
      sLine(c, { x, y: top + 6 }, { x, y: bot - 6 }, wlCss(st.lam, 0.14), 1.1);
    }
    c.fillStyle = 'rgba(150,170,205,.88)';
    c.fillRect(barX - 6, top, 12, cy - bw / 2 - top);
    c.fillRect(barX - 6, cy + bw / 2, 12, bot - (cy + bw / 2));
    sText(c, barX, top - 12, 'Einzelspalt', 'rgba(220,230,255,.9)', 11);
    sText(c, barX - 10, cy - bw / 2 - 4, 'b', 'rgba(200,220,250,.9)', 11, 'right');
    drawDoubleArrow(c, barX - 14, cy - bw / 2, barX - 14, cy + bw / 2, 'rgba(180,205,245,.8)', 1.1);

    /* Elementarwellen aus mehreren Punkten des Spalts */
    c.save();
    c.beginPath(); c.rect(barX + 8, top, screenX - barX - 10, bot - top); c.clip();
    for (let j = 0; j < 7; j++) {
      const sy = cy - bw / 2 + (j + 0.5) / 7 * bw;
      for (let q = 0; q < 7; q++) {
        const r = 8 + ((q * 17 + st.phase * 17 + j * 2) % 112);
        c.beginPath(); c.arc(barX + 6, sy, r, -Math.PI / 2, Math.PI / 2);
        c.strokeStyle = wlCss(st.lam, 0.055); c.lineWidth = 1; c.stroke();
      }
    }
    c.restore();

    drawScreen(c, screenX, top, scH, screenHalf);
    sText(c, screenX - 18, cy - 8, '0. Ordnung', 'rgba(180,205,245,.75)', 9, 'right');

    /* erstes Minimum */
    const sin1 = clamp(st.lam * 1e-9 / (st.b * 1e-3), 0, 0.999);
    const a1 = st.l * Math.tan(Math.asin(sin1));
    const y1 = cy - a1 * scale;
    if (y1 > top + 4 && y1 < bot - 4) {
      sLine(c, { x: barX + 6, y: cy - bw / 2 }, { x: screenX, y: y1 }, 'rgba(255,213,79,.45)', 1, [4, 5]);
      sLine(c, { x: barX + 6, y: cy + bw / 2 }, { x: screenX, y: y1 }, 'rgba(255,213,79,.45)', 1, [4, 5]);
      sText(c, screenX - 10, y1 - 8, '1. Minimum', 'rgba(255,213,79,.9)', 9.5, 'right');
      sText(c, (barX + screenX) / 2, y1 + 12, 'b · sin α = λ', 'rgba(255,213,79,.85)', 9.5);
    }
    drawDoubleArrow(c, barX + 18, bot + 14, screenX, bot + 14, 'rgba(160,190,235,.7)', 1.1);
    sText(c, (barX + screenX) / 2, bot + 28, 'l = ' + num(st.l, 2) + ' m', 'rgba(180,205,240,.85)', 10);

    /* Zeigerbilder unten */
    if (Hh > 400) {
      const iy = Hh - 88, R = 24;
      fillRound(c, 12, iy, 150, 68, 9, 'rgba(10,16,32,.75)', 'rgba(40,60,95,.9)', 1);
      fillRound(c, W - 162, iy, 150, 68, 9, 'rgba(10,16,32,.75)', 'rgba(40,60,95,.9)', 1);
      drawPhasorBundle(c, 87, iy + 28, R, false);
      sText(c, 87, iy + 58, 'Mitte: Verstärkung', 'rgba(220,230,255,.9)', 9, 'center');
      drawPhasorBundle(c, W - 87, iy + 28, R, true);
      sText(c, W - 87, iy + 58, '1. Minimum: Auslöschung', 'rgba(220,230,255,.9)', 9, 'center');
    }

    fillRound(c, 8, 82, Math.min(270, W * 0.48), 62, 8, 'rgba(7,10,20,.72)', 'rgba(40,60,95,.55)', 1);
    sText(c, 12, 88, 'b · sin α = k · λ  (Minima)', '#ffd9a8', 11.5, 'left');
    sText(c, 12, 104, 'b · sin α = (2k+1) · λ/2  (Maxima)', '#9fd8ff', 10.5, 'left');
    sText(c, 12, 120, 'Mitte: alle Wege gleich lang', 'rgba(160,190,235,.85)', 9.5, 'left');
    V.setBadges(['b = ' + num(st.b, 3) + ' mm · λ = ' + num(st.lam, 0) + ' nm', 'l = ' + num(st.l, 2) + ' m · Muster schematisch']);
  }

  V.draw = dt => {
    st.phase += dt * 0.8;
    const c = V.ctx, W = V.W, Hh = V.H;
    c.clearRect(0, 0, W, Hh); bg(V);
    if (st.mode === 'double') drawDouble(c, W, Hh); else drawSingle(c, W, Hh);

    const lam = st.lam * 1e-9, g = st.g * 1e-3, b = st.b * 1e-3, l = st.l;
    const da = lam * l / g;
    const a1d = lam * l / g;
    const sin1 = lam / g;
    const bsin = b * sin1;
    const s1 = l * Math.tan(Math.asin(clamp(lam / b, 0, 0.999)));
    RO.set('lam', num(st.lam, 0) + ' nm');
    RO.set('da', num(da * 1e3, 2) + ' mm');
    RO.set('a1', num(a1d * 1e3, 2) + ' mm');
    RO.set('sin', num(sin1, 4));
    RO.set('sinb', num(lam / b, 4));
    RO.set('b1', num(lam * 1e9, 0) + ' nm  (= λ)');
    RO.set('s1', num(s1 * 1e3, 1) + ' mm');
    curvePlot(cvP, {
      fn: u => patternAt((u - 0.5) * 2 * (st.mode === 'double' ? SCREEN_HALF_D : SCREEN_HALF_S)),
      marker: 0.5,
      top: st.mode === 'double' ? 'Doppelspalt: I(y)' : 'Einzelspalt: I(y)',
      xlab: 'Schirmposition', ylab: 'I', color: wlCss(st.lam, 0.95)
    });
  };
});

/* ==================== 12 · Zeiger ==================== */
addView('zeiger', '12 · Zeiger', V => {
  const st = { N: 3, delta: 60, mode: 'chain' };
  const G = grid(V.panel);
  const sN = slider(G, {
    label: 'Zahl der Spalte N', min: 2, max: 8, step: 1, value: 3,
    fmt: v => num(v, 0), on: v => st.N = Math.round(v)
  });
  const sD = slider(G, {
    label: 'Phasenunterschied δ zwischen Nachbarn', min: 0, max: 360, step: 1, value: 60,
    fmt: v => num(v, 0) + '°', on: v => st.delta = v
  });
  seg(G, {
    label: 'Darstellung', value: 'chain',
    options: [{ v: 'chain', label: 'Kette (Pfeiladdition)' }, { v: 'origin', label: 'alle vom Ursprung' }],
    on: v => st.mode = v
  });
  const row = el('div', 'ctrl');
  [['Hauptmaximum', 0], ['Nebenminimum', 120], ['Nebenmaximum', 180]].forEach(([lab, d]) => {
    const b = el('button', 'jump', lab);
    b.onclick = () => { sN.set(3, true); sD.set(d, true); st.N = 3; st.delta = d; };
    row.append(b);
  });
  G.append(row);
  const RO = readouts(G);
  RO.add('N', 'Spalte N');
  RO.add('d', 'Phasenunterschied δ');
  RO.add('a', 'resultierende Amplitude A_res');
  RO.add('i', 'Intensität I / I_max');
  RO.add('art', 'Art des Punktes');
  RO.add('neben', 'zwischen zwei Hauptmaxima');
  note(G, '<b>Zeigeraddition:</b> Jeder Wellenzug wird durch einen Zeiger der Länge A dargestellt. Man legt die Zeiger <b>Kopf an Fuß</b> aneinander; die Pfeiladdition ergibt den Gesamtzeiger. ' +
    'Seine Länge ist die resultierende Amplitude, sein Quadrat ist die Intensität.');
  note(G, '<b>Hauptmaximum:</b> Alle N Zeiger zeigen in dieselbe Richtung, δ = 0°, 360°, 720°, … Dann ist A_res = N · A und die Intensität maximal. ' +
    '<b>Nebenminimum:</b> Die Zeiger bilden ein geschlossenes Vieleck, δ = k · 360°/N mit k = 1, …, N−1. Dann ist A_res = 0. ' +
    '<b>Nebenmaximum:</b> Zwischen zwei Nebenminima bleibt ein Restzeiger übrig, seine Länge ist kleiner als N · A.');
  note(G, '<b>Beispiel Dreifachspalt:</b> Zwischen zwei Hauptmaxima liegen N−1 = 2 Nebenminima und N−2 = 1 Nebenmaximum. ' +
    'Beim Nebenmaximum ist δ = 180°; die drei Zeiger zeigen abwechselnd nach rechts und links, der Restzeiger hat die Länge A. Die Intensität ist dann (1/3)² = 1/9 des Hauptmaximums.');
  note(G, '<b>Merke:</b> Bei einem Gitter mit sehr vielen Spalten werden die Hauptmaxima sehr schmal und die Nebenmaxima sehr schwach. Deshalb sieht man beim optischen Gitter praktisch nur die Hauptmaxima.');
  V.setBadges(['Zeiger Kopf an Fuß addieren', 'A_res ist die Länge des Gesamtzeigers']);

  function amplitude(N, deltaDeg) {
    const d = deltaDeg * D2R;
    const s = Math.sin(d / 2);
    if (Math.abs(s) < 1e-9) return N;
    return Math.abs(Math.sin(N * d / 2) / s);
  }
  function classify(N, deltaDeg) {
    const d = ((deltaDeg % 360) + 360) % 360;
    const main = Math.abs(d) < 1e-6 || Math.abs(d - 360) < 1e-6;
    if (main) return 'Hauptmaximum';
    const min = Math.abs(Math.sin(N * d * D2R / 2)) < 1e-6;
    if (min) return 'Nebenminimum';
    const a0 = amplitude(N, d), am = amplitude(N, d - 0.5), ap = amplitude(N, d + 0.5);
    if (a0 >= am - 1e-9 && a0 >= ap - 1e-9 && a0 > 1e-6) return 'Nebenmaximum';
    return 'zwischen den ausgezeichneten Punkten';
  }

  function drawPlot(c, x, y, w, h, N, delta) {
    fillRound(c, x, y, w, h, 9, 'rgba(10,16,32,.8)', 'rgba(40,60,95,.9)', 1);
    const L = x + 30, R = x + w - 10, T = y + 12, B = y + h - 18;
    sLine(c, { x: L, y: T }, { x: L, y: B }, 'rgba(70,90,130,.8)', 1);
    sLine(c, { x: L, y: B }, { x: R, y: B }, 'rgba(70,90,130,.8)', 1);
    c.beginPath();
    for (let i = 0; i <= 180; i++) {
      const dd = i / 180 * 360;
      const I = Math.pow(amplitude(N, dd) / N, 2);
      const xx = L + i / 180 * (R - L), yy = B - I * (B - T);
      i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.strokeStyle = 'rgba(120,200,255,.9)'; c.lineWidth = 1.6; c.stroke();
    const mx = L + clamp(delta, 0, 360) / 360 * (R - L);
    sLine(c, { x: mx, y: T }, { x: mx, y: B }, 'rgba(255,213,79,.55)', 1, [3, 3]);
    sText(c, L - 4, T + 2, '1', 'rgba(150,175,215,.8)', 8.5, 'right');
    sText(c, R, B + 12, 'δ', 'rgba(150,175,215,.8)', 9, 'right');
    sText(c, x + 8, y + 3, 'I / I_max', 'rgba(150,175,215,.85)', 8.5, 'left');
  }

  V.draw = () => {
    const c = V.ctx, W = V.W, Hh = V.H;
    c.clearRect(0, 0, W, Hh); bg(V);
    const N = st.N, d = st.delta;
    const plotH = Hh > 430 ? 74 : 0;
    const top = 42, bot = Hh - plotH - 24;
    const cx0 = W / 2, cy0 = (top + bot) / 2;

    const pts = [{ x: 0, y: 0 }];
    if (st.mode === 'chain') {
      for (let j = 0; j < N; j++) {
        const a = j * d * D2R;
        const p = pts[pts.length - 1];
        pts.push({ x: p.x + Math.cos(a), y: p.y - Math.sin(a) });
      }
    } else {
      for (let j = 0; j < N; j++) pts.push({ x: Math.cos(j * d * D2R), y: -Math.sin(j * d * D2R) });
    }
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    pts.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
    const spanX = Math.max(1, maxX - minX), spanY = Math.max(1, maxY - minY);
    const scale = Math.min((W - 120) / spanX, (bot - top - 40) / spanY, 110);
    const ox = cx0 - (minX + maxX) / 2 * scale, oy = cy0 - (minY + maxY) / 2 * scale;
    const P = p => ({ x: ox + p.x * scale, y: oy + p.y * scale });

    /* Einheitskreis als Maßhilfe */
    if (st.mode === 'origin') {
      c.save(); c.strokeStyle = 'rgba(80,105,150,.35)'; c.lineWidth = 1; c.setLineDash([3, 4]);
      const O = P({ x: 0, y: 0 });
      c.beginPath(); c.arc(O.x, O.y, scale, 0, TAU); c.stroke(); c.restore();
    }

    const Ares = amplitude(N, d);
    const collinear = Math.abs(Math.sin(d * D2R)) < 1e-6;
    if (st.mode === 'chain' && collinear) {
      /* Bei δ = 0° oder 180° liegen alle Zeiger auf einer Geraden.
         Für die Anschauung werden sie mit kleinen Höhenversätzen gezeichnet. */
      const rowH = Math.min(26, (bot - top) / Math.max(4, N + 2));
      let x0 = 0;
      for (let j = 0; j + 1 < pts.length; j++) {
        const y = cy0 + (j - (N - 1) / 2) * rowH;
        const x1 = pts[j + 1].x;
        const col = rgba(mixc(COOL, WARM, N > 1 ? j / (N - 1) : 0), 0.95);
        drawArrow2(c, ox + x0 * scale, y, ox + x1 * scale, y, col, 2.2, 9);
        if (N <= 6) sText(c, ox + (x0 + x1) / 2 * scale, y - 9, 'z' + (j + 1), col, 10);
        if (j + 2 < pts.length) {
          c.save(); c.setLineDash([3, 4]); c.strokeStyle = 'rgba(150,170,210,.5)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(ox + x1 * scale, y); c.lineTo(ox + x1 * scale, y + rowH); c.stroke(); c.restore();
        }
        x0 = x1;
      }
      const finalX = pts[pts.length - 1].x;
      const ry = cy0 + (N - 1) / 2 * rowH + 36;
      drawArrow2(c, ox, ry, ox + finalX * scale, ry, 'rgba(255,235,150,.98)', 3.0, 12);
      sText(c, ox + finalX * scale / 2, ry + 15, 'A_res = ' + num(Ares, 1) + ' · A', 'rgba(255,235,150,.95)', 10.5);
      c.save(); c.setLineDash([3, 4]); c.strokeStyle = 'rgba(150,170,210,.45)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(ox + finalX * scale, cy0 + (N - 1) / 2 * rowH); c.lineTo(ox + finalX * scale, ry); c.stroke(); c.restore();
      sText(c, 12, 120, 'Kette auseinandergezogen, δ = ' + num(d, 0) + '°', 'rgba(180,200,235,.8)', 9.5, 'left');
    } else if (st.mode === 'chain') {
      for (let j = 0; j + 1 < pts.length; j++) {
        const A = P(pts[j]), B = P(pts[j + 1]);
        const col = rgba(mixc(COOL, WARM, N > 1 ? j / (N - 1) : 0), 0.95);
        drawArrow2(c, A.x, A.y, B.x, B.y, col, 2.2, 9);
        if (N <= 6) {
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          sText(c, mx, my - 12, 'z' + (j + 1), col, 10);
        }
      }
      const A = P(pts[0]), B = P(pts[pts.length - 1]);
      drawArrow2(c, A.x, A.y, B.x, B.y, 'rgba(255,235,150,.98)', 3.0, 12);
      sText(c, (A.x + B.x) / 2, (A.y + B.y) / 2 + 18, 'A_res', 'rgba(255,235,150,.95)', 11.5);
      if (N >= 2 && N <= 6) {
        const joint = P(pts[1]), a1 = 0, a2 = d * D2R;
        c.save(); c.strokeStyle = 'rgba(140,220,255,.8)'; c.lineWidth = 1.4;
        c.beginPath(); c.arc(joint.x, joint.y, 28, -a1, -a2, true); c.stroke(); c.restore();
        const am = (a1 + a2) / 2;
        sText(c, joint.x + Math.cos(am) * 42, joint.y - Math.sin(am) * 42, 'δ', 'rgba(140,220,255,.95)', 11);
      }
    } else {
      const O = P({ x: 0, y: 0 });
      for (let j = 0; j < N; j++) {
        const B = P(pts[j]);
        const col = rgba(mixc(COOL, WARM, N > 1 ? j / (N - 1) : 0), 0.95);
        drawArrow2(c, O.x, O.y, B.x, B.y, col, 2.1, 9);
        if (N <= 6) sText(c, B.x + 8, B.y - 8, 'z' + (j + 1), col, 10, 'left');
      }
    }

    sText(c, 12, 84, 'A_res = |sin(N·δ/2) / sin(δ/2)|', '#ffd9a8', 11, 'left');
    sText(c, 12, 100, 'Intensität I ~ A_res²', 'rgba(160,190,235,.85)', 9.5, 'left');
    if (plotH) drawPlot(c, 12, Hh - plotH - 10, W - 24, plotH, N, d);

    RO.set('N', num(N, 0));
    RO.set('d', num(d, 0) + '°');
    RO.set('a', num(Ares, 3) + ' · A');
    RO.set('i', pct(Math.pow(Ares / N, 2)));
    RO.set('art', classify(N, d));
    RO.set('neben', 'N−1 = ' + (N - 1) + ' · N−2 = ' + Math.max(0, N - 2));
    V.setBadges(['N = ' + N + ' · δ = ' + num(d, 0) + '°', 'A_res = ' + num(Ares, 2) + ' · A']);
  };
});

/* ==================== 13 · Röntgen ==================== */
addView('roentgen', '13 · Röntgen', V => {
  const st = { U: 60, mode: 'total', phase: 0, speed: 0.8 };
  const G = grid(V.panel);
  const sU = slider(G, {
    label: 'Beschleunigungsspannung U', min: 20, max: 150, step: 1, value: 60,
    fmt: v => num(v, 0) + ' kV', on: v => st.U = v
  });
  seg(G, {
    label: 'Spektrum', value: 'total',
    options: [{ v: 'total', label: 'Brems + charakteristisch' }, { v: 'brems', label: 'nur Bremsstrahlung' }],
    on: v => st.mode = v
  });
  slider(G, { label: 'Zeitlupe der Elektronen', min: 0.2, max: 2.5, step: 0.05, value: 0.8, fmt: v => num(v, 2) + ' Hz', on: v => st.speed = v });
  const RO = readouts(G);
  RO.add('u', 'Spannung U');
  RO.add('e', 'kinetische Energie e·U');
  RO.add('lmin', 'Grenzwellenlänge λ_min = h·c/(e·U)');
  RO.add('fmax', 'f_max = c / λ_min');
  RO.add('art', 'charakteristische Strahlung');
  note(G, '<b>Aufbau der Röhre:</b> Eine <b>Glühkathode</b> setzt Elektronen frei. Der <b>Wehnelt-Zylinder</b> bündelt sie, die hohe Spannung U beschleunigt sie zur <b>Anode</b>. ' +
    'Dort werden sie abgebremst; die Anode muss gekühlt werden. Im Vakuum können sich die Elektronen ungehindert bewegen.');
  note(G, '<b>Bremsstrahlung:</b> Die Elektronen werden im elektrischen Feld der Anodenatome abgelenkt und abgebremst. Dabei senden sie Photonen mit vielen verschiedenen Energien aus. ' +
    'Das ergibt ein <b>kontinuierliches Spektrum</b>. Die maximale Photonenenergie ist genau die kinetische Energie der Elektronen: E_max = e·U.');
  note(G, '<b>Charakteristische Strahlung:</b> Ein Elektron schlägt ein inneres Hüllenelektron aus einem Anodenatom. Ein Elektron aus einer äußeren Schale fällt nach, und es entsteht ein Photon mit einer für das Anodenmaterial typischen Energie. ' +
    'Das ergibt ein <b>Linienspektrum</b>. Die Lage der Linien ist materialabhängig, im Bild sind die Linien schematisch eingezeichnet.');
  note(G, '<b>Grenzwellenlänge:</b> <span class="formula">λ_min = h·c/(e·U)</span>. Mit h·c ≈ 1240 eV·nm folgt λ_min[pm] ≈ 1240/U[kV]. Bei U = 60 kV ergibt sich λ_min ≈ 20,7 pm. ' +
    'Kürzere Wellenlängen gibt es nicht, weil ein Photon nicht mehr Energie als die kinetische Energie eines Elektrons bekommen kann. Größeres U verschiebt die Grenze zu kleineren Wellenlängen und erhöht die maximale Photonenenergie.');
  note(G, '<b>Welle und Teilchen:</b> Röntgenstrahlung ist eine elektromagnetische Welle: Sie zeigt Interferenz an Kristallen (Bragg). Zugleich beschreibt man sie als Photonen mit E = h·f = h·c/λ. ' +
    'Beide Beschreibungen sind nicht widersprüchlich, sondern ergänzen sich: Die Welle erklärt Ausbreitung und Interferenz, das Photon erklärt die Energieübertragung.');
  note(G, '<b>ALARA:</b> „As Low As Reasonably Achievable“: Strahlenexposition so gering wie vernünftigerweise möglich halten. Dazu gehören kurze Bestrahlungszeit, großer Abstand, Abschirmung (Bleischürze, Bleiglas) und nur medizinisch notwendige Aufnahmen.');
  V.setBadges(['Bremsstrahlung: kontinuierlich', 'charakteristische Strahlung: diskret']);

  function lambdaMinPm(U) { return 1239.841984 / U; }

  function drawTube(c, x, y, w, h) {
    const small = w < 400;
    fillRound(c, x, y, w, h, 14, 'rgba(22,18,40,.55)', 'rgba(125,92,190,.65)', 1.5);
    const cy = y + h * 0.48;
    /* Kathode */
    const kx = x + w * 0.15;
    c.save();
    c.fillStyle = 'rgba(150,170,205,.85)';
    c.fillRect(kx - 18, cy - 18, 36, 36);
    c.fillStyle = '#ffb74d';
    for (let i = 0; i < 5; i++) {
      c.beginPath(); c.arc(kx - 9 + i * 4.5, cy - 8, 2.2, 0, TAU); c.fill();
      c.beginPath(); c.arc(kx - 9 + i * 4.5, cy + 8, 2.2, 0, TAU); c.fill();
    }
    c.restore();
    sText(c, kx, cy + 32, small ? 'Kathode' : 'Glühkathode', 'rgba(220,230,250,.9)', 9.5);
    /* Wehnelt-Zylinder */
    c.save(); c.strokeStyle = 'rgba(190,205,235,.8)'; c.lineWidth = 2;
    c.beginPath(); c.arc(kx + 2, cy, 29, -1.05, 1.05); c.stroke();
    c.beginPath(); c.moveTo(kx + 14, cy - 29); c.lineTo(kx + 26, cy - 36);
    c.moveTo(kx + 14, cy + 29); c.lineTo(kx + 26, cy + 36); c.stroke(); c.restore();
    sText(c, kx + 6, small ? cy - 34 : cy - 50, small ? 'Wehnelt' : 'Wehnelt-Zylinder', 'rgba(190,210,240,.85)', 8.8);
    /* Anode */
    const ax = x + w * 0.73;
    c.save();
    c.fillStyle = 'rgba(145,160,185,.95)';
    c.beginPath();
    c.moveTo(ax - 18, cy - 42); c.lineTo(ax + 32, cy - 28);
    c.lineTo(ax + 32, cy + 32); c.lineTo(ax - 18, cy + 42); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(220,230,250,.7)'; c.lineWidth = 1.2; c.stroke();
    c.restore();
    sText(c, ax + 8, cy + 55, 'Anode', 'rgba(220,230,250,.9)', 9.5);
    /* Kühlung */
    c.save(); c.strokeStyle = 'rgba(90,190,255,.8)'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(ax + 18, cy - 8); c.lineTo(x + w - 10, cy - 8); c.stroke();
    c.beginPath(); c.moveTo(ax + 18, cy + 10); c.lineTo(x + w - 10, cy + 10); c.stroke(); c.restore();
    sText(c, x + w - 12, cy + 28, 'Kühlung', 'rgba(120,210,255,.85)', 9, 'right');
    /* Elektronenstrahl */
    const sx = kx + 30, tx = ax - 18;
    c.save();
    for (let i = 0; i < 9; i++) {
      const u = ((i / 9 + st.phase * 0.35) % 1);
      const px = lerp(sx, tx, u), py = cy + Math.sin(u * 7 + st.phase) * 4;
      c.fillStyle = 'rgba(120,190,255,' + (0.35 + 0.6 * (1 - u)) + ')';
      c.beginPath(); c.arc(px, py, 3, 0, TAU); c.fill();
    }
    c.restore();
    sText(c, (sx + tx) / 2, cy - 18, 'Elektronen', 'rgba(140,200,255,.9)', 8.8);
    /* Röntgenstrahlung */
    const ox = ax - 4, oy = cy + 10;
    for (let j = 0; j < 3; j++) {
      c.beginPath();
      for (let i = 0; i <= 34; i++) {
        const u = i / 34;
        const px = ox + u * w * 0.20, py = oy + u * h * 0.26 + Math.sin(u * 18 + j) * 3;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.strokeStyle = 'rgba(180,130,255,' + (0.8 - j * 0.18) + ')'; c.lineWidth = 1.8; c.stroke();
      drawArrow2(c, ox + w * 0.13, oy + h * 0.17 + j * 5, ox + w * 0.20, oy + h * 0.26 + j * 5, 'rgba(190,150,255,.8)', 1.4, 6);
    }
    sText(c, ox + w * 0.10, oy + h * 0.36, small ? 'Röntgen' : 'Röntgenstrahlung', 'rgba(205,180,255,.9)', 9);
    /* Spannung */
    sLine(c, { x: kx, y: y + h - 24 }, { x: kx, y: cy + 38 }, 'rgba(170,190,225,.7)', 1.2);
    sLine(c, { x: kx, y: y + h - 24 }, { x: ax, y: y + h - 24 }, 'rgba(170,190,225,.7)', 1.2);
    sLine(c, { x: ax, y: y + h - 24 }, { x: ax, y: cy + 40 }, 'rgba(170,190,225,.7)', 1.2);
    c.save(); c.strokeStyle = 'rgba(190,210,240,.9)'; c.lineWidth = 1.5;
    c.beginPath(); c.arc((kx + ax) / 2, y + h - 24, 10, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo((kx + ax) / 2 - 5, y + h - 28); c.lineTo((kx + ax) / 2 + 5, y + h - 20); c.stroke(); c.restore();
    sText(c, (kx + ax) / 2 + 18, y + h - 24, 'U = ' + num(st.U, 0) + ' kV', 'rgba(210,225,250,.95)', 10, 'left');
    sText(c, x + 10, y + 12, 'Vakuum', 'rgba(190,170,230,.8)', 9, 'left');
  }

  function brems(lam, U) {
    const lmin = lambdaMinPm(U);
    if (lam <= lmin) return 0;
    const r = lam / lmin;
    return (r - 1) * Math.exp(-1.75 * (r - 1));
  }

  function drawSpectrum(c, x, y, w, h) {
    fillRound(c, x, y, w, h, 10, 'rgba(10,16,32,.7)', 'rgba(40,60,95,.9)', 1);
    const L = x + 34, R = x + w - 12, T = y + 18, B = y + h - 28;
    const xMax = 120;
    const X = lam => L + clamp(lam / xMax, 0, 1) * (R - L);
    const Y = v => B - clamp(v, 0, 1) * (B - T);
    sLine(c, { x: L, y: T }, { x: L, y: B }, 'rgba(80,100,140,.9)', 1);
    sLine(c, { x: L, y: B }, { x: R, y: B }, 'rgba(80,100,140,.9)', 1);
    [0, 40, 80, 120].forEach(t => {
      const xx = X(t);
      sLine(c, { x: xx, y: B }, { x: xx, y: B + 4 }, 'rgba(100,125,165,.8)', 1);
      sText(c, xx, B + 14, t + '', 'rgba(130,155,195,.8)', 8.5);
    });
    sText(c, R, B + 24, 'λ in pm', 'rgba(150,175,215,.85)', 8.8, 'right');
    sText(c, L - 4, T + 3, 'I', 'rgba(150,175,215,.85)', 9, 'right');
    /* Vergleichsspektren */
    [30, 60, 100].forEach(U2 => {
      if (U2 === st.U) return;
      c.beginPath();
      let first = true;
      for (let lam = 1; lam <= xMax; lam += 1) {
        const v = brems(lam, U2);
        const yy = Y(clamp(v / 0.21 * (0.30 + 0.0035 * U2), 0, 1));
        const xx = X(lam);
        if (first) { c.moveTo(xx, yy); first = false; } else c.lineTo(xx, yy);
      }
      c.strokeStyle = 'rgba(120,150,200,.22)'; c.lineWidth = 1.2; c.stroke();
    });
    /* aktuelles Spektrum */
    const lmin = lambdaMinPm(st.U);
    c.beginPath();
    let first = true;
    for (let lam = 1; lam <= xMax; lam += 0.35) {
      const v = brems(lam, st.U);
      const yy = Y(clamp(v / 0.21 * (0.35 + 0.004 * st.U), 0, 1));
      const xx = X(lam);
      if (first) { c.moveTo(xx, yy); first = false; } else c.lineTo(xx, yy);
    }
    c.strokeStyle = 'rgba(120,200,255,.95)'; c.lineWidth = 2; c.stroke();
    /* charakteristische Linien */
    if (st.mode === 'total') {
      [27, 33].forEach((L0, idx) => {
        if (lmin >= L0) return;
        c.beginPath();
        for (let lam = L0 - 3; lam <= L0 + 3; lam += 0.15) {
          const g = Math.exp(-Math.pow((lam - L0) / 0.75, 2)) * (idx === 0 ? 0.26 : 0.18);
          const v = g;
          const yy = Y(clamp(v / 0.21 * (0.35 + 0.004 * st.U), 0, 1));
          const xx = X(lam);
          lam === L0 - 3 ? c.moveTo(xx, yy) : c.lineTo(xx, yy);
        }
        c.strokeStyle = 'rgba(255,190,90,.95)'; c.lineWidth = 1.8; c.stroke();
        sText(c, X(L0), Y(clamp((idx === 0 ? 0.78 : 0.64), 0, 1)) - 4, 'char.', 'rgba(255,205,120,.9)', 8, 'center');
      });
    }
    /* Grenzwellenlänge */
    const xl = X(lmin);
    sLine(c, { x: xl, y: T }, { x: xl, y: B }, 'rgba(255,213,79,.7)', 1, [4, 4]);
    sText(c, xl + 4, T + 4, 'λ_min', 'rgba(255,213,79,.95)', 9, 'left');
    sText(c, xl + 4, T + 16, num(lmin, 1) + ' pm', 'rgba(255,213,79,.85)', 8.5, 'left');
    sText(c, L, T - 2, 'Intensität (schematisch)', 'rgba(150,175,215,.85)', 8.8, 'left');
    sText(c, R, T + 3, st.mode === 'total' ? 'blau: Brems · orange: char.' : 'nur Bremsstrahlung', 'rgba(180,200,235,.85)', 8.8, 'right');
  }

  V.draw = dt => {
    st.phase += dt * st.speed;
    const c = V.ctx, W = V.W, Hh = V.H;
    c.clearRect(0, 0, W, Hh); bg(V);
    const stacked = W < Hh * 1.15;
    if (stacked) {
      const th = Hh * 0.54;
      drawTube(c, 8, 8, W - 16, th - 8);
      drawSpectrum(c, 8, th + 4, W - 16, Hh - th - 12);
    } else {
      const tw = W * 0.52;
      drawTube(c, 8, 8, tw - 10, Hh - 16);
      drawSpectrum(c, tw + 2, 8, W - tw - 10, Hh - 16);
    }
    const lmin = lambdaMinPm(st.U);
    RO.set('u', num(st.U, 0) + ' kV');
    RO.set('e', num(st.U, 0) + ' keV');
    RO.set('lmin', num(lmin, 2) + ' pm');
    RO.set('fmax', num(C0 / (lmin * 1e-12) / 1e18, 2) + ' · 10¹⁸ Hz');
    RO.set('art', st.mode === 'total' ? 'Linien sichtbar (schematisch)' : 'ausgeblendet');
    V.setBadges(['U = ' + num(st.U, 0) + ' kV · λ_min = ' + num(lmin, 1) + ' pm', st.mode === 'total' ? 'Brems- und Linienspektrum' : 'nur Bremsstrahlung']);
  };
});

/* ==================== 14 · Bragg ==================== */
addView('bragg', '14 · Bragg', V => {
  const st = { d: 282, theta: 10.2, lambda: 100 };
  const G = grid(V.panel);
  const sD = slider(G, {
    label: 'Netzebenenabstand d', min: 50, max: 500, step: 1, value: 282,
    fmt: v => num(v, 0) + ' pm', on: v => st.d = v
  });
  const sT = slider(G, {
    label: 'Glanzwinkel θ (zur Netzebene)', min: 1, max: 45, step: 0.1, value: 10.2,
    fmt: v => num(v, 1) + '°', on: v => st.theta = v
  });
  const sL = slider(G, {
    label: 'Wellenlänge λ', min: 10, max: 200, step: 1, value: 100,
    fmt: v => num(v, 0) + ' pm', on: v => st.lambda = v
  });
  const row = el('div', 'ctrl');
  [1, 2, 3].forEach(k => {
    const b = el('button', 'jump', k + '. Ordnung');
    b.onclick = () => {
      const s = k * st.lambda / (2 * st.d);
      if (s <= 1) { const th = Math.asin(s) * 180 / Math.PI; sT.set(clamp(th, 1, 45), true); st.theta = clamp(th, 1, 45); }
    };
    row.append(b);
  });
  G.append(row);
  const RO = readouts(G);
  RO.add('ds', 'Gangunterschied 2·d·sin θ');
  RO.add('k', 'k = 2·d·sin θ / λ');
  RO.add('kr', 'nächste ganze Ordnung');
  RO.add('th1', 'θ für k = 1');
  RO.add('th2', 'θ für k = 2');
  RO.add('th3', 'θ für k = 3');
  RO.add('status', 'Bragg-Bedingung');
  note(G, '<b>Netzebenen:</b> In einem Kristall liegen die Atome in parallelen Ebenen, den Netzebenen, im Abstand d. Röntgenstrahlung wird an diesen Ebenen teilweise reflektiert. ' +
    'Der <b>Glanzwinkel θ</b> wird zwischen dem Strahl und der Netzebene gemessen, nicht zum Einfallslot.');
  note(G, '<b>Gangunterschied:</b> Der Strahl, der an der unteren Ebene reflektiert wird, legt gegenüber dem Strahl an der oberen Ebene den zusätzlichen Weg <span class="formula">2·d·sin θ</span> zurück. ' +
    'Konstruktive Interferenz entsteht bei <span class="formula">k·λ = 2·d·sin θ</span> mit k = 1, 2, 3, …');
  note(G, '<b>Analogie zum Gitter:</b> Beim Gitter ist der Gangunterschied benachbarter Spalte <span class="formula">g·sin α</span>. Beim Kristall wird der Strahl an benachbarten Netzebenen reflektiert, deshalb zählt der Weg hin und zurück: <span class="formula">2·d·sin θ</span>. ' +
    'Die Netzebenen wirken wie ein Gitter mit der Gitterkonstanten 2d.');
  note(G, '<b>Grenzen:</b> Aus sin θ ≤ 1 folgt k ≤ 2d/λ. Ist λ größer als 2d, ist keine Bragg-Reflexion möglich. Deshalb braucht man für Röntgenstrahlung Kristalle mit Atomabständen in der Größenordnung der Wellenlänge; für sichtbares Licht sind diese Abstände zu klein.');
  V.setBadges(['Glanzwinkel θ zur Netzebene', 'k·λ = 2·d·sin θ']);

  V.draw = () => {
    const c = V.ctx, W = V.W, Hh = V.H;
    c.clearRect(0, 0, W, Hh); bg(V);
    const theta = st.theta * D2R;
    const thDraw = clamp(st.theta * 2.2, 16, 58) * D2R;
    const dPix = clamp(46 + 104 * (st.d - 50) / 450, 46, Math.min(150, Hh * 0.26));
    const yTop = Math.max(82, Hh * 0.34), yBot = yTop + dPix;
    const xh = W * 0.56;
    const T = { x: xh, y: yTop }, B = { x: xh, y: yBot };
    const u = { x: Math.cos(thDraw), y: Math.sin(thDraw) };
    const v = { x: Math.cos(thDraw), y: -Math.sin(thDraw) };
    const tan = Math.tan(thDraw);
    const kExact = 2 * st.d * Math.sin(theta) / st.lambda;
    const kNear = Math.round(kExact);
    const ok = kNear >= 1 && Math.abs(kExact - kNear) <= 0.03;
    const accent = ok ? 'rgba(90,230,150,.95)' : 'rgba(255,120,120,.85)';

    /* Netzebenen */
    for (let plane = 0; plane < 2; plane++) {
      const yy = plane ? yBot : yTop;
      sLine(c, { x: 26, y: yy }, { x: W - 18, y: yy }, 'rgba(120,150,200,.45)', 1.2, [6, 5]);
      for (let x = 38; x < W - 20; x += 34) {
        const off = plane ? 17 : 0;
        c.beginPath(); c.arc(x + off, yy, 3.2, 0, TAU);
        c.fillStyle = 'rgba(200,120,100,.75)'; c.fill();
      }
    }
    sText(c, 26, yTop - 12, 'Netzebenen', 'rgba(200,220,250,.9)', 10, 'left');
    drawDoubleArrow(c, 18, yTop, 18, yBot, 'rgba(180,205,245,.8)', 1.2);
    sText(c, 12, (yTop + yBot) / 2, 'd', 'rgba(200,220,250,.95)', 12, 'right');

    /* einfallende Strahlen */
    const startX = 12;
    const yStartT = T.y - (T.x - startX) * tan;
    const yStartB = B.y - (B.x - startX) * tan;
    const inT = { x: startX, y: Math.max(10, yStartT) };
    const inB = { x: startX, y: Math.max(10, yStartB) };
    sLine(c, inT, T, 'rgba(220,230,250,.78)', 1.8);
    sLine(c, inB, B, 'rgba(220,230,250,.78)', 1.8);
    drawArrow2(c, (inT.x + T.x) / 2, (inT.y + T.y) / 2, T.x, T.y, 'rgba(220,230,250,.9)', 1.6, 7);
    drawArrow2(c, (inB.x + B.x) / 2, (inB.y + B.y) / 2, B.x, B.y, 'rgba(220,230,250,.9)', 1.6, 7);

    /* reflektierte Strahlen */
    const endX = W - 24;
    const outT = { x: endX, y: T.y - (endX - T.x) * tan };
    const outB = { x: endX, y: B.y - (endX - B.x) * tan };
    sLine(c, T, outT, accent, 1.8);
    sLine(c, B, outB, accent, 1.8);
    drawArrow2(c, T.x, T.y, outT.x, outT.y, accent, 1.6, 7);
    drawArrow2(c, B.x, B.y, outB.x, outB.y, accent, 1.6, 7);

    /* Gangunterschied-Segmente */
    const seg = dPix * Math.sin(thDraw);
    const P = { x: B.x - u.x * seg, y: B.y - u.y * seg };
    const Q = { x: B.x + v.x * seg, y: B.y + v.y * seg };
    sLine(c, P, B, 'rgba(255,213,79,.95)', 4);
    sLine(c, B, Q, 'rgba(255,213,79,.95)', 4);
    c.save(); c.setLineDash([4, 4]); c.strokeStyle = 'rgba(140,220,255,.55)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(T.x, T.y); c.lineTo(P.x, P.y); c.stroke();
    c.beginPath(); c.moveTo(T.x, T.y); c.lineTo(Q.x, Q.y); c.stroke(); c.restore();
    sText(c, (P.x + B.x) / 2 - 10, (P.y + B.y) / 2 - 4, 'd·sin θ', 'rgba(255,225,130,.95)', 9.5, 'right');
    sText(c, (B.x + Q.x) / 2 + 10, (B.y + Q.y) / 2 - 4, 'd·sin θ', 'rgba(255,225,130,.95)', 9.5, 'left');

    /* Winkel */
    const drawAngle = (O, dir, label, sign) => {
      const r = 34;
      c.beginPath();
      for (let i = 0; i <= 20; i++) {
        const t = sign * i / 20 * thDraw;
        const xx = O.x + Math.cos(Math.PI - t) * r;
        const yy = O.y + Math.sin(Math.PI - t) * r;
        i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      }
      c.strokeStyle = 'rgba(140,220,255,.8)'; c.lineWidth = 1.4; c.stroke();
      const am = Math.PI - sign * thDraw / 2;
      sText(c, O.x + Math.cos(am) * (r + 14), O.y + Math.sin(am) * (r + 14), label, 'rgba(140,220,255,.95)', 11);
    };
    drawAngle(T, u, 'θ', 1);
    drawAngle(B, u, 'θ', 1);
    /* Reflexionswinkel am oberen Trefferpunkt */
    const r2 = 34;
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const t = i / 20 * thDraw;
      const xx = T.x + Math.cos(t) * r2, yy = T.y - Math.sin(t) * r2;
      i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.strokeStyle = 'rgba(140,220,255,.8)'; c.lineWidth = 1.4; c.stroke();
    sText(c, T.x + Math.cos(thDraw / 2) * (r2 + 16), T.y - Math.sin(thDraw / 2) * (r2 + 16), 'θ', 'rgba(140,220,255,.95)', 11);

    /* Status und Formel */
    const boxY = Hh - 96;
    fillRound(c, 12, boxY, Math.min(340, W - 24), 54, 9, 'rgba(10,16,32,.85)', ok ? 'rgba(60,150,100,.8)' : 'rgba(120,60,70,.8)', 1);
    sText(c, 22, boxY + 13, 'k·λ = 2·d·sin θ', '#ffd9a8', 12, 'left');
    sText(c, 22, boxY + 32, 'd = ' + num(st.d, 0) + ' pm · θ = ' + num(st.theta, 1) + '° · λ = ' + num(st.lambda, 0) + ' pm', 'rgba(200,220,245,.9)', 9.5, 'left');
    sText(c, W - 24, boxY + 16, ok ? 'Bragg-Bedingung erfüllt' : 'keine Bragg-Reflexion', accent, 10.5, 'right');
    sText(c, W - 24, boxY + 34, 'k = ' + num(kExact, 2), 'rgba(200,220,245,.9)', 9.5, 'right');

    /* kleine Skizze der Analogie */
    sText(c, 12, Hh - 18, 'Gitter: g·sin α   ·   Kristall: 2·d·sin θ', 'rgba(160,190,235,.8)', 9.5, 'left');
    sText(c, W - 24, Hh - 18, 'Zeichnung schematisch, Winkel vergrößert', 'rgba(150,175,215,.65)', 8.5, 'right');

    RO.set('ds', num(2 * st.d * Math.sin(theta), 1) + ' pm');
    RO.set('k', num(kExact, 3));
    RO.set('kr', kNear + (ok ? ' (passt)' : ' (passt nicht)'));
    const thk = k => { const s = k * st.lambda / (2 * st.d); return s <= 1 ? num(Math.asin(s) * 180 / Math.PI, 2) + '°' : 'nicht möglich'; };
    RO.set('th1', thk(1));
    RO.set('th2', thk(2));
    RO.set('th3', thk(3));
    RO.set('status', ok ? 'erfüllt für k = ' + kNear : 'nicht erfüllt');
    V.setBadges(['d = ' + num(st.d, 0) + ' pm · θ = ' + num(st.theta, 1) + '°', ok ? 'konstruktive Interferenz' : 'Phasen unterscheiden sich']);
  };
});

/* ==================== 15 · Thomson ==================== */
addView('thomson', '15 · Thomson', V => {
  const st = { L: 2.0, C: 2.0, mode: 'osc', phase: 0, speed: 0.8 };
  const G = grid(V.panel);
  slider(G, {
    label: 'Induktivität L', min: 0.5, max: 10.0, step: 0.1, value: 2.0,
    entry: { unit: 'µH', scale: 1e-6, dec: 1 },
    on: v => st.L = v
  });
  slider(G, {
    label: 'Kapazität C', min: 0.5, max: 10.0, step: 0.1, value: 2.0,
    entry: { unit: 'pF', scale: 1e-12, dec: 1 },
    on: v => st.C = v
  });
  seg(G, {
    label: 'Elektron im Dipol', value: 'osc',
    options: [{ v: 'rest', label: 'ruht' }, { v: 'uniform', label: 'gleichförmig' }, { v: 'osc', label: 'schwingt' }],
    on: v => st.mode = v
  });
  slider(G, { label: 'Zeitlupe', min: 0.2, max: 2.5, step: 0.05, value: 0.8, fmt: v => num(v, 2) + ' Hz', on: v => st.speed = v });
  const RO = readouts(G);
  RO.add('f', 'Thomson-Gleichung: f = 1/(2π√(L·C))');
  RO.add('lam', 'Wellenlänge λ = c / f');
  RO.add('l', 'Dipollänge l = λ/2 = c/(2f)');
  RO.add('t', 'Periodendauer T = 1/f');
  RO.add('lc', 'L · C');
  note(G, '<b>Thomson-Gleichung:</b> <span class="formula">f = 1/(2π√(L·C))</span>. Ein Schwingkreis aus Spule und Kondensator schwingt mit dieser Frequenz. ' +
    'Die Energie pendelt zwischen der magnetischen Energie der Spule und der elektrischen Energie des Kondensators.');
  note(G, '<b>Bezug zum Dipol:</b> Ein gerader Dipol der Länge l hat seine Grundschwingung, wenn auf ihm eine stehende Welle mit einem Bauch an jedem Ende passt. ' +
    'Dann ist <span class="formula">l = λ/2</span> und damit <span class="formula">f = c/(2l)</span>. Der Dipol wirkt wie ein Schwingkreis mit sehr kleiner Induktivität und sehr kleiner Kapazität.');
  note(G, '<b>Warum strahlen nur beschleunigte Ladungen?</b> Ein ruhendes Elektron hat ein statisches Feld. Bewegt es sich gleichförmig, wird das Feld nur mitgeführt, es entsteht keine Welle. ' +
    'Wird das Elektron beschleunigt, ändert sich sein Feld; diese Störung löst sich ab und breitet sich als elektromagnetische Welle aus. Beim Schwingen wird das Elektron dauernd beschleunigt, deshalb strahlt der Dipol.');
  note(G, '<b>Merke:</b> Die abgestrahlte Frequenz ist gleich der Schwingfrequenz der Ladung. Ein Dipol der Länge l = 1,50 m hat seine Grundfrequenz bei f = c/(2l) = 100 MHz.');
  V.setBadges(['schwingende Ladung = Dipol', 'Beschleunigung erzeugt die Welle']);

  function freq() { return 1 / (TAU * Math.sqrt(st.L * 1e-6 * st.C * 1e-12)); }

  function drawWaveTrain(c, x0, x1, y0, A, phase) {
    const k = 0.085;
    c.beginPath();
    for (let x = x0; x <= x1; x += 2) {
      const e = Math.sin(phase - (x - x0) * k);
      const y = y0 - A * e;
      x === x0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.strokeStyle = 'rgba(255,112,67,.55)'; c.lineWidth = 1.8; c.stroke();
    for (let x = x0 + 8; x <= x1; x += 18) {
      const e = Math.sin(phase - (x - x0) * k);
      if (Math.abs(e) < 0.06) continue;
      drawArrow2(c, x, y0, x, y0 - A * e, rgba(WARM, 0.35 + 0.55 * Math.abs(e)), 1.2, 5);
      c.beginPath(); c.arc(x, y0, 4, 0, TAU);
      c.fillStyle = e > 0 ? 'rgba(72,214,232,.85)' : 'rgba(10,20,40,.9)';
      c.fill(); c.strokeStyle = 'rgba(72,214,232,.75)'; c.lineWidth = 1; c.stroke();
      if (e <= 0) sLine(c, { x: x - 2.6, y: y0 - 2.6 }, { x: x + 2.6, y: y0 + 2.6 }, 'rgba(72,214,232,.8)', 1);
      if (e <= 0) sLine(c, { x: x + 2.6, y: y0 - 2.6 }, { x: x - 2.6, y: y0 + 2.6 }, 'rgba(72,214,232,.8)', 1);
    }
    drawArrow2(c, x0, y0 + A + 24, x1, y0 + A + 24, 'rgba(180,205,245,.75)', 1.2, 7);
    sText(c, (x0 + x1) / 2, y0 + A + 36, 'c', 'rgba(190,210,245,.85)', 10);
    sText(c, x0 + 6, y0 - A - 20, 'E', '#ff8f6a', 11, 'left');
    sText(c, x1, y0 - A - 20, 'B', '#48d6e8', 11, 'right');
  }

  V.draw = dt => {
    st.phase += dt * st.speed * TAU;
    const c = V.ctx, W = V.W, Hh = V.H;
    c.clearRect(0, 0, W, Hh); bg(V);
    const f = freq(), lam = C0 / f, l = lam / 2;
    const cx = W * 0.30, cy = Hh * 0.48;
    const lPix = Math.min(Hh * 0.44, W * 0.34);
    const top = cy - lPix / 2, bot = cy + lPix / 2;
    const amp = lPix * 0.24;
    const ePos = st.mode === 'osc' ? Math.sin(st.phase) : 0;
    const ey = cy + amp * ePos;

    /* Dipolstab */
    sLine(c, { x: cx, y: top }, { x: cx, y: cy - 4 }, 'rgba(120,140,175,.35)', 12);
    sLine(c, { x: cx, y: cy + 4 }, { x: cx, y: bot }, 'rgba(120,140,175,.35)', 12);
    sLine(c, { x: cx, y: top }, { x: cx, y: cy - 4 }, '#c9d6ef', 4);
    sLine(c, { x: cx, y: cy + 4 }, { x: cx, y: bot }, '#c9d6ef', 4);
    sText(c, cx, top - 14, '+', '#ff8a70', 17);
    sText(c, cx, bot + 14, '−', '#7fb3ff', 17);
    drawDoubleArrow(c, cx - 26, top, cx - 26, bot, 'rgba(180,205,245,.75)', 1.2);
    sText(c, cx - 34, cy, 'l', 'rgba(200,220,250,.95)', 12, 'right');

    /* Elektron */
    c.save();
    c.shadowColor = 'rgba(90,180,255,.9)'; c.shadowBlur = 12;
    c.beginPath(); c.arc(cx, ey, 6, 0, TAU); c.fillStyle = '#7fc8ff'; c.fill();
    c.restore();
    sText(c, cx + 14, ey + 18, 'Elektron', 'rgba(160,220,255,.95)', 10, 'left');
    if (st.mode === 'osc') {
      const aa = -ePos;
      if (Math.abs(aa) > 0.03) {
        const L = 12 + 30 * Math.abs(aa);
        drawArrow2(c, cx, ey, cx, ey + Math.sign(aa) * L, 'rgba(255,95,120,.95)', 2.2, 8);
        sText(c, cx + 8, ey + Math.sign(aa) * (L + 10), 'a', 'rgba(255,140,160,.95)', 11, 'left');
      }
    }
    if (st.mode === 'uniform') {
      drawArrow2(c, cx, cy - 20, cx, cy - 60, 'rgba(120,220,255,.85)', 2, 8);
      sText(c, cx + 8, cy - 62, 'v = konstant', 'rgba(150,220,255,.9)', 9.5, 'left');
    }

    /* Abstrahlung */
    if (st.mode === 'osc') {
      drawWaveTrain(c, cx + 40, Math.min(W - 18, cx + W * 0.56), cy, Math.min(52, Hh * 0.12), st.phase);
      sText(c, cx + 44, cy + Math.min(52, Hh * 0.12) + 54, 'abgestrahlte Welle', 'rgba(200,220,245,.85)', 9.5, 'left');
    } else {
      sText(c, cx + 48, cy - 26, st.mode === 'rest' ? 'keine Beschleunigung' : 'keine Änderung des Feldes', 'rgba(200,180,160,.85)', 9.5, 'left');
      sText(c, cx + 48, cy - 10, 'keine Welle', 'rgba(200,180,160,.85)', 9.5, 'left');
    }

    /* kleines Diagramm y(t), a(t) */
    if (Hh > 420) {
      const gx = W * 0.54, gy = Hh - 104, gw = Math.min(W * 0.42, W - gx - 16), gh = 82;
      fillRound(c, gx, gy, gw, gh, 9, 'rgba(10,16,32,.75)', 'rgba(40,60,95,.9)', 1);
      const Lx = gx + 24, Rx = gx + gw - 10, Ty = gy + 14, By = gy + gh - 18;
      sLine(c, { x: Lx, y: Ty }, { x: Lx, y: By }, 'rgba(70,90,130,.8)', 1);
      sLine(c, { x: Lx, y: (Ty + By) / 2 }, { x: Rx, y: (Ty + By) / 2 }, 'rgba(70,90,130,.5)', 1);
      const drawCurve = (col, off) => {
        c.beginPath();
        for (let i = 0; i <= 80; i++) {
          const u = i / 80;
          const val = st.mode === 'osc' ? Math.sin(u * TAU * 2 + off) : 0;
          const xx = Lx + u * (Rx - Lx), yy = (Ty + By) / 2 - val * (By - Ty) * 0.36;
          i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
        }
        c.strokeStyle = col; c.lineWidth = 1.6; c.stroke();
      };
      drawCurve('rgba(120,200,255,.95)', st.phase);
      drawCurve('rgba(255,120,140,.9)', st.phase + Math.PI);
      sText(c, gx + 8, gy + 3, 'y(t) blau · a(t) rot', 'rgba(160,190,235,.85)', 8.5, 'left');
      sText(c, Rx, By + 10, 't', 'rgba(150,175,215,.8)', 8.5, 'right');
    }
    sText(c, cx, Hh - 14, 'l = ' + num(l, 2) + ' m · λ = ' + num(lam, 2) + ' m', 'rgba(190,210,240,.85)', 10);

    RO.set('f', hzStr(f));
    RO.set('lam', num(lam, 2) + ' m');
    RO.set('l', num(l, 2) + ' m');
    RO.set('t', num(1 / f * 1e9, 1) + ' ns');
    RO.set('lc', num(st.L * st.C, 2) + ' · 10⁻¹⁸ s²');
    V.setBadges(['f = ' + hzStr(f), 'l = ' + num(l, 2) + ' m = λ/2']);
  };
});
