import { chromium } from 'playwright';
const URL = 'http://localhost:59608/';
const out = 'scripts/_out';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
// hero only (day)
await page.screenshot({ path: `${out}/clone-hero-day.png` });
// full page day
await page.screenshot({ path: `${out}/clone-full-day.png`, fullPage: true });
// flip to night via toggle
await page.click('#toggle');
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/clone-hero-night.png` });
await page.screenshot({ path: `${out}/clone-full-night.png`, fullPage: true });
await browser.close();
console.log('done');
