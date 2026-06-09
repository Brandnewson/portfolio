// Generates public/og.png (1200x630 share card) with headless Chromium — no new
// dependency, reuses the installed Playwright. Re-run if the tagline changes.
import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og.png');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1200px; height:630px; background:#F4EEE3; color:#171514;
    font-family:'Segoe UI', system-ui, -apple-system, sans-serif;
    display:flex; flex-direction:column; justify-content:space-between;
    padding:74px 80px;
  }
  .top { display:flex; flex-direction:column; gap:20px; }
  .name { font-size:21px; letter-spacing:0.3em; font-weight:700; text-transform:uppercase; }
  .rule { width:46px; height:3px; background:#A8643C; }
  .eyebrow { font-size:17px; letter-spacing:0.28em; text-transform:uppercase; color:#A8643C; font-weight:600; }
  .headline { font-size:86px; line-height:1.0; font-weight:700; letter-spacing:-0.02em; max-width:1000px; }
  .headline em { font-style:normal; color:#A8643C; }
  .bottom { display:flex; justify-content:space-between; align-items:center; }
  .url { font-size:26px; font-weight:600; }
  .status { display:flex; align-items:center; gap:12px; font-size:17px; letter-spacing:0.18em; text-transform:uppercase; color:#5b544c; font-weight:600; }
  .dot { width:12px; height:12px; border-radius:50%; background:#14CC4A; box-shadow:0 0 10px rgba(20,204,74,0.7); }
</style></head><body>
  <div class="top">
    <div class="name">Branson Tay</div>
    <div class="rule"></div>
    <div class="eyebrow">Full-stack &middot; Simulation &middot; AI</div>
  </div>
  <div class="headline">I build applied-AI tools that <em>ship.</em></div>
  <div class="bottom">
    <div class="url">bransontay.dev</div>
    <div class="status"><span class="dot"></span> Open to work &middot; London + NYC</div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser
  .newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  .then((c) => c.newPage());
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: OUT });
await browser.close();
console.log('og.png written to', OUT);
