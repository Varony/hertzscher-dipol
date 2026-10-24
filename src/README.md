# Quellcode

Die Projekt-Dokumentation steht im Wurzelverzeichnis:

* [README.md](../README.md) – Übersicht, Voraussetzungen, Browser-Workflow und Tipps
* [TUTORIAL.md](../TUTORIAL.md) – Schritt für Schritt von der PowerPoint bis GitHub Pages

## Bauen

```bash
python3 mkicon.py
python3 build.py ../index.html
```

`build.py` setzt `index.html`, `style.css`, `core.js` und `scenes*.js` zur ausgelieferten
`../index.html` zusammen. `icon.dat` und `bundle.js` sind erzeugte Dateien und müssen nicht
eingecheckt werden.
