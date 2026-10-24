/* =========================================================================
   Teil 4: Nahfeld · Fernfeld · Rechenaufgaben
   ========================================================================= */

/* ---------- Momentaner Energiefluss S = E × B ---------- */
function quiverS(V, st, lam, k, t, ext) {
  const ctx = V.ctx;
  const sref = 2 * Math.pow(k, 4) / (lam * lam);
  const NR = 9, NA = 24, rmax = ext * 0.97, rmin = clamp(0.24 * ext, 0.12, 0.5);
  for (let i = 0; i < NR; i++) {
    const r = rmin * Math.pow(rmax / rmin, i / (NR - 1));
    const na = i < 2 ? 8 : (i < 4 ? 16 : 24);
    const Lmax = Math.min(0.17 * r + 0.02 * ext, ext * 0.10);
    for (let j = 0; j < na; j++) {
      const th = j * TAU / na;
      const x = r * Math.sin(th), y = r * Math.cos(th);
      const f = dipoleField(x, y, 0, t, k);
      const S = v3.cross(f.E, f.B);
      const mag = v3.len(S); if (mag < 1e-15) continue;
      const len = Lmax * ampScale(mag, sref);
      const u = v3.mul(S, 1 / mag);
      const A = V.proj([x - u[0] * len * .5, y - u[1] * len * .5, 0]);
      const B = V.proj([x + u[0] * len * .5, y + u[1] * len * .5, 0]);
      if (A.z < 0.06 || B.z < 0.06) continue;
      const scr = Math.hypot(A.x - B.x, A.y - B.y);
      if (scr < 2.2) continue;
      const outward = u[0] * x + u[1] * y > 0;
      const col = outward ? 'rgba(67,209,122,.85)' : 'rgba(255,95,160,.85)';
      V.push((A.z + B.z) * .5, () => sArrow(ctx, A, B, col, Math.max(1.1, scr * .07), Math.min(6.5, 1.5 + scr * .45)));
    }
  }
}

/* ---------- Wellenfronten (Kugelschalen, die nach außen laufen) ---------- */
function waveFronts(V, lam, phase, ext) {
  const base = (((phase / TAU) % 1) + 1) % 1;
  for (let n = 0; n < 9; n++) {
    const R = (base + n) * lam;
    if (R > ext * 1.18) break;
    const a = 0.34 * (1 - n / 10);
    if (a < 0.05) continue;
    const col = 'rgba(120,190,255,' + a.toFixed(2) + ')';
    for (let w = 0; w < 2; w++) {
      const pts = [];
      for (let i = 0; i <= 64; i++) {
        const q = i / 64 * TAU, s = Math.sin(q) * R, c2 = Math.cos(q) * R;
        pts.push(w === 0 ? [s, c2, 0] : [s, 0, c2]);
      }
      for (let i = 0; i + 1 < pts.length; i++) P3(V, pts[i], pts[i + 1], col, 1.3);
    }
  }
}

/* ---------- Gemeinsames Gerüst für Nahfeld / Fernfeld ---------- */
function fieldChapter(id, title, opts) {
  return addView(id, title, V => {
    V.cam.yaw = 0.42; V.cam.pitch = 0.22;
    V.homeCam = { yaw: 0.42, pitch: 0.22, dist: 9 };
    const st = {
      f: F0, slow: .8, cut: 'vertical', showE: true, showB: opts.showB !== false, showNear: !!opts.showNear,
      showDonut: false, showCharges: true, showFieldArrows: true, showS: !!opts.showS,
      showFronts: !!opts.showFronts, showEqGrid: opts.showEqGrid !== false,
      phase: 0, autoFit: true, showGenerator: true, showScale: true,
      gridOn: false, gridA: 45, extFixed: opts.extFixed || 0,
      receiver: { r: opts.r0, theta: opts.theta0 || 90, phi: 35, beta: 0, mode: 'probe', gamma: 0 }
    };
    const G = grid(V.panel);
    const H = {};
    slider(G, {
      label: 'Frequenz des Senders', min: 60, max: 200, step: 1, value: 100,
      entry: { unit: 'MHz', scale: 1e6, dec: 0 },
      fmt: v => num(v, 0) + ' MHz', on: v => st.f = v * 1e6
    });
    H.r = slider(G, {
      label: 'Abstand des Messpunkts r', min: opts.rMin, max: opts.rMax, step: opts.rStep,
      value: opts.r0, fmt: v => num(v, v < 1 ? 2 : 1) + ' m', on: v => st.receiver.r = v
    });
    H.theta = slider(G, {
      label: 'Höhenwinkel θ (0° = Dipolachse)', min: 0, max: 90, step: 1, value: opts.theta0 || 90,
      fmt: v => num(v, 0) + '°', on: v => st.receiver.theta = v
    });
    seg(G, { label: 'E-Feld', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showE = !!v });
    seg(G, { label: 'B-Feld', value: opts.showB === false ? 0 : 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showB = !!v });
    seg(G, {
      label: 'Energiefluss S = E × B', value: opts.showS ? 1 : 0,
      options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showS = !!v
    });
    seg(G, {
      label: 'Wellenfronten', value: opts.showFronts ? 1 : 0,
      options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showFronts = !!v
    });
    seg(G, {
      label: 'Nahfeldgrenze r = λ', value: opts.showNear ? 1 : 0,
      options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showNear = !!v
    });
    slider(G, { label: 'Zeitlupe', min: .15, max: 2.5, step: .05, value: .8, fmt: v => num(v, 2) + ' Hz', on: v => st.slow = v });
    const bRow = el('div', 'ctrl');
    const bFit = el('button', 'jump', 'Ansicht einpassen');
    bFit.onclick = () => { st.autoFit = true; V.resetCam(); };
    bRow.append(bFit); G.append(bRow);
    V.onZoom = () => { st.autoFit = false; };

    const RO = readouts(G);
    RO.add('lam', 'Wellenlänge λ');
    RO.add('dip', 'Sendedipol (λ/2)');
    RO.add('rl', 'r / λ');
    RO.add('bereich', 'Bereich');
    RO.add('phase', 'Phasendifferenz E–B');
    RO.add('flux', 'Gleichrichtung des Energieflusses');
    RO.add('term', 'dominierender Term');
    const plots = el('div', 'plots'); G.append(plots);
    const cv1 = el('canvas'), cv2 = el('canvas');
    plots.append(cv1, cv2);
    (opts.notes || []).forEach(n => note(G, n));

    V.draw = dt => {
      const info = renderDipole(V, st, dt);
      drawLamp(V, st, info.res);
      const k = info.k, lam = info.lam;
      const r = st.receiver.r, rl = r / lam;
      const dphi = fieldPhaseDiff(r, k);
      const sint = Math.sin(st.receiver.theta * D2R);
      const dom = termDominance(r, k);
      RO.set('lam', num(lam, 2) + ' m');
      RO.set('dip', num(lam / 2, 2) + ' m');
      RO.set('rl', num(rl, 2));
      RO.set('bereich', rl < 1 ? 'Nahfeld (r < λ)' : 'Fernfeld (r > λ)');
      RO.set('phase', num(dphi, 0) + '°' + (dphi > 60 ? ' → nicht in Phase' : dphi < 15 ? ' → in Phase' : ''));
      RO.set('flux', pct(fluxRatio(r, sint, k)));
      RO.set('term', ['1/r³ (Nahfeld)', '1/r² (Induktion)', '1/r (Fernfeld)'][dom]);
      phasePlot(cv1, st.phase, dphi * D2R);
      phaseDiffPlot(cv2, k, lam, r);
      V.setBadges(['r = ' + num(r, 2) + ' m = ' + num(rl, 2) + ' λ · λ = ' + num(lam, 2) + ' m',
        rl < 1 ? 'noch Nahfeld' : 'Fernfeld: E ⊥ B und in Phase']);
    };
  });
}

/* ==================== 4 · Nahfeld ==================== */
fieldChapter('near', '4 · Nahfeld', {
  r0: 0.20, rMin: 0.08, rMax: 2.0, rStep: 0.01, theta0: 90,
  extFixed: 1.05, showNear: false, showS: true, showFronts: false, showB: false, showEqGrid: true,
  notes: [
    '<b>Nahfeld (r &lt; λ):</b> Unmittelbar am Dipol ist das Feld fast wie das Feld eines <b>ruhenden</b> Dipols – es „klebt“ am Stab. ' +
    'Es überwiegt der Anteil, der mit <b>1/r³</b> abfällt. Der radiale Feldanteil ist hier groß, die Feldpfeile zeigen nach innen/außen statt nur quer.',
    '<b>E und B sind hier nicht in Phase</b> (Phasendifferenz bis 90°, siehe Diagramm rechts). Die Energie <b>pendelt</b> zwischen Dipol und Feld hin und her – ' +
    'der Energiefluss zeigt abwechselnd nach außen und nach innen (grün = nach außen, rosa = nach innen), im Mittel wird <b>keine</b> Leistung abgestrahlt.',
    'Mit wachsendem Abstand geht das Nahfeld stetig in das <b>Fernfeld</b> über; als Faustregel gilt die Grenze bei etwa einer Wellenlänge. ' +
    'Der eigentliche Übergang liegt bei r ≈ λ/2π ≈ 0,16 λ – im Diagramm sieht man, wie die Phasendifferenz dort von 90° auf 0° umschlägt.'
  ]
});

/* ==================== 5 · Fernfeld ==================== */
fieldChapter('far', '5 · Fernfeld', {
  r0: 4.0, rMin: 0.4, rMax: 9, rStep: 0.1, theta0: 90,
  extFixed: 0, showNear: true, showS: true, showFronts: true, showB: true, showEqGrid: false,
  notes: [
    '<b>Fernfeld (r &gt; λ):</b> Hier überwiegt der mit <b>1/r</b> abfallende Anteil – das Feld hat sich vom Dipol <b>gelöst</b> und läuft als ' +
    'elektromagnetische Welle mit Lichtgeschwindigkeit nach außen (Wellenfronten). Die Amplitude nimmt mit 1/r ab, die Leistung mit 1/r².',
    '<b>E ⊥ B und in Phase:</b> Beide erreichen gleichzeitig Maximum und Minimum (Phasendifferenz ≈ 0°, siehe Diagramm). ' +
    'E steht senkrecht zur Ausbreitungsrichtung (transversal), im Bild ist das Feld daher rein quer – kein radialer Anteil mehr.',
    'Der <b>Energiefluss S = E × B</b> zeigt im Fernfeld dauerhaft nach außen (alle Pfeile grün): etwa die Hälfte des momentanen Flusses ist gleichgerichtet, ' +
    'das ist die abgestrahlte Leistung ∝ 1/r².'
  ]
});

/* ==================== 8 · Rechenaufgaben ==================== */
const EX = [
  {
    n: '1', title: 'Wellenlänge berechnen',
    text: 'Ein UKW-Sender sendet mit f = 100 MHz. Berechne die Wellenlänge λ.',
    unit: 'm', answer: 3, tol: 0.02,
    sol: 'λ = c / f = (3,00 · 10⁸ m/s) / (1,00 · 10⁸ Hz) = <b>3,00 m</b>'
  },
  {
    n: '2', title: 'Länge des λ/2-Dipols',
    text: 'Wie lang muss ein λ/2-Dipol für f = 100 MHz sein?',
    unit: 'm', answer: 1.5, tol: 0.02,
    sol: 'λ = 3,00 m → Dipollänge = λ/2 = <b>1,50 m</b> (genau der Dipol in dieser Simulation)'
  },
  {
    n: '3', title: 'Frequenz aus der Wellenlänge',
    text: 'Ein Sender arbeitet mit λ = 0,69 m. Welche Frequenz hat er?',
    unit: 'MHz', answer: 434, tol: 0.03,
    sol: 'f = c / λ = (3,00 · 10⁸ m/s) / 0,69 m = 4,35 · 10⁸ Hz ≈ <b>435 MHz</b>'
  },
  {
    n: '4', title: 'WLAN',
    text: 'WLAN sendet bei f = 2,4 GHz. Wie lang ist die Welle?',
    unit: 'cm', answer: 12.5, tol: 0.03,
    sol: 'λ = c / f = (3,00 · 10⁸) / (2,4 · 10⁹) m = 0,125 m = <b>12,5 cm</b>. Ein λ/2-Dipol wäre nur 6,25 cm lang.'
  },
  {
    n: '5', title: 'Abstandsgesetz',
    text: 'Bei r = 1,0 m zeigt das Lämpchen 100 % Helligkeit. Wie viel Prozent sind es bei r = 4,0 m?',
    unit: '%', answer: 6.25, tol: 0.05,
    sol: 'Die Leistung verteilt sich auf die Kugelfläche 4πr², also P ∝ 1/r². Vierfacher Abstand → 1/4² = 1/16 = <b>6,25 %</b>'
  },
  {
    n: '6', title: 'Polarisation am Gitter',
    text: 'Das Gitter steht unter α = 30° zur Schwingungsebene des E-Feldes. Wie groß ist das Empfangsfeld |E_E,∥| im Verhältnis zu |E_S|?',
    unit: '× E_S', answer: 0.25, tol: 0.03,
    sol: '|E_S,⊥| = |E_S| · sin 30° = 0,50 · |E_S|. Der Empfangsdipol nimmt davon wieder nur sin 30° auf:<br>|E_E,∥| = |E_S| · sin² 30° = 0,25 · |E_S|'
  },
  {
    n: '7', title: 'Gitter halb abdunkeln',
    text: 'Bei welchem Winkel α ist das Empfangsfeld genau halb so groß wie das Maximum?',
    unit: '°', answer: 45, tol: 0.02,
    sol: 'sin² α = 0,5 → sin α = 0,7071 → <b>α = 45°</b>. (Die Helligkeit ∝ |E|² ist dabei nur 25 % des Maximums – im Kapitel 6 nachprüfen!)'
  },
  {
    n: '8', title: 'Ab wann ist es Fernfeld?',
    text: 'Ein Sender strahlt bei f = 150 MHz. Ab welchem Abstand r ist man im Fernfeld (r > λ)?',
    unit: 'm', answer: 2, tol: 0.03,
    sol: 'λ = c / f = (3,00 · 10⁸) / (1,50 · 10⁸) m = 2,00 m → Fernfeld ab <b>r > 2,00 m</b>'
  },
  {
    n: '9', title: 'Leistungsdichte',
    text: 'Ein Sender strahlt P = 10 W gleichmäßig in alle Richtungen ab. Wie groß ist die Leistungsdichte in r = 5,0 m Abstand?',
    unit: 'W/m²', answer: 0.0318, tol: 0.05,
    sol: 'Die Leistung verteilt sich auf die Kugeloberfläche 4πr²:<br>S = P / (4πr²) = 10 W / (4π · 25 m²) = <b>0,032 W/m²</b>'
  }
];

/* ---------- Zeigeraufgabe: drei Zeiger, Gesamtzeiger, Haupt- oder Nebenmaximum ---------- */
function phasorTaskCard(cards) {
  const card = el('div', 'card');
  const h = el('h3'); h.append(el('span', 'n', '10'), el('span', null, 'Zeigeraddition am Dreifachspalt'));
  card.append(h);
  card.append(el('p', null, 'Drei gleich lange Zeiger haben die Phasenwinkel φ₁ = 0°, φ₂ = 180° und φ₃ = 360°. ' +
    'Konstruiere den Gesamtzeiger, lies seine Amplitude ab und entscheide, ob ein Hauptmaximum oder ein Nebenmaximum vorliegt. ' +
    'Die Zeigerlänge eines einzelnen Zeigers ist 1. Diese Aufgabe gehört zu Kapitel 12.'));
  const cv = el('canvas'); cv.className = 'zeiger-task'; card.append(cv);
  const drawRow = el('div', 'exrow');
  const bDraw = el('button', 'ghost', 'Kette und Gesamtzeiger konstruieren');
  drawRow.append(bDraw); card.append(drawRow);

  const ex = el('div', 'ex');
  const inp = el('input');
  inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.placeholder = 'Amplitude';
  ex.append(inp, el('span', 'unit', 'Einheiten eines Zeigers'));
  card.append(ex);

  const typeRow = el('div', 'seg wide');
  const bMain = el('button', null, 'Hauptmaximum');
  const bSide = el('button', null, 'Nebenmaximum');
  typeRow.append(bMain, bSide); card.append(typeRow);
  let type = null;
  bMain.onclick = () => { type = 'main'; bMain.classList.add('on'); bSide.classList.remove('on'); };
  bSide.onclick = () => { type = 'side'; bSide.classList.add('on'); bMain.classList.remove('on'); };

  const row = el('div', 'exrow');
  const ok = el('button', null, 'Prüfen');
  const show = el('button', 'ghost', 'Lösung aufdecken');
  row.append(ok, show); card.append(row);
  const fb = el('div', 'fb'); card.append(fb);
  const sol = el('div', 'sol');
  sol.innerHTML = '<b>Lösung:</b> Die Zeiger werden Kopf an Fuß gelegt. ' +
    'z₁ zeigt nach rechts, z₂ nach links, z₃ wieder nach rechts. ' +
    'Mit den Längen 1 gilt <span class="formula">z₁ + z₂ + z₃ = 1 − 1 + 1 = 1</span>. ' +
    'Die Amplitude ist also <b>1</b> (in Einheiten eines Zeigers). ' +
    'Beim Hauptmaximum würden alle drei Zeiger in dieselbe Richtung zeigen; dann wäre die Amplitude 3. ' +
    'Der Phasenunterschied δ = 180° liegt zwischen den Hauptmaxima bei 0° und 360°, daher ist es ein <b>Nebenmaximum</b>. ' +
    'Die Intensität ist (1/3)² = 1/9 der Intensität des Hauptmaximums.';
  card.append(sol);

  let showChain = false;
  const draw = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth || 320, H = cv.clientHeight || 190;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#0a1020'; c.fillRect(0, 0, W, H);
    const cy = H * 0.52, ox = W * 0.22;
    const sc = Math.min(W * 0.22, 82);
    /* Achsen */
    sLine(c, { x: 16, y: cy }, { x: W - 16, y: cy }, 'rgba(70,90,130,.55)', 1, [4, 5]);
    sLine(c, { x: ox, y: 16 }, { x: ox, y: H - 16 }, 'rgba(70,90,130,.35)', 1, [4, 5]);
    if (!showChain) {
      sArrow(c, { x: ox, y: cy }, { x: ox + sc, y: cy }, 'rgba(255,150,90,.98)', 2.4, 9);
      sText(c, ox + sc + 8, cy - 10, 'z₁', '#ff9a6a', 11, 'left');
      sArrow(c, { x: ox, y: cy }, { x: ox - sc, y: cy }, 'rgba(150,170,220,.95)', 2.4, 9);
      sText(c, ox - sc - 8, cy - 10, 'z₂', 'rgba(170,190,235,.95)', 11, 'right');
      c.save(); c.setLineDash([6, 4]);
      sArrow(c, { x: ox, y: cy + 12 }, { x: ox + sc, y: cy + 12 }, 'rgba(255,213,79,.9)', 2, 8);
      c.restore();
      sText(c, ox + sc + 8, cy + 14, 'z₃ (liegt auf z₁)', '#ffd54f', 10, 'left');
      sText(c, 16, 18, 'drei Zeiger vom Ursprung', 'rgba(180,200,235,.9)', 10, 'left');
    } else {
      const step = sc, rows = [-26, 0, 26];
      const cols = ['rgba(255,150,90,.98)', 'rgba(150,170,220,.95)', 'rgba(255,213,79,.95)'];
      let x = 0;
      for (let i = 0; i < 3; i++) {
        const y = cy + rows[i];
        const x1 = x, x2 = x + (i === 1 ? -step : step);
        sArrow(c, { x: ox + x1, y }, { x: ox + x2, y }, cols[i], 2.2, 8);
        sText(c, ox + (x1 + x2) / 2, y - 9, 'z' + (i + 1), cols[i], 10, 'center');
        if (i < 2) {
          c.save(); c.setLineDash([3, 4]); c.strokeStyle = 'rgba(150,170,210,.55)'; c.lineWidth = 1;
          c.beginPath(); c.moveTo(ox + x2, y); c.lineTo(ox + x2, cy + rows[i + 1]); c.stroke(); c.restore();
        }
        x = x2;
      }
      /* resultierender Zeiger, getrennt unter der Kette */
      const ry = cy + 58;
      sArrow(c, { x: ox, y: ry }, { x: ox + step, y: ry }, 'rgba(255,240,160,.98)', 3, 11);
      sText(c, ox + step / 2, ry + 14, 'A_res = 1', 'rgba(255,240,160,.95)', 10.5, 'center');
      c.save(); c.setLineDash([3, 4]); c.strokeStyle = 'rgba(150,170,210,.45)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(ox + step, cy + rows[2]); c.lineTo(ox + step, ry); c.stroke();
      c.beginPath(); c.moveTo(ox, cy + rows[2]); c.lineTo(ox, ry); c.stroke(); c.restore();
      sText(c, 16, 18, 'Kette: Kopf an Fuß (auseinandergezogen)', 'rgba(180,200,235,.9)', 10, 'left');
    }
    sText(c, W - 16, H - 14, 'z₁ und z₃ zeigen in dieselbe Richtung', 'rgba(150,175,215,.8)', 9, 'right');
  };
  bDraw.onclick = () => { showChain = !showChain; bDraw.textContent = showChain ? 'Zeiger wieder vom Ursprung zeigen' : 'Kette und Gesamtzeiger konstruieren'; draw(); };
  if (window.ResizeObserver) { const ro = new ResizeObserver(draw); ro.observe(cv); }
  window.addEventListener('resize', draw);
  requestAnimationFrame(draw);

  ok.onclick = () => {
    const raw = inp.value.replace(',', '.').replace(/[^0-9.eE+-]/g, '');
    const v = parseFloat(raw);
    if (!isFinite(v)) { fb.className = 'fb err'; fb.textContent = 'Bitte eine Amplitude eingeben.'; return; }
    if (!type) { fb.className = 'fb err'; fb.textContent = 'Bitte Hauptmaximum oder Nebenmaximum auswählen.'; return; }
    const aOk = Math.abs(v - 1) <= 0.05;
    const tOk = type === 'side';
    if (aOk && tOk) { fb.className = 'fb'; fb.textContent = '✔ Richtig: Amplitude 1, Nebenmaximum.'; }
    else if (!aOk && tOk) { fb.className = 'fb err'; fb.textContent = '✘ Die Art stimmt, aber die Amplitude noch nicht. Addiere die drei Zeiger Kopf an Fuß.'; }
    else if (aOk && !tOk) { fb.className = 'fb err'; fb.textContent = '✘ Die Amplitude stimmt, aber die drei Zeiger zeigen nicht alle in dieselbe Richtung. Vergleiche mit dem Hauptmaximum.'; }
    else { fb.className = 'fb err'; fb.textContent = '✘ Noch nicht richtig. Tipp: z₂ zeigt genau entgegen z₁ und z₃.'; }
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') ok.click(); });
  show.onclick = () => {
    sol.classList.toggle('on');
    show.textContent = sol.classList.contains('on') ? 'Lösung verbergen' : 'Lösung aufdecken';
  };
  cards.append(card);
}

addView('ex', '8 · Rechenaufgaben', V => {
  V.stage.remove();
  V.panel.classList.add('full');
  const cards = el('div', 'cards'); V.panel.append(cards);
  const intro = el('div', 'note');
  intro.innerHTML = '<b>Rechenaufgaben.</b> Wert eintragen (Komma oder Punkt) und prüfen – oder den Lösungsweg aufklappen. ' +
    'Alle Aufgaben lassen sich in den Kapiteln 3, 5 und 6 der Simulation nachprüfen. c = 3,00 · 10⁸ m/s.';
  cards.append(intro);

  EX.forEach(t => {
    const card = el('div', 'card');
    const h = el('h3'); h.append(el('span', 'n', t.n), el('span', null, t.title));
    card.append(h, el('p', null, t.text));
    const row = el('div', 'ex');
    const inp = el('input');
    inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'; inp.placeholder = 'Wert';
    row.append(inp, el('span', 'unit', t.unit));
    card.append(row);
    const fb = el('div', 'fb');
    const sol = el('div', 'sol'); sol.innerHTML = '<b>Lösungsweg:</b> ' + t.sol;
    const brow = el('div', 'exrow');
    const ok = el('button', null, 'Prüfen');
    const show = el('button', 'ghost', 'Lösungsweg zeigen');
    brow.append(ok, show);
    card.append(brow, fb, sol);

    const check = () => {
      const raw = inp.value.replace(',', '.').replace(/[^0-9.eE+-]/g, '');
      const v = parseFloat(raw);
      if (!isFinite(v)) { fb.className = 'fb err'; fb.textContent = 'Bitte einen Zahlenwert eingeben.'; return; }
      const rel = Math.abs(v - t.answer) / Math.abs(t.answer);
      if (rel <= t.tol) { fb.className = 'fb'; fb.innerHTML = '✔ Richtig – ' + t.answer + ' ' + t.unit; }
      else { fb.className = 'fb err'; fb.innerHTML = '✘ Noch nicht richtig. Tipp: erst Formel umstellen, dann einsetzen.'; }
    };
    ok.onclick = check;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    show.onclick = () => { sol.classList.toggle('on'); show.textContent = sol.classList.contains('on') ? 'Lösungsweg verbergen' : 'Lösungsweg zeigen'; };
    cards.append(card);
  });
  phasorTaskCard(cards);
});
