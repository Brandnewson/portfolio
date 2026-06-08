// Verify the QuickRead aside renders the way the Hero brainstorm settled on:
//   - QuickRead container width is the widened ~560px target
//   - KEY column is 110px and uses the sans body font (not mono)
//   - There's a visible vertical rule between KEY and body
//   - No em-dashes leaked back into the SHIPPED or OPEN TO copy
//   - Screenshot saved to scripts/_out/quickread-{day,night}.png
//
// Run: node scripts/verify-quickread.mjs
// Requires the dev server running (npm run dev) on the URL below.
//
// This is a manual-run verification harness, not a CI test. It exists so
// I can inspect the result myself before reporting back to Branson per the
// "verify before handoff" memory.

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '_out');
mkdirSync(OUT_DIR, { recursive: true });

const URL = process.env.URL ?? 'http://localhost:4322/';

function fail(msg) {
  console.error('  ✗', msg);
  process.exitCode = 1;
}
function ok(msg) {
  console.log('  ✓', msg);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });

console.log('Verifying QuickRead…');

// ── Container width ──
const qrBox = await page.locator('.quick-read').first().boundingBox();
console.log(`  QuickRead container width: ${qrBox?.width}px`);
if (!qrBox || qrBox.width < 520) fail(`expected width ≥520px, got ${qrBox?.width}`);
else ok('container width meets the widened target');

// ── KEY column width and font ──
const keyEl = page.locator('.qr-key').first();
const keyBox = await keyEl.boundingBox();
console.log(`  KEY column width: ${keyBox?.width}px`);
if (!keyBox || keyBox.width < 100 || keyBox.width > 140) {
  fail(`expected KEY column ≈110px (allow 100–140), got ${keyBox?.width}`);
} else {
  ok('KEY column width is in the expected range');
}

const keyFont = await keyEl.evaluate((el) => getComputedStyle(el).fontFamily);
console.log(`  KEY font-family: ${keyFont}`);
if (/IBM Plex Mono|mono/i.test(keyFont)) {
  fail('KEY is still rendering in a mono font — should be sans');
} else {
  ok('KEY uses the sans body font (not mono)');
}

// ── Vertical rule between KEY and body ──
const keyBorderRight = await keyEl.evaluate((el) => getComputedStyle(el).borderRightWidth);
console.log(`  KEY border-right: ${keyBorderRight}`);
if (keyBorderRight === '0px') fail('expected a visible vertical rule on the KEY column');
else ok('vertical rule present between KEY and body');

// ── No em-dashes in copy ──
const sectionText = await page.locator('.quick-read').first().innerText();
if (sectionText.includes('—')) {
  fail('em-dash detected in QuickRead copy (Branson asked to remove all em-dashes)');
} else {
  ok('no em-dashes in QuickRead copy');
}

// ── Container width is the new wider target ──
if (qrBox && qrBox.width < 680) fail(`expected container ≥680px after widening, got ${qrBox.width}`);
else ok('container is the wider target (≥680px)');

// ── OPEN TO must be a single line ──
const openToText = page.locator('.qr-row').nth(2).locator('.qr-text');
const openToBox = await openToText.boundingBox();
const openToLineHeight = await openToText.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
const openToLines = openToBox && openToLineHeight ? openToBox.height / openToLineHeight : 0;
console.log(`  OPEN TO height: ${openToBox?.height}px, line-height: ${openToLineHeight}px → ~${openToLines.toFixed(2)} line(s)`);
if (openToLines > 1.25) {
  fail(`OPEN TO wraps to multiple lines (~${openToLines.toFixed(2)})`);
} else {
  ok('OPEN TO fits on a single line');
}

// ── SHIPPED has three plain lines (no sub-keys) ──
const shippedSubCount = await page.locator('.qr-row').nth(0).locator('.qr-substack').count();
const shippedLineCount = await page.locator('.qr-row').nth(0).locator('.qr-line').count();
console.log(`  SHIPPED: ${shippedSubCount} sub-rows, ${shippedLineCount} plain lines`);
if (shippedSubCount !== 0) fail(`SHIPPED still has sub-rows — should be plain lines only`);
else ok('SHIPPED has no sub-rows');
if (shippedLineCount !== 3) fail(`expected 3 SHIPPED lines, got ${shippedLineCount}`);
else ok('SHIPPED renders as 3 distinct lines');

// ── STACK keeps three sub-rows ──
const substackCount = await page.locator('.qr-row').nth(1).locator('.qr-substack').count();
console.log(`  STACK sub-rows: ${substackCount}`);
if (substackCount !== 3) fail(`expected 3 STACK sub-rows (Languages / AI / Web), got ${substackCount}`);
else ok('STACK has the expected 3 sub-rows');

// ── STACK content includes the newly added items ──
const stackText = await page.locator('.qr-row').nth(1).innerText();
for (const term of ['C++', 'Codex', 'Node']) {
  if (!stackText.includes(term)) fail(`STACK missing newly-added '${term}'`);
  else ok(`STACK includes '${term}'`);
}

// ── CTA copy ──
const ctaText = await page.locator('.btn--primary').innerText();
console.log(`  primary CTA: "${ctaText}"`);
if (/\bTHE\b/i.test(ctaText)) fail('primary CTA still contains "THE" — expected the shorter copy');
else ok('primary CTA uses the shorter copy');

// ── Dot alignment with KEY cap-line (within 2px) ──
const dotBox = await page.locator('.qr-row').first().locator('.qr-dot').boundingBox();
const keyEl0 = page.locator('.qr-row').first().locator('.qr-key');
const keyBox0 = await keyEl0.boundingBox();
const keyLineHeight = await keyEl0.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
const keyFontSize = await keyEl0.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
// Cap-line center on a 700-weight sans is ≈ font-size × 0.36 below the line-box top.
const expectedKeyCapY = keyBox0.y + (keyLineHeight - keyFontSize) / 2 + keyFontSize * 0.36;
const dotCenterY = dotBox.y + dotBox.height / 2;
const dotDelta = Math.abs(dotCenterY - expectedKeyCapY);
console.log(`  dot center y: ${dotCenterY.toFixed(2)}px · key cap-center y: ${expectedKeyCapY.toFixed(2)}px · delta: ${dotDelta.toFixed(2)}px`);
if (dotDelta > 2.5) fail(`dot is ${dotDelta.toFixed(2)}px off from key cap-line (target ≤2.5px)`);
else ok('dot vertically aligned with key cap-line');

// ── Screenshots ──
await page.locator('.quick-read').first().screenshot({ path: join(OUT_DIR, 'quickread-day.png') });
ok('day screenshot saved to scripts/_out/quickread-day.png');

// Toggle to night
await page.locator('.theme-toggle .label').nth(1).click();
await page.waitForTimeout(600);
await page.locator('.quick-read').first().screenshot({ path: join(OUT_DIR, 'quickread-night.png') });
ok('night screenshot saved to scripts/_out/quickread-night.png');

// Full hero in both themes
await page.locator('.hero').first().screenshot({ path: join(OUT_DIR, 'hero-night.png') });
await page.locator('.theme-toggle .label').first().click();
await page.waitForTimeout(600);
await page.locator('.hero').first().screenshot({ path: join(OUT_DIR, 'hero-day.png') });
ok('hero screenshots (day + night) saved');

await browser.close();

if (process.exitCode) {
  console.error('\nVerification FAILED — see ✗ lines above.');
} else {
  console.log('\nVerification PASSED.');
}
