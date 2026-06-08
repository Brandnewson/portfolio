// Playwright verification for the MARL card.
//
// Assertions:
//   1. Each .marl-step button has clientHeight >= 32 (real hit target).
//   2. Legend bounding box never overlaps the narrative bounding box, at any
//      phase, at 1440px and 1024px viewports.
//   3. Clicking phase 1 / 5 / 10 changes the narrative text.
//   4. Screenshots of the MARL panel at both viewports go to scripts/_out/.
//
// Usage:   node scripts/verify-marl-card.mjs
// Assumes a dev server on http://localhost:4321 (start with `npx astro dev`).

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '_out');
const URL = 'http://localhost:4321/';

const VIEWPORTS = [
  { name: '1920', width: 1920, height: 1080 }, // desktop, 3-col
  { name: '1440', width: 1440, height: 900 },  // laptop, 3-col (min for 3-col layout)
  { name: '1100', width: 1100, height: 900 },  // narrow, stacked 1-col
];

function rectsOverlap(a, b) {
  // Playwright's boundingBox() returns {x, y, width, height} — derive edges.
  const aRight = a.x + a.width, aBottom = a.y + a.height;
  const bRight = b.x + b.width, bBottom = b.y + b.height;
  return !(aRight <= b.x || bRight <= a.x || aBottom <= b.y || bBottom <= a.y);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const failures = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.marl-card');

    const card = page.locator('.marl-card');
    await card.scrollIntoViewIfNeeded();

    const stepHeights = await page.$$eval('.marl-step', els => els.map(e => e.clientHeight));
    const minH = Math.min(...stepHeights);
    if (minH < 32) failures.push(`[${vp.name}] step height too small: ${minH}px (want >= 32)`);
    else console.log(`[${vp.name}] step hit targets: min ${minH}px (ok)`);

    // Debug: capture full-viewport before any click, see actual layout state.
    await page.screenshot({ path: join(OUT_DIR, `viewport-${vp.name}.png`), fullPage: false });

    for (const phaseN of [1, 5, 10]) {
      const step = page.locator(`.marl-step[aria-label="Phase ${phaseN}"]`);
      await step.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0); // clear any hover state
      await step.click({ force: true });
      await page.waitForTimeout(80);
      const label = await page.locator('.marl-phase-label').innerText();
      const expected = `PHASE ${String(phaseN).padStart(2, '0')}`;
      if (!label.startsWith(expected)) failures.push(`[${vp.name}] phase ${phaseN} label mismatch: "${label}"`);

      const narrRect = await page.locator('.marl-narrative').boundingBox();
      const legendRect = await page.locator('.marl-legend').boundingBox();
      if (!narrRect || !legendRect) {
        failures.push(`[${vp.name}] missing narrative or legend rect at phase ${phaseN}`);
      } else if (rectsOverlap(narrRect, legendRect)) {
        failures.push(`[${vp.name}] phase ${phaseN}: narrative ${JSON.stringify(narrRect)} overlaps legend ${JSON.stringify(legendRect)}`);
      } else {
        const gap = legendRect.y - (narrRect.y + narrRect.height);
        console.log(`[${vp.name}] phase ${phaseN}: narrative/legend gap ${gap.toFixed(1)}px (ok)`);
      }
    }

    const finalStep = page.locator('.marl-step[aria-label="Phase 5"]');
    await finalStep.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await finalStep.click({ force: true });
    await page.waitForTimeout(120);
    const panel = page.locator('article.panel', { has: page.locator('.marl-card') });

    // Assert body is present, non-empty, and inside the panel's visual box.
    const body = page.locator('.marl-phase-body');
    const bodyText = (await body.innerText()).trim();
    if (bodyText.length < 20) failures.push(`[${vp.name}] phase body suspiciously short: "${bodyText}"`);
    const bodyRect = await body.boundingBox();
    const panelRect = await panel.boundingBox();
    if (bodyRect && panelRect) {
      const bodyBottom = bodyRect.y + bodyRect.height;
      const panelBottom = panelRect.y + panelRect.height;
      console.log(`[${vp.name}] panel ${panelRect.y.toFixed(0)}..${panelBottom.toFixed(0)} (h=${panelRect.height.toFixed(0)}); body bottom ${bodyBottom.toFixed(0)}`);
      // Dump diagnostic CSS for the chain.
      const diag = await panel.evaluate(p => {
        const card = p.querySelector('.marl-card');
        const preview = p.querySelector('.preview');
        const gs = (el) => el ? getComputedStyle(el) : null;
        return {
          panel: { h: p.offsetHeight, overflow: gs(p).overflow },
          preview: preview ? { h: preview.offsetHeight, overflow: gs(preview).overflow, flex: gs(preview).flex, display: gs(preview).display } : null,
          card: card ? { h: card.offsetHeight, display: gs(card).display } : null,
        };
      });
      console.log(`[${vp.name}] diag:`, JSON.stringify(diag));
      if (bodyBottom > panelBottom) failures.push(`[${vp.name}] body extends below panel by ${(bodyBottom - panelBottom).toFixed(1)}px`);
      else console.log(`[${vp.name}] body fits inside panel (margin ${(panelBottom - bodyBottom).toFixed(1)}px)`);
    }

    // Also check kicker — should not wrap to more than 2 lines.
    const kicker = page.locator('.kicker');
    if (await kicker.count() > 0) {
      const kRect = await kicker.boundingBox();
      if (kRect && kRect.height > 40) failures.push(`[${vp.name}] kicker wraps too tall: ${kRect.height}px (likely vertical column)`);
      else if (kRect) console.log(`[${vp.name}] kicker height ${kRect.height.toFixed(1)}px (ok)`);
    }

    await panel.screenshot({ path: join(OUT_DIR, `marl-${vp.name}.png`) });

    // Also dump a zoomed clip around the narrative→legend→chips boundary to
    // make legend visibility easy to eyeball.
    const narr = await page.locator('.marl-narrative').boundingBox();
    const stack = await panel.locator('.stack').boundingBox();
    if (narr && stack) {
      const clip = {
        x: Math.max(0, narr.x - 10),
        y: narr.y - 10,
        width: narr.width + 20,
        height: (stack.y + stack.height) - narr.y + 10,
      };
      await page.screenshot({ path: join(OUT_DIR, `marl-${vp.name}-detail.png`), clip });
    }
    console.log(`[${vp.name}] screenshot saved`);

    await ctx.close();
  }

  await browser.close();

  if (failures.length) {
    console.log('\n--- FAILURES ---');
    for (const f of failures) console.log(' ✗', f);
    process.exit(1);
  } else {
    console.log('\nAll checks passed.');
  }
}

main().catch(err => { console.error(err); process.exit(2); });
