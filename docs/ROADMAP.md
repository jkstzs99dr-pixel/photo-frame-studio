# Roadmap

## Phase 0 – Prototyp (erledigt)
Single-File-HTML v0.5, siehe [CHANGELOG](CHANGELOG.md).

## Phase 1 – v1.0 „Einsatzbereit“
- F-01 Exif erhalten · F-02 Copyright/Autor · F-03 GPS-Schalter
- F-04 Zielseitenverhältnis · F-05 Presets
- F-06 Echte Testdateien einsammeln, Mapping verifizieren – **teilweise**: Fuji X100VI (RAF, JPEG hochkant) und X100F (JPEG) geprüft; Rest zurückgestellt (s. Phase 3)
- Weiterhin als Single-File nutzbar

## Phase 2 – Projektstruktur und PWA
- ✅ Automatisierte Tests in GitHub Actions (alle Browser-Tests in Chromium, WebKit, Firefox bei jedem Pull Request)
- Code modularisieren (`exif/`, `render/`, `export/`, `ui/`), Build (z. B. Vite)
- PWA: Manifest, Service Worker (offline), installierbar auf macOS, Windows, Linux, iOS, Android
- Hosting: GitHub Pages (Repo ist öffentlich, [ADR 0003](adr/0003-oeffentlich-deutsch-mit.md))

## Phase 3 – Komfort (v1.x)
- F-10 Mehrfachausgabe · F-11 Rahmen-Stile · F-12 Text-Vorlagen · F-13 Logo-Wasserzeichen
- F-14 Caption-Generator · F-15 Teilen · F-17 Dateinamen-Muster · F-19 weitere Hersteller
- F-06 (Rest) Kompatibilität mit weiteren echten Dateien, sobald verfügbar: Sony-JPEG und ARW, weitere Fuji-Modelle (X-M5), Classic Chrome, Hochformat-RAF (RAW-Drehung bisher nur synthetisch geprüft)

## Phase 4 – Desktop (nur bei Bedarf)
- Tauri-Build mit gleicher Oberfläche für D-01 bis D-05
- Code-Signierung/Notarisierung einplanen (Apple Developer Program, Windows-Zertifikat)

## Offene Entscheidungen

| Thema | Optionen | Stand |
|---|---|---|
| Auslieferung | HTML bleibt · PWA · Desktop | Empfehlung PWA, [ADR 0001](adr/0001-auslieferung-pwa-statt-desktop.md) vorgeschlagen |
| Sichtbarkeit | privat · öffentlich | **entschieden: öffentlich**, neues Repo mit frischem Start; altes Repo privat als Archiv ([ADR 0003](adr/0003-oeffentlich-deutsch-mit.md)) |
| Lizenz | z. B. MIT, GPL-3.0, proprietär | **entschieden: MIT** ([LICENSE](../LICENSE), ADR 0003) |
| Sprache | nur DE · DE + EN | **entschieden: nur DE** (ADR 0003); F-35 ohne Termin |
| Markenrecht | Herstellernamen als Text ok, Logos nicht einbinden | Regel gilt, nicht juristisch geprüft [unsicher] |
