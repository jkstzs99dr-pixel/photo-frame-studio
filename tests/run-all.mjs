// Führt alle Browser-Tests aus: smoke.mjs einmal (Chromium), die übrigen je Browser.
// Browser einschränken: BROWSERS=webkit npm test  (mehrere mit Komma: BROWSERS=chromium,firefox)
// Vorher: python3 tests/fixtures/make_fixtures.py
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'e2e');
const browsers = (process.env.BROWSERS || 'chromium,webkit,firefox').split(',').map((b) => b.trim()).filter(Boolean);
const perBrowser = ['mapping', 'presets', 'ratio', 'gps', 'exif', 'copyright'];

const runs = [];
if (browsers.includes('chromium')) runs.push(['smoke', 'chromium']);
for (const b of browsers) for (const t of perBrowser) runs.push([t, b]);

let failed = 0;
for (const [t, b] of runs) {
  const r = spawnSync(process.execPath, [path.join(dir, t + '.mjs')], { env: { ...process.env, BROWSER: b }, encoding: 'utf8' });
  const ok = r.status === 0;
  console.log(`${ok ? '✔' : '✘'} ${t} (${b})`);
  if (!ok) { failed++; process.stdout.write(r.stdout + r.stderr); }
}
console.log(failed ? `\n${failed} von ${runs.length} Tests fehlgeschlagen` : `\nAlle ${runs.length} Tests bestanden`);
process.exit(failed ? 1 : 0);
