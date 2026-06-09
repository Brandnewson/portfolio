import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '_out');
const PORT = process.env.PORT || '4321';
const URL = `http://localhost:${PORT}/`;
const fails = [];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') fails.push('console: ' + m.text()); });
await page.goto(URL, { waitUntil: 'networkidle' });

async function setTheme(t) {
  await page.evaluate((x) => { document.documentElement.setAttribute('data-theme', x); localStorage.setItem('theme', x); }, t);
  await page.waitForTimeout(180);
}

for (const theme of ['day', 'night']) {
  await setTheme(theme);

  // Hero — toggle centred
  const hero = page.locator('.hero').first();
  await hero.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await hero.screenshot({ path: join(OUT, `r3-hero-${theme}.png`) });

  // Contact
  const contact = page.locator('#contact').first();
  await contact.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await contact.screenshot({ path: join(OUT, `r3-contact-${theme}.png`) });

  // Helm resting
  const helm = page.locator('#helm').first();
  await helm.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await helm.screenshot({ path: join(OUT, `r3-helm-${theme}.png`) });
}

// ── Desktop hover-to-expand: hovering the diagram opens the side-by-side panel ──
await setTheme('day');
await page.locator('#helm').scrollIntoViewIfNeeded();
await page.waitForTimeout(150);
await page.locator('.helm-arch-scroll').hover();
await page.waitForTimeout(600); // 180ms intent + fade/scale settle
const overlayVisible = await page.locator('.helm-overlay-panel').isVisible();
if (!overlayVisible) fails.push('hover did not open the expanded panel');

// Layout: explanatory text column sits LEFT of the diagram.
const detailBox = await page.locator('.helm-overlay-detail').boundingBox();
const stageBox = await page.locator('.helm-overlay-stage').boundingBox();
if (!(detailBox && stageBox && detailBox.x + detailBox.width <= stageBox.x + 5))
  fails.push(`detail text not left of diagram (detail right=${detailBox?.x + detailBox?.width}, stage.x=${stageBox?.x})`);

// Side whitespace: the panel is width-capped, not full-bleed.
const panelBox = await page.locator('.helm-overlay-panel').boundingBox();
if (!(panelBox && panelBox.width < 1440 - 80)) fails.push(`panel not width-capped (w=${panelBox?.width})`);

const overlaySvg = await page.locator('.helm-overlay-stage .helm-arch-svg').boundingBox();
await page.screenshot({ path: join(OUT, 'r3-helm-expanded-day.png'), fullPage: false });

// scroll lock
const locked = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
if (locked !== 'hidden') fails.push(`scroll not locked while open (overflow=${locked})`);

// hovering the worker node fills the LEFT detail column with the 6-stage harness
await page.locator('.helm-overlay-stage .helm-node[aria-label^="worker:9000"]').hover();
await page.waitForTimeout(150);
const stages = await page.locator('.helm-overlay-detail .helm-stage').count();
if (stages !== 6) fails.push(`overlay detail did not reveal 6 stages on worker hover (got ${stages})`);
await page.screenshot({ path: join(OUT, 'r3-helm-expanded-worker-day.png'), fullPage: false });

// zoom in twice → diagram width grows (width-based zoom now)
const beforeW = (await page.locator('.helm-overlay-stage .helm-arch-svg').boundingBox()).width;
await page.locator('.helm-overlay-head .hz-btn[aria-label="Zoom in"]').click();
await page.locator('.helm-overlay-head .hz-btn[aria-label="Zoom in"]').click();
await page.waitForTimeout(250);
const afterW = (await page.locator('.helm-overlay-stage .helm-arch-svg').boundingBox()).width;
if (!(afterW > beforeW + 20)) fails.push(`zoom did not enlarge diagram (${Math.round(beforeW)} -> ${Math.round(afterW)})`);

// Mouse-off retracts a hover-opened panel.
await page.mouse.move(5, 5);
await page.waitForTimeout(550);
if ((await page.locator('.helm-overlay-panel').count()) !== 0) fails.push('panel did not retract on mouse-off');
const unlocked = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
if (unlocked === 'hidden') fails.push('scroll stayed locked after retract');

// Keyboard path: focus the (visually hidden) Expand button + Enter opens; Esc closes.
await page.locator('.helm-arch-expand').focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
if ((await page.locator('.helm-overlay-panel').count()) !== 1) fails.push('keyboard Enter did not open overlay');
await page.keyboard.press('Escape');
await page.waitForTimeout(450);
if ((await page.locator('.helm-overlay-panel').count()) !== 0) fails.push('Escape did not close overlay');

// inline vs overlay size
const inlineSvg = await page.locator('.helm-arch-scroll .helm-arch-svg').boundingBox();
console.log(`inline diagram width: ${Math.round(inlineSvg.width)}px`);
console.log(`overlay diagram (zoom 1) width: ${Math.round(overlaySvg.width)}px | panel width: ${Math.round(panelBox.width)}px`);

await browser.close();

if (fails.length) {
  console.error('\nFAILURES:\n' + fails.map((f) => '  - ' + f).join('\n'));
  process.exit(1);
}
console.log('\nAll rev3 checks passed.');
