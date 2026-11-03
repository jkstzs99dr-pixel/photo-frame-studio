// Exif-Export (F-01): Ausgabedateien mit exiftool prüfen (unabhängig von der eigenen Implementierung).
// Voraussetzungen wie smoke.mjs, zusätzlich exiftool im PATH (macOS: brew install exiftool)
// Vorher: python3 tests/fixtures/make_fixtures.py
// Anderer Browser: BROWSER=webkit bzw. BROWSER=firefox node tests/e2e/exif.mjs
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
const outDir = mkdtempSync(path.join(tmpdir(), 'rahmen-exif-'));
const exif = (f) => JSON.parse(execFileSync('exiftool', ['-j', '-n', '-a', '-G1', f], { encoding: 'utf8' }))[0];

const browser = await pw[process.env.BROWSER || 'chromium'].launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 1600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(page_url);
await page.evaluate(() => localStorage.clear());
await page.reload();

const load = async (files) => {
  await page.click('#clearBtn').catch(() => {});
  await page.setInputFiles('#file', files.map(fx));
  await page.waitForFunction((n) => document.querySelectorAll('.card canvas').length === n, files.length, { timeout: 20000 });
};
const save = async (nth) => {
  const [d] = await Promise.all([page.waitForEvent('download'), page.click(`.card:nth-child(${nth}) .save`)]);
  const f = path.join(outDir, d.suggestedFilename());
  await d.saveAs(f);
  return f;
};

await load(['DSC00001.JPG', 'DSC00002.ARW', 'DSCF0001.JPG', 'base.jpg']);
await page.selectOption('#target', '1600');
const [sony, arw, fuji, base] = [await save(1), await save(2), await save(3), await save(4)];

// Formale Prüfung durch exiftool (Pflichtfelder, Offsets, Struktur)
for (const f of [sony, arw, fuji, base]) {
  const v = JSON.parse(execFileSync('exiftool', ['-j', '-validate', '-warning', '-a', f], { encoding: 'utf8' }))[0];
  assert.equal(v.Validate, 'OK', path.basename(f) + ': ' + [].concat(v.Warning || []).join('; '));
}

// Sony-JPEG: Standard-Exif übernommen, Maße = tatsächliche Ausgabe
{
  const e = exif(sony);
  assert.equal(e['IFD0:Make'], 'SONY');
  assert.equal(e['IFD0:Model'], 'ILCE-7M4');
  assert.equal(e['ExifIFD:LensModel'], 'FE 35mm F1.8');
  assert.equal(e['ExifIFD:FNumber'], 2.8);
  assert.equal(e['ExifIFD:ExposureTime'], 0.004);
  assert.equal(e['ExifIFD:ISO'], 400);
  assert.equal(e['ExifIFD:ExposureCompensation'], 0.7);
  assert.equal(e['IFD0:Orientation'], 1);
  assert.equal(e['ExifIFD:ExifImageWidth'], e['File:ImageWidth']);
  assert.equal(e['IFD0:Artist'], undefined, 'leere Platzhalter nicht übernehmen');
  assert.equal(e['IFD0:Copyright'], undefined, 'leere Platzhalter nicht übernehmen');
  assert.equal(e['ExifIFD:ExifImageHeight'], e['File:ImageHeight']);
  assert.ok(Math.max(e['File:ImageWidth'], e['File:ImageHeight']) <= 1600);
}

// ARW: Exif kommt aus dem RAW, Drehung ist in den Pixeln → Orientation 1
{
  const e = exif(arw);
  assert.equal(e['IFD0:Make'], 'SONY');
  assert.equal(e['ExifIFD:ISO'], 400);
  assert.equal(e['IFD0:Orientation'], 1);
  assert.ok(e['File:ImageHeight'] > e['File:ImageWidth'], 'Hochformat bleibt Hochformat');
  assert.equal(e['IFD0:StripOffsets'], undefined, 'keine RAW-Bildstruktur-Tags');
  assert.equal(e['IFD0:SubIFDs'], undefined);
}

// Fuji: MakerNote bleibt lesbar, Orientation 1, kein GPS (bis F-03), kein altes Miniaturbild
{
  const e = exif(fuji);
  assert.equal(e['IFD0:Make'], 'FUJIFILM');
  assert.equal(e['IFD0:Orientation'], 1);
  assert.ok(e['File:ImageHeight'] > e['File:ImageWidth'], 'Orientation 6 ist in den Pixeln angewendet');
  assert.equal(e['ExifIFD:DateTimeOriginal'], '2026:10:31 14:22:05');
  assert.equal(e['FujiFilm:FilmMode'], 0x600, 'Fuji-MakerNote erhalten');
  assert.equal(e['FujiFilm:ColorChromeEffect'], 32);
  assert.ok(!Object.keys(e).some((k) => k.startsWith('GPS:')), 'GPS wird nicht übernommen');
  assert.ok(!Object.keys(e).some((k) => k.startsWith('IFD1:')), 'kein Miniaturbild');
  assert.equal(e['IFD0:XResolution'], undefined, 'keine dpi-Angabe');
}

// Ohne Exif im Original: kein erfundenes Exif in der Ausgabe
{
  const e = exif(base);
  assert.ok(!Object.keys(e).some((k) => k.startsWith('IFD0:') || k.startsWith('ExifIFD:')), 'kein Exif');
}

// Rundlauf: Ausgabe erneut laden → gleiche Textzeilen
const cardLines = (nth) => page.evaluate((n) => document.querySelector(`.card:nth-child(${n}) pre`).textContent.split('\n\n')[0], nth);
const fujiLines = await cardLines(3);
await page.click('#clearBtn');
await page.setInputFiles('#file', [fuji]);
await page.waitForFunction(() => document.querySelectorAll('.card canvas').length === 1, null, { timeout: 20000 });
assert.equal(await cardLines(1), fujiLines);
assert.match(fujiLines, /Classic Chrome/);

// ZIP-Export enthält ebenfalls Exif
const [z] = await Promise.all([page.waitForEvent('download'), page.click('#zipBtn')]);
const zf = path.join(outDir, 'out.zip');
await z.saveAs(zf);
execFileSync('unzip', ['-o', '-q', zf, '-d', path.join(outDir, 'zip')]);
assert.equal(exif(path.join(outDir, 'zip', path.basename(fuji).replace(/\.jpg$/, '_rahmen.jpg')))['IFD0:Make'], 'FUJIFILM');

assert.deepEqual(errors, []);
await browser.close();
console.log('EXIF OK (' + (process.env.BROWSER || 'chromium') + ')');
