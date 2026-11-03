# ADR 0001: Auslieferung als PWA statt nativer Desktop-Builds

- **Status:** Akzeptiert (geändert am 2026-11-03, siehe „Entscheidung“)
- **Datum:** 2026-11-02

## Kontext

Der Prototyp ist eine einzelne HTML-Datei. Überlegt wird, das Projekt professioneller aufzuziehen und Dateien für Windows, macOS und Linux bereitzustellen. Die meisten geplanten Features (siehe [FEATURES.md](../FEATURES.md), P1–P3) lassen sich im Browser umsetzen. Nur wenige (D-01 bis D-05) brauchen echten Dateisystem- oder Bibliothekszugriff.

## Optionen

| Option | Aufwand | Risiko | Wirkung |
|---|---|---|---|
| A: Single-File-HTML bleibt | gering | Wartbarkeit sinkt mit jedem Feature, keine Updates für Nutzer | reicht für Eigenbedarf und wenige Bekannte |
| B: GitHub-Projekt + PWA | mittel | gering, keine Signierung/Stores | installierbar auf allen Plattformen inkl. Mobil, offline, automatische Updates |
| C: Desktop-App (Tauri/Electron) | hoch | Code-Signierung und Notarisierung (kostenpflichtig), Build-Pipeline pro OS | nur nötig für Desktop-Features |

## Entscheidung

Ursprünglich vorgeschlagen: Option **B** (PWA).

**Entschieden am 2026-11-03:** Für die erste Zeit genügt die **Webseite auf GitHub Pages** (https://jkstzs99dr-pixel.github.io/photo-frame-studio/), ohne PWA-Umbau. Die Seite ist weiterhin eine einzelne HTML-Datei und lässt sich zusätzlich offline als Datei nutzen (Option A, aber mit automatischer Veröffentlichung). Es werden **nur Features aufgenommen, die vollständig im Browser umsetzbar sind**. PWA (Option B) und Desktop (Option C) bleiben spätere Möglichkeiten, ohne Termin.

## Konsequenzen

- Code wird modularisiert und getestet, Prototyp bleibt bis zur Feature-Parität erhalten.
- Für GitHub Pages muss das Repo öffentlich werden oder ein kostenpflichtiger Plan genutzt werden. Entschieden: Das Repo wird öffentlich ([ADR 0003](0003-oeffentlich-deutsch-mit.md)), GitHub Pages ist damit kostenlos nutzbar.
- Desktop-only-Features (echtes RAW-Entwickeln, Ordner-Automatik) sind bis zu Phase 4 nicht verfügbar.
