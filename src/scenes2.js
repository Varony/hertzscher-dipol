/* =========================================================================
   Teil 3: Ansichten – Schwingkreis, Felder, Senden/Empfangen,
           Polarisation, Versuch, Formeln
   ========================================================================= */
const R2D = 180 / Math.PI;

/* ==================== 1 · Schwingkreis → Dipol ==================== */
function lcPath(g, s) {
  const R = 0.52, d0 = 0.155;
  const a0 = Math.PI / 2 + d0, a1 = Math.PI / 2 - d0 + TAU;
  const ang = lerp(a0, a1, s);
  const p0x = R * Math.cos(ang), p0y = R * Math.sin(ang);
  const p1x = -1 + 2 * s, p1y = 0;
  return [lerp(p0x, p1x, g), lerp(p0y, p1y, g)];
}

addView('lc', '1 · Schwingkreis → Dipol', V => {
  const st = { g: 0, gt: 0, ph: 0 };
  /* ---- Modell: Schwingkreis  L₀ = 100 µH, C₀ = 1 nF  →  f₀ = 503 kHz
     Aufbiegen (Platten) senkt C, Abwickeln (Windungen) senkt L;
     Endzustand  L = 0,633 µH, C = 4 pF  →  f = 1/(2π√(L·C)) = 100 MHz (λ = 3 m) ---- */
  const Lstart = 100e-6, Cstart = 1e-9, Lend = 0.633e-6, Cend = 4e-12;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const sC = g => clamp(0.58 * ss(0, 0.42, g) + 0.42 * ss(0.62, 1, g), 0, 1);
  const sL = g => clamp(0.10 * ss(0, 0.34, g) + 0.84 * ss(0.30, 0.78, g) + 0.06 * ss(0.72, 1, g), 0, 1);
  const Cof = g => Cstart * Math.pow(Cend / Cstart, sC(g));
  const Lof = g => Lstart * Math.pow(Lend / Lstart, sL(g));
  const fOf = g => 1 / (TAU * Math.sqrt(Lof(g) * Cof(g)));
  const posOfF = f => {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (fOf(m) < f) lo = m; else hi = m; }
    return (lo + hi) / 2;
  };
  const fc = (x, u) => x >= 1e6 ? num(x / 1e6, 2) + ' MHz' : x >= 1e3 ? num(x / 1e3, 1) + ' kHz' : num(x, 0) + ' Hz';
  const G = grid(V.panel);
  const sG = slider(G, {
    label: 'Frequenz f vorgeben', min: 0, max: 1, step: 0.005, value: 0,
    entry: {
      toPhys: g => fOf(g), toPos: f => posOfF(f),
      display: g => fc(fOf(g)), parse: parseHz
    },
    on: v => { st.gt = v; }
  });
  seg(G, {
    label: 'Schritte', value: 'g0', options: [
      { v: 'g0', label: '① Schwingkreis' },
      { v: 'g1', label: '② Aufbiegen' },
      { v: 'g2', label: '③ Abwickeln' },
      { v: 'g3', label: '④ Dipol' }],
    on: v => {
      const m = { g0: 0, g1: .45, g2: .78, g3: 1 };
      sG.set(m[v]); st.gt = m[v];
    }
  });
  const RO = readouts(G);
  RO.add('f', 'Frequenz');
  RO.add('lam', 'Wellenlänge λ');
  RO.add('l', 'Induktivität L');
  RO.add('c', 'Kapazität C');
  RO.add('r', 'λ : Antennenlänge (1,5 m)');
  note(G, 'In jedem Schritt steigt die Frequenz: <b>Plattenabstand größer, Fläche kleiner, Windungszahl geringer</b> → L und C sinken, und f = 1/(2π√(L·C)) steigt. ' +
    'Achte darauf, wie die Werte mitlaufen: C sinkt vor allem beim <b>Aufbiegen</b> (Platten) und beim <b>Verkleinern</b>, L vor allem beim <b>Abwickeln</b> (Windungen). ' +
    'Die Frequenz kannst du auch direkt in das Feld eintippen – der Schwingkreis stellt sich dann passend ein (z. B. <b>100 MHz</b>).');
  note(G, 'Erst wenn die Antenne die Größenordnung der Wellenlänge erreicht (λ ≈ Meter), wird merklich Leistung abgestrahlt – ein kompakter Schwingkreis strahlt praktisch nichts ab.');
  note(G, '<b>Merke:</b> Der hertzsche Dipol ist ein gerades Drahtstück, das wie ein Schwingkreis mit sehr kleiner Induktivität und sehr kleiner Kapazität wirkt. Ladungen schwingen im Stab hin und her.');

  V.draw = dt => {
    st.g = lerp(st.g, st.gt, Math.min(1, dt * 9));
    const g = st.g;
    st.ph += TAU * (0.22 + 1.0 * g) * dt;
    const c = V.ctx, W = V.W, H = V.H;
    c.clearRect(0, 0, W, H); bg(V);
    const S = Math.min(W / 2.9, H / 2.15), cx = W / 2, cy = H * 0.47;
    const X = x => cx + x * S, Y = y => cy - y * S;
    const N = 150;

    const base = [];
    for (let i = 0; i <= N; i++) base.push(lcPath(g, i / N));
    const coilA = 0.115 * Math.pow(1 - g, 0.55);
    const coilW = 0.15 + 0.11 * g;                 // Wickelbereich dehnt sich aus
    const coilN = 6 * Math.pow(1 - g, 1.15);       // Windungszahl sinkt beim Abwickeln
    const path = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N, p = base[i];
      const p1 = base[Math.min(N, i + 1)], p0 = base[Math.max(0, i - 1)];
      let tx = p1[0] - p0[0], ty = p1[1] - p0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      let off = 0, offA = 0;
      if (coilN > 0.02 && s > 0.5 - coilW && s < 0.5 + coilW) {
        const th = (s - (0.5 - coilW)) / (2 * coilW) * TAU * coilN;
        off = coilA * Math.cos(th);
        offA = coilA * 0.7 * Math.sin(th);
      }
      path.push([p[0] - ty * off + tx * offA, p[1] + tx * off + ty * offA]);
    }
    c.save();
    c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 12; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); path.forEach((p, i) => i ? c.lineTo(X(p[0]), Y(p[1])) : c.moveTo(X(p[0]), Y(p[1]))); c.stroke();
    c.restore();
    const rho = s => -Math.cos(Math.PI * s) * Math.cos(st.ph);
    const curr = s => ((1 - g) + g * Math.sin(Math.PI * s)) * Math.sin(st.ph);
    for (let i = 0; i < N; i++) {
      const q = rho((i + .5) / N), a = Math.abs(q);
      const col = rgba(mixc(COOL, WARM, q > 0 ? 1 : 0), 0.16 + 0.8 * a);
      const p = path[i], q2 = path[i + 1];
      sLine(c, { x: X(p[0]), y: Y(p[1]) }, { x: X(q2[0]), y: Y(q2[1]) }, col, 4.4);
    }
    for (let i = 4; i < N - 3; i += 9) {
      const i0 = curr(i / N);
      if (Math.abs(i0) < .16) continue;
      const p = path[i], p1 = path[i + 1];
      const dx = (p1[0] - p[0]) * S, dy = -(p1[1] - p[1]) * S;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L * Math.sign(i0), uy = dy / L * Math.sign(i0);
      const len = 7 + 13 * Math.abs(i0);
      sArrow(c, { x: X(p[0]) - ux * len / 2, y: Y(p[1]) - uy * len / 2 },
        { x: X(p[0]) + ux * len / 2, y: Y(p[1]) + uy * len / 2 },
        'rgba(255,235,185,' + (.35 + .6 * Math.abs(i0)) + ')', 1.9, 7);
    }
    const pw = 0.34 * Math.pow(Math.max(0, 1 - g * 1.12), 0.8);
    if (pw > 0.012) {
      [0, 1].forEach(e => {
        const i = e ? N : 0, j = e ? N - 1 : 1;
        let tx = path[i][0] - path[j][0], ty = path[i][1] - path[j][1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const nx = -ty, ny = tx, p = path[i];
        sLine(c, { x: X(p[0] + nx * pw), y: Y(p[1] + ny * pw) }, { x: X(p[0] - nx * pw), y: Y(p[1] - ny * pw) }, '#dfe8fa', 5.5);
        const qs = rho(e ? 1 : 0);
        const col = rgba(mixc(COOL, WARM, qs > 0 ? 1 : 0), .35 + .65 * Math.abs(qs));
        sLine(c, { x: X(p[0] + nx * pw), y: Y(p[1] + ny * pw) }, { x: X(p[0] - nx * pw), y: Y(p[1] - ny * pw) }, col, 3);
        sText(c, X(p[0] + nx * (pw + .09)), Y(p[1] + ny * (pw + .09)), qs > 0 ? '+' : '–', col, 20);
      });
      sText(c, X(path[0][0] - 0.34), Y(path[0][1] + 0.10), 'Kondensator C', 'rgba(200,215,245,.8)', 11.5, 'right');
    }
    if (coilA > 0.01) {
      const p = path[Math.round(N * .5)];
      sText(c, X(p[0]), Y(p[1] - 0.44), 'Spule L', 'rgba(200,215,245,.8)', 11.5);
    }
    if (g > 0.6) sText(c, X(0), Y(-0.34), 'Dipol', 'rgba(255,205,120,' + num((g - .6) / .4 * 9, 2) + ')', 13.5);
    if (g > 0.5) {
      const op = (g - .5) * 2;
      sText(c, X(-1.10), Y(-0.02), 'Drahtende 1', 'rgba(150,170,205,' + (0.7 * op) + ')', 10.5, 'right');
      sText(c, X(1.10), Y(-0.02), 'Drahtende 2', 'rgba(150,170,205,' + (0.7 * op) + ')', 10.5, 'left');
    }

    const f = fOf(g);
    const lam = C0 / f;
    const Ln = Lof(g), Cn = Cof(g);
    RO.set('f', fc(f));
    RO.set('lam', lam > 999 ? num(lam / 1000, 2) + ' km' : num(lam, 2) + ' m');
    RO.set('l', Ln >= 1e-6 ? num(Ln * 1e6, Ln * 1e6 < 10 ? 3 : 1) + ' µH' : num(Ln * 1e9, 0) + ' nH');
    RO.set('c', Cn >= 1e-9 ? num(Cn * 1e9, 3) + ' nF' : num(Cn * 1e12, Cn * 1e12 < 10 ? 2 : 1) + ' pF');
    RO.set('r', num(lam / 1.5, lam < 10 ? 1 : 0) + ' : 1');
    const lcRel = (Math.log10(Ln * Cn) - Math.log10(Lstart * Cstart)) / (Math.log10(Lend * Cend) - Math.log10(Lstart * Cstart));
    const bar = (x, y, w, h, v, col, lab) => {
      if (lab) sText(c, x, y + h / 2, lab, '#8fb6e8', 11, 'left');
      x += 42;
      c.fillStyle = 'rgba(34,48,78,.95)'; c.fillRect(x, y, w, h);
      c.fillStyle = col; c.fillRect(x, y, Math.max(2, w * clamp(v, 0, 1)), h);
    };
    const bw = Math.min(W * 0.26, 190);
    const bx0 = W - bw - 54;
    sText(c, bx0, 14, 'log-Skala', '#61708f', 10, 'left');
    bar(bx0, 24, bw, 9, g, '#ffb74d', 'f');
    bar(bx0, 46, bw, 9, 1 - g, '#4fc3f7', 'λ');
    bar(bx0, 68, bw, 9, lcRel, '#7c5cff', 'C·L');
    V.setBadges(['Schwingkreis: Energie pendelt zwischen E-Feld (C) und B-Feld (L)',
      'Regler ziehen = aufbiegen/abwickeln · Frequenz direkt eintippen (z. B. 100 MHz)']);
  };
});

/* ==================== 2 · Felder & Abstrahlung ==================== */
addView('field', '2 · Felder & Abstrahlung', V => {
  V.cam.yaw = -0.38; V.cam.pitch = 0.17;
  V.homeCam = { yaw: -0.38, pitch: 0.17, dist: 8 };
  const st = {
    f: F0, slow: .85, cut: 'vertical', showE: true, showB: true, showNear: true,
    showDonut: false, showCharges: true, phase: 0, autoFit: true, receiver: null,
    gridOn: false, gridA: 45, showFieldArrows: false, showGenerator: true,
    showScale: true, extRange: [2.4, 3.8]
  };
  const G = grid(V.panel);
  slider(G, {
    label: 'Frequenz des Senders', min: 60, max: 200, step: 1, value: 100,
    entry: { unit: 'MHz', scale: 1e6, dec: 0 },
    fmt: v => num(v, 0) + ' MHz', on: v => st.f = v * 1e6
  });
  V.onZoom = () => { st.autoFit = false; };
  slider(G, { label: 'Zeitlupe (Wellen pro Sekunde)', min: .15, max: 2.5, step: .05, value: .85, fmt: v => num(v, 2) + ' Hz', on: v => st.slow = v });
  seg(G, {
    label: 'Schnitt', value: 'vertical',
    options: [{ v: 'vertical', label: 'vertikal (E in der Ebene)' }, { v: 'horizontal', label: 'horizontal (Draufsicht)' }],
    on: v => { st.cut = v; V.cam.pitch = v === 'horizontal' ? 0.62 : 0.17; }
  });
  seg(G, { label: 'E-Feld', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showE = !!v });
  seg(G, { label: 'B-Feld', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showB = !!v });
  seg(G, { label: 'Abstrahlkeule (3D)', value: 0, options: [{ v: 0, label: 'aus' }, { v: 1, label: 'an' }], on: v => st.showDonut = !!v });
  seg(G, { label: 'Ladungen & Strom im Dipol', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showCharges = !!v });
  const bRow = el('div', 'ctrl');
  const bFit = el('button', 'jump', 'Ansicht einpassen');
  bFit.onclick = () => { st.autoFit = true; V.resetCam(); };
  bRow.append(bFit); G.append(bRow);
  const plotsF = el('div', 'plots'); G.append(plotsF);
  const cvPh = el('canvas'); plotsF.append(cvPh);
  const RO = readouts(G);
  RO.add('lam', 'Wellenlänge λ = c/f');
  RO.add('dl', 'Dipollänge');
  RO.add('nf', 'Nahfeld');
  RO.add('axis', 'in Richtung der Dipolachse');
  note(G, '<b>E ⊥ B, in Phase:</b> Im Fernfeld stehen die E- und B-Pfeile an jedem Ort senkrecht aufeinander und erreichen gleichzeitig Maximum und Minimum. ' +
    'Die Amplituden nehmen mit dem Abstand ab; in Richtung der Dipolachse wird <b>keine</b> Energie abgestrahlt. ' +
    '<b>Der Dipol ist ein λ/2-Resonator:</b> Bei höherer Frequenz (kleineres λ) muss er kürzer sein – die Länge ändert sich also mit dem Regler mit (Maßstab links unten).');
  note(G, '<b>Speisung:</b> Der Hochfrequenzgenerator speist den Dipol <b>in der Mitte</b> – an der Stelle, an der die beiden Dipolhälften mit kleinem Spalt aneinandergrenzen. ' +
    'Die beiden Hälften sind die „Platten“ des aufgebogenen Kondensators: Die Ladungen sammeln sich an den <b>äußeren Enden</b> (in der Mitte ist die Ladung null, dort ist der Strom maximal).');
  note(G, 'Die Darstellung läuft in <b>Zeitlupe</b>: Die Wellenlänge (Farbe/Muster) ist maßstäblich richtig, die Ausbreitung wäre real ~10⁸-mal schneller. ' +
    'Die <b>Pfeillängen</b> sind logarithmisch skaliert, damit Nah- und Fernfeld gleichzeitig sichtbar bleiben – die echte Abnahme geht mit 1/r.');

  V.draw = dt => {
    const info = renderDipole(V, st, dt);
    const lam = info.lam;
    drawLamp(V, st, info.res);
    RO.set('lam', num(lam, 2) + ' m');
    RO.set('dl', num(lam / 2, 2) + ' m   (λ/2 – folgt der Frequenz)');
    RO.set('nf', 'r < ' + num(lam, 2) + ' m');
    RO.set('axis', 'sin θ = 0 → kein Signal');
    phasePlot(cvPh, st.phase);
    V.setBadges(['f = ' + hzStr(st.f) + ' · λ = ' + num(lam, 2) + ' m · Nahfeld r < λ',
      'Ziehen = drehen · zwei Finger = zoomen']);
  };
});

/* ==================== 3 · Senden & Empfangen ==================== */
const recvView = addView('recv', '3 · Senden & Empfangen', V => {
  V.cam.yaw = 0.62; V.cam.pitch = 0.24;
  V.homeCam = { yaw: 0.62, pitch: 0.24, dist: 8 };
  const st = {
    f: F0, slow: .8, cut: 'vertical', showE: true, showB: false, showNear: true,
    showDonut: false, showCharges: true, showFieldArrows: true, phase: 0, autoFit: true, showGenerator: true,
    showScale: true,
    receiver: { r: 2.0, theta: 90, phi: 35, beta: 0, mode: 'dipol', gamma: 0 },
    gridOn: false, gridA: 45
  };
  const G = grid(V.panel);
  const H = {};
  V.onZoom = () => { st.autoFit = false; };
  H.f = slider(G, {
    label: 'Frequenz des Senders', min: 60, max: 200, step: 1, value: 100,
    entry: { unit: 'MHz', scale: 1e6, dec: 0 },
    fmt: v => num(v, 0) + ' MHz', on: v => st.f = v * 1e6
  });
  H.r = slider(G, { label: 'Abstand r', min: .3, max: 6, step: .05, value: 2, fmt: v => num(v, 2) + ' m', on: v => st.receiver.r = v });
  H.theta = slider(G, { label: 'Höhenwinkel θ (0° = Dipolachse)', min: 0, max: 90, step: 1, value: 90, fmt: v => num(v, 0) + '°', on: v => st.receiver.theta = v });
  H.phi = slider(G, { label: 'Richtung φ rund um den Dipol', min: 0, max: 360, step: 1, value: 35, fmt: v => num(v, 0) + '°', on: v => st.receiver.phi = v });
  H.beta = slider(G, { label: 'Ausrichtung Empfangsdipol β (0° = parallel zum E-Feld)', min: 0, max: 90, step: 1, value: 0, fmt: v => num(v, 0) + '°', on: v => st.receiver.beta = v });
  H.gamma = slider(G, { label: 'Ausrichtung Schleifenebene γ', min: 0, max: 90, step: 1, value: 0, fmt: v => num(v, 0) + '°', on: v => st.receiver.gamma = v });
  H.gamma.el.style.display = 'none';

  H.mode = seg(G, {
    label: 'Empfänger', value: 'dipol',
    options: [{ v: 'dipol', label: 'Dipol + Lämpchen' }, { v: 'loop', label: 'Induktionsschleife' }],
    on: v => { st.receiver.mode = v; H.gamma.el.style.display = v === 'loop' ? '' : 'none'; H.beta.el.style.display = v === 'loop' ? 'none' : ''; }
  });
  H.grid = seg(G, {
    label: 'Metallgitter dazwischen', value: 0, options: [{ v: 0, label: 'aus' }, { v: 1, label: 'an' }],
    on: v => { st.gridOn = !!v; H.gridA.el.style.display = v ? '' : 'none'; }
  });
  H.gridA = slider(G, { label: 'Gitterwinkel α (Stäbe gegenüber E)', min: 0, max: 90, step: 1, value: 45, fmt: v => num(v, 0) + '°', on: v => st.gridA = v });
  H.gridA.el.style.display = 'none';
  seg(G, { label: 'Schnitt', value: 'vertical', options: [{ v: 'vertical', label: 'vertikal' }, { v: 'horizontal', label: 'horizontal' }], on: v => { st.cut = v; V.cam.pitch = v === 'horizontal' ? 0.62 : 0.24; } });
  seg(G, { label: 'E-Feld zeigen', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showE = !!v });
  seg(G, { label: 'B-Feld zeigen', value: 0, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showB = !!v });
  seg(G, { label: 'Feldpfeile am Empfänger', value: 1, options: [{ v: 1, label: 'an' }, { v: 0, label: 'aus' }], on: v => st.showFieldArrows = !!v });
  slider(G, { label: 'Zeitlupe', min: .15, max: 2.5, step: .05, value: .8, fmt: v => num(v, 2) + ' Hz', on: v => st.slow = v });
  const bRow = el('div', 'ctrl');
  const bFit = el('button', 'jump', 'Ansicht einpassen');
  bFit.onclick = () => { st.autoFit = true; V.resetCam(); };
  bRow.append(bFit); G.append(bRow);

  const RO = readouts(G);
  RO.add('lam', 'Wellenlänge λ');
  RO.add('dip', 'Sendedipol (λ/2)');
  RO.add('hell', 'Helligkeit des Lämpchens', 'warm');
  RO.add('amp', 'Feldamplitude |E| am Empfänger', 'warm');
  RO.add('geo', 'geometrische Faktoren', 'cool');
  RO.add('lamp', 'Lämpchen');
  const plots = el('div', 'plots'); G.append(plots);
  const cv1 = el('canvas'), cv2 = el('canvas'), cv3 = el('canvas');
  plots.append(cv1, cv2, cv3);
  note(G, '<b>Speisung:</b> Der Sender wird <b>in der Mitte</b> gespeist (Spalt zwischen den Dipolhälften). Die Ladungen sitzen an den äußeren Enden und wechseln periodisch ihr Vorzeichen – genau das erzeugt das sich ändernde Feld.');
  note(G, '<b>Vier Beobachtungen (Versuch V1):</b> ① Der Empfang hängt vom Abstand ab (∝ 1/r²). ② In der Ebene senkrecht zum Dipol ist die Abstrahlung radialsymmetrisch. ' +
    '③ In Richtung der Dipolachse wird keine Energie abgestrahlt. ④ Der Empfang hängt vom Winkel zwischen Sende- und Empfangsdipol ab.');
  note(G, '<b>Polarisation am Gitter:</b> <span class="formula">|E_S,⊥| = |E_S|·sin α</span> und der Empfangsdipol registriert ' +
    '<span class="formula">|E_E,∥| = |E_S|·sin² α</span>. Das Lämpchen zeigt die <b>Leistung</b> ∝ |E|².');
  V.setBadges(['Ziehen = drehen · zwei Finger = zoomen']);

  V.applyPreset = p => {
    if (p.r != null) H.r.set(p.r, true);
    if (p.theta != null) H.theta.set(p.theta, true);
    if (p.phi != null) H.phi.set(p.phi, true);
    if (p.beta != null) H.beta.set(p.beta, true);
    if (p.gamma != null) H.gamma.set(p.gamma, true);
    if (p.mode) {
      H.mode.set(p.mode); st.receiver.mode = p.mode;
      H.gamma.el.style.display = p.mode === 'loop' ? '' : 'none';
      H.beta.el.style.display = p.mode === 'loop' ? 'none' : '';
    }
    if (p.grid != null) { H.grid.set(p.grid); st.gridOn = !!p.grid; H.gridA.el.style.display = p.grid ? '' : 'none'; }
    if (p.gridA != null) H.gridA.set(p.gridA, true);
    if (p.showB != null) st.showB = p.showB;
    if (p.showE != null) st.showE = p.showE;
    if (p.showDonut != null) st.showDonut = p.showDonut;
    st.autoFit = true;
    V.resize();
  };

  V.draw = dt => {
    const info = renderDipole(V, st, dt);
    const res = info.res, k = info.k;
    drawLamp(V, st, res);
    if (!res) return;
    const P = res.P;
    RO.set('lam', num(info.lam, 2) + ' m');
    RO.set('dip', num(info.lam / 2, 2) + ' m');
    RO.set('hell', pct(P));
    RO.set('amp', num(res.amp, 3) + ' · E₀');
    RO.set('geo', 'sin θ = ' + num(res.sint, 2) + ' · ' +
      (st.gridOn ? 'sin²α = ' + num(Math.sin(st.gridA * D2R) ** 2, 2) : 'cos β = ' + num(Math.abs(Math.cos(st.receiver.beta * D2R)), 2)));
    RO.set('lamp', P > .02 ? 'leuchtet' : 'dunkel');
    let mx = 1e-9;
    for (let i = 0; i <= 90; i += 2) mx = Math.max(mx, ampFrom(st, k, st.receiver.r, i, st.receiver.beta, st.gridOn, st.gridA));
    polarPlot(cv1, {
      fn: a => {
        const u = ((a % TAU) + TAU) % TAU;
        const th = (u > Math.PI ? TAU - u : u) * R2D;
        return ampFrom(st, k, st.receiver.r, th, st.receiver.beta, st.gridOn, st.gridA) / mx;
      },
      markerAngle: st.receiver.theta * D2R,
      top: 'Richtcharakteristik (θ)', lab: 'θ von der Dipolachse', color: '#ffb74d'
    });
    curvePlot(cv2, {
      fn: u => ampFrom(st, k, lerp(.3, 6, u), st.receiver.theta, st.receiver.beta, st.gridOn, st.gridA) ** 2,
      marker: (st.receiver.r - .3) / 5.7,
      top: 'Helligkeit ↔ Abstand r', xlab: '0,3 m … 6 m', ylab: 'P', color: '#ffd54f'
    });
    phasePlot(cv3, st.phase);
  };
});

/* ==================== 4 · Polarisation (3D) ==================== */
addView('pol', '6 · Polarisation', V => {
  V.cam.yaw = 1.02; V.cam.pitch = 0.26;
  V.homeCam = { yaw: 1.02, pitch: 0.26, dist: 9 };
  const st = { a: 45, mode: 'em', ph: 0, autoFit: true };
  const G = grid(V.panel);
  const sA = slider(G, {
    label: 'Gitterwinkel α (Stäbe gegenüber dem E-Feld)', min: 0, max: 90, step: 1, value: 45,
    fmt: v => num(v, 0) + '°', on: v => st.a = v
  });
  seg(G, {
    label: 'Darstellung', value: 'em',
    options: [{ v: 'em', label: 'E-Welle am Gitter (3D)' }, { v: 'rope', label: 'Seilwellen-Analogie' }],
    on: v => st.mode = v
  });
  const RO = readouts(G);
  RO.add('perp', 'durchgelassen: |E_S,⊥| = |E_S|·sin α', 'warm');
  RO.add('par', 'Empfangsfeld: |E_E,∥| = |E_S|·sin² α', 'warm');
  RO.add('hell', 'Lämpchen: Leistung ∝ |E|²');
  note(G, '<b>Deutung (V1e):</b> Die Stäbe sind <b>parallel</b> zur Schwingungsebene des E-Feldes: Die Welle verschiebt Ladungen in den Stäben (sie werden selbst zu kleinen Sendedipolen) und die Energie wird absorbiert. ' +
    'Stehen die Stäbe <b>senkrecht</b> zum E-Feld, können sie keine Energie aufnehmen → das Feld geht durch. Es wird auf die Richtung senkrecht zu den Stäben „gedreht“ (polarisiert).');
  note(G, '<b>Achtung beim Seil-Vergleich:</b> Beim Seil stehen die Spaltbacken <b>rechtwinklig</b> zur Schwingungsebene, damit die Welle durchkommt – bei der elektromagnetischen Welle müssen die E-Pfeile <b>parallel</b> zu den Gitterstäben liegen, damit die Welle <b>nicht</b> durchkommt.');
  note(G, '<b>Bedienung:</b> Gitter mit dem <b>Regler</b> oder am <b>Drehgriff</b> direkt am Gitter drehen (Finger auf den blauen Punkt setzen und kreisen). ' +
    'Auf der übrigen Fläche ziehen = Ansicht drehen, zwei Finger = zoomen – wie in den Kapiteln 2 und 3.');
  V.setBadges(['α = 45°', '|E_E,∥| = |E_S| · sin² α']);

  /* ---- Drehgriff am Gitter: ziehen dreht α ---- */
  const drawKnob = hp => {
    const c = V.ctx;
    c.save();
    c.beginPath(); c.arc(hp.x, hp.y, 16, 0, TAU); c.fillStyle = 'rgba(79,195,247,.18)'; c.fill();
    c.beginPath(); c.arc(hp.x, hp.y, 10, 0, TAU); c.fillStyle = '#4fc3f7'; c.fill();
    c.strokeStyle = '#eaf7ff'; c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(8,16,30,.9)'; c.lineWidth = 1.8; c.lineCap = 'round';
    c.beginPath(); c.arc(hp.x, hp.y, 4.6, -0.5, 3.3); c.stroke();
    c.beginPath(); c.moveTo(hp.x + 3.6, hp.y + 3.4); c.lineTo(hp.x + 5.4, hp.y + 0.7); c.stroke();
    c.restore();
  };
  let handleDown = false;
  const HIT_R = 48;                      // Trefferradius des Drehgriffs (Touch)
  const handleAlpha = (px, py) => {
    const o = V._handleOrigin;
    if (!o) return st.a;
    let vx = px - o.x, vy = py - o.y;
    const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
    if (st.mode === 'rope' || !V._F) return clamp(Math.atan2(vx, -vy) * R2D, 0, 90);
    let best = st.a, bd = -2;
    for (let t = 0; t <= 90; t++) {
      const A = t * D2R;
      const p = V.proj([0, 0.6 * Math.cos(A), 0.6 * Math.sin(A)]);
      let tx = p.x - o.x, ty = p.y - o.y;
      const tl = Math.hypot(tx, ty) || 1;
      const d = (tx * vx + ty * vy) / tl;
      if (d > bd) { bd = d; best = t; }
    }
    return best;
  };
  V.canvas.addEventListener('pointerdown', e => {
    const h = V._handlePos;
    if (!h) return;
    const r = V.canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (Math.hypot(x - h.x, y - h.y) < HIT_R) {
      handleDown = true; V._handleDrag = true;
      st.a = handleAlpha(x, y); sA.set(st.a);
    }
  });
  V.canvas.addEventListener('pointermove', e => {
    if (!handleDown) return;
    const r = V.canvas.getBoundingClientRect();
    st.a = handleAlpha(e.clientX - r.left, e.clientY - r.top);
    sA.set(st.a);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t =>
    V.canvas.addEventListener(t, () => { handleDown = false; V._handleDrag = false; }));
  V.onDrag = () => V._handleDrag === true;
  V.onZoom = () => { st.autoFit = false; };

  V.draw = dt => {
    st.ph += TAU * 0.45 * dt;
    const c = V.ctx, W = V.W, H = V.H;
    c.clearRect(0, 0, W, H); bg(V);
    const a = st.a * D2R, sino = Math.sin(a), cosa = Math.cos(a);
    const lampP = Math.pow(sino * sino, 2);
    RO.set('perp', num(sino, 3) + ' · E_S');
    RO.set('par', num(sino * sino, 3) + ' · E_S');
    RO.set('hell', st.mode === 'em' ? pct(lampP) : pct(cosa * cosa));
  V.setBadges(['α = ' + num(st.a, 0) + '°', '|E_E,∥| = |E_S| · sin² α',
    st.mode === 'em' ? 'Blauen Griff am Gitter ziehen = Gitter drehen' : 'Griff am Spalt ziehen = Spalt drehen']);

    /* ---------------- Seilwellen-Analogie (2D) ---------------- */
    if (st.mode === 'rope') {
      const S = Math.min(W / 2.75, H / 2.25), cx = W / 2, cy = H / 2;
      const X = x => cx + x * S, Y = y => cy - y * S;
      const bar = [sino, cosa], per = [cosa, -sino];
      const P = (x, y) => ({ x: X(x), y: Y(y) });
      const y0 = .08;
      const rope = (fromX, toX, amp) => {
        c.beginPath();
        for (let i = 0; i <= 120; i++) {
          const x = lerp(fromX, toX, i / 120);
          const y = y0 + amp * Math.sin(st.ph * 2 - x * 3.6);
          i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y));
        }
        c.strokeStyle = '#ffd9a8'; c.lineWidth = 3.4; c.lineCap = 'round'; c.stroke();
      };
      rope(-1.3, -0.07, 0.32);
      rope(0.07, 1.3, 0.32 * Math.abs(cosa));
      [-1, 1].forEach(sg => {
        const off = [per[0] * 0.06 * sg, per[1] * 0.06 * sg];
        sLine(c, P(off[0] + bar[0] * .40, y0 + off[1] + bar[1] * .40), P(off[0] - bar[0] * .40, y0 + off[1] - bar[1] * .40), '#cdd9f0', 6);
      });
      sText(c, X(0), Y(y0 + .62), 'Spalt', '#cfe3ff', 12);
      sText(c, X(-1.15), Y(y0 - .55), 'Schwingungsebene der Welle: senkrecht', '#ff8f6a', 11.5);
      sText(c, X(.85), Y(y0 - .55), 'Amplitude ∝ |cos α|', '#ffd9a8', 11.5);
      const g2 = Math.pow(Math.abs(cosa), 1.2);
      if (g2 > .02) sGlow(c, X(1.08), Y(y0), 16 + 36 * g2, 'rgba(255,205,80,A)', Math.min(1, .3 + g2));
      c.beginPath(); c.arc(X(1.08), Y(y0), 7, 0, TAU);
      c.fillStyle = rgba(mixc([70, 70, 80], LAMPC, g2), 1); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.stroke();
      /* Drehgriff am Spalt */
      V._handleOrigin = { x: X(0), y: Y(y0) };
      V._handlePos = { x: X(0.62 * bar[0]), y: Y(y0 + 0.62 * bar[1]), z: 1 };
      sLine(c, { x: X(0), y: Y(y0) }, { x: V._handlePos.x, y: V._handlePos.y }, 'rgba(120,200,255,.4)', 1.2, [3, 4]);
      drawKnob(V._handlePos);
      return;
    }

    /* ---------------- 3D: E-Welle am Gitter ---------------- */
    if (st.autoFit) V.cam.dist = lerp(V.cam.dist, V.needDist(1.65), 0.09);
    V.begin();
    const kw = TAU / 1.7;
    const xs = -1.55, xr = 1.45, HalfR = 0.52, Gap = 0.055;
    const qt = Math.cos(st.ph);                      // Ladungsvorzeichen der oberen Hälfte
    const Eph = x => -Math.cos(st.ph - kw * (x - xs));
    const bt = [0, cosa, sino];                      // Stabrichtung des Gitters
    const ct = [0, -sino, cosa];                     // senkrecht dazu
    const ut = [0, sino, -cosa];                     // Richtung des durchgelassenen E-Feldes

    /* Achse */
    P3(V, [xs, 0, 0], [xr + 0.25, 0, 0], 'rgba(90,110,150,.45)', 1, [4, 5]);
    /* E-Feldpfeile vor und nach dem Gitter */
    const tipsB = [], tipsA = [];
    for (let x = xs + 0.26; x <= xr + 0.2; x += 0.185) {
      if (Math.abs(x) < 0.15) continue;
      const trans = x < 0 ? 1 : sino;
      const e = Eph(x) * trans;
      const dir = x < 0 ? [0, 1, 0] : ut;
      const tip = [x, dir[1] * e * 0.34, dir[2] * e * 0.34];
      A3(V, [x, 0, 0], tip, rgba(mixc(COOL, WARM, e > 0 ? 1 : 0), .9), 1.7, 8);
      (x < 0 ? tipsB : tipsA).push(tip);
    }
    SEG3(V, tipsB, 'rgba(255,150,100,.45)', 1.3);
    SEG3(V, tipsA, 'rgba(255,205,130,.55)', 1.3);

    /* Sender */
    [[-HalfR, -Gap], [Gap, HalfR]].forEach(([u, v]) => {
      P3(V, [xs, u, 0], [xs, v, 0], 'rgba(120,140,175,.3)', 9);
      P3(V, [xs, u, 0], [xs, v, 0], '#c9d6ef', 3.4);
    });
    const hx = 0.07;
    SEG3(V, [[xs - hx, -hx, 0], [xs + hx, -hx, 0], [xs + hx, hx, 0], [xs - hx, hx, 0], [xs - hx, -hx, 0]], 'rgba(190,205,235,.8)', 1.4);
    [[HalfR, qt], [-HalfR, -qt]].forEach(([yy, q]) => {
      const A = V.proj([xs, yy, 0]); if (A.z < 0.06) return;
      const rq = Math.abs(q);
      V.push(A.z, () => {
        c.save();
        c.fillStyle = rgba(mixc(COOL, WARM, q > 0 ? 1 : 0), .3 + .65 * rq);
        c.beginPath(); c.arc(A.x, A.y, 4 + 9 * rq, 0, TAU); c.fill();
        if (rq > 0.12) {
          c.fillStyle = '#08101f'; c.font = 'bold 15px system-ui';
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(q > 0 ? '+' : '–', A.x, A.y);
        }
        c.restore();
      });
    });
    T3(V, [xs, HalfR + 0.24, 0], 'Sendedipol', 'rgba(220,230,255,.9)', 12);
    T3(V, [xs, -HalfR - 0.26, 0], 'HF-Generator', 'rgba(150,175,215,.85)', 10.5);

    /* Gitter */
    const S = 0.48;
    const cor = [
      v3.add(v3.mul(bt, -S), v3.mul(ct, -S)), v3.add(v3.mul(bt, S), v3.mul(ct, -S)),
      v3.add(v3.mul(bt, S), v3.mul(ct, S)), v3.add(v3.mul(bt, -S), v3.mul(ct, S))
    ];
    SEG3(V, [cor[0], cor[1], cor[2], cor[3], cor[0]], 'rgba(150,170,205,.7)', 1.6);
    for (let u = -0.9; u <= 0.91; u += 0.15) {
      const o = v3.mul(ct, u * S);
      P3(V, v3.add(o, v3.mul(bt, S)), v3.add(o, v3.mul(bt, -S)), 'rgba(200,215,240,.85)', 1.4);
    }
    /* Winkel α */
    const arc = [];
    for (let i = 0; i <= 24; i++) { const t = i / 24 * a; arc.push([0, 0.30 * Math.cos(t), 0.30 * Math.sin(t)]); }
    SEG3(V, arc, 'rgba(120,200,255,.8)', 1.5);
    P3(V, [0, 0, 0], [0, 0.46, 0], 'rgba(120,200,255,.35)', 1, [3, 4]);
    T3(V, [0, 0.42 * Math.cos(a / 2), 0.42 * Math.sin(a / 2)], 'α', '#8fd6ff', 13);
    T3(V, [0, -S - 0.22, 0], 'Gitter', 'rgba(220,230,255,.9)', 12);

    /* Drehgriff am Gitter */
    const knob = [0, 0.62 * cosa, 0.62 * sino];
    V._handleOrigin = V.proj([0, 0, 0]);
    V._handlePos = V.proj(knob);
    P3(V, [0, 0.30 * cosa, 0.30 * sino], knob, 'rgba(120,200,255,.4)', 1.2, [3, 4]);

    /* Zerlegung des E-Feldes am Gitter */
    const e0 = Eph(0);
    const mag = 0.42 + 0.40 * Math.abs(e0);
    const Ev = [0, (e0 >= 0 ? 1 : -1) * mag, 0];
    const parV = v3.mul(bt, v3.dot(Ev, bt));
    const perV = v3.sub(Ev, parV);
    A3(V, [0, 0, 0], Ev, 'rgba(233,238,251,.9)', 2.2, 9);
    A3(V, [0, 0, 0], parV, 'rgba(255,110,110,.6)', 2, 8);
    A3(V, [0, 0, 0], perV, 'rgba(255,180,80,.95)', 2.4, 10);
    T3(V, Ev, 'E_S', '#e9eefb', 12, -9);
    T3(V, perV, 'E⊥', '#ffb74d', 12, 13);
    T3(V, parV, 'E∥', 'rgba(255,150,150,.95)', 12, -10);

    /* Empfänger */
    [[-0.38, -0.035], [0.035, 0.38]].forEach(([u, v]) => {
      P3(V, [xr, u, 0], [xr, v, 0], 'rgba(120,140,175,.3)', 9);
      P3(V, [xr, u, 0], [xr, v, 0], '#c9d6ef', 3.4);
    });
    T3(V, [xr, 0.62, 0], 'Empfangsdipol', 'rgba(220,230,255,.9)', 12);
    const eR = Eph(xr) * sino;
    const tipE = [xr, ut[1] * eR * 0.40, ut[2] * eR * 0.40];
    A3(V, [xr, 0, 0], tipE, 'rgba(255,180,80,.95)', 2.2, 9);
    A3(V, [xr, 0, 0], [xr, tipE[1], 0], 'rgba(255,213,79,.95)', 2.4, 9);
    T3(V, [xr + 0.30, 0.34, 0], 'E⊥', '#ffb74d', 11.5, 0, 'left');
    T3(V, [xr - 0.06, -0.30, 0], 'E_E,∥', '#ffd54f', 11.5, 0, 'right');
    V.flush();

    /* Lämpchen */
    const A2 = V.proj([xr, 0, 0]);
    if (A2.z > 0.06) {
      const g2 = Math.pow(clamp(lampP, 0, 1), .34);
      if (g2 > .02) sGlow(c, A2.x, A2.y, 16 + 44 * g2, 'rgba(255,205,80,A)', Math.min(1, .3 + g2));
      c.beginPath(); c.arc(A2.x, A2.y, 7, 0, TAU);
      c.fillStyle = rgba(mixc([70, 70, 80], LAMPC, g2), 1); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.2; c.stroke();
    }
    if (V._handlePos && V._handlePos.z > 0.06) drawKnob(V._handlePos);
  };
});

/* ==================== 5 · Versuch V1 mit Aufgaben ==================== */
function taskCard(container, o) {
  const card = el('div', 'card');
  const h = el('h3'); h.append(el('span', 'n', o.n), el('span', null, o.title));
  card.append(h);
  if (o.text) card.append(el('p', null, o.text));
  const ans = el('div', 'ans'), fb = el('div', 'fb');
  let done = false;
  o.options.forEach((t, i) => {
    const b = el('button', null, t);
    b.onclick = () => {
      if (done) return; done = true;
      [...ans.children].forEach((x, j) => {
        if (j === o.correct) x.classList.add('ok');
        else if (j === i) x.classList.add('bad');
        x.disabled = true;
      });
      fb.textContent = o.feedback;
      if (i !== o.correct) fb.className = 'fb err';
      if (o.preset) {
        const jb = el('button', 'jump', '▶ In der Simulation zeigen');
        jb.onclick = () => { recvView.applyPreset(o.preset); showView(recvView); };
        card.append(jb);
      }
    };
    ans.append(b);
  });
  card.append(ans, fb);
  container.append(card);
}

addView('test', '7 · Versuch V1', V => {
  V.stage.remove();
  const cards = el('div', 'cards'); V.panel.append(cards);
  V.panel.classList.add('full');
  cards.append((() => { const d = el('div', 'note'); d.innerHTML = '<b>Versuch V1 – Abstrahlcharakteristik.</b> Sendedipol am Hochfrequenzgenerator, Empfangsdipol mit Glühlämpchen. Die Helligkeit des Lämpchens ist ein Maß für die Empfangsstärke. <b>Erst überlegen, dann antworten – und anschließend in der Simulation nachstellen.</b>'; return d; })());

  taskCard(cards, {
    n: 'a', title: 'Abstand vergrößern',
    text: 'Sender und Empfänger sind parallel ausgerichtet. Der Empfänger wird weiter vom Sender entfernt. Was passiert mit der Helligkeit des Lämpchens?',
    options: ['Sie bleibt gleich.', 'Sie nimmt stark ab, die Leistung etwa ∝ 1/r².', 'Sie nimmt nur ganz wenig ab.', 'Sie wird heller.'],
    correct: 1,
    feedback: 'Richtig: Die abgestrahlte Energie verteilt sich auf eine immer größere Fläche. In großer Entfernung leuchtet das Lämpchen nicht mehr.',
    preset: { r: 3.6, theta: 90, beta: 0, grid: 0 }
  });
  taskCard(cards, {
    n: 'b', title: 'Richtung in der Äquatorebene',
    text: 'Der Empfänger wird im gleichen Abstand in verschiedene Richtungen um den Sender herum gehalten (immer in der Ebene senkrecht zum Sendedipol, immer parallel ausgerichtet).',
    options: ['Jede Richtung liefert das gleiche Ergebnis (radialsymmetrisch).', 'Nur nach Norden.', 'Gegenüber vom Sender ist es heller.', 'Es gibt zwei Vorzugsrichtungen.'],
    correct: 0,
    feedback: 'Richtig: In der Ebene rechtwinklig zum Sendedipol ist die Abstrahlung radialsymmetrisch – im gleichen Abstand liefert jede Richtung das gleiche Ergebnis.',
    preset: { r: 2.0, theta: 90, phi: 120, beta: 0, grid: 0 }
  });
  taskCard(cards, {
    n: 'c', title: 'In Richtung der Dipolachse',
    text: 'Der Empfänger wird in gleicher Entfernung über (bzw. unter) den Sender gehalten – also in Richtung der Dipolachse.',
    options: ['Das Lämpchen leuchtet besonders hell.', 'Es leuchtet wie in der Äquatorebene.', 'Es leuchtet praktisch nicht.', 'Es leuchtet nur bei 45°.'],
    correct: 2,
    feedback: 'Richtig: In Richtung der Dipolachse wird keine Energie abgestrahlt (Faktor sin θ → 0).',
    preset: { r: 2.0, theta: 0, phi: 35, beta: 0, grid: 0 }
  });
  taskCard(cards, {
    n: 'd', title: 'Empfänger drehen',
    text: 'Der Empfänger bleibt an der gleichen Stelle, wird aber um 90° gedreht – er steht also senkrecht zum Sendedipol.',
    options: ['Kein Signal (Lämpchen dunkel).', 'Maximales Signal.', 'Signal halb so groß.', 'Frequenz verdoppelt sich.'],
    correct: 0,
    feedback: 'Richtig: Der Empfangsdipol nimmt nur die Komponente des E-Feldes auf, die in seine Richtung zeigt (cos β → 0 bei 90°).',
    preset: { r: 2.0, theta: 90, beta: 90, grid: 0 }
  });
  taskCard(cards, {
    n: 'e', title: 'Metallgitter dazwischen',
    text: 'Ein Gitter mit parallelen Metallstäben wird zwischen Sender und Empfänger gestellt und gedreht. Wann ist der Empfang maximal?',
    options: ['Wenn die Stäbe parallel zur Schwingungsebene des E-Feldes stehen.', 'Wenn die Stäbe senkrecht zur Schwingungsebene des E-Feldes stehen.', 'Immer gleich.', 'Wenn die Stäbe um 45° gedreht sind.'],
    correct: 1,
    feedback: 'Richtig: Stehen die Stäbe parallel zum E-Feld, werden sie selbst zu Schwingungen angeregt und absorbieren die Energie. Senkrecht dazu können sie keine Energie aufnehmen – das Lämpchen leuchtet hell.',
    preset: { r: 2.0, theta: 90, beta: 0, grid: 1, gridA: 0 }
  });
  taskCard(cards, {
    n: 'f', title: 'Zusatz: Induktionsschleife',
    text: 'Statt des Empfangsdipols wird eine Induktionsschleife mit Lämpchen in die Nähe des Senders gehalten. Was beobachtet man?',
    options: ['Nichts, eine Schleife kann keine Wellen empfangen.', 'Das Lämpchen leuchtet – Beweis für ein sich änderndes Magnetfeld.', 'Das Lämpchen leuchtet nur, wenn man die Schleife heizt.', 'Das Lämpchen leuchtet, weil sich Ladungen im Draht verschieben.'],
    correct: 1,
    feedback: 'Richtig: Das leuchtende Lämpchen zeigt ein sich änderndes Magnetfeld am Ort der Schleife (Induktionsgesetz) – der Beweis für die magnetische Komponente der Welle.',
    preset: { mode: 'loop', r: 1.5, theta: 90, gamma: 0, grid: 0 }
  });
});

/* ==================== 6 · Formeln & Merksätze ==================== */
addView('calc', '9 · Formeln', V => {
  const st = { v: 47 };
  const G = grid(V.panel);
  const sF = slider(G, {
    label: 'Frequenz f (log)', min: 0, max: 100, step: 1, value: 47,
    entry: {
      toPhys: v => 30e6 * Math.pow(100, v / 100),
      toPos: f => 100 * Math.log(f / 30e6) / Math.log(100),
      display: v => hzStr(30e6 * Math.pow(100, v / 100)),
      parse: parseHz
    },
    fmt: v => hzStr(30e6 * Math.pow(100, v / 100)),
    on: v => st.v = v
  });
  const RO = readouts(G);
  RO.add('f', 'Frequenz f');
  RO.add('lam', 'Wellenlänge λ = c / f');
  RO.add('h', 'Resonanzdipol λ/2');
  RO.add('v', 'λ/4 (Monopol)');
  note(G, '<span class="formula">c = λ · f</span> &nbsp;→&nbsp; <span class="formula">λ = c / f</span> &nbsp; mit c = 3,00·10⁸ m/s. ' +
    'Beispiel: UKW-Sender 100 MHz → λ = 3,00 m. Ein λ/2-Dipol ist damit 1,50 m lang.');
  note(G, '<b>Merksätze</b><br>• E- und B-Pfeil stehen an jedem Ort im rechten Winkel und schwingen im Fernfeld <b>in Phase</b>.<br>' +
    '• Die Empfangsstärke hängt von <b>Abstand</b>, <b>Richtung</b> und <b>Winkel</b> zwischen Sende- und Empfangsdipol ab.<br>' +
    '• In Richtung der Dipolachse wird <b>keine Energie</b> abgestrahlt – in der Äquatorebene ist die Abstrahlung radialsymmetrisch.<br>' +
    '• Elektromagnetische Wellen sind <b>transversal</b> und lassen sich <b>linear polarisieren</b>: Die Schwingungsebene des E-Feldes liegt durch die Ausrichtung des Sendedipols fest.');
  const tb = el('div', 'note');
  tb.innerHTML = '<table class="cmp"><tr><th></th><th>Senden</th><th>Empfangen</th></tr>' +
    '<tr><td>Ursache</td><td>erzwungene Schwingung der Ladungen im Stab</td><td>das ankommende E-Feld verschiebt die Ladungen</td></tr>' +
    '<tr><td>Nachweis</td><td>Induktionsschleife (B), Empfangsdipol (E)</td><td>Glühlämpchen: Helligkeit ∝ Leistung</td></tr>' +
    '<tr><td>Abhängigkeit</td><td>f, Dipollänge ≈ λ/2</td><td>Abstand (1/r²), θ (sin²θ), Winkel (cos²β), Polarisation</td></tr></table>';
  G.append(tb);

  V.draw = () => {
    const c = V.ctx, W = V.W, H = V.H;
    c.clearRect(0, 0, W, H); bg(V);
    const f = 30e6 * Math.pow(100, st.v / 100);
    const lam = C0 / f;
    const L = 50, R = W - 20, T = H * 0.35;
    /* log-Skala 1 cm … 10 km */
    const lo = Math.log10(0.01), hi = Math.log10(10000);
    const X = d => L + (Math.log10(d) - lo) / (hi - lo) * (R - L);
    c.strokeStyle = '#22304e'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(L, T); c.lineTo(R, T); c.stroke();
    for (let p = -2; p <= 4; p++) {
      const x = X(Math.pow(10, p));
      c.beginPath(); c.moveTo(x, T - 6); c.lineTo(x, T + 6); c.stroke();
      sText(c, x, T + 20, p === -2 ? '1 cm' : p === 0 ? '1 m' : p === 3 ? '1 km' : (p < 0 ? '0,1 m' : Math.pow(10, p) + ' m'), '#61708f', 10);
    }
    /* Marken */
    const marks = [[0.15, 'Smartphone'], [1.5, 'λ/2-Dipol'], [3, 'UKW λ'], [300, 'Langwelle λ']];
    marks.forEach(([d, t], i) => {
      const x = X(d);
      c.strokeStyle = 'rgba(120,150,200,.5)'; c.beginPath(); c.moveTo(x, T - 4); c.lineTo(x, T - 10 - i * 15); c.stroke();
      sText(c, x, T - 18 - i * 15, t, 'rgba(150,175,215,.85)', 9.5);
    });
    /* λ-Balken */
    const bw = Math.max(2, X(lam) - L);
    const g = c.createLinearGradient(L, 0, X(lam), 0);
    g.addColorStop(0, '#2b7fb8'); g.addColorStop(1, '#4fc3f7');
    c.fillStyle = g; c.fillRect(L, T + 34, bw, 12);
    sText(c, L, T + 62, 'λ = ' + (lam >= 1000 ? num(lam / 1000, 2) + ' km' : lam >= 1 ? num(lam, 2) + ' m' : num(lam * 100, 1) + ' cm'), '#4fc3f7', 13, 'left');
    const bw2 = Math.max(2, X(lam / 2) - L);
    c.fillStyle = '#ffb74d'; c.fillRect(L, T + 82, bw2, 12);
    sText(c, L, T + 110, 'λ/2 = ' + (lam / 2 >= 1000 ? num(lam / 2000, 2) + ' km' : lam / 2 >= 1 ? num(lam / 2, 2) + ' m' : num(lam * 50, 1) + ' cm'), '#ffb74d', 13, 'left');
    sText(c, W - 16, 20, 'c = λ · f', '#ffd9a8', 15, 'right');
    sText(c, W - 16, 40, 'λ = c / f   mit c = 3,00 · 10⁸ m/s', '#8fb6e8', 11, 'right');
    RO.set('f', hzStr(f));
    RO.set('lam', lam >= 1000 ? num(lam / 1000, 3) + ' km' : num(lam, 2) + ' m');
    RO.set('h', lam / 2 >= 1000 ? num(lam / 2000, 3) + ' km' : num(lam / 2, 2) + ' m');
    RO.set('v', lam / 4 >= 1000 ? num(lam / 4000, 3) + ' km' : num(lam / 4, 2) + ' m');
    V.setBadges(['Wellenlänge und Antennenlänge im Vergleich']);
  };
});

/* ==================== Start (siehe boot.js) ==================== */
