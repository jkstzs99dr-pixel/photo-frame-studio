// Mapping-Regression mit Werten aus echten Kameradateien (F-06).
// Die Fotos selbst liegen nicht im Repo; hier stehen nur die ausgelesenen MakerNote-Werte
// („Gelesene Werte“ im Prototyp) und die erwartete Textzeile, gegengeprüft mit exiftool.
// Anderer Browser: BROWSER=webkit bzw. BROWSER=firefox
import * as pw from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const page_url = pathToFileURL(path.join(root, 'prototype/rahmen.html')).href;

const cases = [
  {
    // X100VI, DSCF7711.RAF (2026-10-03), Firmware X100VI_0100
    // exiftool: Nostalgic Neg, DevelopmentDynamicRange 400 (DynamicRangeSetting Manual), WB Kelvin 6000,
    // ColorChrome Strong, FXBlue Off, Highlight -2, Shadow +1, Sharpness -2, Saturation +2, Grain Weak, Clarity -2
    name: 'X100VI Nostalgic Neg, DR400, Kelvin 6000',
    fuji: { 0x1001: [2], 0x1002: [0xff0], 0x1003: [0x100], 0x1005: [6000], 0x100a: [0, 0], 0x100f: [-2000],
      0x1040: [-16], 0x1041: [32], 0x1047: [32], 0x1048: [64], 0x104e: [0], 0x1401: [0xa00], 0x1402: [1], 0x1403: [400] },
    line: 'Nostalgic Neg.  ·  DR400  ·  WB 6000K  ·  Color Chrome Strong  ·  Highlight -2  ·  Shadow +1  ·  Sharp -2  ·  Color +2  ·  Grain Weak  ·  Clarity -2',
  },
  {
    // X100F, DSCF7063.JPG (2022-07-23), Firmware 2.11 – kein FilmMode-Tag, S/W steckt in Saturation
    // exiftool: Saturation Acros Green Filter, DynamicRangeSetting Manual + DevelopmentDynamicRange 100,
    // WB Daylight (Feinabstimmung 0/0), Sharpness 0, Shadow/Highlight 0, Grain Off
    name: 'X100F Acros Green Filter, DR100, Daylight',
    fuji: { 0x1001: [3], 0x1002: [0x100], 0x1003: [0x503], 0x100a: [0, 0], 0x1040: [0], 0x1041: [0], 0x1047: [0],
      0x1402: [1], 0x1403: [100] },
    line: 'Acros Green Filter  ·  DR100  ·  WB Daylight',
  },
  {
    // X100F, DSCF7088.JPG (2022-08-13), in digiKam gespeichert (Pixel bereits hochkant, Orientation 1)
    // exiftool: FilmMode Provia, Saturation normal, WB Cloudy, DR Manual + 100
    name: 'X100F Provia, DR100, Cloudy',
    fuji: { 0x1001: [3], 0x1002: [0x200], 0x1003: [0], 0x100a: [0, 0], 0x1040: [0], 0x1041: [0], 0x1047: [0],
      0x1401: [0], 0x1402: [1], 0x1403: [100] },
    line: 'Provia  ·  DR100  ·  WB Cloudy',
  },
  {
    // X100VI, DSCF8424.JPG (2026-11-03), unbearbeitet, Orientation 8 (Rotate 270 CW), Firmware 1.31
    // exiftool: Provia, DR Manual + 200, WB Daylight, Feinabstimmung roh 40/-100 (Prototyp: /20 → R+2 B-5, an der Kamera bestätigt),
    // Sharpness +1, Saturation +2, ColorChrome Strong, FXBlue Off, Grain Weak, Clarity 3
    name: 'X100VI Provia, DR200, Daylight mit Feinabstimmung',
    fuji: { 0x1001: [0x84], 0x1002: [0x100], 0x1003: [0x100], 0x100a: [40, -100], 0x100f: [3000], 0x1040: [0], 0x1041: [0],
      0x1047: [32], 0x1048: [64], 0x104e: [0], 0x1401: [0], 0x1402: [1], 0x1403: [200] },
    line: 'Provia  ·  DR200  ·  WB Daylight R+2 B-5  ·  Color Chrome Strong  ·  Sharp +1  ·  Color +2  ·  Grain Weak  ·  Clarity +3',
  },
  {
    // DynamicRangeSetting 0x200 ohne DevelopmentDynamicRange: Bedeutung je Kamera unklar
    // (exiftool: „Wide1 (230%)“) → nichts raten, DR weglassen
    name: 'DR-Altwert ohne Entwicklungswert',
    fuji: { 0x1402: [0x200] },
    line: '',
  },
  {
    // Abwandlung: Kelvin mit Feinabstimmung (Werte / 20)
    name: 'Kelvin mit Feinabstimmung',
    fuji: { 0x1002: [0xff0], 0x1005: [5300], 0x100a: [40, -60] },
    line: 'WB 5300K R+2 B-3',
  },
  {
    // Kelvin ohne Temperatur-Tag: nichts raten
    name: 'Kelvin ohne Temperatur',
    fuji: { 0x1002: [0xff0] },
    line: 'WB Kelvin',
  },
];

const browser = await pw[process.env.BROWSER || 'chromium'].launch();
const page = await browser.newPage();
await page.goto(page_url);
for (const c of cases) {
  const got = await page.evaluate((f) => fujiLine(Object.fromEntries(Object.entries(f).map(([k, v]) => [+k, v]))).join('  ·  '), c.fuji);
  assert.equal(got, c.line, c.name);
}
await browser.close();
console.log('MAPPING OK (' + (process.env.BROWSER || 'chromium') + ')');
