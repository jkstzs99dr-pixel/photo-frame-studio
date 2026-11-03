// GPS-Schalter (F-03): Standort nur mit Haken in der Ausgabe, Hinweis an der Bildkarte.
// Voraussetzungen wie exif.mjs. Anderer Browser: BROWSER=webkit bzw. BROWSER=firefox
// Vorher: python3 tests/fixtures/make_fixtures.py
import * as pw from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fx = (n) => path.join(root, 'tests/fixtures/out', n);
const page_url = pathToFileURL(path.join(root, 'prototype/rahmen.html')).href;
const outDir = mkdtempSync(path.join(tmpdir(), 'rahmen-gps-'));
const exif = (f) => JSON.parse(execFileSync('exiftool', ['-j', '-n', '-a', '-G1', f], { encoding: 'utf8' }))[0];
const gpsKeys = (e) => Object.keys(e).filter((k) => k.startsWith('GPS:'));
const validate = (f) => {
  const v = JSON.parse(execFileSync('exiftool', ['-j', '-validate', '-warning', '-a', f], { encoding: 'utf8' }))[0];
  assert.equal(v.Validate, 'OK', path.basename(f) + ': ' + [].concat(v.Warning || []).join('; '));
};

const browser = await pw[process.env.BROWSER || 'chromium'].launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 1600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(page_url);
await page.evaluate(() => localStorage.clear());
await page.reload();

await page.setInputFiles('#file', [fx('DSCF0001.JPG'), fx('DSC00001.JPG'), fx('base.jpg')]);
await page.waitForFunction(() => document.querySelectorAll('.card canvas').length === 3, null, { timeout: 20000 });
let run = 0;
const save = async (nth) => {
  const [d] = await Promise.all([page.waitForEvent('download'), page.click(`.card:nth-child(${nth}) .save`)]);
  const f = path.join(outDir, `${++run}_${d.suggestedFilename()}`);
  await d.saveAs(f);
  return f;
};
const dims = (nth) => page.textContent(`.card:nth-child(${nth}) .dims`);

// Standard: Haken aus, kein GPS in der Ausgabe, Hinweis nur beim Bild mit Standort
assert.equal(await page.isChecked('#gps'), false);
assert.match(await dims(1), /GPS-Standort im Original \(wird entfernt\)/);
assert.doesNotMatch(await dims(2), /GPS/);
{
  const f = await save(1);
  assert.deepEqual(gpsKeys(exif(f)), []);
  validate(f);
}

// Haken an: GPS vollständig übernommen, übriges Exif unverändert
await page.check('#gps');
assert.match(await dims(1), /GPS-Standort im Original \(wird übernommen\)/);
{
  const f = await save(1), e = exif(f);
  assert.equal(e['GPS:GPSLatitudeRef'], 'N');
  assert.ok(Math.abs(e['GPS:GPSLatitude'] - (52 + 31 / 60)) < 1e-6, 'Breitengrad');
  assert.equal(e['GPS:GPSLongitudeRef'], 'E');
  assert.ok(Math.abs(e['GPS:GPSLongitude'] - (13 + 24 / 60)) < 1e-6, 'Längengrad');
  assert.equal(e['IFD0:Make'], 'FUJIFILM');
  assert.equal(e['FujiFilm:FilmMode'], 0x600);
  validate(f);
}

// Bilder ohne GPS bekommen auch mit Haken keinen Standort
for (const nth of [2, 3]) {
  const f = await save(nth);
  assert.deepEqual(gpsKeys(exif(f)), []);
  validate(f);
}

// Einstellung bleibt nach Neuladen erhalten
await page.reload();
assert.equal(await page.isChecked('#gps'), true);

assert.deepEqual(errors, []);
await browser.close();
console.log('GPS OK (' + (process.env.BROWSER || 'chromium') + ')');
