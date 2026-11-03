// Presets (F-05): Standard-Presets, eigene speichern/laden/löschen, Export/Import als JSON.
// Voraussetzungen wie smoke.mjs. Anderer Browser: BROWSER=webkit bzw. BROWSER=firefox
// Vorher: python3 tests/fixtures/make_fixtures.py
import * as pw from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fx = (n) => path.join(root, 'tests/fixtures/out', n);
const page_url = pathToFileURL(path.join(root, 'prototype/rahmen.html')).href;
const outDir = mkdtempSync(path.join(tmpdir(), 'rahmen-presets-'));

const browser = await pw[process.env.BROWSER || 'chromium'].launch();
const page = await browser.newPage({ viewport: { width: 1300, height: 1600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
// Antworten für prompt()/confirm() der Reihe nach
const answers = [];
page.on('dialog', (d) => { const a = answers.shift(); a === false ? d.dismiss() : d.accept(a === true ? undefined : a); });
await page.goto(page_url);
await page.evaluate(() => localStorage.clear());
await page.reload();

await page.setInputFiles('#file', [fx('DSC00001.JPG'), fx('DSCF0001.JPG')]);
await page.waitForFunction(() => document.querySelectorAll('.card canvas').length === 2, null, { timeout: 20000 });
const dims = async (nth) => (await page.textContent(`.card:nth-child(${nth}) .dims`)).match(/(\d+) × (\d+)/).slice(1).map(Number);
const options = () => page.$$eval('#preset option', (os) => os.map((x) => x.textContent));
const status = () => page.textContent('#status');

// Standard-Presets vorhanden, nicht löschbar
const std = ['Instagram (4:5, 1350 px)', 'Story (9:16, 1920 px)', 'Print 10×15 (300 dpi)'];
for (const n of std) assert.ok((await options()).includes(n), 'Standard-Preset fehlt: ' + n);
await page.fill('#author', 'Peter Tischer');

// Instagram: 4:5, lange Kante 1350, GPS aus; persönliche Angaben bleiben
await page.check('#gps');
await page.selectOption('#preset', { label: std[0] });
assert.equal(await page.inputValue('#ratio'), '4:5');
assert.equal(await page.inputValue('#target'), '1350');
assert.equal(await page.isChecked('#gps'), false);
assert.equal(await page.inputValue('#author'), 'Peter Tischer');
assert.equal(await page.isDisabled('#presetDel'), true, 'Standard-Preset nicht löschbar');
for (const nth of [1, 2]) {
  const [w, h] = await dims(nth);
  assert.ok(Math.abs(w / h - 0.8) < 1 / w && h <= 1350 && h >= 1340, `Instagram Karte ${nth}: ${w}×${h}`);
}

// Story: 9:16, 1080 × 1920
await page.selectOption('#preset', { label: std[1] });
{
  const [w, h] = await dims(1);
  assert.ok(Math.abs(w / h - 9 / 16) < 1 / w && h <= 1920 && h >= 1910, `Story ${w}×${h}`);
}

// Print 10×15: 3:2 bzw. 2:3 passend zur Bildausrichtung, 1772 px
await page.selectOption('#preset', { label: std[2] });
assert.equal(await page.inputValue('#target'), '1772');
{
  const [w1, h1] = await dims(1), [w2, h2] = await dims(2);   // Karte 1 quer, Karte 2 hoch
  assert.ok(Math.abs(w1 / h1 - 3 / 2) < 1 / h1 && w1 <= 1772 && w1 >= 1762, `Print quer ${w1}×${h1}`);
  assert.ok(Math.abs(w2 / h2 - 2 / 3) < 1 / w2 && h2 <= 1772 && h2 >= 1762, `Print hoch ${w2}×${h2}`);
}

// Manuelle Änderung → Auswahl zeigt kein Preset mehr
await page.selectOption('#ratio', '1:1');
assert.equal(await page.inputValue('#preset'), '');

// Eigenes Preset speichern (alle Einstellungen inkl. persönlicher Angaben)
await page.fill('#border', '5');
await page.dispatchEvent('#border', 'input');
await page.fill('#copyright', '© 2026 Peter Tischer');
await page.check('#wm');
answers.push('Mein Look');
await page.click('#presetSave');
assert.ok((await options()).includes('Mein Look'));
assert.equal(await page.isDisabled('#presetDel'), false);

// Name eines Standard-Presets ist gesperrt
answers.push(std[0]);
await page.click('#presetSave');
assert.match(await status(), /Standard-Preset/);

// Anderes laden, dann eigenes → alles wiederhergestellt
await page.selectOption('#preset', { label: std[1] });
await page.fill('#author', 'Jemand anderes');
await page.dispatchEvent('#author', 'input');
await page.selectOption('#preset', { label: 'Mein Look' });
assert.equal(await page.inputValue('#border'), '5');
assert.equal(await page.inputValue('#ratio'), '1:1');
assert.equal(await page.inputValue('#author'), 'Peter Tischer');
assert.equal(await page.inputValue('#copyright'), '© 2026 Peter Tischer');
assert.equal(await page.isChecked('#wm'), true);

// Überschreiben mit Rückfrage
await page.selectOption('#ratio', '4:5');
answers.push('Mein Look', true);
await page.click('#presetSave');
assert.equal((await options()).filter((x) => x === 'Mein Look').length, 1);

// Bleibt nach Neuladen erhalten
await page.reload();
assert.ok((await options()).includes('Mein Look'));
await page.selectOption('#preset', { label: 'Mein Look' });
assert.equal(await page.inputValue('#ratio'), '4:5');

// Export
const [d] = await Promise.all([page.waitForEvent('download'), page.click('#presetExport')]);
assert.equal(d.suggestedFilename(), 'rahmen-presets.json');
const exp = path.join(outDir, 'rahmen-presets.json');
await d.saveAs(exp);
const json = JSON.parse(readFileSync(exp, 'utf8'));
assert.equal(json.format, 'photo-frame-studio-presets');
assert.deepEqual(json.presets.map((p) => p.name), ['Mein Look'], 'nur eigene Presets');
assert.equal(json.presets[0].settings.author, 'Peter Tischer');

// Löschen mit Rückfrage
answers.push(true);
await page.click('#presetDel');
assert.ok(!(await options()).includes('Mein Look'));

// Import: Datei von oben + ein bereinigtes Preset mit ungültigen Werten
json.presets.push({ name: 'Kaputt', settings: { border: 99, ratio: 'quatsch', target: 1234, author: 42, evil: '<script>', wm: true } });
const imp = path.join(outDir, 'import.json');
writeFileSync(imp, JSON.stringify(json));
await page.setInputFiles('#presetFile', imp);
await page.waitForFunction(() => [...document.querySelectorAll('#preset option')].some((x) => x.textContent === 'Kaputt'));
assert.match(await status(), /2 Preset/);
await page.selectOption('#preset', { label: 'Kaputt' });
assert.equal(await page.inputValue('#border'), '8', 'auf Maximum begrenzt');
assert.equal(await page.inputValue('#ratio'), '4:5', 'ungültiges Format verworfen, bisheriger Wert bleibt');
assert.equal(await page.inputValue('#target'), '1772', 'ungültige Größe verworfen, bisheriger Wert bleibt');
assert.equal(await page.isChecked('#wm'), true);
assert.equal(await page.inputValue('#author'), 'Peter Tischer', 'falscher Typ ignoriert');
await page.selectOption('#preset', { label: 'Mein Look' });
assert.equal(await page.inputValue('#ratio'), '4:5');

// Kaputte Datei: Fehlermeldung, nichts geändert
const bad = path.join(outDir, 'bad.json');
writeFileSync(bad, '{ kein json');
const before = await options();
await page.setInputFiles('#presetFile', bad);
await page.waitForFunction(() => /fehlgeschlagen/.test(document.getElementById('status').textContent));
assert.match(await status(), /nicht lesbar oder ungültig/);
assert.deepEqual(await options(), before);

assert.deepEqual(errors, []);
await browser.close();
console.log('PRESETS OK (' + (process.env.BROWSER || 'chromium') + ')');
