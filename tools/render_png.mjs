// qr/*.svg dosyalarını PNG yapar. Kullanım: node tools/render_png.mjs
import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';
const dir = new URL('../qr/', import.meta.url).pathname;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 900, height: 1260 }, deviceScaleFactor: 2 });
for (const f of readdirSync(dir).filter((x) => x.endsWith('.svg'))) {
  await p.setContent(`<body style="margin:0;background:transparent">${readFileSync(dir + f, 'utf8')}</body>`);
  await p.screenshot({ path: dir + f.replace('.svg', '.png'), omitBackground: true, clip: { x: 0, y: 0, width: 900, height: 1260 } });
  console.log('png', f);
}
await b.close();
