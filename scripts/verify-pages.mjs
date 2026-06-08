// Playwright verification for the Writing + Contact pages and their links.
//
// Checks:
//   /writing        — lists all 3 tech notes, each links to /writing/<id>;
//                     Back link points home.
//   /writing/<id>   — renders the note (h1 + non-empty .prose); Back -> /writing.
//   /contact        — email mailto present; Back link home.
//   Navigation      — clicking a note row lands on its detail page.
//   Screenshots to scripts/_out.
//
// Usage:   node scripts/verify-pages.mjs   (dev server on :4321)

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '_out');
const BASE = 'http://localhost:4321';

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newContext({ viewport: { width: 1280, height: 900 } }).then(c => c.newPage());
  const failures = [];

  // ── /writing index ──
  await page.goto(`${BASE}/writing`, { waitUntil: 'networkidle' });
  const noteLinks = await page.$$eval('.note-link', els => els.map(e => e.getAttribute('href')));
  if (noteLinks.length !== 3) failures.push(`/writing: expected 3 note links, got ${noteLinks.length}`);
  else console.log(`/writing: ${noteLinks.length} notes listed (ok)`);
  if (!noteLinks.every(h => h && h.startsWith('/writing/'))) failures.push(`/writing: a note link is malformed: ${JSON.stringify(noteLinks)}`);
  const backHref = await page.locator('.back-link').first().getAttribute('href');
  if (backHref !== '/#work') failures.push(`/writing: back link is ${backHref}, want /#work`);
  else console.log(`/writing: back link ok`);
  await page.screenshot({ path: join(OUT, 'writing-index.png') });

  // ── navigation: click first note → detail ──
  await page.locator('.note-link').first().click();
  await page.waitForLoadState('networkidle');
  if (!/\/writing\/.+/.test(new URL(page.url()).pathname)) failures.push(`nav: clicking a note did not reach a detail page (${page.url()})`);
  else console.log(`nav: note click -> ${new URL(page.url()).pathname} (ok)`);
  const h1 = await page.locator('.note-page-title').textContent().catch(() => null);
  const proseKids = await page.locator('.prose > *').count();
  if (!h1) failures.push(`detail: missing title`);
  if (proseKids < 3) failures.push(`detail: .prose looks empty (${proseKids} children) — markdown not rendering`);
  else console.log(`detail: "${h1?.trim()}" with ${proseKids} prose blocks (ok)`);
  const detailBack = await page.locator('.back-link').first().getAttribute('href');
  if (detailBack !== '/writing') failures.push(`detail: back link is ${detailBack}, want /writing`);
  else console.log(`detail: back link ok`);
  await page.screenshot({ path: join(OUT, 'writing-detail.png'), fullPage: true });

  // ── /contact ──
  await page.goto(`${BASE}/contact`, { waitUntil: 'networkidle' });
  const mailto = await page.locator('a[href^="mailto:"]').first().getAttribute('href').catch(() => null);
  if (!mailto) failures.push(`/contact: no mailto link found`);
  else console.log(`/contact: ${mailto} (ok)`);
  const chCount = await page.locator('.channel').count();
  if (chCount !== 3) failures.push(`/contact: expected 3 channels, got ${chCount}`);
  else console.log(`/contact: ${chCount} channels (ok)`);
  const ghTarget = await page.locator('.channel-value[href*="github.com"]').getAttribute('target').catch(() => null);
  if (ghTarget !== '_blank') failures.push(`/contact: external profile links should open in a new tab`);
  else console.log(`/contact: external profile links open in new tab (ok)`);
  const cBack = await page.locator('.back-link').first().getAttribute('href');
  if (cBack !== '/#work') failures.push(`/contact: back link is ${cBack}, want /#work`);
  else console.log(`/contact: back link ok`);
  await page.screenshot({ path: join(OUT, 'contact.png') });

  await browser.close();

  if (failures.length) {
    console.error('\nFAILURES:\n' + failures.map(f => '  - ' + f).join('\n'));
    process.exit(1);
  }
  console.log('\nAll page checks passed.');
}

main().catch(e => { console.error(e); process.exit(1); });
