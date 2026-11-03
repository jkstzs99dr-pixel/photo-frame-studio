# Exif- und MakerNote-Mapping

Stand des Prototyps v1.0-rc4. **Verifiziert** = mit echter Kameradatei geprüft (bisher: X100VI-JPEG Acros, X100VI-RAF Nostalgic Neg. vom 2026-10-03, X100F-JPEGs Acros Green Filter und Provia von 2022, X100VI-JPEG Provia DR200 hochkant direkt von der Karte vom 2026-11-03). **Abgeleitet** = nach exiftool-Tag-Tabellen umgesetzt, nicht mit echter Datei geprüft.

## Standard-Exif (alle Hersteller)

| Tag | Name | Verwendung |
|---|---|---|
| 0x010F / 0x0110 | Make / Model (IFD0) | Zeile 1 |
| 0x0112 | Orientation (IFD0) | JPEG: Drehung setzt der Browser beim Laden um, Ausgabe bekommt Orientation 1. RAW: Drehung bei Vorschauen ohne eigene Orientierung per Canvas. Verifiziert mit Wert 8 (Rotate 270 CW, X100VI-JPEG 8424) in Chromium, WebKit und Firefox |
| 0xA434 | LensModel | Zeile 1 (fehlt z. B. bei X100-Kameras, dann nur Kamera) |
| 0x920A | FocalLength | Zeile 2 |
| 0x829D | FNumber | Zeile 2 |
| 0x829A | ExposureTime | Zeile 2 (`1/x s` unter 1 s) |
| 0x8827 | ISO / PhotographicSensitivity | Zeile 2 |
| 0x8822 | ExposureProgram | Zeile 2 (Manual, Aperture-priority AE, …) |
| 0x9204 | ExposureBiasValue | Zeile 3 (Sony/andere), nur wenn ≠ 0 |

Hinweis aus der CLI-Phase: Fuji schreibt die Werte als Brüche (`10/4000`, `1600/100`, `2300/100`); ISO heißt bei neueren Exif-Versionen `PhotographicSensitivity`.

## Fujifilm-MakerNote

Erkennung: MakerNote beginnt mit `FUJIFILM`, IFD-Offset bei +8 (Little Endian), Offsets relativ zum MakerNote-Start.

Ältere Modelle (geprüft: X100F) schreiben bei S/W **kein** FilmMode-Tag (0x1401); die Simulation steht nur in Saturation (0x1003). Color Chrome (0x1048) fehlt dort ebenfalls.

| Tag | Name | Mapping | Status |
|---|---|---|---|
| 0x1001 | Sharpness | 0:-4, 1:-3, 2:-2, 0x82:-1, 3:0, 0x84:+1, 4:+2, 5:+3, 6:+4 | verifiziert (-1, -2 X100VI-RAF, 0 X100F-JPEG, +1 X100VI-JPEG 8424) |
| 0x1002 | WhiteBalance | 0 Auto, 0x100 Daylight, 0x200 Cloudy, 0x400 Incandescent, 0xF00–0xF04 Custom, 0xFF0 Kelvin … | verifiziert (Auto, Kelvin X100VI-RAF, Daylight und Cloudy X100F-JPEG, Daylight X100VI-JPEG 8424) |
| 0x1005 | ColorTemperature | bei WB Kelvin Anzeige `WB 6000K`; fehlt der Wert, bleibt `WB Kelvin` | verifiziert (6000 X100VI-RAF) |
| 0x1003 | Saturation | Farbe: 0x80 +1 … 0x400 -1 …; **bei S/W enthält das Feld die Film-Simulation**: 0x500 Acros, 0x501 Acros+R, 0x502 +Ye, 0x503 +G, 0x300 B&W … | verifiziert (Acros Red Filter; Acros Green Filter X100F-JPEG; Farbe +2 X100VI-RAF) |
| 0x100A | WhiteBalanceFineTune | Werte / 20 → R/B-Shift | verifiziert (0/0 X100VI-RAF; 40/−100 → R+2 B−5 X100VI-JPEG 8424, Einstellung an der Kamera bestätigt; exiftool zeigt nur die Rohwerte) |
| 0x100F | Clarity | / 1000 | verifiziert (-2 X100VI-RAF, +3 X100VI-JPEG 8424) |
| 0x1040 / 0x1041 | ShadowTone / HighlightTone | Anzeige = −Wert / 16 | verifiziert (+2; Highlight -2, Shadow +1 X100VI-RAF) |
| 0x1047 | GrainEffectRoughness | 0 Off, 32 Weak, 64 Strong | verifiziert (Weak) |
| 0x1048 | ColorChromeEffect | 0 Off, 32 Weak, 64 Strong | verifiziert (Strong X100VI-RAF) |
| 0x104E | ColorChromeFXBlue | 0 Off, 32 Weak, 64 Strong | verifiziert (Off X100VI-RAF; Weak/Strong abgeleitet) |
| 0x1401 | FilmMode | 0 Provia, 0x120 Astia, 0x200/0x400 Velvia, 0x500 Pro Neg. Std, 0x501 Pro Neg. Hi, 0x600 Classic Chrome, 0x700 Eterna, 0x800 Classic Neg., 0x900 Eterna Bleach Bypass, 0xA00 Nostalgic Neg., 0xB00 Reala Ace | verifiziert (Nostalgic Neg. X100VI-RAF; Provia X100F-JPEG und X100VI-JPEG 8424), übrige abgeleitet |
| 0x1402 | DynamicRangeSetting | 0 Auto (Wert ggf. in 0x140B), 1 Manual (Wert in 0x1403). Andere Werte (z. B. 0x200, laut exiftool „Wide1 (230%)“ bei älteren Kameras) werden seit v1.0-rc3 **weggelassen** | verifiziert (Auto; Manual mit 100/200/400 bei X100F und X100VI) |
| 0x1403 | DevelopmentDynamicRange | Wert direkt (`DR` + Wert), hat Vorrang vor 0x1402 | verifiziert (400 X100VI-RAF, 200 X100VI-JPEG 8424, 100 X100F-JPEG; fehlt beim Acros-JPEG mit DR Auto) |
| 0x140B | AutoDynamicRange | bei DR Auto der gewählte Wert (z. B. 200) | verifiziert (200 %) |

## Sony-MakerNote

Erkennung: Make enthält „SONY". Optionaler Header `SONY DSC \0\0\0` (12 Byte), danach IFD; **Offsets relativ zum TIFF-Header** (nicht zum MakerNote-Start). Byte-Order wie Exif.

| Tag | Name | Mapping | Status |
|---|---|---|---|
| 0xB020 | CreativeStyle | String (Standard, Vivid, …) | abgeleitet |
| 0xB025 | DynamicRangeOptimizer | 0 Off, 1 Standard, 2 Advanced Auto, 3 Auto, 8–12 Advanced Lv1–Lv5 | abgeleitet |
| 0x2001 | PreviewImage | Kandidat für RAW-Vorschau | abgeleitet |

Offen: Picture Profile, Weißabgleich, Objektiv-Erkennung über LensType (0xB027) bei fehlendem LensModel.

## RAW-Vorschau

| Format | Methode | Status |
|---|---|---|
| Fuji RAF | Header `FUJIFILMCCD-RAW`, JPEG-Offset bei Byte 84, Länge bei 88 (Big Endian); Exif steckt im eingebetteten JPEG | verifiziert (X100VI-RAF, Vorschau 4416 × 2944 px bei 7728 × 5152 px Sensor) |
| TIFF-basiert (ARW, SR2, SRF, DNG, NEF, CR2, ORF) | IFD-Kette + SubIFDs (0x014A) durchsuchen; Kandidaten aus 0x0201/0x0202 und aus Strips (0x0111/0x0117) mit Compression 6/7; Sony 0x2001; **größtes gültiges JPEG** (beginnt mit FFD8) gewinnt | synthetisch getestet |
| Orientierung | hat das Vorschau-JPEG keine eigene Orientierung, wird die des RAW (IFD0 0x0112) per Canvas angewendet | synthetisch getestet (6); echte Hochformat-RAW noch offen |

## Exif in der Ausgabedatei (F-01)

Seit v0.6. Das Exif wird **neu aufgebaut** (nicht 1:1 kopiert), damit die Ausgabe in sich stimmig ist und spätere Schalter (F-02 Copyright, F-03 GPS) einfach Tags setzen oder weglassen können. Byte-Order wie im Original.

| Bereich | Verhalten |
|---|---|
| IFD0 | Übernommen: ImageDescription, Make, Model, Software, DateTime, Artist, Rating, RatingPercent, Copyright. Neu gesetzt: Orientation = 1, YCbCrPositioning = 1. Alles andere entfällt (Bildstruktur, RAW-Interna, SubIFDs, dpi). |
| ExifIFD | Alle Tags übernommen außer: MakerNote (s. u.), Interop-Zeiger (0xA005), Padding (0xEA1C). Neu gesetzt: PixelX/YDimension = Ausgabemaße, ColorSpace = sRGB, ComponentsConfiguration = YCbCr; ExifVersion = 0232, falls im Original fehlend. |
| MakerNote | **Fuji:** unverändert übernommen (Offsets relativ zum MakerNote-Start, daher verschiebbar). **Sony/andere:** entfällt, weil die Offsets relativ zum TIFF-Header des Originals sind und nach dem Verschieben ins Leere zeigen würden. |
| GPS | **Nur mit Haken** „Standort (GPS) in die Datei übernehmen“ (F-03, Standard aus): dann wird das GPS-IFD vollständig und unverändert übernommen. Ohne Haken entfällt es. Die Bildkarte zeigt, ob das Original einen Standort (GPSLatitude) enthält. |
| IFD1 / Miniaturbild | Entfällt (zeigt das Bild ohne Rahmen). |
| XMP, IPTC, ICC-Profil | Aus dem Original nicht übernommen (eigene Autor/Copyright-Angaben s. u.). ICC bewusst nicht: der Canvas liefert sRGB-Pixel, ein P3-/AdobeRGB-Profil würde die Farben verfälschen (→ F-34). |
| Größe | APP1 ist auf 64 KB begrenzt; wird es zu groß, entfällt zuerst die MakerNote. |
| Canvas-Export | JFIF-APP0 und das eigene Exif von Safari werden entfernt; das neue APP1 steht direkt hinter SOI. |

### Autor und Copyright (F-02, seit v0.7)

| Feld in der Oberfläche | Exif (IFD0) | IPTC (APP13) | XMP |
|---|---|---|---|
| Autor | Artist (0x013B) | 2:80 By-line, max. 32 Byte | dc:creator |
| Copyright-Vermerk | Copyright (0x8298) | 2:116 CopyrightNotice, max. 128 Byte | dc:rights (x-default) |

- Ausgefüllte Felder **ersetzen** die Werte aus der Kamera, leere Felder lassen sie unverändert. IPTC und XMP werden nur geschrieben, wenn mindestens ein Feld ausgefüllt ist, und enthalten nur diese Angaben.
- Exif-Texte werden als UTF-8 geschrieben (wie exiftool), IPTC mit Zeichensatz-Kennung UTF-8 (1:90). Zu lange IPTC-Werte werden an einer Zeichengrenze gekürzt; Exif und XMP enthalten den vollen Text.
- Welche Programme und Plattformen welche Quelle anzeigen, ist nicht geprüft [unsicher].

Geprüft mit `exiftool -validate` (synthetische Dateien, Chromium/WebKit/Firefox). Mit echten Kameradateien noch nicht geprüft [unsicher].

## Bekannte Lücken

- ~~Fuji DynamicRangeSetting 0x200 = DR200?~~ Geklärt (v1.0-rc3): X100VI mit DR200 und DR400 sowie X100F mit DR100 schreiben 0x1402 = 1 (Manual) und den Wert in 0x1403. Der frühere Zweig 0x100/0x200/0x201 → DR100/DR200/DR400 widersprach exiftool und wurde entfernt; solche Werte erscheinen nicht mehr im Text.
- Leere Text-Tags: Die X100VI schreibt Artist (256 Byte) und Copyright (512 Byte) als Leerzeichen-Platzhalter. Solche Felder (nur Leerzeichen/NUL) werden seit v1.0-rc2 nicht in die Ausgabe übernommen.
- Echte Sony-Dateien (JPEG + ARW verschiedener Generationen), eine X-M5-Datei und weitere Fuji-Simulationen (z. B. Classic Chrome) als Testmaterial fehlen → F-06.
- Werte aus echten Dateien stehen als Regressionstest in `tests/e2e/mapping.mjs` (ohne die Fotos selbst).
