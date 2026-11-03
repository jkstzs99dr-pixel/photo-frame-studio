// Copyright / Autor (F-02): Exif, IPTC und XMP der Ausgabedateien mit exiftool prüfen.
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
const outDir = mkdtempSync(path.join(tmpdir(), 'rahmen-copyright-'));
const exif = (f) => JSON.parse(execFileSync('exiftool', ['-j', '-a', '-G1', f], { encoding: 'utf8' }))[0];
const groups = (e, g) => Object.keys(e).filter((k) => k.startsWith(g + ':'));
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

await page.setInputFiles('#file', [fx('DSCF0001.JPG'), fx('base.jpg')]);
await page.waitForFunction(() => document.querySelectorAll('.card canvas').length === 2, null, { timeout: 20000 });
let run = 0;
const save = async (nth) => {
  const [d] = await Promise.all([page.waitForEvent('download'), page.click(`.card:nth-child(${nth}) .save`)]);
  const f = path.join(outDir, `${++run}_${d.suggestedFilename()}`);
  await d.saveAs(f);
  return f;
};

// Felder leer: Werte aus der Kamera bleiben, kein IPTC/XMP
{
  const f = await save(1), e = exif(f);
  assert.equal(e['IFD0:Artist'], 'Kamera Artist');
  assert.equal(e['IFD0:Copyright'], 'Kamera Copyright');
  assert.deepEqual(groups(e, 'IPTC'), []);
  assert.deepEqual(groups(e, 'XMP-dc'), []);
  validate(f);
}

// Felder gesetzt (mit Umlauten und XML-Sonderzeichen): überschreiben Kamera-Werte, in Exif, IPTC und XMP
const author = 'Jörg Müller & Co';
const copyright = '© 2026 Jörg Müller <alle Rechte>';
await page.fill('#author', author);
await page.fill('#copyright', copyright);
{
  const f = await save(1), e = exif(f);
  assert.equal(e['IFD0:Artist'], author);
  assert.equal(e['IFD0:Copyright'], copyright);
  assert.equal(e['IPTC:By-line'], author);
  assert.equal(e['IPTC:CopyrightNotice'], copyright);
  assert.equal(e['XMP-dc:Creator'], author);
  assert.equal(e['XMP-dc:Rights'], copyright);
  assert.equal(e['FujiFilm:FilmMode'], 'Classic Chrome', 'übriges Exif bleibt erhalten');
  validate(f);
}

// Bild ohne Exif: Autor/Copyright werden trotzdem geschrieben, sonst nichts erfunden
{
  const f = await save(2), e = exif(f);
  assert.equal(e['IFD0:Artist'], author);
  assert.equal(e['IPTC:CopyrightNotice'], copyright);
  assert.equal(e['IFD0:Make'], undefined);
  assert.equal(e['ExifIFD:DateTimeOriginal'], undefined);
  validate(f);
}

// Nur Copyright gesetzt: Autor aus der Kamera bleibt, IPTC/XMP enthalten nur den Copyright-Vermerk
await page.fill('#author', '');
{
  const f = await save(1), e = exif(f);
  assert.equal(e['IFD0:Artist'], 'Kamera Artist');
  assert.equal(e['IFD0:Copyright'], copyright);
  assert.equal(e['IPTC:By-line'], undefined);
  assert.equal(e['XMP-dc:Creator'], undefined);
  assert.equal(e['XMP-dc:Rights'], copyright);
  validate(f);
}

// Einstellungen bleiben nach Neuladen erhalten
await page.reload();
assert.equal(await page.inputValue('#copyright'), copyright);

assert.deepEqual(errors, []);
await browser.close();
console.log('COPYRIGHT OK (' + (process.env.BROWSER || 'chromium') + ')');
