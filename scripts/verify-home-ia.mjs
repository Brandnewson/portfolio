// Verification for the home-page IA refinement pass.
// Usage: PORT=4324 node scripts/verify-home-ia.mjs
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '_out');
const PORT = process.env.PORT || '4324';
const BASE = `http://localhost:${PORT}`;
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const setTheme = async (t) => { await page.evaluate((x) => { document.documentElement.setAttribute('data-theme', x); localStorage.setItem('theme', x); }, t); await page.waitForTimeout(150); };

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

// ── 1. Hero quick-links ──
const primaryHref = await page.locator('.navcta--primary').getAttribute('href');
ok(primaryHref === '#work', `primary CTA href is ${primaryHref}, want #work`);

const ql = (sel) => page.locator(`.quick-links a:has-text("${sel}")`);
const gh = await ql('GitHub').getAttribute('href');
ok(gh === 'https://github.com/Brandnewson', `GitHub href ${gh}`);
ok(await ql('GitHub').getAttribute('target') === '_blank', 'GitHub not new tab');
const li = await ql('LinkedIn').getAttribute('href');
ok(li === 'https://www.linkedin.com/in/bransontay', `LinkedIn href ${li}`);
ok(await ql('LinkedIn').getAttribute('target') === '_blank', 'LinkedIn not new tab');
ok(await ql('Contact').getAttribute('href') === '#contact', 'Contact qlink not #contact');
const cv = page.locator('.qlink--cv');
ok(await cv.getAttribute('href') === '/Branson-Tay-CV.pdf', 'CV href wrong');
ok((await cv.getAttribute('download')) !== null, 'CV missing download attr');
// CV weighted: filled tint vs ghost (compare background to GitHub qlink)
const cvBg = await cv.evaluate((el) => getComputedStyle(el).backgroundColor);
const ghBg = await ql('GitHub').evaluate((el) => getComputedStyle(el).backgroundColor);
ok(cvBg !== ghBg, `CV not visually weighted (cvBg=${cvBg}, ghBg=${ghBg})`);
// dropped jump-links
ok(await page.locator('.navcta:has-text("Profile")').count() === 0, 'Profile jump-CTA still present');
// phosphor guard: no CTA uses the phosphor token colour
const phos = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--phos').trim());
for (const sel of ['.navcta--primary', '.qlink--cv', '.quick-links a']) {
  const c = await page.locator(sel).first().evaluate((el) => getComputedStyle(el).color);
  // crude: --phos in night is #14CC4A → rgb(20, 204, 74)
  ok(!c.includes('20, 204, 74'), `${sel} uses phosphor colour ${c}`);
}

// ── Hero refinements: toggle moved into the eyebrow row, calibrate stripped ──
ok(await page.locator('.eyebrow-row .theme-toggle').count() === 1, 'theme toggle not in the eyebrow row');
ok(await page.locator('.calibrate').count() === 0, 'calibrate block still present');
ok(await page.locator('.inspo').count() === 0, 'inspiration line still present');

// ── Helm diagram is button-only (no hover-to-expand hint) ──
ok(await page.locator('.helm-arch-hint-hover').count() === 0, 'Helm hover-to-expand hint still present');
ok(await page.locator('.helm-arch-expand').first().isVisible(), 'Helm Expand button not visible');

// ── 2/5. Repo buttons + Helm privacy line + anchors ──
const helm = page.locator('#work');
ok(await helm.locator('.title').innerText().then((t) => t.includes('Helm')), '#work is not the Helm band');
ok(await helm.locator('.cta-note').count() === 1, 'Helm privacy note missing');
const noteTxt = await helm.locator('.cta-note').innerText();
ok(noteTxt.startsWith('Source is private as Helm is a live product'), `Helm note text: ${noteTxt}`);
ok(await helm.locator('.btn:has-text("View code")').count() === 0, 'Helm should have no View code button');

const marl = page.locator('#marl');
const marlRepo = marl.locator('.btn:has-text("View code")');
ok(await marlRepo.count() === 1, 'MARL repo button missing');
ok(await marlRepo.getAttribute('href') === 'https://github.com/Brandnewson/F1_StrategySimulator', 'MARL repo href wrong');
ok(await marlRepo.getAttribute('target') === '_blank', 'MARL repo not new tab');

const sim = page.locator('#sim');
const simRepo = sim.locator('.btn:has-text("View code")');
ok(await simRepo.count() === 1, 'Quasi repo button missing');
ok(await simRepo.getAttribute('href') === 'https://github.com/LGRSimulations/LGR_FullTrackQSLapTimeSim', 'Quasi repo href wrong');
ok(await simRepo.getAttribute('target') === '_blank', 'Quasi repo not new tab');

// ── 3. Other projects collapsible ──
const op = page.locator('.other-projects');
ok(await op.count() === 1, 'OtherProjects section missing');
const firstItem = op.locator('.op-item').first();
ok(await op.locator('.op-item').count() === 6, `expected 6 other projects, got ${await op.locator('.op-item').count()}`);
ok(await op.locator('.op-name:has-text("Travelindr")').count() === 1, 'Travelindr missing from Other projects');
// collapsed: summary shows title + oneliner + chips; bullets hidden
ok(await firstItem.locator('.op-name').isVisible(), 'collapsed title not visible');
ok(await firstItem.locator('.op-oneliner').isVisible(), 'collapsed one-liner not visible');
ok(await firstItem.locator('.op-chip').first().isVisible(), 'collapsed chips not visible');
ok(!(await firstItem.locator('.op-bullet').first().isVisible()), 'bullets visible before expand');
// expand
await firstItem.locator('.op-summary').click();
await page.waitForTimeout(150);
ok(await firstItem.locator('.op-bullet').first().isVisible(), 'bullets not visible after expand');
const openState = await firstItem.evaluate((el) => el.open);
ok(openState === true, 'details did not open');

// ── 6. /#work scrolls to the Helm band ──
await page.goto(`${BASE}/#work`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const workTop = await page.locator('#work').evaluate((el) => el.getBoundingClientRect().top);
const simTop = await page.locator('#sim').evaluate((el) => el.getBoundingClientRect().top);
// #work (Helm) should sit at the top of the viewport (its tall band fills the
// screen) and clearly above the last band (#sim), i.e. we did NOT land on quasi.
ok(Math.abs(workTop) < 400, `/#work not at top of viewport (top=${Math.round(workTop)})`);
ok(simTop > workTop + 400, `/#work landed below Helm (workTop=${Math.round(workTop)}, simTop=${Math.round(simTop)})`);
const workTitle = await page.locator('#work .title').innerText();
ok(workTitle.includes('Helm'), `/#work band title is ${workTitle}`);

// SectionRail resolves every anchor it lists
const railHrefs = await page.locator('.section-rail .rail-item').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
for (const h of railHrefs) {
  const id = h.replace('#', '');
  const exists = await page.locator(`#${id}`).count();
  ok(exists === 1, `SectionRail anchor ${h} has no target`);
}

// ── 4 (writing). PRJ order 001 → 002 → 003 ──
await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
const pids = await page.locator('.note-pid').evaluateAll((els) => els.map((e) => e.textContent.trim()));
ok(JSON.stringify(pids) === JSON.stringify(['PRJ/001', 'PRJ/002', 'PRJ/003']), `writing order: ${JSON.stringify(pids)}`);
// confirm 001 is Helm
const firstNoteText = await page.locator('.note-link, li').first().innerText().catch(() => '');
await page.screenshot({ path: join(OUT, 'home-writing.png'), fullPage: true });

// ── Screenshots in both themes ──
// Park the cursor in a corner + dismiss any open Helm overlay between steps so
// the diagram's hover-to-expand never intercepts clicks or taints shots.
const settle = async () => { await page.mouse.move(4, 4); await page.keyboard.press('Escape'); await page.waitForTimeout(450); };
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
for (const theme of ['day', 'night']) {
  await setTheme(theme);
  await settle();
  await page.locator('.hero').scrollIntoViewIfNeeded(); await page.waitForTimeout(120);
  await page.locator('.hero').screenshot({ path: join(OUT, `home-hero-${theme}.png`) });
  await settle();
  await page.locator('#work').scrollIntoViewIfNeeded(); await page.waitForTimeout(120);
  await page.locator('#work').screenshot({ path: join(OUT, `home-helm-${theme}.png`) });
  await settle();
  await page.locator('#marl').scrollIntoViewIfNeeded(); await page.waitForTimeout(120);
  await page.locator('#marl').screenshot({ path: join(OUT, `home-marl-${theme}.png`) });
  // other projects collapsed
  const op2 = page.locator('.other-projects');
  await settle();
  await op2.scrollIntoViewIfNeeded(); await page.waitForTimeout(120);
  await op2.screenshot({ path: join(OUT, `home-other-collapsed-${theme}.png`) });
  // expand first two and screenshot
  await op2.locator('.op-summary').nth(0).click();
  await op2.locator('.op-summary').nth(1).click();
  await page.waitForTimeout(200);
  await op2.screenshot({ path: join(OUT, `home-other-expanded-${theme}.png`) });
  // collapse again for next theme cleanliness
  await op2.locator('.op-summary').nth(0).click();
  await op2.locator('.op-summary').nth(1).click();
}

await browser.close();
if (fails.length) { console.error('\nFAILURES:\n' + fails.map((f) => '  - ' + f).join('\n')); process.exit(1); }
console.log('\nAll home-IA checks passed.');
