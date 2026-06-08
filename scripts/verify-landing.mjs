import { chromium } from 'playwright';
const PORT = process.env.PORT || '4321';
const URL = `http://localhost:${PORT}/`;
const out = 'scripts/_out';
const b = await chromium.launch();

// desktop
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(URL, { waitUntil: 'networkidle' });
await p.waitForTimeout(500);
await p.screenshot({ path: `${out}/landing-hero-day.png` });

// theme toggle flips data-theme
const before = await p.getAttribute('html', 'data-theme');
await p.click('.theme-toggle');
await p.waitForTimeout(600);
const after = await p.getAttribute('html', 'data-theme');
console.log('theme:', before, '->', after, before !== after ? 'OK' : 'FAIL');

// rail appears + scroll-spy after scrolling to a section
await p.evaluate(() => document.getElementById('marl').scrollIntoView());
await p.waitForTimeout(700);
const railVisible = await p.isVisible('.section-rail.is-visible');
const marlActive = await p.isVisible('.section-rail .rail-item.is-active');
console.log('rail visible:', railVisible, '| active set:', marlActive);
await p.screenshot({ path: `${out}/landing-rail-night.png` });

// anchor jump: clicking a rail item changes hash
await p.click('.section-rail a[href="#contact"]');
await p.waitForTimeout(500);
console.log('hash after contact click:', await p.evaluate(() => location.hash));

// full page (night, since we toggled)
await p.screenshot({ path: `${out}/landing-full-night.png`, fullPage: true });

// mobile strip
const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
await m.goto(URL, { waitUntil: 'networkidle' });
await m.evaluate(() => document.getElementById('helm').scrollIntoView());
await m.waitForTimeout(700);
console.log('mobile strip visible:', await m.isVisible('.section-rail-m.is-visible'));
await m.screenshot({ path: `${out}/landing-mobile-day.png` });

await b.close();
console.log('done');
