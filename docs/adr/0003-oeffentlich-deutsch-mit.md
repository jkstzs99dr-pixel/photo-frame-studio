# ADR 0003: Öffentliches Repository mit frischem Start, nur Deutsch, MIT-Lizenz

- **Status:** Akzeptiert
- **Datum:** 2026-11-03

## Kontext

Vor einer Veröffentlichung standen in der [Roadmap](../ROADMAP.md) drei Fragen offen: Sichtbarkeit des Repositorys, Sprache (DE oder DE + EN) und Lizenz. Das Werkzeug ist für den Eigenbedarf und einen kleinen Kreis von Bekannten gedacht, nicht für eine große Nutzerschaft; gegen eine Veröffentlichung spricht aber nichts.

Eine Prüfung vor dem Umschalten ergab: Der erste Commit des bisherigen Repositorys enthält eine private Mailadresse als Autor. Ein nachträgliches Umschreiben der Historie entfernt sie nicht zuverlässig, weil GitHub die Stände der Pull Requests dauerhaft aufbewahrt.

## Entscheidung

1. **Das Projekt wird öffentlich – in einem neuen Repository mit frischem Start** (ein Commit mit dem aktuellen Stand, ohne alte Historie). Das bisherige Repository bleibt **privat als Archiv** mit vollständiger Historie und den Pull Requests #1–#10.
2. **Oberfläche und Dokumentation bleiben auf Deutsch.** Eine englische Version (F-35) wird aktuell nicht benötigt.
3. **Lizenz: MIT** (Datei [`LICENSE`](../../LICENSE), Rechteinhaber Peter Tischer).

## Konsequenzen

- **Mailadresse:** Neue Commits verwenden die anonyme GitHub-Adresse (`…@users.noreply.github.com`), nicht die private Mailadresse.
- **Hosting (Phase 2):** GitHub Pages ist bei einem öffentlichen Repo kostenlos; die PWA aus [ADR 0001](0001-auslieferung-pwa-statt-desktop.md) kann dort ausgeliefert werden.
- **Lizenz:** Mit MIT darf jede Person den Code nutzen, ändern und weitergeben, auch kommerziell – Bedingung ist nur, dass der Copyright- und Lizenzhinweis erhalten bleibt. Es gibt keine Gewährleistung. Die Alternative „keine Lizenz / alle Rechte vorbehalten“ wurde erwogen und verworfen.
- **Persönliche Voreinstellungen:** Der Wasserzeichen-Text ist standardmäßig leer, Platzhalter nennen keine echte Person.
- **Echte Fotos:** Keine echten Kameradateien im Repo (Größe, Personen auf Bildern, Standorte). Regressionstests nutzen nur ausgelesene Werte (`tests/e2e/mapping.mjs`). Ausnahme: das eigene Referenzbild `docs/img/referenz-layout.jpg` (ohne Metadaten).
- **Sprache:** F-35 bleibt im Backlog (P3), ohne Termin. Code-Bezeichner bleiben englisch, Kommentare und UI-Texte deutsch (wie in [CLAUDE.md](../../CLAUDE.md)).
- **Markenrecht:** Herstellernamen nur als Text, keine Logos ([unsicher], nicht juristisch geprüft).
