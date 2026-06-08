// Playwright verification for the Helm system-topology diagram.
//
// Assertions:
//   1. The island renders the expected node + edge counts.
//   2. Default state shows the legend (not a node detail panel).
//   3. Hovering the worker node lights it (is-active) and reveals the 6-stage
//      harness in the detail panel.
//   4. Hovering a node dims at least one unrelated node (focus-and-dim works).
//   5. The detail panel height does not change between hovering web and worker
//      (reserved min-height keeps the band from jumping).
//   6. No connector label overflows the SVG bounds.
//   7. Screenshots: default + worker-hover at 1440 and 1100 viewports.
//
// Usage:   node scripts/verify-helm-arch.mjs
// Assumes a dev server on http://localhost:4321.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '_out');
const URL = 'http://localhost:4321/';

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1150', width: 1150, height: 900 }, // narrowest 2-col: worst-case wrap
  { name: '1100', width: 1100, height: 900 },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const failures = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.helm-arch');

    const arch = page.locator('.helm-arch');
    await arch.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(150);

    const nodeCount = await page.locator('.helm-node').count();
    const edgeCount = await page.locator('.helm-edge').count();
    if (nodeCount !== 11) failures.push(`[${vp.name}] node count ${nodeCount} (want 11)`);
    else console.log(`[${vp.name}] nodes: ${nodeCount} (ok)`);
    if (edgeCount !== 12) failures.push(`[${vp.name}] edge count ${edgeCount} (want 12)`);
    else console.log(`[${vp.name}] edges: ${edgeCount} (ok)`);

    // Default state -> legend visible, no detail.
    const legendVisible = await page.locator('.helm-legend').isVisible();
    if (!legendVisible) failures.push(`[${vp.name}] default legend not visible`);
    else console.log(`[${vp.name}] default legend (ok)`);

    await page.screenshot({ path: join(OUT_DIR, `helm-default-${vp.name}.png`), fullPage: false });

    // The whole island height must not change as you move between nodes (no
    // page jump). On desktop the detail floats (absolute, sizes to content); on
    // mobile it reserves a min-height. Either way .helm-arch stays constant.
    const nodeHandles = await page.locator('.helm-node').elementHandles();
    const heights = [];
    for (const h of nodeHandles) {
      await h.hover();
      await page.waitForTimeout(50);
      const box = await page.locator('.helm-arch').boundingBox();
      heights.push(Math.round(box?.height ?? 0));
    }
    const hMax = Math.max(...heights), hMin = Math.min(...heights);
    if (hMax - hMin > 2) failures.push(`[${vp.name}] island height jumps across nodes: ${hMin}px..${hMax}px`);
    else console.log(`[${vp.name}] island height stable across all nodes: ${hMax}px (ok)`);

    // Desktop only: the floating panel is an overlay and flips to the opposite
    // side of the hovered node (left node -> panel right, right node -> left).
    if (vp.width >= 1101) {
      await page.locator('.helm-node[aria-label^="web:3000"]').hover();
      await page.waitForTimeout(40);
      const webFlip = await page.locator('.helm-arch-detail').evaluate(el => el.classList.contains('is-flip'));
      const pos = await page.locator('.helm-arch-detail').evaluate(el => getComputedStyle(el).position);
      await page.locator('.helm-node[aria-label^="Claude API"]').hover();
      await page.waitForTimeout(40);
      const claudeFlip = await page.locator('.helm-arch-detail').evaluate(el => el.classList.contains('is-flip'));
      if (pos !== 'absolute') failures.push(`[${vp.name}] desktop detail should be an absolute overlay (got ${pos})`);
      if (webFlip) failures.push(`[${vp.name}] web (left node) should not flip the panel`);
      if (!claudeFlip) failures.push(`[${vp.name}] claude (right node) should flip the panel left`);
      if (pos === 'absolute' && !webFlip && claudeFlip) console.log(`[${vp.name}] floating overlay + flip correct (ok)`);
    }

    // Worker-specific: hover it last and confirm the 6-stage harness shows.
    const worker = page.locator('.helm-node[aria-label^="worker:9000"]');
    await worker.hover();
    await page.waitForTimeout(120);
    const workerActive = await worker.evaluate(el => el.classList.contains('is-active'));
    if (!workerActive) failures.push(`[${vp.name}] worker did not become active on hover`);
    else console.log(`[${vp.name}] worker hover active (ok)`);

    const stages = await page.locator('.helm-stage').count();
    if (stages !== 6) failures.push(`[${vp.name}] harness stages ${stages} (want 6)`);
    else console.log(`[${vp.name}] harness 6 stages revealed (ok)`);

    // At least one node should be dimmed while worker is hovered.
    const dimmed = await page.locator('.helm-node.is-dim').count();
    if (dimmed < 1) failures.push(`[${vp.name}] no nodes dimmed on hover`);
    else console.log(`[${vp.name}] dimmed nodes on hover: ${dimmed} (ok)`);

    await page.screenshot({ path: join(OUT_DIR, `helm-worker-${vp.name}.png`), fullPage: false });

    // Label overflow check: every edge-label bg rect must sit within the svg box.
    const svgBox = await page.locator('.helm-arch-svg').boundingBox();
    const overflow = await page.$$eval('.helm-edge-label-bg', (rects, box) => {
      let bad = 0;
      for (const r of rects) {
        const b = r.getBoundingClientRect();
        if (b.left < box.x - 1 || b.right > box.x + box.width + 1) bad++;
      }
      return bad;
    }, svgBox);
    if (overflow > 0) failures.push(`[${vp.name}] ${overflow} edge labels overflow the svg horizontally`);
    else console.log(`[${vp.name}] no label horizontal overflow (ok)`);

    await ctx.close();
  }

  // ── Mobile: diagram enlarges + becomes swipeable, detail stacks below ──
  {
    const ctx = await browser.newContext({ viewport: { width: 414, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.helm-arch');
    await page.locator('.helm-arch').scrollIntoViewIfNeeded();

    const scroll = await page.locator('.helm-arch-scroll').evaluate(el => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    if (scroll.sw - scroll.cw <= 0) failures.push(`[mobile] diagram does not overflow for swipe (${scroll.sw} <= ${scroll.cw})`);
    else console.log(`[mobile] diagram swipeable: ${scroll.sw - scroll.cw}px horizontal scroll (ok)`);

    const hintVisible = await page.locator('.helm-arch-swipe').isVisible();
    if (!hintVisible) failures.push(`[mobile] swipe hint not visible`);
    else console.log(`[mobile] swipe hint visible (ok)`);

    const pos = await page.locator('.helm-arch-detail').evaluate(el => getComputedStyle(el).position);
    if (pos === 'absolute') failures.push(`[mobile] detail should stack below, not overlay (got ${pos})`);
    else console.log(`[mobile] detail stacks below (position: ${pos}) (ok)`);

    // Tap a node selects it (no hover on touch).
    await page.locator('.helm-node[aria-label^="worker:9000"]').click();
    await page.waitForTimeout(80);
    const tapStages = await page.locator('.helm-stage').count();
    if (tapStages !== 6) failures.push(`[mobile] tapping worker did not reveal the 6-stage harness (${tapStages})`);
    else console.log(`[mobile] tap selects node + reveals detail (ok)`);

    await page.screenshot({ path: join(OUT_DIR, 'helm-mobile.png'), fullPage: false });
    await ctx.close();
  }

  await browser.close();

  if (failures.length) {
    console.error('\nFAILURES:\n' + failures.map(f => '  - ' + f).join('\n'));
    process.exit(1);
  }
  console.log('\nAll Helm architecture checks passed.');
}

main().catch(err => { console.error(err); process.exit(1); });
