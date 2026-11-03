// Smoke-Test für prototype/rahmen.html in Headless-Chromium.
// Voraussetzungen: npm i -D playwright && npx playwright install chromium
// Vorher: python3 tests/fixtures/make_fixtures.py
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fx = (n) => path.join(root, 'tests/fixtures/out', n);
const page_url = pathToFileURL(path.join(root, 'prototype/rahmen.html')).href;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 1600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(page_url);
await page.evaluate(() => localStorage.clear());
await page.reload();

await page.setInputFiles('#file', [fx('DSC00001.JPG'), fx('DSC00002.ARW'), fx('DSC00003.RAF')]);
await page.waitForFunction(() => document.querySelectorAll('.card canvas').length === 3, null, { timeout: 20000 });

const cards = await page.evaluate(() => [...document.querySelectorAll('.card')].map((c) => ({
  fn: c.querySelector('.fn').textContent,
  lines: c.querySelector('pre').textContent.split('\n\n')[0].split('\n'),
  w: c.querySelector('canvas').width, h: c.querySelector('canvas').height,
})));

for (const c of cards) {
  assert.equal(c.lines[0], 'SONY ILCE-7M4  ·  FE 35mm F1.8');
  assert.equal(c.lines[1], '35 mm  ·  f/2.8  ·  1/250 s  ·  ISO 400  ·  Aperture-priority AE');
  assert.equal(c.lines[2], 'Creative Style Vivid  ·  DRO Auto  ·  EV +0.7');
}
assert.ok(cards[1].fn.includes('RAW'), 'ARW als RAW markiert');
assert.ok(cards[1].h > cards[1].w, 'ARW-Orientierung 6 angewendet (Hochformat)');

// Zielgröße E-Mail 1600 px
await page.selectOption('#target', '1600');
const dims = await page.textContent('.card .dims');
const m = dims.match(/(\d+) × (\d+)/);
assert.ok(Math.max(+m[1], +m[2]) <= 1600, 'lange Kante <= 1600: ' + dims);

// Modus gleichmäßiger Rahmen
await page.uncheck('#info');
assert.ok(await page.isDisabled('#strip'));
await page.check('#info');

// Downloads
const [d1] = await Promise.all([page.waitForEvent('download'), page.click('.card:nth-child(1) .save')]);
assert.equal(d1.suggestedFilename(), 'DSC00001_rahmen.jpg');
const [d2] = await Promise.all([page.waitForEvent('download'), page.click('.card:nth-child(2) .save')]);
assert.equal(d2.suggestedFilename(), 'DSC00002_arw_rahmen.jpg');

// Info-Dialog
await page.click('#infoBtn');
assert.ok(await page.evaluate(() => document.getElementById('infoDlg').open));
await page.keyboard.press('Escape');

assert.deepEqual(errors, []);
await browser.close();
console.log('SMOKE OK');
