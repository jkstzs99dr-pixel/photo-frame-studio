#!/usr/bin/env python3
"""Erzeugt synthetische Testdateien in tests/fixtures/out/.

- base.jpg       : 3000x2000 JPEG ohne Exif
- DSC00001.JPG   : Sony-JPEG mit Exif + Sony-MakerNote (Creative Style Vivid, DRO Auto, EV +0.7),
                   leere Artist/Copyright-Platzhalter aus Leerzeichen
- DSC00002.ARW   : ARW-artige TIFF-Datei mit Vorschau-JPEG in SubIFD und Orientation 6
- DSC00003.RAF   : RAF-Attrappe mit dem Sony-JPEG als eingebettetem JPEG
- DSCF0001.JPG   : Fuji-JPEG mit Fuji-MakerNote (Classic Chrome), Orientation 6, Aufnahmedatum,
                   Artist/Copyright aus der Kamera, GPS und Miniaturbild (IFD1) – für F-01/F-02

Achtung: Die Dateien folgen der eigenen Implementierung. Sie ersetzen keine echten Kameradateien.
Voraussetzung: pip install pillow
"""
import struct
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent / "out"
OUT.mkdir(exist_ok=True)

# Basisbild
im = Image.new("RGB", (3000, 2000), (90, 120, 90))
d = ImageDraw.Draw(im)
for i in range(0, 3000, 100):
    d.rectangle([i, 1200, i + 50, 2000], fill=(40, 70, 40))
im.save(OUT / "base.jpg", quality=90)
jpg = (OUT / "base.jpg").read_bytes()

def asc(s):
    b = s.encode() + b"\0"
    return (2, len(b), b)
def sh(v): return (3, 1, struct.pack("<H", v))
def lg(v): return (4, 1, struct.pack("<I", v))
def rat(n, d): return (5, 1, struct.pack("<II", n, d))
def srat(n, d): return (10, 1, struct.pack("<ii", n, d))

def ifd(entries, pos, nxt=0):
    """IFD bauen; pos = absolute Position im TIFF (für Offsets der Zusatzdaten), nxt = nächstes IFD."""
    es = sorted(entries, key=lambda e: e[0])
    n = len(es)
    table = struct.pack("<H", n)
    extra = b""
    eo = pos + 2 + 12 * n + 4
    for tag, (typ, cnt, pl) in es:
        if len(pl) <= 4:
            v = pl.ljust(4, b"\0")
        else:
            v = struct.pack("<I", eo + len(extra))
            extra += pl + (b"\0" if len(pl) % 2 else b"")
        table += struct.pack("<HHI", tag, typ, cnt) + v
    return table + struct.pack("<I", nxt) + extra

def tiff(arw):
    t = bytearray(0x1000)
    t[0:8] = b"II*\0" + struct.pack("<I", 8)
    # Leere Artist/Copyright-Platzhalter aus Leerzeichen, wie sie echte Kameras schreiben (X100VI: 256/512 Byte)
    i0 = [(0x10F, asc("SONY")), (0x110, asc("ILCE-7M4")), (0x13B, asc(" " * 31)), (0x8298, asc(" " * 63)),
          (0x8769, lg(0x300))]
    if arw:
        i0 += [(0x112, sh(6)), (0x14A, lg(0x900))]
    b = ifd(i0, 8); t[8:8 + len(b)] = b
    mn = b"SONY DSC \0\0\0" + ifd([(0xB020, asc("Vivid")), (0xB025, lg(3))], 0x600 + 12)
    ex = [(0x829A, rat(1, 250)), (0x829D, rat(28, 10)), (0x8822, sh(3)), (0x8827, sh(400)),
          (0x9204, srat(7, 10)), (0x920A, rat(350, 10)), (0xA434, asc("FE 35mm F1.8")),
          (0x927C, (7, len(mn), struct.pack("<I", 0x600)))]
    b = ifd(ex, 0x300); t[0x300:0x300 + len(b)] = b
    t[0x600:0x600 + len(mn)] = mn
    if arw:
        b = ifd([(0x201, lg(0x1000)), (0x202, lg(len(jpg)))], 0x900); t[0x900:0x900 + len(b)] = b
        return bytes(t) + jpg
    return bytes(t[:0x900])

app1 = b"Exif\0\0" + tiff(False)
sony_jpg = b"\xff\xd8" + b"\xff\xe1" + struct.pack(">H", len(app1) + 2) + app1 + jpg[2:]
(OUT / "DSC00001.JPG").write_bytes(sony_jpg)
(OUT / "DSC00002.ARW").write_bytes(tiff(True))
hdr = b"FUJIFILMCCD-RAW 0201".ljust(84, b"\0") + struct.pack(">II", 0x100, len(sony_jpg))
(OUT / "DSC00003.RAF").write_bytes(hdr.ljust(0x100, b"\0") + sony_jpg)
# Fuji-JPEG: Querformat-Pixel mit Orientation 6, Fuji-MakerNote (Offsets relativ zum MakerNote-Start)
thumb_im = im.resize((160, 107)); thumb_im.save(OUT / "_thumb.jpg", quality=70)
thumb = (OUT / "_thumb.jpg").read_bytes(); (OUT / "_thumb.jpg").unlink()
t = bytearray(0x700)
t[0:8] = b"II*\0" + struct.pack("<I", 8)
b = ifd([(0x10F, asc("FUJIFILM")), (0x110, asc("X100VI")), (0x112, sh(6)), (0x11A, rat(72, 1)),
         (0x132, asc("2026:10:31 14:22:05")), (0x13B, asc("Kamera Artist")), (0x8298, asc("Kamera Copyright")),
         (0x8769, lg(0x200)), (0x8825, lg(0x500))], 8, nxt=0x600)
t[8:8 + len(b)] = b
fmn = b"FUJIFILM" + struct.pack("<I", 12) + ifd(
    [(0x1002, sh(0)), (0x1048, lg(32)), (0x1401, sh(0x600)), (0x1402, sh(0x200))], 12)
b = ifd([(0x829A, rat(1, 500)), (0x829D, rat(56, 10)), (0x8827, sh(125)), (0x9003, asc("2026:10:31 14:22:05")),
         (0x920A, rat(23, 1)), (0x927C, (7, len(fmn), struct.pack("<I", 0x300)))], 0x200)
t[0x200:0x200 + len(b)] = b
t[0x300:0x300 + len(fmn)] = fmn
b = ifd([(0x0, (1, 4, bytes([2, 3, 0, 0]))), (0x1, asc("N")),
         (0x2, (5, 3, struct.pack("<IIIIII", 52, 1, 31, 1, 0, 1))), (0x3, asc("E")),
         (0x4, (5, 3, struct.pack("<IIIIII", 13, 1, 24, 1, 0, 1)))], 0x500)
t[0x500:0x500 + len(b)] = b
b = ifd([(0x103, sh(6)), (0x201, lg(0x700)), (0x202, lg(len(thumb)))], 0x600)
t[0x600:0x600 + len(b)] = b
app1 = b"Exif\0\0" + bytes(t) + thumb
(OUT / "DSCF0001.JPG").write_bytes(b"\xff\xd8\xff\xe1" + struct.pack(">H", len(app1) + 2) + app1 + jpg[2:])
print("Fixtures erzeugt in", OUT)
