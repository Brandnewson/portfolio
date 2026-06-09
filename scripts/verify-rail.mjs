import { chromium } from 'playwright';
const URL = 'http://localhost:59640/';
const out = 'scripts/_out';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
// scroll to MARL — rail should show, MARL active
await page.evaluate(() => document.getElementById('marl').scrollIntoView());
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/rail-marl-day.png` });
// night + profile
await page.evaluate(() => { window.scrollTo(0,0); });
await page.waitForTimeout(300);
await page.click('#toggle');
await page.waitForTimeout(600);
await page.evaluate(() => document.getElementById('profile').scrollIntoView());
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/rail-profile-night.png` });
await browser.close();
console.log('done');
