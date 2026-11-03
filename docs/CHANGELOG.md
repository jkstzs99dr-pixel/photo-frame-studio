# Changelog

Entstehung des Prototyps (alle Schritte am 2026-11-02).

## v1.0-rc4 – Veröffentlichung vorbereitet
- Entscheidungen festgehalten in ADR 0003: öffentliches Repo mit frischem Start (altes Repo bleibt privat als Archiv), nur Deutsch, MIT-Lizenz (`LICENSE`)
- Wasserzeichen-Text standardmäßig leer (vorher „Peter Tischer“); Platzhalter für Autor/Copyright ohne echten Namen
- Roadmap: offene Entscheidungen beantwortet, Hosting über GitHub Pages

## v1.0-rc3 – Drehung und DR200 mit echten Dateien geklärt (F-06, Teil 3)
- Geprüft mit `DSCF8424.JPG` (X100VI, unbearbeitet von der Karte, hochkant mit Orientation 8, Provia, DR200 manuell, WB Daylight mit Feinabstimmung): Drehung in Chromium, WebKit und Firefox korrekt (Ausgabe hochkant, Orientation 1), Textzeilen und Exif korrekt
- Geprüft mit `DSCF7088.JPG` (X100F, in digiKam gespeichert, Provia, Cloudy): korrekt
- DR geklärt: X100VI und X100F schreiben bei manuellem DR immer 0x1402 = 1 und den Wert in 0x1403. **Entfernt:** Zuordnung 0x100/0x200/0x201 → DR100/DR200/DR400 (widersprach exiftool, wurde von keiner geprüften Kamera genutzt); solche Werte werden jetzt weggelassen
- Beide Dateien als Fälle in `tests/e2e/mapping.mjs`, dazu ein Fall für den entfernten DR-Zweig
- WB-Feinabstimmung 40/−100 → R+2 B−5: Einstellung an der Kamera bestätigt (Umrechnung Rohwert / 20 damit verifiziert)
- Weitere Kompatibilitätsprüfungen (Sony-JPEG/ARW, X-M5, Classic Chrome, Hochformat-RAF) zurückgestellt, bis Dateien verfügbar sind → Roadmap Phase 3

## v1.0-rc2 – Prüfung mit echtem X100F-JPEG (F-06, Teil 2)
- Geprüft mit `DSCF7063.JPG` (X100F, Firmware 2.11, Acros Green Filter, DR100 manuell, Daylight, Artist „Peter Tischer“) gegen exiftool: Textzeilen, Exif-Ausgabe (Fuji-Tags 1:1 identisch, Artist erhalten, leerer Copyright-Platzhalter entfällt) korrekt
- Befund: X100F schreibt bei S/W kein FilmMode-Tag, Simulation nur in Saturation – vom Prototyp richtig behandelt
- Keine Codeänderung; X100F-Werte als weiterer Fall in `tests/e2e/mapping.mjs`

## v1.0-rc2 – Prüfung mit echter X100VI-RAF (F-06, Teil 1)
- Geprüft mit `DSCF7711.RAF` (X100VI, Nostalgic Neg., DR400, Kelvin 6000, GPS) gegen exiftool: Textzeilen, Exif-Ausgabe, alle Fuji-Tags (1:1 identisch) und GPS-Schalter korrekt
- Korrektur: leere Text-Platzhalter der Kamera (Artist/Copyright aus Leerzeichen) werden nicht mehr in die Ausgabe übernommen
- Verbesserung: bei Weißabgleich Kelvin zeigt Zeile 3 die Farbtemperatur (`WB 6000K` statt `WB Kelvin`)
- Neuer Test `tests/e2e/mapping.mjs` mit den ausgelesenen Werten der echten Datei (ohne das Foto); Sony-Testdatei mit leeren Platzhaltern
- `docs/EXIF-MAPPING.md`: Status der Fuji-Tags aktualisiert

## v1.0-rc – Presets (F-05)
- Neue Preset-Leiste oben im Einstellungsbereich: Auswahl, „Einstellungen speichern …“, Löschen, Exportieren, Importieren
- Standard-Presets (fest, nicht löschbar, setzen nur Format und Größe): Instagram (4:5, 1350 px, GPS aus), Story (9:16, 1920 px, GPS aus), Print 10×15 (3:2/2:3, 1772 px)
- Eigene Presets speichern **alle** Einstellungen inkl. Autor, Copyright und Wasserzeichen-Text (im Browser gemerkt)
- Export aller eigenen Presets als `rahmen-presets.json`; Import ersetzt gleichnamige, verwirft unbekannte Felder, falsche Typen und ungültige Auswahlwerte, begrenzt Reglerwerte
- Neue Ausgabegröße „Instagram Hochformat – 1350 px“ und neues Seitenverhältnis „3:2 / 2:3 passend zur Bildausrichtung“
- Neuer Test `tests/e2e/presets.mjs`

## v0.9 – Zielseitenverhältnis (F-04)
- Neue Auswahl „Seitenverhältnis“: Wie Bild, 1:1, 4:5 (Instagram), 9:16 (Story/Reels), 3:2, 2:3 (Fotoabzug); im Browser gemerkt
- Das gerahmte Bild samt Textstreifen wird **mittig** auf eine weiße Fläche im Zielformat gesetzt („Abzug mittig“), nichts wird abgeschnitten
- Ausgabegröße gilt für das fertige Bild inklusive Auffüllfläche; Vorschau, Kartenangabe und Exif-Maße stimmen überein
- Print-Hinweise verweisen auf 3:2 bzw. 2:3
- Neuer Test `tests/e2e/ratio.mjs`

## v0.8 – GPS-Schalter (F-03)
- Neuer Haken „Standort (GPS) in die Datei übernehmen“, **standardmäßig aus** (im Browser gemerkt)
- Mit Haken wird das GPS-IFD des Originals vollständig übernommen; Bilder ohne Standort bekommen keinen
- Bildkarte zeigt „GPS-Standort im Original (wird entfernt / wird übernommen)“
- Neuer Test `tests/e2e/gps.mjs`; Fuji-Testdatei hat jetzt auch einen Längengrad

## v0.7 – Autor und Copyright (F-02)
- Neue Felder „Autor“ und „Copyright-Vermerk“ in den Einstellungen (werden im Browser gemerkt)
- Ausgefüllt → geschrieben in Exif (Artist, Copyright), IPTC (By-line, CopyrightNotice, UTF-8) und XMP (dc:creator, dc:rights); ersetzen die Kamera-Werte
- Leer → Artist/Copyright aus der Kamera bleiben unverändert, kein IPTC/XMP
- Auch Bilder ohne Exif bekommen Autor/Copyright, sonst wird nichts ergänzt
- Leeres IPTC-Segment aus Safaris Canvas-Export wird entfernt
- Neuer Test `tests/e2e/copyright.mjs`; Fuji-Testdatei hat jetzt Artist/Copyright aus der „Kamera“

## v0.6 – Exif in der Ausgabedatei (F-01)
- Ausgabe-JPEGs enthalten jetzt Exif aus dem Original (JPEG, RAF, ARW/TIFF-RAW): Kamera, Objektiv, Belichtung, Aufnahmedatum, Copyright/Artist (falls vorhanden)
- Orientation wird auf 1 gesetzt (Drehung steckt in den Pixeln), Bildmaße auf die tatsächliche Ausgabe
- Fuji-MakerNote wird übernommen; Sony- und andere MakerNotes nicht (Offsets wären ungültig)
- **GPS wird nicht übernommen**, bis es einen Schalter gibt (F-03); kein Miniaturbild, keine dpi-Angabe
- Eigenes Exif des Canvas-Exports (Safari) wird entfernt
- Neuer Test `tests/e2e/exif.mjs` (Prüfung mit exiftool, auch in WebKit und Firefox), neue Testdatei `DSCF0001.JPG`

## v0.5 – Ausgabegröße nach Verwendungszweck
- Auswahl: Original, E-Mail & Messenger, Social Media, Web & Bildschirm, Print (300 dpi)
- Zielgröße gilt für die lange Kante **inkl. Rahmen**, kein Hochskalieren
- Ausgabemaße und Megapixel pro Bildkarte, Hinweistext je Zweck

## v0.4 – Info-Dialog
- Button „ⓘ Info" mit Funktionen, unterstützten Dateien und Einschränkungen

## v0.3 – Sony und RAW
- Sony-MakerNote: Creative Style (0xB020), DRO (0xB025); Belichtungskorrektur (Exif 0x9204) für alle Hersteller
- RAW-Eingabe über eingebettetes Vorschau-JPEG: ARW/SR2/SRF, RAF; Best Effort DNG/NEF/CR2/ORF
- Orientierung aus RAW wird angewendet, Ausgabename `<name>_<ext>_rahmen.jpg` für RAWs

## v0.2 – Rahmen-Modus, Wasserzeichen, Favicon
- Checkbox „Aufnahmedaten im unteren Rand" (aus = gleichmäßiger Rahmen)
- Wasserzeichen-Text (Standard „Peter Tischer"), Deckkraft, unten rechts
- Eingebettetes Favicon (SVG + PNG, Apple-Touch-Icon)

## v0.1 – Webapp aus dem Shell-Skript
- Single-File-HTML: Drag & Drop, Fuji-MakerNote direkt im Browser gelesen, Rand/Streifen/Qualität einstellbar, Einzel- und ZIP-Export

## v0 – Shell-Skript
- `scripts/rahmen_fuji.sh` mit ImageMagick + exiftool: Rahmen + drei Textzeilen, Fuji-Felder (Acros-Sonderfall in `Saturation`, `FujiFilm:Sharpness`, `DynamicRangeSetting`/`AutoDynamicRange`)
