# CLAUDE.md – Projektkontext Photo Frame Studio

Diese Datei gibt Claude Code den nötigen Kontext. Bitte vor jeder Änderung lesen.

## Ziel

Ein schnelles, lokales Werkzeug, mit dem Fotograf:innen Bilder zum Veröffentlichen aufbereiten:
weißer Rahmen wie ein Fotoabzug, Aufnahmedaten im Rand, Wasserzeichen, Ausgabegröße nach Verwendungszweck.
Zielgruppe zunächst: Projektinhaber (Fuji X100VI, X-M5) und Bekannte mit Sony-Kameras.

## Projektinhaber und Zusammenarbeit

- Projektinhaber: Peter. Kommunikation auf **Deutsch**, sachlich, strukturiert, direkt umsetzbar.
- Peter ist **kein Programmierer**: Technische Schritte (Terminal, Git, Build) kurz und schrittweise erklären, Befehle copy-paste-fähig liefern.
- Unsicherheiten klar markieren (`[unsicher]`), nichts als verifiziert darstellen, was nicht mit echten Dateien geprüft ist.
- Bei mehreren Wegen: Optionen A/B/C mit Aufwand/Risiko/Wirkung und eine Empfehlung.

## Harte Anforderungen (nicht verhandelbar)

1. **Keine Bild-Uploads.** Sämtliche Verarbeitung lokal (Browser bzw. später App). Keine Telemetrie, keine externen Requests zur Laufzeit. Siehe [ADR 0002](docs/adr/0002-verarbeitung-lokal.md).
2. **Originale nie verändern.** Ausgabe immer als neue Datei.
3. **Fehlende Metadaten weglassen**, nie raten oder Platzhalter ausgeben.
4. Funktionsfähig in aktuellen Versionen von Safari, Chrome, Edge, Firefox (macOS, Windows, Linux).

## Aktueller Stand

- `prototype/rahmen.html` ist die **Referenzimplementierung** (v1.0-rc4, Single-File, Vanilla JS, keine Abhängigkeiten).
  Verhalten und Ausgabe-Layout sind der Maßstab für jede Neuimplementierung.
- `scripts/rahmen_fuji.sh` ist die ursprüngliche CLI-Variante (ImageMagick 7 + exiftool, macOS). Nur noch Referenz.
- Entwicklungsverlauf: [docs/CHANGELOG.md](docs/CHANGELOG.md).

## Architektur des Prototyps (prototype/rahmen.html)

| Abschnitt | Aufgabe |
|---|---|
| `readIFD`, `val` | Generischer TIFF/IFD-Parser (Typen 1–13, Endianness, Schutz gegen kaputte IFDs) |
| `parseExif` | JPEG: APP1/Exif finden, `parseTiff` aufrufen |
| `parseTiff` | IFD0 (Make, Model, Orientation), ExifIFD (Belichtung, Objektiv, EV), MakerNotes Fuji und Sony |
| `parseRaw` | RAW: Fuji-RAF-Header bzw. TIFF-basierte RAWs durchsuchen, größtes eingebettetes JPEG wählen, Orientierung übernehmen |
| `buildLines`, `fujiLine`, `sonyLine`, `generalLine` | Die drei Textzeilen erzeugen |
| `plan`, `finalDims`, `padDims` | Zielgröße (lange Kante inkl. Rahmen und Auffüllfläche, nie hochskalieren), Zielseitenverhältnis (Abzug mittig) |
| `drawFramed` | Canvas: Rahmen, Textstreifen, Text (auto-verkleinert), Wasserzeichen |
| `getSource`, `rotCanvas` | Bild laden, ggf. Orientierung manuell anwenden |
| `pickTags`, `buildApp1`, `withExif` | Exif fürs Ausgabe-JPEG neu aufbauen (Whitelist, Orientation 1, neue Maße, Fuji-MakerNote, GPS nur mit Haken) und einsetzen |
| `ownTags`, `buildXmp`, `buildApp13` | Autor/Copyright aus den Einstellungen als Exif-Tags, XMP (dc) und IPTC (APP13) |
| `STD`, `cleanSettings`, `renderPresets` | Presets: Standard-Presets (nur Format/Größe), eigene Presets (alle Einstellungen) in localStorage, Export/Import als JSON mit Bereinigung |
| `makeZip`, `crc32` | ZIP ohne Kompression (Store) |
| UI | Einstellungen (localStorage), Karten mit Vorschau, Info-Dialog |

Fachliche Details zu Tags und Werten: [docs/EXIF-MAPPING.md](docs/EXIF-MAPPING.md).

## Geplante Richtung

- Repo ist **öffentlich** (MIT), Oberfläche und Doku nur **Deutsch** ([ADR 0003](docs/adr/0003-oeffentlich-deutsch-mit.md)). Commits mit der anonymen GitHub-Adresse, keine privaten Mailadressen.
- Empfohlen (noch nicht final entschieden): **PWA im GitHub-Repo**, später optional Tauri-Desktop-Build. Siehe [ADR 0001](docs/adr/0001-auslieferung-pwa-statt-desktop.md).
- Bei Modularisierung: Logik in testbare Module trennen (`exif/`, `render/`, `export/`, `ui/`), Build z. B. mit Vite. Der Single-File-Prototyp bleibt bis zur Feature-Parität erhalten.
- Backlog mit Prioritäten: [docs/FEATURES.md](docs/FEATURES.md). Phasen: [docs/ROADMAP.md](docs/ROADMAP.md).

## Tests

- `npm test` (Skript `tests/run-all.mjs`) führt alle Tests in Chromium, WebKit und Firefox aus; `BROWSERS=webkit npm test` schränkt ein. Dieselben Tests laufen per GitHub Actions (`.github/workflows/tests.yml`) bei jedem Push auf `main` und jedem Pull Request, je Browser ein Job. Neue Testdateien in `tests/run-all.mjs` eintragen.
- Veröffentlichung: `.github/workflows/pages.yml` stellt `prototype/rahmen.html` als `index.html` auf GitHub Pages (https://jkstzs99dr-pixel.github.io/photo-frame-studio/) – automatisch nach grünem Test-Lauf auf `main`, manuell über „Run workflow“.
- `python3 tests/fixtures/make_fixtures.py` erzeugt synthetische Testdateien (Basis-JPEG, Sony-JPEG mit MakerNote, ARW-artige TIFF-Datei mit Vorschau-JPEG und Orientierung 6, RAF-Attrappe).
- `node tests/e2e/smoke.mjs` lädt den Prototyp in Headless-Chromium und prüft Textzeilen, Maße, Modi und Downloads.
- `node tests/e2e/exif.mjs` prüft das Exif der Ausgabedateien unabhängig mit `exiftool` (inkl. `-validate`). Mit `BROWSER=webkit` bzw. `BROWSER=firefox` in den anderen Engines ausführen – Safari schreibt beim Canvas-Export eigenes Exif und leeres IPTC.
- `node tests/e2e/copyright.mjs` prüft Autor/Copyright (F-02) in Exif, IPTC und XMP, ebenfalls mit `BROWSER=…`.
- `node tests/e2e/gps.mjs` prüft den GPS-Schalter (F-03) und den Hinweis an der Bildkarte, ebenfalls mit `BROWSER=…`.
- `node tests/e2e/ratio.mjs` prüft das Zielseitenverhältnis (F-04): Maße, mittige Lage in der Vorschau, gespeicherte Datei, ebenfalls mit `BROWSER=…`.
- `node tests/e2e/presets.mjs` prüft Presets (F-05): Standard-Presets, Speichern/Laden/Löschen, Export/Import inkl. ungültiger Dateien, ebenfalls mit `BROWSER=…`.
- `node tests/e2e/mapping.mjs` prüft `fujiLine` mit MakerNote-Werten aus echten Kameradateien (nur Werte, keine Fotos). Neue echte Dateien hier als Fall ergänzen.
- **Wichtig:** Synthetische Dateien prüfen nur die eigene Implementierung. Echte Kameradateien (Fuji, Sony) als Fixtures fehlen noch und sind für Mapping-Änderungen Pflicht. Echte Fotos nicht committen ([ADR 0003](docs/adr/0003-oeffentlich-deutsch-mit.md)); stattdessen ausgelesene Werte in `tests/e2e/mapping.mjs`.

## Konventionen

- UI-Texte und Dokumentation auf Deutsch; Code-Bezeichner englisch, Kommentare kurz auf Deutsch.
- Änderungen am Verhalten in `docs/CHANGELOG.md` eintragen, Feature-Status in `docs/FEATURES.md` pflegen.
- Architekturentscheidungen als ADR in `docs/adr/` (fortlaufend nummeriert).
- Keine Hersteller-Logos einbinden (Markenrecht ungeklärt).
