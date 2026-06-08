import { chromium } from 'playwright';

const URL = 'http://localhost:4322/';
const out = 'scripts/_out';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/header-day.png`, clip: { x: 0, y: 0, width: 1440, height: 110 } });

// Flip to night via the store's localStorage key, reload.
await page.evaluate(() => localStorage.setItem('theme', 'night'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/header-night.png`, clip: { x: 0, y: 0, width: 1440, height: 110 } });

await browser.close();
console.log('done');
