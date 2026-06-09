import { chromium } from 'playwright';
const URL = 'http://localhost:59640/';
const out = 'scripts/_out';
const browser = await chromium.launch();

// desktop — confirm chips have no bullets
const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto(URL, { waitUntil: 'networkidle' });
await d.evaluate(() => document.getElementById('work').scrollIntoView());
await d.waitForTimeout(500);
await d.screenshot({ path: `${out}/v8-chips-day.png`, clip: { x: 120, y: 350, width: 640, height: 360 } });

// mobile — bottom strip with scroll-spy
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await m.goto(URL, { waitUntil: 'networkidle' });
await m.evaluate(() => document.getElementById('helm').scrollIntoView());
await m.waitForTimeout(700);
await m.screenshot({ path: `${out}/v8-mobile-day.png` });
await m.click('#toggle');                       // toggle is in hero; scroll up first
await m.evaluate(() => window.scrollTo(0,0));
await m.waitForTimeout(200);
await m.click('#toggle');
await m.waitForTimeout(500);
await m.evaluate(() => document.getElementById('profile').scrollIntoView());
await m.waitForTimeout(700);
await m.screenshot({ path: `${out}/v8-mobile-night.png` });

await browser.close();
console.log('done');
