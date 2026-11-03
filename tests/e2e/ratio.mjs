// Zielseitenverhältnis (F-04): Auffüllen mit weißem Rand, „Abzug mittig“, nichts abgeschnitten.
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
const outDir = mkdtempSync(path.join(tmpdir(), 'rahmen-ratio-'));
const exif = (f) => JSON.parse(execFileSync('exiftool', ['-j', '-n', '-a', '-G1', f], { encoding: 'utf8' }))[0];
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

// Karte 1: Querformat 3000×2000 (Sony), Karte 2: Hochformat 2000×3000 (Fuji, Orientation 6)
await page.setInputFiles('#file', [fx('DSC00001.JPG'), fx('DSCF0001.JPG')]);
await page.waitForFunction(() => document.querySelectorAll('.card canvas').length === 2, null, { timeout: 20000 });

// Vorschau-Canvas: Maße und Begrenzung der nicht-weißen Pixel (Foto + Text)
const probe = (nth) => page.evaluate((n) => {
  const c = document.querySelector(`.card:nth-child(${n}) canvas`), g = c.getContext('2d');
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let top = -1, left = c.width;
  for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
    const i = (y * c.width + x) * 4;
    if (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200) { if (top < 0) top = y; if (x < left) left = x; }
  }
  return { w: c.width, h: c.height, top, left };
}, nth);
// Erwartete Lage nach Spezifikation: Rand 3 %, Streifen 8 % der langen Kante, Abzug mittig im Zielformat
const expected = (iw, ih, r) => {
  const L = Math.max(iw, ih), B = Math.round(L * 0.03), E = Math.round(L * 0.08);
  const fw = iw + 2 * B, fh = ih + 2 * B + E;
  const W = fw / fh < r ? Math.round(fh * r) : fw, H = fw / fh < r ? fh : Math.round(fw / r);
  return { w: W, h: H, top: Math.floor((H - fh) / 2) + B, left: Math.floor((W - fw) / 2) + B };
};
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} statt ${b}`);

// Standard: kein Auffüllen, Maße wie bisher
assert.equal(await page.inputValue('#ratio'), '');
{
  const p = await probe(1);
  assert.equal(p.h, 933 + 2 * 42 + 112);
  assert.equal(p.w, 1400 + 2 * 42);
  near(p.top, 42, 1, 'Foto oben');
}

for (const [ratio, r] of [['1:1', 1], ['4:5', 4 / 5], ['9:16', 9 / 16], ['3:2', 3 / 2], ['2:3', 2 / 3]]) {
  await page.selectOption('#ratio', ratio);
  for (const [nth, iw, ih] of [[1, 1400, 933], [2, 933, 1400]]) {
    const p = await probe(nth), e = expected(iw, ih, r);
    near(p.w / p.h, r, 1 / Math.min(p.w, p.h), `${ratio} Karte ${nth} Seitenverhältnis`);
    assert.equal(p.w, e.w, `${ratio} Karte ${nth} Breite`);
    assert.equal(p.h, e.h, `${ratio} Karte ${nth} Höhe`);
    near(p.top, e.top, 1, `${ratio} Karte ${nth} Foto oben (mittig)`);
    near(p.left, e.left, 1, `${ratio} Karte ${nth} Foto links (mittig)`);
  }
}

// Gespeicherte Datei: Zielformat 4:5, lange Kante <= 1080 (Instagram), Exif-Maße stimmen
await page.selectOption('#ratio', '4:5');
await page.selectOption('#target', '1080');
for (const nth of [1, 2]) {
  const [d] = await Promise.all([page.waitForEvent('download'), page.click(`.card:nth-child(${nth}) .save`)]);
  const f = path.join(outDir, d.suggestedFilename());
  await d.saveAs(f);
  const e = exif(f), w = e['File:ImageWidth'], h = e['File:ImageHeight'];
  near(w / h, 4 / 5, 1 / w, `Datei ${nth} 4:5`);
  assert.ok(h <= 1080 && h >= 1070, `Datei ${nth} lange Kante ${h}`);
  assert.equal(e['ExifIFD:ExifImageWidth'], w);
  validate(f);
  const dims = await page.textContent(`.card:nth-child(${nth}) .dims`);
  assert.ok(dims.includes(`${w} × ${h}`), 'Kartenangabe = Datei: ' + dims);
}

// Gleichmäßiger Rahmen (ohne Textstreifen) funktioniert ebenfalls
await page.uncheck('#info');
{
  const p = await probe(1);
  near(p.w / p.h, 4 / 5, 1 / p.w, 'ohne Textstreifen 4:5');
}

// Einstellung bleibt nach Neuladen erhalten
await page.reload();
assert.equal(await page.inputValue('#ratio'), '4:5');

assert.deepEqual(errors, []);
await browser.close();
console.log('RATIO OK (' + (process.env.BROWSER || 'chromium') + ')');
