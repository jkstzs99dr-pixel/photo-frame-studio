# ADR 0002: Verarbeitung ausschließlich lokal

- **Status:** Akzeptiert
- **Datum:** 2026-11-02

## Kontext

Fotos enthalten private Informationen (Orte, Personen, GPS). Das Werkzeug soll ohne Konto und ohne Server funktionieren.

## Entscheidung

Alle Bilder werden ausschließlich lokal verarbeitet (Browser bzw. später App). Keine Uploads, keine Telemetrie, keine externen Requests zur Laufzeit. Externe Bibliotheken werden mitgeliefert, nicht per CDN nachgeladen.

## Konsequenzen

- Funktionen, die Netzwerk bräuchten (z. B. Ortsname aus GPS, F-33), nur als ausdrückliches Opt-in mit klarem Hinweis.
- RAW-Entwicklung muss lokal erfolgen (WASM oder Desktop), nicht über einen Dienst.
