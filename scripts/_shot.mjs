import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '_out');
const BASE = 'http://localhost:4321';
const pages = [['/', 'home'], ['/writing', 'writing'], ['/contact', 'contact']];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const theme of ['day', 'night']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  for (const [path, name] of pages) {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(250);
    await page.screenshot({ path: join(OUT, `${name}-${theme}.png`), fullPage: true });
  }
  await ctx.close();
}
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mctx.newPage();
await mp.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await mp.screenshot({ path: join(OUT, 'home-mobile.png'), fullPage: true });
await mctx.close();
await browser.close();
console.log('shots written');
