// Verify the ProjectFeature shell renders the way the spec requires:
//   - Three .project-feature sections on the landing page
//   - Each has the top accent rule, PID + tier eyebrow, title, summary, chips
//   - 1st and 3rd: copy on the LEFT, preview on the RIGHT
//   - 2nd (MARL, reverse): preview on the LEFT, copy on the RIGHT
//   - PID renders phosphor in night mode (live-state discipline)
//   - No card-in-card: .project-feature has no outer border
//   - Screenshots saved to scripts/_out/projects-{day,night}.png
//
// Run: node scripts/verify-project-feature.mjs

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '_out');
mkdirSync(OUT_DIR, { recursive: true });

const URL = process.env.URL ?? 'http://localhost:4321/';

function fail(msg) { console.error('  ✗', msg); process.exitCode = 1; }
function ok(msg)   { console.log('  ✓', msg); }

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'networkidle' });

console.log('Verifying ProjectFeature shell…');

// ── Count ──
const features = page.locator('.project-feature');
const count = await features.count();
console.log(`  .project-feature count: ${count}`);
if (count !== 3) fail(`expected 3 ProjectFeature bands, got ${count}`);
else ok('three featured project bands rendered');

// ── No outer border (banded, not carded) ──
const firstBorder = await features.first().evaluate((el) => getComputedStyle(el).borderTopWidth);
console.log(`  band border-top: ${firstBorder}`);
if (firstBorder !== '0px') fail(`expected no outer border on band, got ${firstBorder}`);
else ok('band has no outer border (banded, not carded)');

// ── Accent rule present ──
const ruleHeight = await features.first().locator('.acc-rule').evaluate((el) => getComputedStyle(el).height);
console.log(`  acc-rule height: ${ruleHeight}`);
if (ruleHeight === '0px') fail('top accent rule missing');
else ok('top accent rule present');

// ── Alternating sides via column positions ──
async function copyPreviewX(featureIdx) {
  const f = features.nth(featureIdx);
  const copyBox = await f.locator('.copy').boundingBox();
  const previewBox = await f.locator('.preview').boundingBox();
  return { copyX: copyBox.x, previewX: previewBox.x };
}

const f1 = await copyPreviewX(0);
const f2 = await copyPreviewX(1);
const f3 = await copyPreviewX(2);
console.log(`  PRJ/001 copy.x=${f1.copyX.toFixed(0)}  preview.x=${f1.previewX.toFixed(0)}`);
console.log(`  PRJ/002 copy.x=${f2.copyX.toFixed(0)}  preview.x=${f2.previewX.toFixed(0)}`);
console.log(`  PRJ/003 copy.x=${f3.copyX.toFixed(0)}  preview.x=${f3.previewX.toFixed(0)}`);

if (f1.copyX < f1.previewX) ok('PRJ/001 copy is on the LEFT');
else fail('PRJ/001 expected copy LEFT, preview RIGHT');

if (f2.copyX > f2.previewX) ok('PRJ/002 copy is on the RIGHT (reverse)');
else fail('PRJ/002 expected copy RIGHT, preview LEFT (reverse prop)');

if (f3.copyX < f3.previewX) ok('PRJ/003 copy is on the LEFT');
else fail('PRJ/003 expected copy LEFT, preview RIGHT');

// ── Each band has the required pieces ──
for (let i = 0; i < 3; i++) {
  const f = features.nth(i);
  const pid = await f.locator('.pid').innerText();
  const tier = await f.locator('.tier').innerText();
  const title = await f.locator('.title').innerText();
  const pointCount = await f.locator('.point').count();
  const chipCount = await f.locator('.chip').count();
  console.log(`  [${i}] ${pid} · ${tier} — "${title.slice(0, 36)}…" · points:${pointCount} chips:${chipCount}`);
  if (!pid.startsWith('PRJ/')) fail(`[${i}] PID malformed: ${pid}`);
  if (!['FEATURED', 'RESEARCH', 'SHIPPING'].includes(tier)) fail(`[${i}] tier malformed: ${tier}`);
  if (!title) fail(`[${i}] title empty`);
  if (pointCount < 3) fail(`[${i}] expected ≥3 summary points, got ${pointCount}`);
  if (chipCount < 3) fail(`[${i}] expected ≥3 chips, got ${chipCount}`);
}
ok('all three bands have PID, tier, title, point-form summary, and chips');

// ── No em-dashes in ProjectFeature .copy columns (Branson rule).
// Scope is the copy column only — island previews (FsSimCard, MarlCard) own
// their own approved copy and aren't in scope for this check.
const copyTexts = await page.locator('.project-feature .copy').allInnerTexts();
const anyEmDash = copyTexts.some((t) => t.includes('—'));
if (anyEmDash) fail('em-dash detected in a ProjectFeature copy column (Branson rule)');
else ok('no em-dashes in any ProjectFeature copy column');

// ── "Why it matters" pull-quote rendered on each (we set it on all three) ──
const whyCount = await page.locator('.why').count();
console.log(`  .why pull-quotes: ${whyCount}`);
if (whyCount !== 3) fail(`expected 3 why pull-quotes, got ${whyCount}`);
else ok('why pull-quote rendered on every band');

// ── Page is scrollable (the old single-viewport layout is dead) ──
const scrollInfo = await page.evaluate(() => ({
  scrollH: document.documentElement.scrollHeight,
  clientH: document.documentElement.clientHeight,
  bodyOverflow: getComputedStyle(document.body).overflow,
  pageOverflow: getComputedStyle(document.querySelector('.page')).overflow,
}));
console.log(`  scrollHeight: ${scrollInfo.scrollH}px · clientHeight: ${scrollInfo.clientH}px`);
console.log(`  body overflow: ${scrollInfo.bodyOverflow} · .page overflow: ${scrollInfo.pageOverflow}`);
if (scrollInfo.scrollH <= scrollInfo.clientH) fail('page is not taller than viewport — nothing to scroll');
else ok('page content exceeds viewport (scroll has something to scroll)');
if (/hidden/.test(scrollInfo.bodyOverflow)) fail('body has overflow:hidden — scroll blocked');
else ok('body allows scroll');
if (/hidden/.test(scrollInfo.pageOverflow)) fail('.page has overflow:hidden — scroll blocked');
else ok('.page allows scroll');

// Functional scroll test — use mouse wheel (window.scrollTo is unreliable in
// headless Chromium for reasons unrelated to the page). What we're verifying
// is that the document scroll mechanism is engaged at all.
await page.mouse.wheel(0, 600);
await page.waitForTimeout(200);
const wheelY = await page.evaluate(() => window.scrollY);
if (wheelY < 50) fail(`wheel scroll had no effect (scrollY: ${wheelY})`);
else ok(`wheel scroll works (scrollY moved to ${wheelY})`);
await page.evaluate(() => window.scrollTo(0, 0));
await page.mouse.wheel(0, -wheelY);
await page.waitForTimeout(200);

// ── Island hydration ──
// PRJ/001 should hold FsSimCard, PRJ/002 should hold MarlCard, PRJ/003 still
// shows the placeholder until the SVG diagram lands.
const fsHydrated = await features.nth(0).locator('.preview-placeholder').count();
const marlHydrated = await features.nth(1).locator('.preview-placeholder').count();
const helmPlaceholder = await features.nth(2).locator('.preview-placeholder').count();
console.log(`  preview placeholders — PRJ/001:${fsHydrated} PRJ/002:${marlHydrated} PRJ/003:${helmPlaceholder}`);
if (fsHydrated !== 0) fail('PRJ/001 still shows placeholder — FsSimCard not wired');
else ok('PRJ/001 has FsSimCard wired (no placeholder)');
if (marlHydrated !== 0) fail('PRJ/002 still shows placeholder — MarlCard not wired');
else ok('PRJ/002 has MarlCard wired (no placeholder)');
if (helmPlaceholder !== 1) fail('PRJ/003 should still show placeholder until Helm SVG lands');
else ok('PRJ/003 still shows placeholder (Helm SVG pending)');

// ── Helm phrasing locked ──
const helmText = await features.nth(2).innerText();
if (!/agentic harness/i.test(helmText)) fail('Helm copy missing "agentic harness" (locked phrasing)');
else ok('Helm copy preserves "agentic harness" phrasing');
if (/paying users?/i.test(helmText)) fail('Helm copy claims "paying users" — not yet (project memory)');
else ok('Helm copy does not claim paying users');

// ── Phosphor check on PID in night mode ──
// Toggle to night first
await page.locator('.theme-toggle .label').nth(1).click();
await page.waitForTimeout(700);

const pidColor = await features.first().locator('.pid').evaluate((el) => getComputedStyle(el).color);
console.log(`  PID colour (night): ${pidColor}`);
// Phosphor #14CC4A → rgb(20, 204, 74). Any near match is fine.
const m = pidColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
if (m) {
  const [_, r, g, b] = m.map(Number);
  const isPhosphor = g > 150 && g > r + 50 && g > b + 50;
  if (!isPhosphor) fail(`PID colour ${pidColor} doesn't look like phosphor green`);
  else ok('PID renders in phosphor green in night mode (live-state discipline)');
} else {
  fail(`could not parse PID colour: ${pidColor}`);
}

// ── Title colour is NOT phosphor (no leak) ──
const titleColor = await features.first().locator('.title').evaluate((el) => getComputedStyle(el).color);
console.log(`  title colour (night): ${titleColor}`);
const tm = titleColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)/);
if (tm) {
  const [_, r, g, b] = tm.map(Number);
  const isPhosphor = g > 150 && g > r + 50 && g > b + 50;
  if (isPhosphor) fail('title is rendering in phosphor green — discipline violation');
  else ok('title is NOT phosphor (discipline holds)');
}

// ── Screenshots ──
// Night first (we're already toggled)
await page.locator('.projects').first().screenshot({ path: join(OUT_DIR, 'projects-night.png') });
ok('night screenshot saved to scripts/_out/projects-night.png');

// Toggle back to day
await page.locator('.theme-toggle .label').first().click();
await page.waitForTimeout(700);
await page.locator('.projects').first().screenshot({ path: join(OUT_DIR, 'projects-day.png') });
ok('day screenshot saved to scripts/_out/projects-day.png');

// Single-band closeups so I can read the layout easily
await features.first().screenshot({ path: join(OUT_DIR, 'projects-band1-day.png') });
await features.nth(1).screenshot({ path: join(OUT_DIR, 'projects-band2-day.png') });
ok('band closeups saved');

await browser.close();

if (process.exitCode) {
  console.error('\nVerification FAILED — see ✗ lines above.');
} else {
  console.log('\nVerification PASSED.');
}
