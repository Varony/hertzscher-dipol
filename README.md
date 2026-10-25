# Physik 13.1: Elektromagnetische Wellen

**Klausurvorbereitung mit Lernpfad, 15 interaktiven Kapiteln und einer Probeklausur. Eine HTML-Datei, offline im Browser, für iPad und Desktop.**

[▶ Website öffnen](https://schule-theta.vercel.app/) · [Voraussetzungen](#voraussetzungen-für-genau-dieses-ergebnis) · [Ohne Terminal](#ohne-terminal-direkt-bei-anthropic-openai-oder-google) · [Tipps & Tricks](#tipps--tricks) · [Tutorial](TUTORIAL.md)

> **Entstehung in Kürze:** Die Simulation entstand an einem Abend im Oktober 2026 mit dem CLI-Agenten
> OpenCode – aus einer PowerPoint, einem Video und vielen kleinen Iterationen. Die erste vollständige
> Version wurde um 23:01 committet, die letzten Fehler waren eine Stunde später behoben. Die fünf
> Commits und der komplette Weg stehen im [Tutorial](TUTORIAL.md#wie-das-original-entstanden-ist).

## Was ist das?

Eine interaktive Klausurvorbereitung zu **elektromagnetischen Wellen in Physik 13.1**. Sie folgt dem
Skript und führt in fünf Modulen vom Schwingkreis über Nah- und Fernfeld, Polarisation und Maxwell
bis zu Interferenz, Zeigerdarstellung, Röntgenstrahlung und Bragg-Reflexion.

Der **Lernpfad** zeigt Lernziele, Reihenfolge und Fortschritt. Die **Probeklausur** simuliert die
Prüfung mit 60 Minuten, 40 BE und drei Aufgaben. Die Besonderheit: Es gibt **keine Bibliothek,
keinen Build beim Nutzer und keine Netzverbindung**. Die komplette Website steckt in `index.html`.
Die 3D-Szenen sind mit **Canvas 2D und einer eigenen Projektion** gezeichnet, nicht mit WebGL.

**Online:** [Vercel](https://schule-theta.vercel.app/) · [GitHub Pages](https://varony.github.io/hertzscher-dipol/) · **Offline:** `index.html` herunterladen und
im Browser öffnen.

## Voraussetzungen für genau dieses Ergebnis

Das Ergebnis ist reproduzierbar. Es braucht fünf Bausteine – fehlt einer, wird es entweder keine
Einzeldatei, keine echte 3D-Darstellung oder keine verlässliche Physik:

| Baustein | Mindestens | In diesem Projekt |
|----------|------------|-------------------|
| **CLI-Agent** | Datei-, Shell- und Git-Zugriff, Werkzeugaufrufe | OpenCode v2, direkt im Repository |
| **Modell** | Tool-Calling, Bild-/PDF-Eingabe, mind. 200 K Kontext | 1-Mio.-Kontext-Modell mit Vision |
| **PowerPoint lesen** | LibreOffice + Poppler, PDF oder PNG pro Folie | 28 Folien → PDF → Agent |
| **Laufzeit** | Python 3, Git, aktueller Browser | `build.py`, GitHub Pages |
| **Mensch** | Physik/Didaktik prüfen, auf dem iPad testen | Auswahl, Review, Gerätetest |

> **Schritt für Schritt:** [TUTORIAL.md](TUTORIAL.md) führt von der Installation über die
> PowerPoint-Konvertierung und den Bauauftrag bis zu Tests und GitHub Pages – inklusive
> Prompt-Vorlagen, Checkpoints und Fehlerbehebung.

### 1. Ein CLI-Agent

Gebaut wurde mit **OpenCode**, einem Open-Source-Agenten für das Terminal. Er liest Dateien, führt
Befehle aus, schreibt Code und committet – alles im Projektordner. Installation:

```bash
curl -fsSL https://opencode.ai/v2/install | bash
opencode --version
```

Alternativen mit denselben Fähigkeiten sind Claude Code, Codex CLI oder ein anderer Agent mit
Datei- und Shell-Zugriff. Entscheidend ist nicht der Name, sondern:

* Der Agent sieht das **Repository**, nicht nur einen Chatverlauf.
* Er kann **mehrere Dateien** ändern und den Build ausführen.
* Er kann **Git** bedienen, damit jeder Schritt nachvollziehbar bleibt.
* Er kann **Bilder oder PDF-Seiten** an das Modell geben.

Das Modell wird im Agenten mit `/models` gewählt. Es muss Werkzeuge aufrufen und Bilder lesen können;
200.000 Token Kontext reichen für dieses Projekt, 1 Million ist komfortabel. Welche Modelle wann
sinnvoll sind, steht unter [Welches Modell?](#welches-modell).

### 2. PowerPoint lesen

Eine `.pptx` ist für den Agenten kein Bild, sondern eine Binärdatei. Der zuverlässige Weg führt über
PDF und – wenn nötig – PNG:

```bash
# PPTX → PDF
libreoffice --headless --convert-to pdf \
  --outdir material material/Hertzscher_Dipol_komplett.pptx

# Optional: jede Folie als Bild
pdftoppm -png -r 150 material/Hertzscher_Dipol_komplett.pdf material/folie
```

OpenCode kann PDFs und PNGs über das `read`-Werkzeug an das Modell geben (bis 20 MiB). Das PDF ist der
beste Kompromiss: Text, Layout und Diagramme bleiben zusammen. Ist es größer als 20 MiB, werden die
Folien als PNG gelesen oder das PDF wird geteilt.

**Für Web-Chats gilt dasselbe:** PDF hochladen, nicht die PPTX. PPTX wird oft nur als Text extrahiert;
Pfeile, Feldlinien und Layout gehen dabei verloren. Sprechernotizen lassen sich mit `python-pptx`
auslesen. Die genauen Befehle stehen im [Tutorial](TUTORIAL.md#2-die-powerpoint-lesen).

### 3. Projekt, Material und Laufzeit

Mehr ist nicht nötig:

* ein Ordner mit `material/` (Folien, Transkript, Notizen),
* Python 3 und Git,
* ein Browser zum Testen,
* ein GitHub-Konto für die Veröffentlichung (oder Netlify Drop).

Es gibt **keinen Build-Server, keine Datenbank und kein Framework**. Die Quelle liegt in `src/`, der
Build setzt sie zu einer HTML-Datei zusammen. Genau deshalb funktioniert das Ergebnis per AirDrop, im
Flugmodus und auf GitHub Pages.

### 4. Der Mensch bleibt zuständig

Der Agent kann Code schreiben, aber nicht entscheiden, ob die Physik stimmt oder ob sich eine
Bedienung auf dem iPad gut anfühlt. Die Arbeitsteilung im Original:

| Mensch | Agent |
|--------|-------|
| Material auswählen, kürzen, didaktisch strukturieren | Grundgerüst, 3D-Projektion, Szenen |
| Formeln und Kontrollwerte vorgeben | Feldberechnung, Regler, Aufgabenlogik |
| Auf dem iPad testen, Fehler melden | Fehler suchen, ändern, bauen, committen |
| Entscheiden, was „gut genug“ ist | Varianten vorschlagen und umsetzen |

## Ohne Terminal: direkt bei Anthropic, OpenAI oder Google

Wenn du keinen CLI-Agenten benutzen willst, geht der Großteil auch im Browser. Du brauchst ein Konto,
die Präsentation als **PDF** und etwas Geduld mit Copy-and-paste. Die drei Oberflächen unterscheiden
sich vor allem darin, wie sie lange Dateien ausgeben:

| | **Claude** (Anthropic) | **ChatGPT** (OpenAI) | **Gemini** (Google) |
|---|---|---|---|
| **Oberfläche** | claude.ai, Projects, Artifacts | chatgpt.com, Projects, Code-Blöcke | gemini.google.com, Canvas, Drive |
| **Datei** | PDF, PNG | PDF, PNG | PDF, Google Slides, PNG |
| **Modell** | Sonnet 5.5 / Opus 5.5 | GPT-5.6 Sol, GPT-6 Astra (Pro) | Gemini 4, Gemini 3.8 Flash |
| **Kontext** | bis 1 Mio. (API; Web ggf. weniger) | 256 K im Thinking; Modelle bis 1,05 Mio. | 1 Mio. |
| **Stärke** | Artifacts, saubere Einzeldatei | Code-Blöcke mit Vorschau, Projekte | Drive, Slides, viel Kontext |
| **Aufpassen** | große Dateien können abbrechen | Canvas 2026 abgelöst; GPT-6.1 nur Work/Codex | Gemini 4: 32 K Ausgabe |

### Der gemeinsame Ablauf

1. **Präsentation als PDF exportieren.** Nicht die PPTX hochladen, wenn es auf Layout ankommt.
2. **Neues Projekt oder neuen Chat öffnen** und das PDF hochladen.
3. **Bauauftrag einfügen.** Ziel, Zielgerät, Kapitel, technische Randbedingungen und Physik nennen.
   Eine Vorlage steht im [Tutorial](TUTORIAL.md#anhang-der-bauauftrag-als-kopiervorlage).
4. **Erst das Grundgerüst verlangen:** Tabs, leere Bühne, Touch-Bedienung. Noch keine Fachinhalte.
5. **Kapitel für Kapitel ergänzen.** Bei Claude bleibt die Datei als Artifact im Chat; bei ChatGPT
   und Gemini die aktuelle HTML-Datei wieder anhängen – sonst arbeitet der Agent auf einem alten Stand.
6. **Vorschau testen und herunterladen.** Danach lokal und auf dem iPad öffnen.
7. **Veröffentlichen.** GitHub-Weboberfläche oder Netlify Drop; für die Schule reicht auch AirDrop.

### Claude (Anthropic)

1. Auf <https://claude.ai> ein **Project** anlegen und das PDF hochladen.
2. Im Chat **Claude Sonnet 5.5** wählen (schnell und günstig) oder **Opus 5.5** für Architektur und
   schwierige Physik.
3. Nach einer einzelnen HTML-Datei mit inline CSS/JS fragen. Claude öffnet sie als **Artifact** neben
   dem Chat; Änderungen erscheinen direkt in der Vorschau.
4. Mit „Ändere nur Kapitel 4“ weiterarbeiten. Große Dateien brechen in Artifacts praktisch ab – dann
   in Module teilen oder eine zweite Datei verlangen.
5. Die HTML-Datei aus dem Artifact kopieren oder herunterladen und lokal testen.

**Gut geeignet**, weil Artifacts genau auf eine einzelne, in sich geschlossene HTML-Seite ausgelegt
sind. **Grenze:** Die Vorschau ersetzt weder den iPad-Test noch eine Versionsverwaltung.

### ChatGPT (OpenAI)

1. Auf <https://chatgpt.com> ein **Project** oder einen neuen Chat öffnen und das PDF hochladen.
2. Das stärkste verfügbare Modell wählen: **GPT-5.6 Sol** im normalen Chat, **GPT-6 Astra** mit
   Pro/Work. **GPT-6.1 Sol** läuft (Stand Oktober 2026) in **ChatGPT Work und Codex**, nicht im
   normalen Chat.
3. Eine einzelne HTML-Datei verlangen. ChatGPT zeigt Code-Blöcke mit **Vorschau**; Canvas wurde 2026
   bei den neueren Modellen abgelöst.
4. Bei langen Dateien in Abschnitte teilen: „Gib zuerst das Gerüst aus, dann Kapitel 1–3, dann 4–6.“
5. Code kopieren oder herunterladen, lokal speichern und im Browser prüfen.

**Gut geeignet** für Code-Blöcke und Projekte. **Grenze:** Das Kontextfenster im Chat ist kleiner als
das API-Fenster; sehr lange Dateien und viele Folienbilder füllen es schnell.

### Gemini (Google)

1. Auf <https://gemini.google.com> einen neuen Chat öffnen. PDF hochladen oder eine Präsentation aus
   **Google Drive** öffnen.
2. **Gemini 4** für Analyse und schwierige Zusammenhänge wählen, **Gemini 3.8 Flash** für schnelle
   Iterationen mit mehr Ausgabelänge.
3. In **Canvas** eine HTML-Datei erzeugen lassen und die Vorschau prüfen.
4. Herunterladen bzw. exportieren und lokal testen.

**Gut geeignet** für lange Präsentationen und Drive-Dateien. **Grenze:** Gemini 4 hat laut
Modellkatalog nur 32 K Ausgabe – eine 139-KB-HTML-Datei passt nicht in einem Rutsch. Dann modular
arbeiten oder Flash wählen.

### Was im Browser nicht geht

* **Kein Repository:** Du bist die Versionsverwaltung. Nach jeder guten Version eine Kopie anlegen
  (`v1.html`, `v2.html`).
* **Kein Build und kein Test:** Der Agent sieht den Code, aber nicht dein iPad. Der letzte Test bleibt
  bei dir.
* **Kein unbegrenztes Gedächtnis:** Lange Chats verlieren Details. Starte für eine neue Phase einen
  neuen Chat mit Zusammenfassung und aktueller Datei.
* **Tarif prüfen:** Die stärksten Modelle, Artifacts und langen Kontexte sind oft an kostenpflichtige
  Pläne gebunden; Free-Tarife haben niedrigere Limits.
* **Keine echten Dateien:** Was der Agent ausgibt, muss vollständig sein. Prüfe die Zeilenzahl oder
  Dateigröße nach jedem großen Schritt.
* **Datenschutz:** Keine echten Schülerdaten oder internen Dokumente hochladen.

## Tipps & Tricks

### Welche Dateien eignen sich?

| Datei | Wofür | Warum | Tipp |
|-------|-------|-------|------|
| **PDF** | Folien, Handouts, Layout | Text, Bilder und Reihenfolge in einer Datei | Beste Wahl; für OpenCode unter 20 MiB bleiben, 150 dpi reichen |
| **PNG/JPG pro Folie** | komplexe Diagramme, kleine Beschriftungen | Das Modell „sieht“ die Folie als Bild | 150–200 dpi, in Gruppen von 5–8 lesen |
| **PPTX** | Ausgangsmaterial | oft nur Textextraktion, Layout geht verloren | Vorher zu PDF konvertieren |
| **DOCX/MD/TXT** | Bauauftrag, Notizen, Transkript | kompakt und gut durchsuchbar | Ideal für Anforderungen und Sprechernotizen |
| **HTML** | aktueller Stand der Simulation | enthält alles, was der Agent ändern soll | Immer die **vollständige, aktuelle** Datei hochladen |
| **Screenshot** | visuelle Fehler | zeigt Layout und Bedienung | Mit Gerät, Browser und Schritt beschreiben |
| **Video** | Erklärvideo | zu groß, kein sinnvoller Kontext | Link oder Transkript/Notizen verwenden |
| **Scan-PDF** | alte Unterlagen | ohne Textebene schwer lesbar | Vorher OCR (`ocrmypdf`) |

Für dieses Projekt: **PDF der 28 Folien** plus **Video-Transkript** plus **`BAUAUFTRAG.md`**. Das ist
kompakt genug für 200 K Kontext und enthält alles, was für die Kapitel nötig ist.

### Welches Modell?

| Aufgabe | Anforderung | Beispiele (Stand Oktober 2026) |
|---------|-------------|--------------------------------|
| Architektur, Physik, große Umbauten | starkes Reasoning, 1 Mio. Kontext | Claude Opus 5.5, GPT-6 Astra, Gemini 4 |
| Umsetzung, ganze Dateien | gutes Coding, 128 K Ausgabe | Claude Sonnet 5.5, GPT-6.1 Sol |
| Schnelle kleine Änderungen | niedrige Latenz, günstig | Claude Haiku 5.5, GPT-6 Luna, Gemini 3.8 Flash |
| Folien lesen | Bild- oder PDF-Eingabe | alle oben genannten mit Vision |

Faustregeln:

* **Reasoning-Modus für Planung und Physik**, schneller Modus für CSS, Text und kleine Fixes.
* **Ein Modell pro Phase.** Ein Modellwechsel mitten in der Aufgabe kostet Kontext, wenn der
  Chatverlauf nicht mitgenommen wird.
* **Vision prüfen.** Ein Modell ohne Bildeingabe kann Folien nur als Text lesen.
* **Ausgabe beachten.** Für eine komplette 139-KB-Datei braucht es ein großes Ausgabefenster;
  Gemini 4 mit 32 K ist dafür zu knapp.
* Das teuerste Modell ist selten nötig: Der Engpass ist die Iteration, nicht die rohe Intelligenz.

### Kontextfenster

Ein Kontextfenster ist das Arbeitsgedächtnis einer Sitzung: Systemprompt, Dateien, Bilder, bisherige
Antworten und Werkzeugergebnisse zählen mit. Eine grobe Schätzung für englischen Code:
**1 Token ≈ 4 Zeichen**.

| Inhalt | Größe | Tokens (grob) |
|--------|-------|---------------|
| `index.html` (fertig) | 139 KB | 35–40 K |
| `src/*.js` (Quellcode) | 101 KB | 25–30 K |
| 28 Folien als PDF/Bilder | – | 50–80 K |
| alles zusammen | – | 100–150 K |

Damit gilt:

* **200 K reichen** für dieses Projekt, wenn du nicht Quellcode und fertige Datei gleichzeitig lädst.
* **1 Mio. ist Komfort**, kein Muss. Große Fenster werden langsamer und teurer.
* **30–40 % frei lassen** für Antworten und Werkzeugergebnisse. Ein volles Fenster produziert
  abgeschnittene Dateien und vergessene Details („context rot“).
* **Nicht duplizieren:** `index.html` enthält bereits CSS und JS. Wer zusätzlich `src/` einfügt, zahlt
  denselben Inhalt doppelt.
* **Das Ausgabefenster ist oft der eigentliche Engpass**, nicht das Eingabefenster. 139 KB HTML sind
  etwa 35 K Ausgabetokens. Claude und GPT können das, Gemini 4 nicht in einem Rutsch.
* **Neue Phase, neuer Chat:** Zusammenfassung + aktuelle Datei + offene Aufgabe mitgeben. Das ist
  schneller, als einen 300.000-Token-Chat weiterzuschleppen.

### Prompting

* **Ein Auftrag, eine Änderung.** „Baue Kapitel 4“ ist besser als „verbessere die Simulation“.
* **Akzeptanzkriterien nennen.** Was muss man sehen, messen oder bedienen können? Woran erkennt man,
  dass es fertig ist?
* **Auf Folien verweisen.** „Folie 24: sin²α“ ist präziser als „das mit dem Gitter“.
* **Fehler reproduzierbar melden.** Schritte, Erwartung, tatsächliches Verhalten, Konsolenausgabe.
* **Ursache vor Fix verlangen.** „Erkläre zuerst, warum der Radius NaN wird, dann behebe es minimal.“
* **Bei kleinen Änderungen einen Diff verlangen**, bei großen die vollständige Datei. Danach Zeilen-
  oder Dateigröße prüfen.
* **Randbedingungen wiederholen.** „Keine externen Bibliotheken, eine HTML-Datei, offline“ gehört in
  jeden größeren Auftrag.
* **Screenshots für visuelle Fehler**, Konsole für JavaScript-Fehler. Der Agent kann nur reagieren,
  was er sieht.

### Testen und veröffentlichen

* **Offline testen:** im Browser die Netzwerkansicht öffnen, „Offline“ aktivieren, neu laden. Es darf
  keine fehlende Ressource geben.
* **Früh auf dem Zielgerät testen:** Touch, Querformat, geteilter Bildschirm, „Zum Home-Bildschirm“.
* **GitHub ohne Terminal:** Repository im Browser anlegen, `index.html` und `.nojekyll` hochladen,
  *Settings → Pages → Deploy from branch* (Branch `main`, Ordner `/root`).
* **Noch einfacher:** <https://app.netlify.com/drop> – Ordner mit `index.html` hineinziehen, Link
  kopieren. Kein Konto nötig.
* **Versionen sichern:** `v1.html`, `v2.html` oder Git. Ein misslungener Umbau lässt sich sonst nur
  schwer zurücknehmen.
* **Keine echten Personendaten** in Prompts oder Beispieldateien.

## Lernpfad und Kapitel

| # | Ansicht | Inhalt |
|---|---------|--------|
| 0 | Lernpfad | Fünf Module mit Lernzielen, Fortschritt und direkten Links zu allen Kapiteln |
| 1 | Schwingkreis → Dipol | Aufbiegen, Abwickeln, Verkleinern; L und C sinken, f steigt; Dipollänge folgt λ/2 |
| 2 | Felder & Abstrahlung | E- und B-Feld, Fernfeld, Abstrahlkeule, keine Abstrahlung entlang der Dipolachse |
| 3 | Nahfeld | 1/r³-Anteil, radialer Feldanteil, Phasenverschiebung, pendelnder Energiefluss |
| 4 | Fernfeld | Wellenfronten, transversales 1/r-Feld, E und B in Phase, Poynting nach außen |
| 5 | Polarisation | Drehbares Gitter, Zerlegung E∥ / E⊥, \|E_E,∥\| = \|E_S\|·sin²α |
| 6 | Maxwell | Vier Aussagen in Worten und Bildern, Kausalkette E → B → Welle, Dipol und Fernfeld |
| 7 | Thomson | Schwingendes Elektron als Dipol, Thomson-Gleichung, Grundfrequenz f = c/(2l) |
| 8 | Senden & Empfangen | Abstand, Höhenwinkel θ, Richtung φ, Ausrichtung β, Gitter α, Induktionsschleife |
| 9 | Versuch V1 | Aufgaben a bis f mit Vorhersage, Rückmeldung und „In der Simulation zeigen“ |
| 10 | Interferenz | Doppelspalt und Einzelspalt, Gangunterschied, Kleinwinkelnaherung, Schirmmuster |
| 11 | Zeiger & Gitter | Zeigeraddition, Hauptmaximum, Nebenmaxima, Nebenminima, Dreifachspalt |
| 12 | Röntgen | Röhre, Bremsstrahlung und charakteristische Strahlung, λmin, Welle und Teilchen, ALARA |
| 13 | Bragg | Netzebenen, Glanzwinkel, Gangunterschied 2·d·sin θ, Bragg-Bedingung und Rechner |
| 14 | Formeln | c = λ·f, Wellenlängen-Rechner, Merksätze und Vergleichstabelle |
| 15 | Rechenaufgaben | Neun Aufgaben mit Werteingabe, Prüfung und aufklappbarem Lösungsweg |
| 16 | Probeklausur | 60 Minuten, 40 BE, Timer, drei Aufgaben nacheinander, Lösungen erst am Ende |

## Auf dem iPad starten

**Empfohlen – über die Online-Adresse:**

1. In **Safari** öffnen: <https://schule-theta.vercel.app/>
2. Teilen-Symbol → **„Zum Home-Bildschirm“** → startet ohne Adressleiste im Vollbild wie eine App (Icon ist eingebaut).

Alternativ: <https://varony.github.io/hertzscher-dipol/>

**Ohne Internet – Datei direkt:**

1. `index.html` aufs iPad übertragen: AirDrop, iCloud Drive, Dateien-App oder E-Mail-Anhang.
2. In **Safari** öffnen (in der Dateien-App: Teilen-Symbol → „In Safari öffnen“).
3. Optional Vollbild: Teilen-Symbol → **„Zum Home-Bildschirm“**.

> Tipp: Wenn „In Safari öffnen“ fehlt, die Datei über einen kleinen lokalen Webserver
> (`python3 -m http.server` im Ordner) oder einen beliebigen statischen Webspace bereitstellen.

## Physik-Hinweise

* **Speisung:** Der Hochfrequenzgenerator speist den Sendedipol **in der Mitte** – die beiden Dipolhälften
  sind die „Platten“ des aufgebogenen Kondensators. Die Ladungen sitzen daher an den **äußeren Enden**
  (Mitte ladungsfrei, dort maximaler Strom) und wechseln periodisch ihr Vorzeichen.
* **Frequenz eintippen:** Bei Kapitel 1 („Frequenz f vorgeben“) und bei den Frequenz-Reglern der
  Kapitel 2, 3, 4, 8 und 14 kann f direkt in das Feld geschrieben werden (z. B. `100`, `100 MHz`, `2,4 GHz`).
  Der Regler springt auf den passenden Wert.
* **Kapitel 1 rechnet physikalisch:** L₀ = 100 µH, C₀ = 1 nF → 503 kHz; Aufbiegen senkt C, Abwickeln senkt L
  (unterschiedlich schnell), Endzustand L = 0,63 µH, C = 4 pF → **100 MHz** (λ = 3 m). Die angezeigte
  Frequenz wird live aus L und C berechnet: f = 1/(2π√(L·C)).
* **Dipollänge = λ/2:** Der Sendedipol ist ein λ/2-Resonator, seine Länge folgt also der Frequenz
  (1,50 m bei 100 MHz, 2,50 m bei 60 MHz, 0,75 m bei 200 MHz). Ein Maßstabsbalken im Bild macht die
  absoluten Größen ablesbar. Die Frequenz ist zwischen 60 und 200 MHz einstellbar.
* Feldberechnung mit den Standardformeln des Hertz-Dipols – Nahfeld (1/r³), Induktionsfeld (1/r²) und
  Fernfeld (1/r). **Kontrollgrößen:** Die Phasendifferenz E–B geht von 90° (Nahfeld) auf 0° (Fernfeld),
  E × B zeigt im Fernfeld nach außen (Poynting), und im statischen Grenzfall ergibt sich das Dipolfeld.
* Empfangsamplitude ∝ sin θ · cos β bzw. am Gitter ∝ sin α · sin(α−β) mit β = 0 → sin²α (Folie 24);
  die Helligkeit des Lämpchens folgt der Leistung ∝ |E|². Die Feldpfeile am Empfänger zeigen die
  **momentane** transversale Feldstärke (hinter dem Gitter die gedrehte Richtung).
* Darstellung in **Zeitlupe** (Wellenlänge maßstäblich, Ausbreitung stark gerafft);
  die Pfeillängen der Feldvektoren sind logarithmisch skaliert, damit Nah- und Fernfeld gleichzeitig sichtbar sind.

## Bedienung

* Ziehen = drehen · zwei Finger = zoomen · „Ansicht einpassen“ setzt zurück (einheitlich in allen 3D-Kapiteln)
* Kapitel 5: Gitter über den Regler **oder den blauen Drehgriff direkt am Gitter** drehen (Finger aufsetzen und kreisen)
* Kapitel 9: Nach einer Antwort erscheint **„▶ In der Simulation zeigen“** und stellt die passende Anordnung in Kapitel 8 ein
* Kapitel 0: Lernstand abhaken; Kapitel 16: Klausur mit Timer starten, abgeben und Lösungen vergleichen

## Projektstruktur und Build

```
.
├── index.html          fertige Single-File-Version (das wird ausgeliefert)
├── .nojekyll           verhindert Jekyll-Verarbeitung auf GitHub Pages
├── TUTORIAL.md         Schritt-für-Schritt-Anleitung
└── src/
    ├── index.html      HTML-Gerüst mit Platzhaltern für CSS, JS und Icon
    ├── style.css
    ├── core.js         Mathematik, 3D-Projektion, UI, Tab-System
    ├── scenes1.js      Zeichenprimitive und Felddarstellung
    ├── scenes2.js      Kapitel 1, 2, 5, 8, 9, 14
    ├── scenes3.js      Kapitel 3, 4, 15
    ├── scenes4.js      Kapitel 6, 7, 10 bis 13
    ├── scenes5.js      Kapitel 0 und 16 (Lernpfad, Probeklausur)
    ├── build.py        baut index.html
    └── mkicon.py       erzeugt das App-Icon als Data-URI
```

Die fertige `index.html` ist bewusst eingecheckt, damit Vercel und GitHub Pages ohne Build-Schritt auskommen.
Wer aus den Quellen neu bauen will:

```bash
python3 src/mkicon.py            # optional: erzeugt src/icon.dat
python3 src/build.py index.html  # setzt CSS/JS/Icon ein
```

Ohne `src/icon.dat` wird die Datei trotzdem gebaut, nur ohne eingebettetes Icon. Mit `mkicon.py`
reproduziert der Build die eingecheckte `index.html` byte-genau.

## Quellen

* Präsentation `Hertzscher_Dipol_komplett.pptx` (28 Folien, Kapitel 3.1, Versuch V1 / V1e)
* Video: <https://youtu.be/HIweE_DCluQ> – „Hertz'sche Dipolstrahlung als Nachweis elektromagnetischer Strahlung“
