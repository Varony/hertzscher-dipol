# Hertzscher Dipol – interaktive Simulation

Interaktive Lern-Simulation zu **Senden und Empfangen mit dem hertzschen Dipol**.
Umgesetzt nach der Präsentation *„Hertzscher_Dipol_komplett.pptx“* (Kapitel 3.1, Elektromagnetische Wellen)
und dem Video *„Hertz'sche Dipolstrahlung als Nachweis elektromagnetischer Strahlung“* (Matthias Kohl).

**Datei:** `index.html` – eine einzige, in sich geschlossene HTML-Datei (kein Internet, keine Bibliotheken, keine Installation nötig).

**Online:** <https://varony.github.io/hertzscher-dipol/> (GitHub Pages, immer die aktuelle Version)

## Auf dem iPad starten

**Empfohlen – über die Online-Adresse:**

1. In **Safari** öffnen: <https://varony.github.io/hertzscher-dipol/>
2. Teilen-Symbol → **„Zum Home-Bildschirm“** → startet ohne Adressleiste im Vollbild wie eine App (Icon ist eingebaut).

**Ohne Internet – Datei direkt:**

1. `index.html` aufs iPad übertragen (iCloud Drive, LocalSend, Mail-Anhang).
2. In der **Dateien**-App antippen – die Simulation läuft (WebKit-Vorschau). Für Vollbild stattdessen die Datei über einen kleinen lokalen Webserver (`python3 -m http.server` am Rechner) im Netz bereitstellen und die Adresse in Safari öffnen.

Bedienung: **Ziehen = drehen**, **zwei Finger = zoomen**, Regler mit dem Finger, das Gitter in Kapitel 6 am blauen Drehgriff.

## Die neun Kapitel

| # | Kapitel | Inhalt |
|---|---------|--------|
| 1 | Schwingkreis → Dipol | Aufbiegen, Abwickeln (Windungen sinken, Draht streckt sich), Verkleinern – L und C sinken, f steigt (Folie 4) |
| 2 | Felder & Abstrahlung | E- und B-Feld (in Phase, senkrecht), Nahfeld r < λ, Abstrahlkeule, kein Feld entlang der Achse |
| 3 | Senden & Empfangen | Empfangsdipol mit Lämpchen: Abstand, Höhenwinkel θ, Richtung φ, Ausrichtung β, Metallgitter α, Induktionsschleife |
| 4 | Nahfeld | Messpunkt nahe am Dipol: 1/r³-Anteil überwiegt, radialer Feldanteil, E und B bis 90° phasenverschoben, Energiefluss pendelt (grün/rosa) |
| 5 | Fernfeld | Wellenfronten laufen nach außen, E ⊥ B und **in Phase** (Δφ → 0°), transversales 1/r-Feld, Energiefluss dauerhaft nach außen |
| 6 | Polarisation (3D) | E-Welle läuft auf das drehbare Gitter zu: Zerlegung E∥ / E⊥, hinter dem Gitter ist das Feld gedreht, |E_E,∥| = |E_S|·sin²α |
| 7 | Versuch V1 | Aufgaben a–f mit Vorhersage, Rückmeldung und „In der Simulation zeigen“ |
| 8 | Rechenaufgaben | 9 Aufgaben mit Werteingabe, Prüfung und aufklappbarem Lösungsweg (λ, f, Abstandsgesetz, Polarisation, Leistungsdichte) |
| 9 | Formeln | c = λ·f, Wellenlängen-Rechner mit Maßstab, Merksätze und Vergleichstabelle |

## Physik-Hinweise

* **Speisung:** Der Hochfrequenzgenerator speist den Sendedipol **in der Mitte** – die beiden Dipolhälften
  sind die „Platten“ des aufgebogenen Kondensators. Die Ladungen sitzen daher an den **äußeren Enden**
  (Mitte ladungsfrei, dort maximaler Strom) und wechseln periodisch ihr Vorzeichen.
* Dipollänge fest **1,50 m** (λ/2 bei 100 MHz); die Frequenz ist zwischen 60 und 200 MHz einstellbar.
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
* Kapitel 4: Gitter über den Regler **oder den blauen Drehgriff direkt am Gitter** drehen (Finger aufsetzen und kreisen)
* Kapitel 3: „▶ In der Simulation zeigen“ (Kapitel 5) stellt die passende Versuchsanordnung ein

## Quellen

* Präsentation `Hertzscher_Dipol_komplett.pptx` (28 Folien, Kapitel 3.1, Versuch V1 / V1e)
* Video: <https://youtu.be/HIweE_DCluQ> – „Hertz'sche Dipolstrahlung als Nachweis elektromagnetischer Strahlung“
