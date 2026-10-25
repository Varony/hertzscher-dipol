# Tutorial: Von der PowerPoint zur interaktiven Simulation

**Ziel:** Eine einzelne, offline lauffähige HTML-Datei mit neun 3D-Kapiteln – so wie dieses Repository.

**Werkzeug:** OpenCode (CLI-Agent) und ein Modell mit Werkzeug- und Bildunterstützung.

**Zeit:** Ein Abend für das Grundgerüst, danach Feinschliff. Das Original entstand am 14. Oktober 2026 in
rund einer Stunde sichtbarer Iterationen.

**Ergebnis:** `index.html` zum Ausliefern, `src/` zum Weiterentwickeln, GitHub Pages als Hosting.

> Dieses Tutorial beschreibt die Entstehung der ersten neun Kapitel. Später kamen der Lernpfad,
> Interferenz, Zeiger, Röntgen, Bragg, Thomson und die Probeklausur dazu. Die Kapitelnummern im
> Tutorial entsprechen daher nicht mehr der aktuellen Reihenfolge.

> Dieses Tutorial rekonstruiert den Weg, der zu diesem Projekt geführt hat. Es ist kein starres Rezept:
> Kapitel, Physik und Gestaltung lassen sich austauschen. Die Beispieldateien und Prompts beziehen sich
> auf den hertzschen Dipol, die Arbeitsweise gilt aber für jede interaktive Lernseite.

## 0. Die Pipeline

```text
Hertzscher_Dipol_komplett.pptx
        │  LibreOffice
        ▼
Folien.pdf  /  folie-01.png … folie-28.png
        │  OpenCode read
        ▼
Agent + Modell (Text, Bilder, Werkzeuge)
        │  schreibt und baut
        ▼
src/index.html + style.css + core.js + scenes*.js
        │  python3 src/build.py index.html
        ▼
index.html  ──► GitHub Pages ──► iPad / Desktop
```

Der wichtigste Unterschied zu „einmal prompten“: Es gibt **Checkpoints**. Nach jedem Schritt wird gebaut,
im Browser geöffnet, geprüft und committet. Erst dann kommt der nächste Auftrag.

### Wie das Original entstanden ist

Die sichtbaren Iterationen des Originals passen in eine gute Stunde. Rekonstruktion aus der
Commit-Historie:

| Zeit | Commit | Inhalt |
|------|--------|--------|
| 23:01 | `a5702e2` | Erste vollständige Version: neun Ansichten, 3D-Szenen, Aufgaben, Aufteilung in `src/` und Build-Skript |
| 23:04 | `fcb601e` | Online-Adresse (GitHub Pages) und iPad-Anleitung ergänzt |
| 23:28 | `585e32a` | Dipollänge folgt jetzt der Frequenz (λ/2), Maßstabsbalken, Generator-Anschluss passt sich an |
| 23:37 | `49aa329` | Frequenz direkt eintippbar; Kapitel 1 rechnet mit echten Werten für L und C: f = 1/(2π√(LC)) |
| 23:59 | `837c121` | Drehgriff in Kapitel 6 repariert (Trefferradius war NaN) + Hinweis-Badge |

Der erste Wurf war vollständig, aber nicht fertig. Die letzten drei Commits beheben Fehler, die erst
beim Benutzen auffallen: eine Dipollänge, die nicht mit der Frequenz skalierte, eine Anzeige, die nicht
zur Formel passte, und ein Trefferradius, der zu `NaN` wurde. Genau dafür braucht es den Menschen vor
dem Bildschirm.

## 1. Werkzeuge installieren

### 1.1 OpenCode

OpenCode ist der CLI-Agent, mit dem das Original gebaut wurde. Installation unter Linux und macOS:

```bash
curl -fsSL https://opencode.ai/v2/install | bash
```

Alternativen: `brew install anomalyco/tap/opencode-v2`, `npm install -g @opencode/cli` oder die
Desktop-App von <https://opencode.ai>. Unter Windows das Standalone-Binary von derselben Seite
verwenden. Prüfen:

```bash
opencode --version
```

Danach im Projektordner starten:

```bash
opencode
```

Im Agenten:

```text
/connect
/models
```

`/connect` verbindet den Anbieter (API-Schlüssel oder vorhandener Zugang), `/models` wählt das Modell.
Das Modell muss **Werkzeuge aufrufen**, **Dateien schreiben** und **Bilder bzw. PDF-Seiten lesen** können.
Für dieses Projekt reichen 200.000 Token Kontext; komfortabel sind 1 Million.

**Geeignete Modelle (Stand Oktober 2026):**

| Modell | Kontext | Ausgabe | Einsatz |
|--------|---------|---------|---------|
| Claude Sonnet 5.5 | 1 Mio. | 128 K | guter Standard für Code und längere Dateien |
| Claude Opus 5.5 | 1 Mio. | 128 K | Architektur, schwierige Physik, große Umbauten |
| GPT-6.1 Sol | 1,05 Mio. | 128 K | Coding und Agentenarbeit |
| Gemini 3.8 Flash | 1 Mio. | 65 K | schnelle Iteration, viel Ausgabe |
| Gemini 4 | 1 Mio. | 32 K | Analyse und viel Kontext; für eine komplette Datei zu wenig Ausgabe |

Das sind API-Werte; in Web-Oberflächen können Kontext und Ausgabe niedriger liegen. Modellnamen ändern
sich. Wichtiger als der Name sind vier Eigenschaften: **Werkzeuge**, **Vision**, **mindestens 200 K
Kontext** und ein **Ausgabefenster, das die Datei fassen kann**.

### 1.2 Systemwerkzeuge

```bash
# Debian/Ubuntu
sudo apt install libreoffice poppler-utils git python3

# macOS
brew install --cask libreoffice
brew install poppler git python3
```

Prüfen:

```bash
libreoffice --version
pdftoppm -v
python3 --version
git --version
```

Für PowerPoint-Notizen und reinen Text ist `python-pptx` nützlich:

```bash
python3 -m pip install --user python-pptx
```

### 1.3 Ein Modell mit Vision

Wer PowerPoint-Folien als Bilder liest, braucht ein Modell mit Bildeingabe. Ohne Vision geht es auch:
Dann werden die Folien zu Text extrahiert. Layout, Pfeile und Diagramme gehen dabei aber verloren – bei
einer Physik-Präsentation ist das ein echter Verlust.

**Checkpoint:** `opencode --version` funktioniert, `/models` zeigt ein Modell mit Werkzeugen und
Bildunterstützung, LibreOffice und Poppler sind installiert.

## 2. Die PowerPoint lesen

### 2.1 Warum nicht die PPTX direkt?

OpenCode liest Text, Bilder (PNG, JPEG, GIF, WebP) und PDF. Eine binäre `.pptx` wird nicht als Folie
gerendert. Web-Chats nehmen PPTX zwar oft an, extrahieren aber meist nur Text. Für eine Simulation, die
Pfeile, Feldlinien und Diagramme nachbauen soll, ist das zu wenig.

Der zuverlässigste Weg ist deshalb: **PPTX → PDF → Bilder oder PDF an den Agenten**.

### 2.2 PDF erzeugen (empfohlen)

```bash
mkdir -p material
libreoffice --headless --convert-to pdf \
  --outdir material material/Hertzscher_Dipol_komplett.pptx

ls -lh material/Hertzscher_Dipol_komplett.pdf
pdfinfo material/Hertzscher_Dipol_komplett.pdf | head
```

OpenCode kann PDFs über das `read`-Werkzeug an das Modell geben (bis 20 MiB). Prüfe die Größe:

```bash
du -h material/Hertzscher_Dipol_komplett.pdf
```

Ist die Datei größer als 20 MiB, gibt es zwei Wege:

```bash
# Variante A: Seiten als PNG, in kleinen Gruppen lesen
pdftoppm -png -r 150 material/Hertzscher_Dipol_komplett.pdf material/folie

# Variante B: PDF aufteilen (qpdf installieren) und Teile lesen
qpdf --split-pages=8 material/Hertzscher_Dipol_komplett.pdf material/teil.pdf
```

### 2.3 PNG pro Folie (beste Bildqualität)

```bash
pdftoppm -png -r 150 material/Hertzscher_Dipol_komplett.pdf material/folie
ls material/folie-*.png | head
```

150 dpi reichen für normale Folien. Bei kleinen Beschriftungen sind 200 dpi besser. 28 Folien ergeben
etwa 10–25 MB – das ist handhabbar. Lies die Bilder in Gruppen von fünf bis acht, damit der Kontext
nicht unnötig vollläuft:

```text
Lies material/folie-01.png bis material/folie-06.png.
Fasse pro Folie in zwei Sätzen zusammen, was gezeigt wird, und nenne die physikalischen Aussagen.
```

### 2.4 Nur Text und Notizen

Wenn es schnell gehen soll oder das Modell keine Bilder liest:

```bash
pdftotext -layout material/Hertzscher_Dipol_komplett.pdf material/folien.txt
```

Sprechernotizen stehen nicht im PDF. Dafür `python-pptx`:

```bash
python3 - <<'PY'
from pptx import Presentation

prs = Presentation("material/Hertzscher_Dipol_komplett.pptx")
for i, slide in enumerate(prs.slides, 1):
    print(f"\n--- Folie {i} ---")
    for shape in slide.shapes:
        if shape.has_text_frame and shape.text_frame.text.strip():
            print(shape.text_frame.text)
    if slide.has_notes_slide:
        notes = slide.notes_slide.notes_text_frame.text.strip()
        if notes:
            print("Notizen:", notes)
PY
```

Alternativ konvertiert [MarkItDown](https://github.com/microsoft/markitdown) Office-Dateien nach Markdown:

```bash
pipx install markitdown          # oder: python3 -m pip install --user markitdown
markitdown material/Hertzscher_Dipol_komplett.pptx > material/folien.md
```

### 2.5 Video und andere Quellen

Ein Video würde den Kontext sprengen. Besser:

* den Link im Bauauftrag nennen,
* die relevanten Aussagen als Stichpunkte notieren,
* oder ein Transkript in `material/video-transkript.md` ablegen.

**Checkpoint:** Es gibt `material/Hertzscher_Dipol_komplett.pdf` (oder Folien-PNGs) und eine Textfassung
der wichtigsten Aussagen. Der Agent kann daraus die Kapitelstruktur ableiten.

## 3. Projekt anlegen

```bash
mkdir hertzscher-dipol
cd hertzscher-dipol
git init
mkdir -p material src

cp /pfad/zur/Hertzscher_Dipol_komplett.pptx material/
printf 'material/\n*.log\nsrc/bundle.js\nsrc/icon.dat\n' > .gitignore
```

`material/` bleibt aus dem Repository, wenn die Präsentation nicht frei lizenziert ist. Für die
Nachvollziehbarkeit reicht eine Textfassung oder ein Link.

### 3.1 Bauauftrag schreiben

Lege `BAUAUFTRAG.md` an. Das ist die wichtigste Datei im ganzen Projekt: Sie verhindert, dass der Agent
bei jedem neuen Chat andere Annahmen trifft.

```markdown
# Bauauftrag: Hertzscher Dipol – interaktive Simulation

## Ziel
Eine interaktive Lernsimulation zu Senden und Empfangen mit dem hertzschen Dipol.
Zielgruppe: Oberstufe. Zielgerät: iPad (Safari) und Desktop.

## Technische Randbedingungen
- genau eine HTML-Datei für die Auslieferung, CSS und JS inline
- keine externen Bibliotheken, keine CDNs, kein Internet nötig
- 3D mit Canvas 2D und eigener Projektion, kein WebGL
- Bedienung per Finger: ziehen = drehen, zwei Finger = zoomen
- deutsche Oberfläche, responsive, keine Hover-Abhängigkeiten
- Quellcode in src/ aufgeteilt, build.py erzeugt index.html

## Inhalt
1. Schwingkreis → Dipol
2. Felder und Abstrahlung
3. Senden und Empfangen
4. Nahfeld
5. Fernfeld
6. Polarisation
7. Versuch V1 mit Aufgaben a–f
8. Rechenaufgaben
9. Formeln und Wellenlängen-Rechner

## Physik
- Dipol entlang der y-Achse, Speisung in der Mitte
- f = 1/(2π√(L·C)), L und C mit echten Einheiten
- Dipollänge = λ/2, Frequenz 60–200 MHz
- Feld mit Nahfeld (1/r³), Induktionsfeld (1/r²), Fernfeld (1/r)
- Kontrollwerte: E–B-Phase 90° im Nahfeld, 0° im Fernfeld
- Empfang ∝ sin θ · cos β, am Gitter ∝ sin α · sin(α−β) → sin²α
- Poynting-Vektor im Fernfeld nach außen

## Didaktik
- jede Größe visuell und als Zahl zeigen
- Aufgaben mit Vorhersage, Rückmeldung und Lösungsweg
- keine versteckten Rechenwege; Formel am Bildschirm nachvollziehbar
```

**Checkpoint:** `BAUAUFTRAG.md` ist geschrieben, `material/` enthält die Folien, `git status` ist sauber
oder zeigt nur gewollte Dateien.

## 4. Die erste Agenten-Sitzung

```bash
opencode
```

Wähle das Modell und wechsle für die Analyse in den **Plan-Agenten** (Modus `plan`), für Änderungen
später zurück in **Build** (`build`). Zuerst planen, nicht bauen:

```text
Lies @BAUAUFTRAG.md und @material/Hertzscher_Dipol_komplett.pdf.

Fasse in höchstens 12 Stichpunkten zusammen:
1. welche Kapitel du siehst,
2. welche physikalischen Größen eine Rolle spielen,
3. welche Stellen mehrdeutig sind.

Stelle mir drei Rückfragen. Schreibe noch keinen Code.
```

Korrigiere die Antwort, bevor es weitergeht. Das ist der Moment, in dem teure Missverständnisse
verschwinden.

Dann das Grundgerüst:

```text
Lege das Grundgerüst an:
- src/index.html mit Tab-Navigation und Platzhaltern für CSS/JS/Icon
- src/style.css
- src/core.js: Mathematik, 3D-Projektion, Touch-Orbit, Tab-System
- src/scenes1.js, src/scenes2.js, src/scenes3.js: noch leere Ansichten
- src/build.py: setzt CSS und JS zu einer Datei zusammen
- src/mkicon.py: erzeugt ein einfaches App-Icon als Data-URI

Noch keine Fachinhalte. Ziel: eine leere, aber bedienbare 3D-Bühne.
Baue anschließend `python3 src/build.py index.html` und starte einen lokalen Server.
```

Prüfen:

```bash
python3 src/build.py index.html
python3 -m http.server 8000
```

<http://localhost:8000> öffnen. Es muss eine Bühne geben, die sich mit der Maus bzw. dem Finger drehen
lässt. Noch keine Kapitel, keine Physik.

**Checkpoint:** Build läuft, Seite lädt, Drehen und Zoomen funktionieren, keine Fehler in der Konsole.
Jetzt committen:

```bash
git add -A
git commit -m "Grundgerüst: Tabs, 3D-Bühne, Build"
```

## 5. Warum src/ und ein Build?

Das Original liefert **eine** HTML-Datei aus, entwickelt aber in mehreren Dateien. Das hat zwei Vorteile:

* Die ausgelieferte Datei funktioniert per Doppelklick, per AirDrop und auf GitHub Pages – ohne Server,
  ohne Netz, ohne Build beim Nutzer.
* Der Quellcode bleibt lesbar und der Agent muss beim Ändern eines Kapitels nicht 2.300 Zeilen auf einmal
  umschreiben.

```text
src/index.html   Gerüst mit Platzhaltern /*__CSS__*/ und /*__JS__*/
src/style.css
src/core.js      Mathematik, 3D-Projektion, UI, Tab-System
src/scenes1.js   Zeichenprimitive und Felddarstellung
src/scenes2.js   Kapitel 1–3, 6, 7, 9
src/scenes3.js   Kapitel 4, 5, 8
src/build.py     setzt alles zu index.html zusammen
src/mkicon.py    erzeugt icon.dat (Data-URI)
```

Der Build ist absichtlich primitiv: lesen, ersetzen, schreiben. Kein Bundler, keine Abhängigkeiten.

```bash
python3 src/mkicon.py            # optional, erzeugt src/icon.dat
python3 src/build.py index.html  # baut die ausgelieferte Datei
```

**Checkpoint:** Ein zweiter Build erzeugt dieselbe Datei. `index.html` funktioniert auch per
`file://` und zeigt im Netzwerk-Tab **keine** externen Anfragen.

## 6. Kapitel für Kapitel

Reihenfolge und Physik:

| Kapitel | Inhalt | Prüfpunkt |
|---------|--------|-----------|
| 1 | Schwingkreis → Dipol | L und C sinken, f = 1/(2π√(LC)) steigt; Endwert 100 MHz |
| 2 | Felder und Abstrahlung | E ⊥ B, keine Abstrahlung auf der Dipolachse, Keule im Fernfeld |
| 3 | Senden und Empfangen | Amplitude ∝ sin θ · cos β; Gitter ∝ sin²α; Lampe ∝ \|E\|² |
| 4 | Nahfeld | 1/r³ dominiert, E–B-Phase gegen 90°, Energiefluss pendelt |
| 5 | Fernfeld | 1/r, E–B-Phase gegen 0°, Poynting nach außen |
| 6 | Polarisation | Zerlegung E∥/E⊥, hinter dem Gitter sin²α |
| 7 | Versuch V1 | Aufgaben a–f, Rückmeldung, Sprung in die passende Szene |
| 8 | Rechenaufgaben | 9 Aufgaben mit Werteingabe und Lösungsweg |
| 9 | Formeln | c = λ·f, Wellenlängen-Rechner, Merksätze |

Ein Auftrag pro Kapitel, mit Akzeptanzkriterien:

```text
Ergänze Kapitel 4 (Nahfeld) in src/scenes3.js und der Tab-Navigation.

Inhalt:
- Messpunkt nahe am Dipol, Abstand r und Frequenz f einstellbar
- 1/r³-Anteil überwiegt gegenüber 1/r
- radialer Feldanteil wird sichtbar
- E und B sind bis 90° phasenverschoben
- Energiefluss S = E × B pendelt (grün/rot)

Akzeptanzkriterien:
- bei r < λ/6 ist der 1/r³-Anteil deutlich größer als der 1/r-Anteil
- die Phasendifferenz geht bei kleinem r gegen 90°
- funktioniert bei 60, 100 und 200 MHz
- funktioniert nach Resize und im Querformat
- keine externen Bibliotheken

Ändere nur die betroffenen Dateien. Baue danach index.html.
```

Nach jedem Kapitel:

```bash
python3 src/build.py index.html
# im Browser prüfen
git add -A
git commit -m "Kapitel 4: Nahfeld"
```

**Checkpoint:** Jedes Kapitel ist einzeln bedienbar, die Zahlen passen zur Formel, und der Build ist
committet. Kein Kapitel wird „später zusammen“ getestet.

## 7. Testen

### 7.1 Desktop

* Chrome und Safari (oder Firefox) öffnen.
* Konsole: keine Fehler, keine Warnungen über fehlende Dateien.
* Netzwerk-Tab: keine externen Anfragen. Zum Gegenprüfen im Browser „Offline“ aktivieren und neu laden.
* Fenstergröße ändern, Quer- und Hochformat.
* Frequenz auf 60, 100 und 200 MHz stellen; Dipollänge und Maßstab prüfen.

### 7.2 iPad

* Über die Online-Adresse oder einen lokalen Server öffnen, nicht nur als Datei-Vorschau.
* Ziehen = drehen, zwei Finger = zoomen.
* Regler mit dem Finger, nicht mit der Maus.
* Gitter in Kapitel 6 am blauen Griff drehen.
* „Zum Home-Bildschirm“ testen: kein Adressbalken, Icon vorhanden.
* Randfälle: Hochformat, Querformat, geteilter Bildschirm, dunkler Modus.

### 7.3 Performance

Viele Feldvektoren sehen auf dem Desktop gut aus und ruckeln auf dem Tablet. Wenn es klemmt:

* Anzahl der Vektoren pro Frame reduzieren,
* weit entfernte Vektoren ausblenden,
* `devicePixelRatio` begrenzen,
* Animationen pausieren, wenn der Tab nicht sichtbar ist.

### 7.4 Fehler melden

```text
Bug: Der Drehgriff in Kapitel 6 lässt sich nicht greifen.

Schritte:
1. Kapitel 6 öffnen.
2. Gitter mit dem Regler auf 30° drehen.
3. Blauen Griff mit dem Finger berühren und kreisen.

Erwartet: Das Gitter folgt dem Finger.
Tatsächlich: Nichts passiert, die Konsole zeigt „Trefferradius ist NaN“.

Bitte Ursache nennen und minimal-invasiv beheben. Keine Umgestaltung.
```

**Checkpoint:** Die Testmatrix ist einmal vollständig durchlaufen. Gefundene Fehler sind mit
Reproduktion, Erwartung und Konsolenausgabe dokumentiert.

## 8. Physik prüfen

Der Agent kann Code schreiben, aber nicht entscheiden, ob die Physik stimmt. Lass ihn die Formeln
dokumentieren und prüfe sie selbst:

```text
Schreibe PHYSIK.md mit:
- jeder verwendeten Formel,
- den Einheiten,
- den Grenzfällen (r → 0, r → ∞, θ = 0),
- den Kontrollwerten, die man im UI sehen muss.

Keine neuen Features. Nur dokumentieren, was der Code tut.
```

Kontrollwerte für dieses Projekt:

* **Schwingkreis:** L = 100 µH, C = 1 nF → f = 1/(2π√(LC)) ≈ 503 kHz.
* **Wellenlänge:** 100 MHz → λ = c/f ≈ 3,00 m; λ/2 ≈ 1,50 m.
* **Dipollänge:** 60 MHz → 2,50 m; 100 MHz → 1,50 m; 200 MHz → 0,75 m.
* **Nahfeld/Fernfeld:** E–B-Phase 90° → 0°; Poynting im Fernfeld nach außen.
* **Richtcharakteristik:** keine Abstrahlung entlang der Dipolachse (θ = 0).
* **Polarisation:** hinter dem Gitter \|E∥\| = \|E\|·sin²α.
* **Empfang:** Amplitude ∝ sin θ · cos β; Leistung ∝ \|E\|².

Ein zweites Modell oder ein Kollege prüft die Physik, nicht den Code. Das ist keine Bürokratie: Ein
falscher Faktor fällt im Unterricht sonst erst den Schülern auf.

**Checkpoint:** `PHYSIK.md` existiert, die Zahlen sind nachgerechnet, die Grenzfälle stimmen.

## 9. Veröffentlichen

### 9.1 GitHub Pages

```bash
touch .nojekyll
git add .nojekyll
git commit -m "GitHub Pages: Jekyll deaktivieren"

git remote add origin https://github.com/<user>/hertzscher-dipol.git
git branch -M main
git push -u origin main
```

Im Browser: **Settings → Pages → Deploy from branch → Branch `main`, Ordner `/root` → Save**.
Die leere Datei `.nojekyll` im Wurzelverzeichnis verhindert die Jekyll-Verarbeitung.

Nach ein bis zwei Minuten:

```text
https://<user>.github.io/hertzscher-dipol/
```

### 9.2 Ohne GitHub

* **Netlify Drop:** <https://app.netlify.com/drop> – Ordner mit `index.html` hineinziehen, Link kopieren.
* **Beliebiger statischer Webspace:** `index.html` hochladen, fertig.
* **Nur lokal:** `index.html` per AirDrop auf das iPad, in Safari öffnen.

### 9.3 iPad

1. Adresse in Safari öffnen.
2. Teilen-Symbol → „Zum Home-Bildschirm“.
3. Icon antippen – die Simulation startet im Vollbild.

**Checkpoint:** Die öffentliche Adresse lädt und das Icon ist da. Offline funktioniert die lokal
gespeicherte `index.html`.

## 10. Wenn es klemmt

| Problem | Ursache | Lösung |
|---------|---------|--------|
| `opencode: command not found` | Installation nicht im `PATH` | Neu installieren, Shell neu starten |
| Modell liest die Folien nicht | Modell ohne Vision oder PDF zu groß | PNG pro Folie, Modell mit Bildeingabe wählen |
| PDF über 20 MiB | Hohe Auflösung, viele Bilder | `pdftoppm -r 120`, PDF aufteilen |
| Antwort bricht mitten im HTML ab | Ausgabelimit oder Chat-Oberfläche | In Teilen arbeiten, Moduldateien, „gib nur den geänderten Block aus“ |
| Kontext voll | Zu viele Dateien/Bilder geladen | Neue Sitzung mit Zusammenfassung + aktueller Datei |
| Build schlägt fehl | Falscher Ordner oder fehlende Schreibrechte | Aus dem Repo-Wurzelverzeichnis starten, Zielpfad prüfen |
| Icon fehlt | `src/icon.dat` nicht erzeugt | `python3 src/mkicon.py`, dann neu bauen |
| Touch geht nicht | Maus-Events statt Pointer-Events | Auf `pointerdown`/`pointermove` umstellen, Hover vermeiden |
| GitHub Pages 404 | Falscher Branch/Ordner oder noch nicht deployed | Einstellungen prüfen, ein bis zwei Minuten warten |
| iPad zeigt nur Vorschau | Datei direkt geöffnet | Über `http://` oder GitHub Pages öffnen |

## 11. Checkliste

- [ ] OpenCode installiert, Modell mit Werkzeugen und Vision gewählt
- [ ] LibreOffice, Poppler, Python und Git vorhanden
- [ ] PPTX als PDF und/oder PNG aufbereitet
- [ ] `BAUAUFTRAG.md` mit Ziel, Technik, Inhalt und Physik geschrieben
- [ ] Grundgerüst gebaut, im Browser getestet, committet
- [ ] jedes Kapitel einzeln ergänzt und getestet
- [ ] keine externen Abhängigkeiten, offline getestet
- [ ] auf dem iPad getestet (Touch, Vollbild, Querformat)
- [ ] `PHYSIK.md` geschrieben und Kontrollwerte nachgerechnet
- [ ] `index.html` gebaut und veröffentlicht
- [ ] Repository enthält `README.md`, `TUTORIAL.md`, `src/` und `.nojekyll`

## Anhang: Der Bauauftrag als Kopiervorlage

```text
Baue eine interaktive Lernsimulation zum [Thema] für [Zielgruppe].
Zielgerät: [iPad/Safari, Desktop].

Technische Randbedingungen:
- genau eine HTML-Datei für die Auslieferung, CSS und JS inline
- keine externen Bibliotheken, keine CDNs, kein Internet nötig
- 3D mit Canvas 2D und eigener Projektion (kein WebGL)
- Bedienung per Finger: ziehen = drehen, zwei Finger = zoomen
- deutsche Oberfläche, responsive, keine Hover-Abhängigkeiten
- Quellcode in src/ aufgeteilt, build.py erzeugt index.html

Inhalt: [Kapitel 1–9 mit je einem Satz]
Physik: [Formeln, Einheiten, Bezugswerte, Grenzfälle]
Didaktik: [was Lernende selbst verändern können, welche Aufgaben]

Liefere zuerst nur das Grundgerüst: Tabs, leere 3D-Bühne, Touch-Orbit,
Resize-Handling. Noch keine Fachinhalte. Danach Kapitel für Kapitel.
```
