# ADR 0001: Auslieferung als PWA statt nativer Desktop-Builds

- **Status:** Vorgeschlagen
- **Datum:** 2026-11-02

## Kontext

Der Prototyp ist eine einzelne HTML-Datei. Überlegt wird, das Projekt professioneller aufzuziehen und Dateien für Windows, macOS und Linux bereitzustellen. Die meisten geplanten Features (siehe [FEATURES.md](../FEATURES.md), P1–P3) lassen sich im Browser umsetzen. Nur wenige (D-01 bis D-05) brauchen echten Dateisystem- oder Bibliothekszugriff.

## Optionen

| Option | Aufwand | Risiko | Wirkung |
|---|---|---|---|
| A: Single-File-HTML bleibt | gering | Wartbarkeit sinkt mit jedem Feature, keine Updates für Nutzer | reicht für Eigenbedarf und wenige Bekannte |
| B: GitHub-Projekt + PWA | mittel | gering, keine Signierung/Stores | installierbar auf allen Plattformen inkl. Mobil, offline, automatische Updates |
| C: Desktop-App (Tauri/Electron) | hoch | Code-Signierung und Notarisierung (kostenpflichtig), Build-Pipeline pro OS | nur nötig für Desktop-Features |

## Entscheidung (vorgeschlagen)

Option **B**. Option C bleibt als spätere Erweiterung möglich, weil Tauri dieselbe Web-Oberfläche verpacken kann.

## Konsequenzen

- Code wird modularisiert und getestet, Prototyp bleibt bis zur Feature-Parität erhalten.
- Für GitHub Pages muss das Repo öffentlich werden oder ein kostenpflichtiger Plan genutzt werden. Entschieden: Das Repo wird öffentlich ([ADR 0003](0003-oeffentlich-deutsch-mit.md)), GitHub Pages ist damit kostenlos nutzbar.
- Desktop-only-Features (echtes RAW-Entwickeln, Ordner-Automatik) sind bis zu Phase 4 nicht verfügbar.
