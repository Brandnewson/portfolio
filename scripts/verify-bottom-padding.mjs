// Verify the landing page has visible bottom padding below the project panels
// at desktop viewports, with no panel clipped against the bottom bar.
//
// Background: `.page` has `overflow: hidden` at >=1200px, so any panel whose
// rendered height exceeds the available content row will be silently clipped.
// This script measures and screenshots so we can tell padding apart from
// clipping by the numbers, not by eyeballing.
//
// Usage:  node scripts/verify-bottom-padding.mjs
// Assumes a dev server on http://localhost:4321.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '_out');
const URL = 'http://localhost:4321/';

// Real-world viewports: a 1080p monitor in Chrome with the default chrome
// gives ~960 px of usable height (60 title + 60 tabs/URL); add the bookmarks
// bar and it drops to ~920. We MUST verify at those heights — verifying at a
// clean 1920×1080 only tests fullscreen / kiosk mode and hides overflow that
// every normal user will see.
const VIEWPORTS = [
  { name: '1920x1080 (fullscreen)',     width: 1920, height: 1080 },
  { name: '1920x960  (chrome default)', width: 1920, height: 960  },
  { name: '1920x880  (chrome+bkmks)',   width: 1920, height: 880  },
  { name: '1440x900  (laptop)',         width: 1440, height: 900  },
  { name: '1280x800  (small laptop)',   width: 1280, height: 800  },
];

const MIN_VISIBLE_BOTTOM_PAD = 24; // px we want between tallest panel and page bottom

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const failures = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('.marl-card');
    await page.waitForTimeout(200); // let layout settle

    const measurements = await page.evaluate(() => {
      const main = document.querySelector('main.page');
      const projects = document.querySelector('.projects');
      const grid = document.querySelector('.grid');
      const panels = Array.from(document.querySelectorAll('article.panel'));

      const mainRect = main.getBoundingClientRect();
      const projectsRect = projects.getBoundingClientRect();
      const gridRect = grid.getBoundingClientRect();
      const projectsCS = getComputedStyle(projects);
      const mainCS = getComputedStyle(main);

      const panelRects = panels.map((p) => {
        const r = p.getBoundingClientRect();
        return {
          id: p.querySelector('.pid')?.textContent ?? '?',
          top: r.top, bottom: r.bottom, height: r.height,
        };
      });

      const tallestPanelBottom = Math.max(...panelRects.map((p) => p.bottom));
      const isScrollMode = mainCS.overflow.includes('visible');
      /* In fit-mode (overflow:hidden on .page) the budget is the viewport
         content area: panel bottom must sit above main.bottom by the gap.
         In scroll-mode, .projects extends past the viewport and the user
         reaches the padding by scrolling. Read documentElement.scrollHeight
         as the "true bottom" of the document; the gap to the panel bottom
         equals the rendered padding-bottom on .projects. */
      const docBottom = document.documentElement.scrollHeight;
      const referenceBottom = isScrollMode ? docBottom : mainRect.bottom;

      return {
        viewportHeight: window.innerHeight,
        mainTop: mainRect.top, mainBottom: mainRect.bottom, mainHeight: mainRect.height,
        mainOverflow: mainCS.overflow,
        projectsTop: projectsRect.top, projectsBottom: projectsRect.bottom,
        projectsPaddingBottom: projectsCS.paddingBottom,
        gridBottom: gridRect.bottom,
        panelRects,
        tallestPanelBottom,
        isScrollMode,
        docBottom,
        visibleBottomGap: referenceBottom - tallestPanelBottom,
      };
    });

    const m = measurements;
    console.log(`\n[${vp.name}]`);
    console.log(`  viewport h:           ${m.viewportHeight}`);
    console.log(`  main: top=${m.mainTop.toFixed(0)} bottom=${m.mainBottom.toFixed(0)} h=${m.mainHeight.toFixed(0)} overflow=${m.mainOverflow}`);
    console.log(`  projects: top=${m.projectsTop.toFixed(0)} bottom=${m.projectsBottom.toFixed(0)} pad-bottom=${m.projectsPaddingBottom}`);
    console.log(`  grid bottom:          ${m.gridBottom.toFixed(0)}`);
    for (const p of m.panelRects) {
      console.log(`  panel ${p.id}: top=${p.top.toFixed(0)} bottom=${p.bottom.toFixed(0)} h=${p.height.toFixed(0)}`);
    }
    console.log(`  tallest panel bottom: ${m.tallestPanelBottom.toFixed(0)}`);
    console.log(`  scroll mode:          ${m.isScrollMode} (doc bottom=${m.docBottom})`);
    console.log(`  bottom gap:           ${m.visibleBottomGap.toFixed(0)}px (want >= ${MIN_VISIBLE_BOTTOM_PAD})`);

    // Pass condition: tallest panel bottom is at least MIN_VISIBLE_BOTTOM_PAD
    // pixels above the bottom of main (the viewport content area, since main
    // is flex:1 inside body and at desktop has overflow:hidden).
    if (m.visibleBottomGap < MIN_VISIBLE_BOTTOM_PAD) {
      failures.push(
        `[${vp.name}] only ${m.visibleBottomGap.toFixed(0)}px gap below tallest panel (want >= ${MIN_VISIBLE_BOTTOM_PAD}). ` +
        `Panel bottom ${m.tallestPanelBottom.toFixed(0)} vs main bottom ${m.mainBottom.toFixed(0)}.`
      );
    }

    // Panel clipping: if any panel extends past main.bottom while main is
    // overflow:hidden, we're silently clipping content.
    if (m.mainOverflow.includes('hidden')) {
      for (const p of m.panelRects) {
        if (p.bottom > m.mainBottom + 0.5) {
          failures.push(`[${vp.name}] panel ${p.id} clipped: bottom=${p.bottom.toFixed(0)} > main bottom=${m.mainBottom.toFixed(0)}`);
        }
      }
    }

    await page.screenshot({ path: join(OUT_DIR, `bottom-pad-${vp.name}.png`), fullPage: false });
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

main().catch((err) => { console.error(err); process.exit(2); });
