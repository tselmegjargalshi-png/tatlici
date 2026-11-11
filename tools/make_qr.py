#!/usr/bin/env python3
"""Tatlı Durağı için iki özel QR kodu üretir (SVG). PNG için tools/render_png.mjs kullanılır.

Kullanım: python3 tools/make_qr.py https://tatlici.vercel.app
Gereken: reportlab (QR matrisi için)
"""
import base64, math, sys, pathlib
from reportlab.graphics.barcode import qrencoder as qe

ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'https://tatlici.vercel.app').rstrip('/')

CHOCO, CHOCO_D, GOLD, GOLD_L, CREAM, PIST = '#3B1E10', '#2A140A', '#C8963E', '#F0D59A', '#FBF5EA', '#7E9A2E'


def matrix(url):
    for v in range(2, 12):
        try:
            q = qe.QRCode(v, qe.QRErrorCorrectLevel.H)
            q.addData(url)
            q.make()
            n = q.getModuleCount()
            return [[q.isDark(r, c) for c in range(n)] for r in range(n)]
        except Exception:
            continue
    raise SystemExit('URL çok uzun')


def in_finder(r, c, n):
    return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)


def logo_b64():
    return base64.b64encode((ROOT / 'assets' / 'logo.webp').read_bytes()).decode()


def defs():
    return f'''<defs>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3D58C"/><stop offset=".5" stop-color="{GOLD}"/><stop offset="1" stop-color="#9A6B23"/></linearGradient>
<linearGradient id="choco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A2C14"/><stop offset="1" stop-color="{CHOCO_D}"/></linearGradient>
<linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4E2814"/><stop offset="1" stop-color="{CHOCO_D}"/></linearGradient>
</defs>'''


def tulip(cx, cy, s, fill='url(#gold)'):
    # logodaki lale süsü
    k = s / 100
    return (f'<g transform="translate({cx - 50 * k:.2f},{cy - 50 * k:.2f}) scale({k:.4f})" fill="{fill}">'
            '<path d="M50 4C42 18 32 26 32 40c0 11 8 18 18 18s18-7 18-18C68 26 58 18 50 4z"/>'
            '<path d="M8 22c14 2 24 12 26 30 2 14-4 26-14 34C14 66 2 44 8 22z" opacity=".9"/>'
            '<path d="M92 22c-14 2-24 12-26 30-2 14 4 26 14 34 6-20 18-42 12-64z" opacity=".9"/></g>')


def qr1(m, url):
    """Kemer: logodaki numan kapı, yuvarlak noktalar, altın göz merkezleri."""
    n = len(m); W, H = 900, 1260
    q = 560; cell = q / (n + 2)
    ox, oy = (W - q) / 2, 560
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">', defs(),
             f'<rect width="{W}" height="{H}" rx="56" fill="#FFFFFF"/>',
             f'<rect x="18" y="18" width="{W-36}" height="{H-36}" rx="42" fill="none" stroke="url(#gold)" stroke-width="6"/>',
             f'<rect x="34" y="34" width="{W-68}" height="{H-68}" rx="30" fill="none" stroke="{CHOCO}" stroke-width="1.5" opacity=".35"/>',
             f'<image href="data:image/webp;base64,{logo_b64()}" x="100" y="70" width="700" height="466" preserveAspectRatio="xMidYMid meet"/>']
    # QR paneli: numan kapı biçimi
    px, py, pw, ph = ox - 40, oy - 40, q + 80, q + 80
    parts.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="46" fill="{CREAM}" stroke="url(#gold)" stroke-width="5"/>')
    r = cell * 0.47
    for rr in range(n):
        for cc in range(n):
            if not m[rr][cc] or in_finder(rr, cc, n):
                continue
            if abs(rr - n / 2 + .5) < 2.6 and abs(cc - n / 2 + .5) < 2.6:
                continue
            x = ox + (cc + 1) * cell + cell / 2; y = oy + (rr + 1) * cell + cell / 2
            parts.append(f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r:.2f}" fill="url(#choco)"/>')
    for (fr, fc) in [(0, 0), (0, n - 7), (n - 7, 0)]:
        x = ox + (fc + 1) * cell; y = oy + (fr + 1) * cell; s = 7 * cell
        parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{s:.2f}" height="{s:.2f}" rx="{cell*.8:.2f}" fill="url(#choco)"/>')
        parts.append(f'<rect x="{x+cell:.2f}" y="{y+cell:.2f}" width="{5*cell:.2f}" height="{5*cell:.2f}" rx="{cell*.4:.2f}" fill="{CREAM}"/>')
        parts.append(f'<rect x="{x+2*cell:.2f}" y="{y+2*cell:.2f}" width="{3*cell:.2f}" height="{3*cell:.2f}" rx="{cell*.5:.2f}" fill="url(#choco)"/>')
    parts.append(tulip(W / 2, oy + q / 2, cell * 4.2, fill='url(#gold)'))
    # alt yazı
    parts.append(f'<text x="{W/2}" y="{py + ph + 78}" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="44" font-style="italic" font-weight="700" fill="{CHOCO}">Menüyü görmek için okutun</text>')
    parts.append(f'<path d="M250 {py + ph + 112}h160M490 {py + ph + 112}h160" stroke="{GOLD}" stroke-width="2.5"/>')
    parts.append(f'<path transform="translate(450 {py + ph + 112})" d="M0-12 12 0 0 12-12 0z" fill="url(#gold)"/>')
    parts.append('</svg>')
    return '\n'.join(parts)


def qr2(m, url):
    """Baklava: elmas dilim noktalar, çikolata zemin, fıstık yeşili göz merkezleri."""
    n = len(m); W, H = 900, 1260
    q = 540; cell = q / (n + 2)
    ox, oy = (W - q) / 2, 360
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">', defs(),
             f'<rect width="{W}" height="{H}" rx="56" fill="url(#bg2)"/>']
    # baklava deseni (elmas kafes)
    pat = []
    step = 60
    for gy in range(-1, H // step + 2):
        for gx in range(-1, W // step + 2):
            cx = gx * step + (step / 2 if gy % 2 else 0); cy = gy * step / 2 * 1
            pat.append(f'<path transform="translate({cx} {cy})" d="M0-14 14 0 0 14-14 0z" fill="none" stroke="{GOLD}" stroke-width="1.2"/>')
    parts.append(f'<g opacity=".16">{"".join(pat)}</g>')
    parts.append(f'<rect x="18" y="18" width="{W-36}" height="{H-36}" rx="42" fill="none" stroke="url(#gold)" stroke-width="5"/>')
    # başlık
    parts.append(f'<text x="{W/2}" y="150" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="92" font-style="italic" font-weight="700" fill="{GOLD_L}">Tatlı Durağı</text>')
    parts.append(f'<text x="{W/2}" y="212" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="30" letter-spacing="14" fill="{GOLD}">TATLICI</text>')
    parts.append(f'<path d="M180 250h200M520 250h200" stroke="{GOLD}" stroke-width="2"/>')
    parts.append(f'<path transform="translate(450 250)" d="M0-13 13 0 0 13-13 0z" fill="url(#gold)"/>')
    # krem panel
    px, py, pw, ph = ox - 70, oy - 70, q + 140, q + 140
    parts.append(f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" rx="40" fill="{CREAM}"/>')
    parts.append(f'<rect x="{px+10}" y="{py+10}" width="{pw-20}" height="{ph-20}" rx="32" fill="none" stroke="url(#gold)" stroke-width="3"/>')
    h = cell * 0.74
    for rr in range(n):
        for cc in range(n):
            if not m[rr][cc] or in_finder(rr, cc, n):
                continue
            x = ox + (cc + 1) * cell + cell / 2; y = oy + (rr + 1) * cell + cell / 2
            parts.append(f'<path d="M{x:.2f} {y-h:.2f}L{x+h:.2f} {y:.2f}L{x:.2f} {y+h:.2f}L{x-h:.2f} {y:.2f}z" fill="{CHOCO}"/>')
    for (fr, fc) in [(0, 0), (0, n - 7), (n - 7, 0)]:
        x = ox + (fc + 1) * cell; y = oy + (fr + 1) * cell; s = 7 * cell
        parts.append(f'<rect x="{x:.2f}" y="{y:.2f}" width="{s:.2f}" height="{s:.2f}" rx="{cell*.5:.2f}" fill="{CHOCO}"/>')
        parts.append(f'<rect x="{x+cell:.2f}" y="{y+cell:.2f}" width="{5*cell:.2f}" height="{5*cell:.2f}" rx="{cell*.3:.2f}" fill="{CREAM}"/>')
        parts.append(f'<rect x="{x+2*cell:.2f}" y="{y+2*cell:.2f}" width="{3*cell:.2f}" height="{3*cell:.2f}" rx="{cell*.3:.2f}" fill="{CHOCO}"/>')
        cx, cy = x + 3.5 * cell, y + 3.5 * cell
        parts.append(f'<path d="M{cx} {cy-cell*.25:.2f}L{cx+cell*.25:.2f} {cy}L{cx} {cy+cell*.25:.2f}L{cx-cell*.25:.2f} {cy}z" fill="{PIST}"/>')
    # alt bölüm
    by = py + ph
    parts.append(f'<text x="{W/2}" y="{by + 90}" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="46" font-style="italic" fill="{GOLD_L}">Telefonunu yaklaştır,</text>')
    parts.append(f'<text x="{W/2}" y="{by + 148}" text-anchor="middle" font-family="Georgia, \'DejaVu Serif\', serif" font-size="46" font-style="italic" fill="{GOLD_L}">tatlı seni bulsun</text>')
    parts.append(tulip(W / 2, by + 215, 70))
    parts.append('</svg>')
    return '\n'.join(parts)


if __name__ == '__main__':
    out = ROOT / 'qr'; out.mkdir(exist_ok=True)
    for name, fn, tag in [('tatli-duragi-qr-kemer', qr1, '1'), ('tatli-duragi-qr-baklava', qr2, '2')]:
        url = f'{BASE}/?q={tag}'
        (out / f'{name}.svg').write_text(fn(matrix(url), url), encoding='utf-8')
        print(name, url, len(matrix(url)))
