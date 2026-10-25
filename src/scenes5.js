/* =========================================================================
   Teil 6: Lernpfad und Probeklausur
   ========================================================================= */

/* ==================== 0 · Lernpfad ==================== */
const LEARN_KEY = 'physik131_lernpfad_v1';
const LEARN_MODULES = [
  {
    title: 'Die elektromagnetische Welle',
    time: 'ca. 45 min',
    desc: 'Vom Schwingkreis über Felder und Nah-/Fernfeld bis zu Maxwell und Thomson.',
    items: [
      { id: 'lc', n: '1', title: 'Schwingkreis → Dipol', goal: 'Aus L und C die Frequenz berechnen und die Dipollänge begründen.' },
      { id: 'field', n: '2', title: 'Felder & Abstrahlung', goal: 'E und B im Fernfeld beschreiben, Abstrahlung und Polarisation erklären.' },
      { id: 'near', n: '3', title: 'Nahfeld', goal: '1/r³, Phasenverschiebung und pendelnden Energiefluss deuten.' },
      { id: 'far', n: '4', title: 'Fernfeld', goal: '1/r, Wellenfronten und Energiefluss nach außen erklären.' },
      { id: 'pol', n: '5', title: 'Polarisation', goal: 'Polarisation am Gitter mit sin²α berechnen und deuten.' },
      { id: 'maxwell', n: '6', title: 'Maxwell', goal: 'Die vier Aussagen und die Kausalkette E → B → Welle erklären.' },
      { id: 'thomson', n: '7', title: 'Thomson', goal: 'Thomson-Gleichung, λ/2-Resonanz und beschleunigte Ladungen verbinden.' }
    ]
  },
  {
    title: 'Senden, Empfangen und Versuch',
    time: 'ca. 25 min',
    desc: 'Die Anwendung am Dipol: Abstand, Richtung, Ausrichtung und der Versuch V1.',
    items: [
      { id: 'recv', n: '8', title: 'Senden & Empfangen', goal: 'Empfang in Abhängigkeit von Abstand, Richtung und Ausrichtung erklären.' },
      { id: 'test', n: '9', title: 'Versuch V1', goal: 'Die sechs Beobachtungen a bis f den physikalischen Aussagen zuordnen.' }
    ]
  },
  {
    title: 'Interferenz und Zeiger',
    time: 'ca. 35 min',
    desc: 'Doppelspalt, Einzelspalt, Gitter und die Zeigerdarstellung als gemeinsames Werkzeug.',
    items: [
      { id: 'interf', n: '10', title: 'Interferenz', goal: 'Doppel- und Einzelspalt mit Gangunterschied, Kleinwinkel und Schirmmuster berechnen.' },
      { id: 'zeiger', n: '11', title: 'Zeiger & Gitter', goal: 'Zeiger addieren, Haupt- und Nebenmaxima bestimmen, Gitter deuten.' }
    ]
  },
  {
    title: 'Röntgenstrahlung und Bragg',
    time: 'ca. 30 min',
    desc: 'Entstehung der Röntgenstrahlung, Grenzwellenlänge und Interferenz an Netzebenen.',
    items: [
      { id: 'roentgen', n: '12', title: 'Röntgen', goal: 'Röhre, Brems- und charakteristische Strahlung, λmin und ALARA erklären.' },
      { id: 'bragg', n: '13', title: 'Bragg', goal: 'Die Bragg-Bedingung k·λ = 2·d·sin θ anwenden.' }
    ]
  },
  {
    title: 'Formeln, Aufgaben und Prüfung',
    time: 'ca. 90 min',
    desc: 'Erst nachschlagen, dann rechnen, dann unter Prüfungsbedingungen schreiben.',
    items: [
      { id: 'calc', n: '14', title: 'Formeln', goal: 'Formeln und Konstanten sicher umstellen.' },
      { id: 'ex', n: '15', title: 'Rechenaufgaben', goal: 'Gemischte Aufgaben mit Formel, Einheit und Kontrolle lösen.' },
      { id: 'klausur', n: '16', title: 'Probeklausur', goal: '60 Minuten, 40 BE, drei Aufgaben unter Prüfungsbedingungen bearbeiten.' }
    ]
  }
];

addView('start', '0 · Lernpfad', V => {
  V.stage.remove();
  V.panel.classList.add('full');
  const cards = el('div', 'cards');
  V.panel.append(cards);

  const hero = el('div', 'learn-hero');
  hero.innerHTML = '<div class="learn-kicker">Physik 13.1 · Klausurvorbereitung</div>' +
    '<h2>Vom Dipol bis zur Bragg-Reflexion</h2>' +
    '<p>Arbeite die fünf Module in der Reihenfolge durch. Jedes Kapitel hat ein klares Ziel, ' +
    'die Rechenaufgaben prüfen die Formeln und die Probeklausur simuliert die Prüfung mit 60 Minuten und 40 BE.</p>';
  cards.append(hero);

  const meta = el('div', 'learn-meta');
  meta.innerHTML = '<span class="learn-pill">60 Minuten</span>' +
    '<span class="learn-pill">40 BE</span>' +
    '<span class="learn-pill">3 Aufgaben</span>' +
    '<span class="learn-pill">Aufgabe 1: 14 BE</span>' +
    '<span class="learn-pill">Aufgabe 2: 15 BE</span>' +
    '<span class="learn-pill">Aufgabe 3: 11 BE</span>';
  cards.append(meta);

  const prog = el('div', 'card learn-progress');
  prog.innerHTML = '<div class="learn-progress-top"><b>Lernstand</b><span>0 von 16</span></div>' +
    '<div class="learn-bar"><i></i></div>' +
    '<div class="learn-hint">Häkchen werden lokal im Browser gespeichert. Du kannst jederzeit weitermachen.</div>';
  cards.append(prog);
  const bar = prog.querySelector('.learn-bar i');
  const status = prog.querySelector('.learn-progress-top span');

  const valid = new Set(LEARN_MODULES.flatMap(m => m.items.map(it => it.id)));
  let done = new Set();
  try {
    const raw = JSON.parse(localStorage.getItem(LEARN_KEY) || '[]');
    done = new Set(raw.filter(id => valid.has(id)));
  } catch (_) { done = new Set(); }
  const boxes = [];
  const update = () => {
    const n = done.size, total = valid.size;
    bar.style.width = (total ? n / total * 100 : 0) + '%';
    status.textContent = n + ' von ' + total;
  };
  const save = () => {
    try { localStorage.setItem(LEARN_KEY, JSON.stringify([...done])); } catch (_) { }
    update();
  };

  LEARN_MODULES.forEach((mod, mi) => {
    const box = el('div', 'card learn-module');
    const head = el('div', 'learn-module-head');
    head.innerHTML = '<div><div class="learn-kicker">Modul ' + (mi + 1) + '</div><h3>' + mod.title + '</h3></div>' +
      '<span class="learn-time">' + mod.time + '</span>';
    box.append(head);
    box.append(el('p', 'learn-desc', mod.desc));
    mod.items.forEach(it => {
      const row = el('div', 'learn-row');
      const cb = el('input');
      cb.type = 'checkbox'; cb.className = 'learn-check'; cb.checked = done.has(it.id);
      cb.addEventListener('change', () => {
        if (cb.checked) done.add(it.id); else done.delete(it.id);
        save();
      });
      boxes.push({ cb, id: it.id });
      const main = el('div', 'learn-main');
      main.innerHTML = '<div class="learn-title"><span class="learn-num">' + it.n + '</span>' + it.title + '</div>' +
        '<div class="learn-goal">' + it.goal + '</div>';
      const btn = el('button', 'jump learn-open', 'Öffnen');
      btn.onclick = () => {
        const v = views.find(x => x.id === it.id);
        if (v) showView(v);
      };
      row.append(cb, main, btn);
      box.append(row);
    });
    cards.append(box);
  });

  const refresh = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(LEARN_KEY) || '[]');
      done = new Set(raw.filter(id => valid.has(id)));
    } catch (_) { done = new Set(); }
    boxes.forEach(b => { b.cb.checked = done.has(b.id); });
    update();
  };
  V.onShow = refresh;

  const actions = el('div', 'learn-actions');
  const bExam = el('button', 'jump', 'Probeklausur starten');
  bExam.onclick = () => {
    const v = views.find(x => x.id === 'klausur');
    if (v) showView(v);
  };
  const bForm = el('button', 'jump', 'Formeln öffnen');
  bForm.onclick = () => {
    const v = views.find(x => x.id === 'calc');
    if (v) showView(v);
  };
  const bReset = el('button', 'jump ghost', 'Lernstand zurücksetzen');
  bReset.onclick = () => {
    done.clear();
    boxes.forEach(b => { b.cb.checked = false; });
    save();
  };
  actions.append(bExam, bForm, bReset);
  cards.append(actions);

  const foot = el('div', 'note');
  foot.innerHTML = '<b>Prüfungsformat:</b> 60 Minuten, 40 BE, drei Aufgaben. ' +
    'Aufgabe 1 prüft Dipol, Schwingkreis und Maxwell, Aufgabe 2 Doppelspalt, Einzelspalt und Zeiger, ' +
    'Aufgabe 3 Röntgenstrahlung und Bragg. Die vollständige schriftliche Fassung liegt in ' +
    '<span class="formula">Physik/pruefungen/2026-10-25_klausur-13-1_klausur.md</span>.';
  cards.append(foot);

  update();
});

/* ==================== 16 · Probeklausur ==================== */
const EXAM_TASKS = [
  {
    title: 'Aufgabe 1 · Dipol und Schwingkreis',
    points: 14,
    links: [['lc', '1 · Schwingkreis → Dipol'], ['maxwell', '6 · Maxwell'], ['thomson', '7 · Thomson']],
    html: '<p>Ein hertzscher Dipol wird von einem Schwingkreis mit der Induktivität ' +
      '<span class="formula">L = 2,0 µH</span> und der Kapazität <span class="formula">C = 1,0 pF</span> gespeist.</p>' +
      '<table class="cmp"><tr><th>Teil</th><th>Aufgabe</th><th>BE</th></tr>' +
      '<tr><td>a</td><td>Frequenz mit der Thomson-Gleichung berechnen</td><td>3</td></tr>' +
      '<tr><td>b</td><td>Wellenlänge und optimale Dipollänge berechnen</td><td>3</td></tr>' +
      '<tr><td>c</td><td>Resonanzbedingung des Dipols begründen</td><td>2</td></tr>' +
      '<tr><td>d</td><td>Maxwell-Aussagen zuordnen</td><td>4</td></tr>' +
      '<tr><td>e</td><td>Elektromagnetische Welle skizzieren</td><td>2</td></tr></table>' +
      '<p><b>a)</b> Berechnen Sie die Frequenz f des Schwingkreises mit der Thomson-Gleichung.</p>' +
      '<p><b>b)</b> Berechnen Sie die Wellenlänge λ und die optimale Dipollänge l = λ/2.</p>' +
      '<p><b>c)</b> Begründen Sie, warum ein Dipol für eine gegebene Frequenz etwa eine halbe Wellenlänge lang sein muss.</p>' +
      '<p><b>d)</b> Ordnen Sie die vier Maxwell-Aussagen den Situationen A bis D zu. Jede Aussage wird genau einmal verwendet.</p>' +
      '<p><b>Maxwell-Aussagen:</b></p><ol>' +
      '<li>Ladungen sind die Quellen und Senken des elektrischen Feldes.</li>' +
      '<li>Es gibt keine magnetischen Monopole.</li>' +
      '<li>Ein sich änderndes Magnetfeld erzeugt ein elektrisches Feld.</li>' +
      '<li>Ein Strom oder ein sich änderndes elektrisches Feld erzeugt ein magnetisches Feld.</li></ol>' +
      '<p><b>Situationen:</b></p><ul>' +
      '<li><b>A.</b> Die magnetischen Feldlinien eines Stabmagneten sind in sich geschlossen und haben keinen Anfang und kein Ende.</li>' +
      '<li><b>B.</b> Die elektrischen Feldlinien einer positiven Punktladung beginnen an der Ladung und verlaufen nach außen.</li>' +
      '<li><b>C.</b> In einer Leiterschleife entsteht ein elektrisches Feld, wenn sich das Magnetfeld durch die Schleife ändert.</li>' +
      '<li><b>D.</b> Zwischen den Platten eines sich aufladenden Kondensators entsteht ein ringförmiges Magnetfeld, obwohl dort keine Ladungen fließen.</li></ul>' +
      '<p><b>e)</b> Skizzieren Sie eine elektromagnetische Welle im Fernfeld. Zeichnen Sie E, B und die Ausbreitungsrichtung ein. ' +
      'Erläutern Sie in einem Satz, wie E und B zueinander schwingen.</p>',
    sol: '<p><b>a)</b> <span class="formula">f = 1/(2π√(L·C))</span>. Mit ' +
      '<span class="formula">L·C = 2,0·10⁻¹⁸ s²</span> und <span class="formula">√(L·C) = 1,414·10⁻⁹ s</span> folgt ' +
      '<span class="formula">f = 1/(2π·1,414·10⁻⁹ s) ≈ 1,13·10⁸ Hz</span>. Also <b>f ≈ 113 MHz</b>.</p>' +
      '<p><b>b)</b> <span class="formula">λ = c/f = (3,00·10⁸ m/s)/(1,13·10⁸ Hz) ≈ 2,66 m</span>. ' +
      'Die optimale Dipollänge ist <span class="formula">l = λ/2 ≈ 1,33 m</span>.</p>' +
      '<p><b>c)</b> Auf dem Dipol bildet sich eine stehende Welle. Bei der Grundschwingung liegt an beiden Enden ein Bauch ' +
      'und in der Mitte ein Knoten. Damit passt genau eine halbe Wellenlänge auf den Dipol: <span class="formula">l = λ/2</span>. ' +
      'Die ankommende Schwingung wird resonant verstärkt.</p>' +
      '<p><b>d)</b> 1-B, 2-A, 3-C, 4-D. Je richtige Zuordnung 1 BE.</p>' +
      '<p><b>e)</b> Die Welle läuft zum Beispiel in x-Richtung. E schwingt senkrecht dazu, B senkrecht zu E und senkrecht zur ' +
      'Ausbreitungsrichtung. Im Fernfeld schwingen E und B in Phase und stehen an jedem Ort senkrecht aufeinander.</p>'
  },
  {
    title: 'Aufgabe 2 · Doppelspalt, Einzelspalt und Zeiger',
    points: 15,
    links: [['interf', '10 · Interferenz'], ['zeiger', '11 · Zeiger & Gitter']],
    html: '<p>Ein Doppelspalt mit dem Spaltmittenabstand <span class="formula">g = 0,25 mm</span> wird mit Laserlicht beleuchtet. ' +
      'Auf einem Schirm im Abstand <span class="formula">l = 2,40 m</span> haben benachbarte Maxima den Abstand ' +
      '<span class="formula">Δa = 6,1 mm</span>.</p>' +
      '<table class="cmp"><tr><th>Teil</th><th>Aufgabe</th><th>BE</th></tr>' +
      '<tr><td>a</td><td>Wellenlänge aus Δa, g und l berechnen</td><td>3</td></tr>' +
      '<tr><td>b</td><td>Lage des Maximums 3. Ordnung berechnen</td><td>2</td></tr>' +
      '<tr><td>c</td><td>Erstes Minimum des Einzelspalts berechnen</td><td>3</td></tr>' +
      '<tr><td>d</td><td>Bedingungen für Maxima und Minima gegenüberstellen</td><td>4</td></tr>' +
      '<tr><td>e</td><td>Zeigerdiagramme für Haupt- und Nebenmaximum zeichnen</td><td>3</td></tr></table>' +
      '<p><b>a)</b> Leiten Sie mit der Kleinwinkelnaherung den Zusammenhang zwischen Δa, g, l und λ her und berechnen Sie λ.</p>' +
      '<p><b>b)</b> Berechnen Sie die Entfernung des Maximums 3. Ordnung von der optischen Achse.</p>' +
      '<p><b>c)</b> Der Doppelspalt hat die Spaltbreite <span class="formula">b = 0,080 mm</span>. ' +
      'Berechnen Sie den Winkel und die Entfernung des ersten Einzelspalt-Minimums von der optischen Achse.</p>' +
      '<p><b>d)</b> Stellen Sie die Bedingungen für Maxima und Minima am Doppelspalt und am Einzelspalt gegenüber. ' +
      'Gehen Sie auf die Ordnung k und die Rolle von g bzw. b ein.</p>' +
      '<table class="cmp"><tr><th></th><th>Doppelspalt</th><th>Einzelspalt</th></tr>' +
      '<tr><td>Gangunterschied</td><td></td><td></td></tr>' +
      '<tr><td>Maximum k-ter Ordnung</td><td></td><td></td></tr>' +
      '<tr><td>Minimum k-ter Ordnung</td><td></td><td></td></tr>' +
      '<tr><td>Einfluss</td><td></td><td></td></tr></table>' +
      '<p><b>e)</b> Zeichnen Sie je ein Zeigerdiagramm für das Hauptmaximum und das Nebenmaximum eines Dreifachspalts. ' +
      'Erklären Sie anhand der Zeiger die jeweilige Amplitude.</p>',
    sol: '<p><b>a)</b> Für kleine Winkel gilt <span class="formula">sin α ≈ tan α = a/l</span>. Mit ' +
      '<span class="formula">Δs = g·sin α</span> folgt für das Maximum k-ter Ordnung ' +
      '<span class="formula">k·λ = g·a_k/l</span>. Der Abstand benachbarter Maxima ist ' +
      '<span class="formula">Δa = λ·l/g</span>, also <span class="formula">λ = Δa·g/l</span>. Einsetzen: ' +
      '<span class="formula">λ = (6,1·10⁻³ m·0,25·10⁻³ m)/(2,40 m) ≈ 6,35·10⁻⁷ m</span>. Also <b>λ ≈ 635 nm</b>.</p>' +
      '<p><b>b)</b> <span class="formula">a₃ = 3·Δa = 3·6,1 mm = 18,3 mm</span>.</p>' +
      '<p><b>c)</b> <span class="formula">b·sin α₁ = λ</span>, also ' +
      '<span class="formula">sin α₁ = 635·10⁻⁹ m / 80·10⁻⁶ m ≈ 7,94·10⁻³</span> und ' +
      '<span class="formula">α₁ ≈ 0,455°</span>. Die Entfernung ist ' +
      '<span class="formula">a₁ = l·tan α₁ ≈ 2,40 m·7,94·10⁻³ ≈ 19,1 mm</span>.</p>' +
      '<p><b>d)</b> Doppelspalt: <span class="formula">Δs = g·sin α</span>, Maxima ' +
      '<span class="formula">|Δs| = k·λ</span> mit k = 0, 1, 2, …, Minima ' +
      '<span class="formula">|Δs| = (2k−1)·λ/2</span> mit k = 1, 2, … . Der Spaltmittenabstand g bestimmt den Abstand der Maxima. ' +
      'Einzelspalt: <span class="formula">Δs = b·sin α</span>, Minima ' +
      '<span class="formula">b·sin α = k·λ</span> mit k = 1, 2, …, Maxima ' +
      '<span class="formula">b·sin α = (2k+1)·λ/2</span> mit k = 1, 2, … . Die Spaltbreite b bestimmt die Lage der Minima. ' +
      'In der Mitte ist das Einzelspaltmuster hell, weil dort alle Elementarwellen den gleichen Weg haben und sich konstruktiv überlagern.</p>' +
      '<p><b>e)</b> Hauptmaximum: Alle drei Zeiger zeigen in dieselbe Richtung, zum Beispiel 0°, 0°, 0°. ' +
      '<span class="formula">A_res = 3·A₀</span>, die Intensität ist <span class="formula">9·A₀²</span>. ' +
      'Nebenmaximum: Die Phasen sind 0°, 180° und 360°. Zwei Zeiger zeigen nach rechts, einer nach links. ' +
      '<span class="formula">A_res = A₀</span>, die Intensität ist <span class="formula">A₀²</span>, also 1/9 des Hauptmaximums.</p>'
  },
  {
    title: 'Aufgabe 3 · Röntgenstrahlung und Bragg-Reflexion',
    points: 11,
    links: [['roentgen', '12 · Röntgen'], ['bragg', '13 · Bragg']],
    html: '<p>Eine Röntgenröhre wird mit der Beschleunigungsspannung <span class="formula">U = 40 kV</span> betrieben. ' +
      'Die Röhre besitzt eine Glühkathode, einen Wehnelt-Zylinder und eine gekühlte Anode.</p>' +
      '<table class="cmp"><tr><th>Teil</th><th>Aufgabe</th><th>BE</th></tr>' +
      '<tr><td>a</td><td>Aufbau und Entstehung der beiden Strahlungsanteile beschreiben</td><td>4</td></tr>' +
      '<tr><td>b</td><td>Grenzwellenlänge und maximale Photonenenergie berechnen</td><td>2</td></tr>' +
      '<tr><td>c</td><td>Ende des Bremsspektrums und Materialabhängigkeit erklären</td><td>2</td></tr>' +
      '<tr><td>d</td><td>Bragg-Reflexion skizzieren und Glanzwinkel berechnen</td><td>3</td></tr></table>' +
      '<p><b>a)</b> Beschreiben Sie den Aufbau der Röntgenröhre und die Entstehung der Bremsstrahlung sowie der charakteristischen Strahlung. ' +
      'Gehen Sie auf die Rolle von Kathode, Anode und Beschleunigungsspannung ein.</p>' +
      '<p><b>b)</b> Berechnen Sie die Grenzwellenlänge λ_min und die maximale Photonenenergie.</p>' +
      '<p><b>c)</b> Erklären Sie, warum das Bremsspektrum bei λ_min endet und warum die charakteristischen Linien vom Anodenmaterial abhängen.</p>' +
      '<p><b>d)</b> An einem NaCl-Kristall mit dem Netzebenenabstand <span class="formula">d = 282 pm</span> wird die Röntgenstrahlung reflektiert. ' +
      'Skizzieren Sie die Bragg-Reflexion mit dem Glanzwinkel θ und dem Gangunterschied. ' +
      'Berechnen Sie den Glanzwinkel für die Reflexion 1. Ordnung mit λ = λ_min.</p>',
    sol: '<p><b>a)</b> Die Glühkathode setzt Elektronen frei. Der Wehnelt-Zylinder bündelt den Strahl, die Spannung U beschleunigt die Elektronen zur Anode. ' +
      'Dort werden sie abgebremst, die Anode wird gekühlt. Bremsstrahlung entsteht durch Abbremsen und Ablenken der Elektronen im Feld der Anodenatome; ' +
      'sie hat ein kontinuierliches Spektrum, und die maximale Photonenenergie ist <span class="formula">E_max = e·U</span>. ' +
      'Charakteristische Strahlung entsteht, wenn ein Elektron ein inneres Hüllenelektron herausschlägt und ein äußeres Elektron nachrückt. ' +
      'Die Photonenenergien sind für das Anodenmaterial typisch, es entsteht ein Linienspektrum.</p>' +
      '<p><b>b)</b> <span class="formula">λ_min = h·c/(e·U) = 1240 eV·nm / 40 000 eV ≈ 0,031 nm = 31 pm</span>. ' +
      '<span class="formula">E_max = e·U = 40 keV</span>.</p>' +
      '<p><b>c)</b> Ein Photon kann höchstens die gesamte kinetische Energie eines Elektrons übernehmen. Bei kleinerer Wellenlänge wäre die Photonenenergie größer als e·U. ' +
      'Die charakteristischen Linien hängen vom Anodenmaterial ab, weil die Energiedifferenzen der Elektronenschalen von der Atomart bestimmt werden.</p>' +
      '<p><b>d)</b> Bragg-Bedingung: <span class="formula">k·λ = 2·d·sin θ</span>. Für k = 1 und λ = 31 pm: ' +
      '<span class="formula">sin θ = 31 pm / (2·282 pm) = 31/564 ≈ 0,0550</span>, also <span class="formula">θ ≈ 3,15°</span>. ' +
      'In der Skizze trifft ein Strahl unter dem Glanzwinkel θ auf die obere Netzebene, ein paralleler Strahl auf die untere. ' +
      'Der Gangunterschied der reflektierten Strahlen ist <span class="formula">2·d·sin θ</span>.</p>'
  }
];

addView('klausur', '16 · Probeklausur', V => {
  V.stage.remove();
  V.panel.classList.add('full');
  const cards = el('div', 'cards');
  V.panel.append(cards);

  const intro = el('div', 'card');
  intro.innerHTML = '<div class="learn-kicker">Prüfungsmodus</div>' +
    '<h3>Probeklausur Physik 13.1</h3>' +
    '<p>60 Minuten, 40 BE, drei Aufgaben. Die Aufgaben werden nacheinander angezeigt. ' +
    'Die Lösungen erscheinen erst nach dem Abgeben oder nach Ablauf der Zeit.</p>' +
    '<div class="learn-meta"><span class="learn-pill">60 Minuten</span><span class="learn-pill">40 BE</span>' +
    '<span class="learn-pill">Aufgabe 1: 14 BE</span><span class="learn-pill">Aufgabe 2: 15 BE</span>' +
    '<span class="learn-pill">Aufgabe 3: 11 BE</span></div>' +
    '<div class="note"><b>Hilfsmittel:</b> Formelsammlung, Taschenrechner ohne CAS, Zeichengerät. ' +
    'Rechne auf Papier und trage nur die Ergebnisse in deine Aufzeichnungen ein.</div>' +
    '<div class="note"><b>Die drei Aufgaben:</b><br>' +
    '1. Dipol und Schwingkreis: Frequenz, Wellenlänge, Dipollänge, Maxwell-Aussagen, Skizze (14 BE).<br>' +
    '2. Doppelspalt, Einzelspalt und Zeiger: Wellenlänge, Minima, Bedingungen, Zeigerdiagramme (15 BE).<br>' +
    '3. Röntgenstrahlung und Bragg: Entstehung, Grenzwellenlänge, Bragg-Winkel (11 BE).</div>' +
    '<div class="exrow"><button class="jump" id="exam-start">Klausur starten</button>' +
    '<button class="jump ghost" id="exam-home">Zum Lernpfad</button></div>';
  cards.append(intro);

  const head = el('div', 'card exam-head');
  head.style.display = 'none';
  head.innerHTML = '<div class="exam-top"><div><div class="learn-kicker">Restzeit</div>' +
    '<div class="exam-timer">60:00</div></div><div class="exam-meta">' +
    '<span class="learn-pill">40 BE</span><span class="learn-pill">3 Aufgaben</span></div></div>' +
    '<div class="exam-nav"></div>' +
    '<div class="exrow"><button class="ghost" id="exam-prev">Zurück</button>' +
    '<button class="ghost" id="exam-next">Weiter</button>' +
    '<button id="exam-submit">Abgeben</button>' +
    '<button class="ghost" id="exam-reset">Neu starten</button></div>';
  cards.append(head);

  const taskCard = el('div', 'card exam-task');
  taskCard.style.display = 'none';
  cards.append(taskCard);

  const solWrap = el('div');
  cards.append(solWrap);

  const timerEl = head.querySelector('.exam-timer');
  const nav = head.querySelector('.exam-nav');
  const bPrev = head.querySelector('#exam-prev');
  const bNext = head.querySelector('#exam-next');
  const bSubmit = head.querySelector('#exam-submit');
  const bReset = head.querySelector('#exam-reset');
  const bStart = intro.querySelector('#exam-start');
  const bHome = intro.querySelector('#exam-home');

  const state = { running: false, submitted: false, current: 0, remaining: 3600, timer: null };
  const fmt = s => {
    s = Math.max(0, s);
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const updateTimer = () => {
    timerEl.textContent = fmt(state.remaining);
    timerEl.classList.toggle('low', state.remaining <= 300);
  };
  const stopTimer = () => {
    if (state.timer) clearInterval(state.timer);
    state.timer = null;
  };
  const startTimer = () => {
    stopTimer();
    state.timer = setInterval(() => {
      if (!state.running) return;
      state.remaining--;
      updateTimer();
      if (state.remaining <= 0) submit(true);
    }, 1000);
  };

  const renderNav = () => {
    nav.innerHTML = '';
    EXAM_TASKS.forEach((t, i) => {
      const b = el('button', state.current === i ? 'on' : null, (i + 1) + '');
      b.onclick = () => { state.current = i; renderTask(); };
      nav.append(b);
    });
  };

  const renderTask = () => {
    renderNav();
    bPrev.disabled = state.current === 0;
    bNext.disabled = state.current === EXAM_TASKS.length - 1;
    const t = EXAM_TASKS[state.current];
    taskCard.innerHTML = '<div class="exam-task-head"><div><div class="learn-kicker">Aufgabe ' +
      (state.current + 1) + ' von ' + EXAM_TASKS.length + '</div><h3>' + t.title + '</h3></div>' +
      '<span class="exam-points">' + t.points + ' BE</span></div>' + t.html;
    const links = el('div', 'exrow');
    t.links.forEach(([id, label]) => {
      const b = el('button', 'jump ghost', 'Kapitel: ' + label);
      b.onclick = () => {
        const v = views.find(x => x.id === id);
        if (v) showView(v);
      };
      links.append(b);
    });
    taskCard.append(links);
  };

  const renderSolutions = () => {
    solWrap.innerHTML = '';
    const note = el('div', 'note');
    note.innerHTML = state.remaining <= 0 ? '<b>Zeit abgelaufen.</b> Vergleiche jetzt deine Lösungen.' :
      '<b>Abgegeben.</b> Vergleiche jetzt deine Lösungen mit deinem Rechenweg.';
    solWrap.append(note);
    EXAM_TASKS.forEach((t, i) => {
      const card = el('div', 'card');
      card.innerHTML = '<div class="exam-task-head"><div><div class="learn-kicker">Lösung ' +
        (i + 1) + '</div><h3>' + t.title + '</h3></div><span class="exam-points">' + t.points + ' BE</span></div>';
      const sol = el('div', 'sol on');
      sol.innerHTML = t.sol;
      card.append(sol);
      solWrap.append(card);
    });
  };

  const submit = auto => {
    if (!state.running && state.submitted) return;
    state.running = false;
    state.submitted = true;
    stopTimer();
    if (auto) state.remaining = 0;
    updateTimer();
    bSubmit.disabled = true;
    bSubmit.textContent = 'Abgegeben';
    try {
      const arr = JSON.parse(localStorage.getItem(LEARN_KEY) || '[]');
      if (!arr.includes('klausur')) arr.push('klausur');
      localStorage.setItem(LEARN_KEY, JSON.stringify(arr));
    } catch (_) { }
    renderTask();
    renderSolutions();
  };

  const reset = () => {
    state.running = false;
    state.submitted = false;
    state.current = 0;
    state.remaining = 3600;
    stopTimer();
    updateTimer();
    bSubmit.disabled = false;
    bSubmit.textContent = 'Abgeben';
    intro.style.display = '';
    head.style.display = 'none';
    taskCard.style.display = 'none';
    solWrap.innerHTML = '';
    taskCard.innerHTML = '';
  };

  const start = () => {
    reset();
    state.running = true;
    state.submitted = false;
    state.remaining = 3600;
    intro.style.display = 'none';
    head.style.display = '';
    taskCard.style.display = '';
    updateTimer();
    bSubmit.disabled = false;
    bSubmit.textContent = 'Abgeben';
    renderTask();
    startTimer();
  };

  bStart.onclick = start;
  bHome.onclick = () => { const v = views.find(x => x.id === 'start'); if (v) showView(v); };
  bPrev.onclick = () => { if (state.current > 0) { state.current--; renderTask(); } };
  bNext.onclick = () => { if (state.current < EXAM_TASKS.length - 1) { state.current++; renderTask(); } };
  bSubmit.onclick = () => submit(false);
  bReset.onclick = reset;
  updateTimer();
});
