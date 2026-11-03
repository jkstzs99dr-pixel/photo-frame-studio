# Feature-Backlog

Prioritäten: **P1** kritisch · **P2** wichtig · **P3** nice-to-have · **D** nur mit Desktop-App sinnvoll
Status: ✅ umgesetzt · 🟡 teilweise · ⬜ offen

## Umgesetzt (Prototyp v1.0-rc4)

| ID | Feature | Status | Hinweise |
|---|---|---|---|
| B-01 | Drag & Drop / Dateiauswahl, mehrere Bilder, Vorschau | ✅ | |
| B-02 | Weißer Rahmen, Breite einstellbar | ✅ | in % der langen Kante |
| B-03 | Modus „Aufnahmedaten im Rand" vs. gleichmäßiger Rahmen | ✅ | |
| B-04 | Drei Textzeilen, automatische Schriftverkleinerung | ✅ | |
| B-05 | Fuji-MakerNote (Film-Simulation, DR, WB, Color Chrome, FX Blue, Tone, Sharpness, Color, Grain, Clarity) | 🟡 | X100VI (Acros-JPEG, Nostalgic-Neg.-RAF, Provia-DR200-JPEG hochkant) und X100F (Acros-G-, Provia-JPEG) verifiziert; X-M5 und weitere Simulationen offen |
| B-06 | Sony-MakerNote (Creative Style, DRO) + EV | 🟡 | nur synthetisch getestet |
| B-07 | RAW über eingebettetes Vorschau-JPEG (ARW/SR2/SRF/RAF, Best Effort DNG/NEF/CR2/ORF) | 🟡 | RAF mit X100VI verifiziert; ARW und übrige nur synthetisch |
| B-08 | Wasserzeichen-Text, Deckkraft | ✅ | Position fest unten rechts |
| B-09 | Ausgabegröße nach Verwendungszweck | ✅ | lange Kante inkl. Rahmen, kein Hochskalieren |
| B-10 | Export einzeln / ZIP, JPEG-Qualität | ✅ | ZIP unkomprimiert |
| B-11 | Info-Dialog, Favicon, Einstellungen merken | ✅ | |
| F-05 | Presets speichern, exportieren, importieren (JSON) | ✅ | 3 Standard-Presets (nur Format/Größe); eigene Presets mit allen Einstellungen inkl. Autor/Copyright |
| F-04 | Zielseitenverhältnis (1:1, 4:5, 9:16, 3:2, 2:3, 3:2/2:3 automatisch) | ✅ | Auffüllen mit weißem Rand, Abzug (Foto + Text) mittig; kein Beschnitt |
| F-03 | GPS-Schalter | ✅ | Standard aus; Hinweis an der Bildkarte, wenn das Original einen Standort enthält |
| F-02 | Copyright / Autor (Exif, IPTC, XMP) | ✅ | leere Felder = Kamera-Werte bleiben; Anzeige in Lightroom/Flickr usw. nicht geprüft |
| F-01 | Exif in Ausgabedatei erhalten | 🟡 | ohne Sony-MakerNote; nur synthetisch getestet (Chromium, WebKit, Firefox) |

## Backlog

### P1 – kritisch

| ID | Feature | Nutzen | Machbar im Browser |
|---|---|---|---|
| F-01 | ~~Exif in Ausgabedatei erhalten~~ | umgesetzt in v0.6, siehe oben | Ja |
| F-02 | ~~Copyright / Autor~~ | umgesetzt in v0.7, siehe oben | Ja |
| F-03 | ~~GPS-Schalter~~ | umgesetzt in v0.8, siehe oben | Ja |
| F-04 | ~~Zielseitenverhältnis~~ | umgesetzt in v0.9, siehe oben | Ja |
| F-05 | ~~Presets/Profile~~ | umgesetzt in v1.0-rc, siehe oben | Ja |
| F-06 | **Echte Kamera-Testdateien** (Fuji, Sony) als Fixtures – 🟡 X100VI (RAF, JPEG hochkant) und X100F (2 JPEGs) geprüft; Rest (Sony, X-M5, Classic Chrome, Hochformat-RAF) zurückgestellt → Roadmap Phase 3 | Mapping verlässlich machen | – |

### P2 – wichtig

| ID | Feature | Machbar im Browser |
|---|---|---|
| F-10 | Mehrere Ausgaben gleichzeitig (z. B. Mail + Insta + Print in einem ZIP) | Ja |
| F-11 | Rahmen-Stile: Polaroid, Passepartout, schwarz, freie Farbe, Innenlinie | Ja |
| F-12 | Text-Vorlagen mit Platzhaltern (`{kamera}`, `{objektiv}`, `{datum}`, `{ort}`, `{titel}`), Überschreiben pro Bild | Ja |
| F-13 | Wasserzeichen als Logo/Signatur (PNG), Position/Größe, dunkle Variante | Ja |
| F-14 | Caption-Generator für Social Media (Aufnahmedaten + Hashtags in Zwischenablage) | Ja |
| F-15 | Teilen-Button (Web Share API) | Teilweise (Safari/Chrome; Firefox nicht) |
| F-16 | Filter nach Bewertung (XMP-Rating) | Teilweise |
| F-17 | Dateinamen-Muster | Ja |
| F-18 | HEIC-Eingabe (iPhone) | Nur Safari nativ |
| F-19 | Weitere Hersteller: Canon Picture Style, Nikon Picture Control, Sony Picture Profile | Ja (Testdateien nötig) |

### P3 – nice-to-have

| ID | Feature |
|---|---|
| F-30 | Große Vorschau / Lightbox, Vorher-Nachher |
| F-31 | Fuji-Rezept-Karte als eigenes Bild |
| F-32 | Kontaktbogen / Collage, Panorama-Splitting für Karussells |
| F-33 | Ortsname aus GPS (Netzwerk nötig → Konflikt mit ADR 0002, nur opt-in) |
| F-34 | Farbprofil-Handling (Display P3 → sRGB) |
| F-35 | Mehrsprachigkeit (DE/EN) – aktuell nicht benötigt, [ADR 0003](adr/0003-oeffentlich-deutsch-mit.md) |

### D – nur Desktop

Zurückgestellt: Es werden vorerst nur browser-taugliche Features umgesetzt ([ADR 0001](adr/0001-auslieferung-pwa-statt-desktop.md)).

| ID | Feature |
|---|---|
| D-01 | Echtes RAW-Entwickeln in voller Auflösung (z. B. LibRaw) |
| D-02 | Ordner überwachen und automatisch verarbeiten |
| D-03 | Kontextmenü im Finder/Explorer, Export-Ziel für digiKam/Lightroom |
| D-04 | Direkt in Zielordner schreiben ohne Download-Dialog (im Browser nur Chrome teilweise) |
| D-05 | Sehr große Serien/Bilder ohne Browser-Speichergrenzen |
