# Landing Narrative Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio landing page into a guided narrative scroll — name-led hero with directed CTAs, a "calibrate" theme beat, three project bands, a CV-accurate profile, a contact close, and a scroll-spy section rail (desktop edge / mobile bottom strip).

**Architecture:** Static Astro components (`.astro`) for all presentational sections; one React island (`.tsx`) for the interactive section rail; the existing `ThemeToggle` island is reused in the hero. All colour via CSS custom properties in `_tokens.scss`; SCSS only. The approved high-fidelity clone at `.superpowers/brainstorm/37566-1780927336/content/landing-clone-v8.html` is the visual source of truth — match it.

**Tech Stack:** Astro 6, React 19 islands, nanostores (`stores/theme.ts`), SCSS, Playwright (verification).

**Full design spec:** `docs/superpowers/specs/2026-06-08-landing-narrative-design.md`

---

## Testing approach (read first)

This is a presentational Astro redesign, so classic unit-TDD does not map. "Verification" for each task is:

1. **Build/type check:** `npx astro check` (template + TS errors) and/or `npm run build` must pass.
2. **Behavioural checks (Playwright)** for the interactive pieces only: theme toggle flips `data-theme` and persists; the hero CTAs jump to the right anchors; the rail appears after the hero and sets `.active` via scroll-spy; the mobile strip shows below 1100px.
3. **Visual check:** screenshot the running dev server and eyeball against the clone (`scripts/_out/*` versus `landing-clone-v8.html`).

A dev server runs on the next free port from 4321 (`npm run dev` prints it). Playwright scripts go in `scripts/` (pattern already established: `scripts/verify-*.mjs`). Run with `node scripts/<name>.mjs`.

**Commit after every task.** Branch is `main`; commit directly (small, focused commits). No hooks to skip.

---

## File structure

**Create:**
- `src/data/profile.ts` — typed profile content (experience, education, stack, looking-for)
- `src/components/profile/Profile.astro` — the "Background" section
- `src/components/shell/Closing.astro` — the contact/closing section
- `src/islands/SectionRail.tsx` — scroll-spy nav island (desktop rail + mobile strip)
- `src/islands/SectionRail.scss` — its styles (island convention: co-located `.scss`)
- `scripts/verify-landing.mjs` — final behavioural + visual verification

**Modify:**
- `src/styles/_tokens.scss` — add `--primary-tint` (day + night)
- `src/styles/_components.scss` — receive the `.theme-toggle` global styles + a shared `.wrap` container
- `src/components/shell/InstrumentBar.astro` — remove the `.theme-toggle` `:global` block (moved to `_components.scss`)
- `src/layouts/Shell.astro` — remove `TargaBar`; add `hideBar` prop to omit `InstrumentBar` on the landing
- `src/components/hero/Hero.astro` — full rewrite to the new hero
- `src/components/projects/ProjectFeature.astro` — `list-style:none` on `.stack`; add `anchorId` prop
- `src/pages/index.astro` — assemble the new page; mount the rail; pass `hideBar`

**Delete:**
- `src/components/shell/TargaBar.astro` (dropped site-wide)
- `src/components/hero/QuickRead.astro` (content relocated into Profile)

---

## Task 1: Add the `--primary-tint` token

**Files:**
- Modify: `src/styles/_tokens.scss`

- [ ] **Step 1: Add the day value**

In the `:root` block (day defaults), after the `--primary-hover` line, add:

```scss
  // Faint accent fill — lighter primary CTA + tinted chips
  --primary-tint: rgba(139, 90, 48, 0.07);
```

- [ ] **Step 2: Add the night value**

In the `[data-theme="night"]` block, after its `--primary-hover` line, add:

```scss
  --primary-tint: rgba(217, 160, 48, 0.09);
```

- [ ] **Step 3: Verify it compiles**

Run: `npx astro check`
Expected: no new errors (token is just declared; unused for now is fine).

- [ ] **Step 4: Commit**

```bash
git add src/styles/_tokens.scss
git commit -m "feat(tokens): add --primary-tint for lighter primary CTA"
```

---

## Task 2: Decouple ThemeToggle styles from InstrumentBar

The hero mounts `ThemeToggle`, but its styles currently live as a `:global(.theme-toggle)` block inside `InstrumentBar.astro`. Astro only ships a component's styles when that component renders — and the landing won't render `InstrumentBar`. Move the toggle styles to a global partial so the toggle is styled anywhere it mounts. Also add a shared `.wrap` container used by the new sections.

**Files:**
- Modify: `src/styles/_components.scss`
- Modify: `src/components/shell/InstrumentBar.astro`

- [ ] **Step 1: Move the toggle styles into `_components.scss`**

Append to `src/styles/_components.scss` (these are lifted verbatim from `InstrumentBar.astro`, minus the `:global()` wrapper since this file is already global):

```scss
// ── Shared narrative-page container ──
.wrap {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 48px;

  @media (max-width: 900px) {
    padding: 0 26px;
  }
}

// ── ThemeToggle island (global so it styles wherever it mounts) ──
.theme-toggle {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  min-width: 124px;
  border: 1px solid var(--bar-fg-mut);
  border-radius: 0;
  overflow: hidden;
  font-family: var(--font-mono);
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: var(--bar-fg);
  transition: border-color 0.15s ease;

  &:hover { border-color: var(--primary); }

  .label {
    position: relative;
    z-index: 1;
    padding: 5px 0;
    font-size: 10px;
    letter-spacing: 0.22em;
    text-align: center;
    color: var(--bar-fg-mut);
    pointer-events: none;
    transition: color 0.18s ease;

    &.is-active { color: var(--toggle-active-fg); }
  }

  .slider {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 50%;
    background: var(--primary);
    transition: transform 0.22s ease;
    pointer-events: none;
    z-index: 0;

    &[data-position="day"]   { transform: translateX(0); }
    &[data-position="night"] { transform: translateX(100%); }
  }
}
```

> Note: the hero sits on `--bg` (not the dark bar). `--bar-fg`/`--bar-fg-mut` resolve to readable values in both themes already; if the toggle text looks wrong on the hero background during visual check, that is addressed in Task 9's hero styles (which can override `--bar-fg` locally). Leave as-is for now.

- [ ] **Step 2: Confirm `_components.scss` is imported**

Run: `grep -n "_components" src/styles/global.scss`
Expected: a line importing the partial (e.g. `@use 'components';` or `@import './components';`). If absent, add it alongside the other partial imports.

- [ ] **Step 3: Remove the moved block from InstrumentBar**

In `src/components/shell/InstrumentBar.astro`, delete the entire `:global(.theme-toggle)` … block (all the `:global(.theme-toggle …)` rules, from the `// ── ThemeToggle island …` comment through the last `.slider[data-position="night"]` rule). Leave the rest of InstrumentBar's styles intact.

- [ ] **Step 4: Verify the toggle still looks right in the bar**

Run: `npm run build` then `npm run dev`, open a page that still uses the bar (e.g. `/helm` if present, else temporarily any). Confirm the DAY/NIGHT toggle still renders correctly.
Expected: build passes; toggle unchanged visually.

- [ ] **Step 5: Commit**

```bash
git add src/styles/_components.scss src/components/shell/InstrumentBar.astro
git commit -m "refactor(toggle): move ThemeToggle styles to global partial; add .wrap"
```

---

## Task 3: Drop TargaBar site-wide

**Files:**
- Modify: `src/layouts/Shell.astro`
- Delete: `src/components/shell/TargaBar.astro`

- [ ] **Step 1: Remove the import and render from Shell**

In `src/layouts/Shell.astro`, delete the line `import TargaBar from '../components/shell/TargaBar.astro';` and delete the `<TargaBar />` element from the `<body>`.

- [ ] **Step 2: Delete the component file**

```bash
git rm src/components/shell/TargaBar.astro
```

- [ ] **Step 3: Confirm nothing else imports it**

Run: `grep -rn "TargaBar" src/`
Expected: no matches.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Shell.astro
git commit -m "feat(shell): drop TargaBar site-wide"
```

---

## Task 4: Add `hideBar` to Shell

The landing must render with no `InstrumentBar`. Deep pages keep it.

**Files:**
- Modify: `src/layouts/Shell.astro`

- [ ] **Step 1: Add the prop and conditional render**

Update the frontmatter `Props` and destructure, then guard the `InstrumentBar` render. The frontmatter becomes:

```astro
---
import '../styles/global.scss';
import InstrumentBar from '../components/shell/InstrumentBar.astro';

interface Props {
  title?: string;
  hideBar?: boolean;
}

const { title = 'Branson — Portfolio', hideBar = false } = Astro.props;
---
```

And in the `<body>`, replace the `<InstrumentBar />` line with:

```astro
  {!hideBar && <InstrumentBar />}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: passes (existing pages omit `hideBar`, so they still show the bar).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/Shell.astro
git commit -m "feat(shell): add hideBar prop to omit InstrumentBar on landing"
```

---

## Task 5: Fix chip bullets + add anchor ids to ProjectFeature

**Files:**
- Modify: `src/components/projects/ProjectFeature.astro`

- [ ] **Step 1: Add `anchorId` prop**

In the `Props` interface add `anchorId?: string;`. In the destructure add `anchorId,`. On the root `<section class:list={['project-feature', reverse && 'is-reverse']}>` add the id:

```astro
<section id={anchorId} class:list={['project-feature', reverse && 'is-reverse']}>
```

- [ ] **Step 2: Remove the stray list bullets on the stack chips**

In the `<style>` block, change the `.stack` rule to include `list-style: none;`:

```scss
.stack {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
  list-style: none;
}
```

- [ ] **Step 3: Verify**

Run: `npm run build`
Expected: passes. (Visual confirmation of clean chips happens in Task 11.)

- [ ] **Step 4: Commit**

```bash
git add src/components/projects/ProjectFeature.astro
git commit -m "feat(project): add anchorId prop; remove stray chip bullets"
```

---

## Task 6: Profile data module

**Files:**
- Create: `src/data/profile.ts`

- [ ] **Step 1: Create the typed data module**

```ts
// Profile content for the landing "Background" section. Edit here, not in markup.
export interface ExperienceItem {
  when: string;
  org: string;
  role: string;
  location: string;
}

export interface EducationItem {
  when: string;
  org: string;
  qual: string;
  desc: string;
}

export interface StackRow {
  key: string;
  value: string;
}

export interface City {
  name: string;
  coord: string;
}

export const BIO =
  'I sit at the intersection of mechanical engineering and computer science. I want to build in that overlap, capitalising on both, and push toward physical AI, where learning systems meet real hardware and dynamics.';

export const EXPERIENCE: ExperienceItem[] = [
  { when: '2024 — 25', org: 'Jaguar TCS Racing', role: 'Junior Strategy & Software Engineer', location: 'Kidlington, UK' },
  { when: '2020 — 22', org: 'Republic of Singapore Navy', role: 'Marine Systems Specialist Technician', location: 'Singapore' },
  { when: '2019 — 20', org: 'Travelindr', role: 'Co-founder & CEO', location: 'Singapore' },
];

export const EDUCATION: EducationItem[] = [
  {
    when: '2022 — 26',
    org: 'University of Leeds',
    qual: 'BSc Computer Science, Year in Industry · Leeds, UK',
    desc: 'The software half. Formula Student Performance & Simulation sub-team lead across aero, tyres, powertrain and vehicle dynamics; final-year project on multi-agent reinforcement learning for race strategy.',
  },
  {
    when: '2017 — 20',
    org: 'Ngee Ann Polytechnic',
    qual: 'Diploma, Mechanical Engineering · Singapore',
    desc: 'The mechanical foundation: gearbox design to load, speed and dimensional spec, CAD/CAM fabrication, and core engineering method. Graduated with the Good Progress and School of Engineering Merit awards.',
  },
];

export const STACK: StackRow[] = [
  { key: 'Languages', value: 'Python, TypeScript, C++, Rust, MATLAB, Java' },
  { key: 'AI / ML', value: 'PyTorch, RAG, Claude Code, Codex, agentic harnesses, NumPy / SciPy' },
  { key: 'Web / Infra', value: 'React, Node, FastAPI / Flask, MongoDB, AWS, Azure, Docker, CI/CD' },
  { key: 'Tools', value: 'Git, Docker, Azure DevOps, ATLAS telemetry' },
];

export const ROLES = ['Forward-Deployed Engineer', 'Applied AI Engineer', 'Solutions Architect', 'Full-stack Engineer'];

export const CITIES: City[] = [
  { name: 'London', coord: '51.5°N · 0.1°W' },
  { name: 'New York', coord: '40.7°N · 74.0°W' },
];

export const AVAILABLE = 'SEP 2026';
```

- [ ] **Step 2: Verify it type-checks**

Run: `npx astro check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/profile.ts
git commit -m "feat(data): add profile content module"
```

---

## Task 7: Profile.astro section

**Files:**
- Create: `src/components/profile/Profile.astro`

- [ ] **Step 1: Create the component**

```astro
---
import { BIO, EXPERIENCE, EDUCATION, STACK, ROLES, CITIES, AVAILABLE } from '../../data/profile';
---
<section class="profile" id="profile">
  <div class="wrap">
    <div class="profile-head">
      <div class="phead mono"><span class="pid">PROFILE</span><span aria-hidden="true">·</span><span class="tier">WHO I AM</span></div>
      <h2 class="ptitle">Background</h2>
      <p class="bio">{BIO}</p>
    </div>

    <div class="pgrid">
      <div class="pcol">
        <div class="col-key mono">Experience</div>
        <ol class="timeline" role="list">
          {EXPERIENCE.map((e) => (
            <li>
              <div class="tl-when mono">{e.when}</div>
              <div class="tl-main">
                <span class="tl-org">{e.org}</span>
                <span class="tl-role">{e.role}</span>
                <span class="tl-loc mono">{e.location}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div class="pcol">
        <div class="col-key mono">Education</div>
        <div class="edu">
          {EDUCATION.map((e) => (
            <div class="edu-item">
              <div class="edu-top"><span class="edu-org">{e.org}</span><span class="edu-when mono">{e.when}</span></div>
              <div class="edu-qual">{e.qual}</div>
              <div class="edu-desc">{e.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div class="stack-block">
      <div class="col-key mono">Stack</div>
      <div class="stk">
        {STACK.map((s) => (
          <div class="stk-row"><span class="stk-key">{s.key}</span><span class="stk-val">{s.value}</span></div>
        ))}
      </div>
    </div>

    <div class="lookingfor">
      <div class="lf-head mono">Looking for</div>
      <div class="lf-grid">
        <div>
          <span class="lf-sub mono">Roles</span>
          <div class="chips">
            {ROLES.map((r) => <span class="chip-lg">{r}</span>)}
          </div>
        </div>
        <div>
          <span class="lf-sub mono">Locations</span>
          <div class="cities">
            {CITIES.map((c) => (
              <div class="city"><span class="city-name">{c.name}</span><span class="city-coord mono">{c.coord}</span></div>
            ))}
          </div>
        </div>
        <div>
          <span class="lf-sub mono">Available</span>
          <div class="avail-val mono"><span class="live-dot" aria-hidden="true"></span> {AVAILABLE}</div>
        </div>
      </div>
    </div>
  </div>
</section>

<style lang="scss">
.profile { padding: 108px 0; }
.profile-head { margin-bottom: 44px; max-width: 60ch; }

.phead { display: flex; align-items: center; gap: 10px; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--mut); margin-bottom: 14px; }
.pid { color: var(--phos); text-shadow: var(--phos-glow); font-weight: 600; }
.tier { color: var(--fg); font-weight: 600; }

.ptitle { font-family: var(--font-hero); font-weight: 600; font-size: clamp(28px, 3vw, 42px); line-height: 1.05; letter-spacing: -0.015em; color: var(--fg); margin: 10px 0 0; }
.bio { margin-top: 18px; font-size: 16px; line-height: 1.6; color: var(--fg2); }

.pgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; }
.col-key { font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--primary); margin-bottom: 8px; }

.timeline { list-style: none; margin: 0; padding: 0; }
.timeline li { display: grid; grid-template-columns: 78px 1fr; gap: 18px; padding: 16px 0; border-top: 1px solid var(--bd); }
.tl-when { font-size: 11px; color: var(--mut); letter-spacing: 0.04em; padding-top: 3px; }
.tl-main { display: flex; flex-direction: column; gap: 2px; }
.tl-org { font-size: 17px; font-weight: 600; color: var(--fg); }
.tl-role { font-size: 14px; color: var(--fg2); }
.tl-loc { font-size: 11px; color: var(--mut); letter-spacing: 0.04em; margin-top: 2px; }

.edu { margin: 0; }
.edu-item { padding: 18px 0; border-top: 1px solid var(--bd); }
.edu-top { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; }
.edu-org { font-size: 17px; font-weight: 600; color: var(--fg); }
.edu-when { font-size: 11px; color: var(--mut); letter-spacing: 0.04em; white-space: nowrap; }
.edu-qual { font-size: 14px; color: var(--fg2); margin-top: 2px; }
.edu-desc { font-size: 13.5px; color: var(--mut); line-height: 1.55; margin-top: 9px; }

.stack-block { margin-top: 56px; }
.stk { margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; column-gap: 56px; }
.stk-row { display: grid; grid-template-columns: 118px 1fr; gap: 16px; padding: 14px 0; border-top: 1px solid var(--bd); align-items: baseline; }
.stk-key { font-size: 12px; font-weight: 600; color: var(--mut); }
.stk-val { font-size: 15px; color: var(--fg); line-height: 1.5; }

.lookingfor { margin-top: 52px; border: 1px solid var(--bd); background: var(--bg2); padding: 34px 38px; }
.lf-head { font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--primary); margin-bottom: 26px; }
.lf-grid { display: grid; grid-template-columns: 1.5fr 1.3fr 1fr; gap: 44px; }
.lf-sub { display: block; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--mut); margin-bottom: 14px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip-lg { font-size: 13px; padding: 9px 14px; border: 1px solid var(--bd); color: var(--fg); background: var(--bg); }
.cities { display: flex; gap: 30px; }
.city { display: flex; flex-direction: column; gap: 3px; }
.city-name { font-family: var(--font-hero); font-size: 22px; font-weight: 600; color: var(--fg); line-height: 1; }
.city-coord { font-size: 10.5px; color: var(--mut); letter-spacing: 0.04em; }
.avail-val { display: inline-flex; align-items: center; gap: 9px; font-size: 14px; letter-spacing: 0.06em; color: var(--phos); text-shadow: var(--phos-glow); }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dot-bg); box-shadow: var(--dot-glow); flex-shrink: 0; }

@media (max-width: 900px) {
  .pgrid { grid-template-columns: 1fr; gap: 44px; }
  .stk { grid-template-columns: 1fr; column-gap: 0; }
  .lf-grid { grid-template-columns: 1fr; gap: 28px; }
  .cities { gap: 24px; }
}

.mono { font-family: var(--font-mono); }
</style>
```

- [ ] **Step 2: Verify**

Run: `npx astro check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/Profile.astro
git commit -m "feat(profile): add Background section"
```

---

## Task 8: Closing.astro (contact)

**Files:**
- Create: `src/components/shell/Closing.astro`

- [ ] **Step 1: Create the component**

```astro
---
// Closing / contact section. Email is the primary action; resume secondary.
---
<section class="close" id="contact">
  <div class="wrap">
    <span class="acc-rule" aria-hidden="true"></span>
    <h2>Let's build something that ships.</h2>
    <p>Open to Forward-Deployed, Applied AI, Solutions Architect, and Full-stack roles in London and New York from September 2026.</p>
    <div class="cta-row">
      <a class="btn btn--primary mono" href="mailto:bransontay@gmail.com">✉ bransontay@gmail.com</a>
      <a class="btn mono" href="/resume.pdf" download="BRANSON TAY.pdf"><span aria-hidden="true">↓</span> Résumé</a>
    </div>
    <div class="foot mono">
      <a href="https://github.com/Brandnewson" target="_blank" rel="noopener noreferrer">GitHub</a>
      <a href="https://linkedin.com/in/bransontay" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      <span>© 2026 Branson Tay</span>
    </div>
  </div>
</section>

<style lang="scss">
.close { min-height: 84vh; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 80px 0; }
.acc-rule { display: block; height: 2px; width: 120px; margin: 0 auto 40px; background: var(--rule); }
h2 { font-family: var(--font-hero); font-weight: 600; font-size: clamp(34px, 4.6vw, 64px); line-height: 1.02; letter-spacing: -0.02em; color: var(--fg); margin: 0; }
p { margin: 20px auto 0; font-size: 16px; color: var(--fg2); max-width: 48ch; }
.cta-row { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 36px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 15px 26px; border: 1px solid var(--bd); font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--fg); text-decoration: none; transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease; }
.btn:hover { color: var(--primary); border-color: var(--primary); }
.btn--primary { border-color: var(--primary); background: var(--primary-tint); color: var(--primary); }
.btn--primary:hover { border-color: var(--primary-hover); color: var(--primary-hover); }
.foot { margin-top: 64px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--mut); display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; }
.foot a { color: var(--mut); text-decoration: none; }
.foot a:hover { color: var(--primary); }
.mono { font-family: var(--font-mono); }
</style>
```

- [ ] **Step 2: Verify**

Run: `npx astro check`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/shell/Closing.astro
git commit -m "feat(shell): add closing/contact section"
```

---

## Task 9: Rewrite Hero.astro

**Files:**
- Modify (full rewrite): `src/components/hero/Hero.astro`
- Delete: `src/components/hero/QuickRead.astro`

- [ ] **Step 1: Replace Hero.astro with the new hero**

```astro
---
import ThemeToggle from '../../islands/ThemeToggle.tsx';
---
<section class="hero" id="top">
  <div class="wrap">
    <p class="name">Branson Tay</p>
    <p class="eyebrow mono">Full-stack engineer · AI × physical systems</p>
    <h1 class="headline">I build applied-AI tools that <em>ship.</em></h1>
    <p class="sub">A full-stack engineer who ships real things end to end. What pulls me is the intersection of AI and physical systems, where learning models meet real hardware and dynamics.</p>

    <p class="status mono"><span class="live-dot" aria-hidden="true"></span> <b>OPEN TO WORK</b> · LONDON + NYC · FROM SEP 2026</p>

    <div class="calibrate">
      <span class="cal-label mono">Calibrate your view →</span>
      <ThemeToggle client:load />
      <span class="inspo" aria-live="polite">
        <span class="inspo-day">Inspired by a 911 Targa sitting in Maranello</span>
        <span class="inspo-night">Inspired by a 300ZX cruising on the motorway</span>
      </span>
    </div>

    <nav class="heronav" aria-label="Jump to section">
      <a class="navcta navcta--primary" href="#work">
        <span class="nc-top"><span class="nc-label mono">Featured project</span><span class="nc-arrow" aria-hidden="true">↓</span></span>
        <span class="nc-sub">Quasi-static lap-time simulator</span>
      </a>
      <a class="navcta" href="#profile">
        <span class="nc-top"><span class="nc-label mono">Profile</span><span class="nc-arrow" aria-hidden="true">↓</span></span>
        <span class="nc-sub">Experience, stack, availability</span>
      </a>
      <a class="navcta" href="#contact">
        <span class="nc-top"><span class="nc-label mono">Contact</span><span class="nc-arrow" aria-hidden="true">↓</span></span>
        <span class="nc-sub">Email &amp; links</span>
      </a>
    </nav>
  </div>
</section>

<style lang="scss">
.hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 88px 0 56px; }

.name { font-family: var(--font-hero); font-size: clamp(22px, 2.5vw, 32px); font-weight: 700; letter-spacing: -0.01em; color: var(--fg); margin: 0 0 8px; }
.name::after { content: ''; display: block; width: 34px; height: 2px; background: var(--rule); margin-top: 12px; }

.eyebrow { font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--primary); margin: 16px 0 22px; }

.headline { font-family: var(--font-hero); font-weight: 600; font-size: clamp(40px, 6vw, 80px); line-height: 0.98; letter-spacing: -0.025em; color: var(--fg); max-width: 14ch; margin: 0; }
.headline em { font-style: normal; color: var(--emphasis); }

.sub { font-size: clamp(16px, 1.5vw, 20px); line-height: 1.5; color: var(--fg2); max-width: 54ch; margin-top: 24px; }

.status { display: inline-flex; align-items: center; gap: 10px; margin-top: 26px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--mut); }
.status b { color: var(--phos); text-shadow: var(--phos-glow); font-weight: 600; }
.live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dot-bg); box-shadow: var(--dot-glow); flex-shrink: 0; animation: pulse 2.4s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.calibrate { margin-top: 38px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.cal-label { font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--mut); }
.inspo span { font-style: italic; font-size: 12.5px; color: var(--mut); }
.inspo .inspo-day, .inspo .inspo-night { display: none; }

.heronav { margin-top: 44px; display: flex; gap: 12px; flex-wrap: wrap; align-items: stretch; }
.navcta { display: inline-flex; flex-direction: column; gap: 6px; min-width: 188px; padding: 16px 18px; border: 1px solid var(--bd); text-decoration: none; background: transparent; transition: border-color 0.15s ease, background 0.15s ease; }
.nc-top { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.nc-label { font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg); }
.nc-arrow { font-size: 15px; color: var(--mut); transition: transform 0.15s ease, color 0.15s ease; }
.nc-sub { font-size: 11px; color: var(--mut); }
.navcta:hover { border-color: var(--primary); }
.navcta:hover .nc-label { color: var(--primary); }
.navcta:hover .nc-arrow { transform: translateY(3px); color: var(--primary); }
.navcta--primary { border-color: var(--primary); border-left-width: 3px; background: var(--primary-tint); }
.navcta--primary .nc-label, .navcta--primary .nc-arrow { color: var(--primary); }
.navcta--primary:hover { border-color: var(--primary-hover); }

.mono { font-family: var(--font-mono); }

@media (max-width: 900px) {
  .heronav { flex-direction: column; }
  .navcta { min-width: 0; width: 100%; }
}
</style>

<style is:global>
  /* Inspiration line swaps with theme (Astro scoped CSS mangles [data-theme]
     descendant selectors, so this lives in a global block — same pattern the
     old InstrumentBar used for its day/night lines). */
  html[data-theme="day"] .inspo .inspo-day { display: inline; }
  html[data-theme="night"] .inspo .inspo-night { display: inline; }
</style>
```

- [ ] **Step 2: Delete QuickRead (now unused)**

```bash
git rm src/components/hero/QuickRead.astro
```

- [ ] **Step 3: Confirm nothing else imports QuickRead**

Run: `grep -rn "QuickRead" src/`
Expected: no matches.

- [ ] **Step 4: Verify build + toggle on hero**

Run: `npm run build` then `npm run dev`. Open the landing. Confirm: name masthead, eyebrow, headline with amber/bordeaux "ship.", the DAY/NIGHT toggle renders and flips theme, and the inspiration line swaps (Targa in day, 300ZX at night).
Expected: build passes; toggle works; inspiration line swaps.

> If the toggle labels look low-contrast on the cream/near-black hero (because `--bar-fg` was tuned for the dark bar), add to the `.calibrate` scope in Step 1's `<style>`: `:global(.theme-toggle){ --bar-fg: var(--fg); --bar-fg-mut: var(--mut); }`. Only do this if the visual check shows a problem.

- [ ] **Step 5: Commit**

```bash
git add src/components/hero/Hero.astro
git commit -m "feat(hero): rewrite to narrative hero with calibrate beat and directional CTAs"
```

---

## Task 10: SectionRail island

**Files:**
- Create: `src/islands/SectionRail.tsx`
- Create: `src/islands/SectionRail.scss`

- [ ] **Step 1: Create the styles**

`src/islands/SectionRail.scss`:

```scss
// Desktop: fixed right-edge vertical rail. Mobile: bottom strip. Both hidden
// on the hero, revealed once scrolled past it; active item set by scroll-spy.
.section-rail {
  position: fixed;
  top: 50%;
  right: 26px;
  transform: translateY(-50%);
  z-index: 60;
  display: flex;
  flex-direction: column;
  gap: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &.is-visible { opacity: 1; pointer-events: auto; }

  .rail-item {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    text-decoration: none;
    padding: 5px 0;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--mut);
  }
  .rl-label { opacity: 0; transform: translateX(6px); transition: opacity 0.15s ease, transform 0.15s ease; }
  .rl-tick { width: 22px; height: 2px; background: var(--mut); transition: width 0.15s ease, background 0.15s ease; }
  .rail-item:hover { color: var(--fg); }
  .rail-item:hover .rl-label { opacity: 1; transform: none; }
  .rail-item:hover .rl-tick { width: 30px; background: var(--fg); }
  .rail-item.is-active { color: var(--fg); }
  .rail-item.is-active .rl-label { opacity: 1; transform: none; }
  .rail-item.is-active .rl-tick { width: 34px; background: var(--gauge-fill); box-shadow: var(--gauge-glow); }

  @media (max-width: 1100px) { display: none; }
}

.section-rail-m {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 60;
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 22px;
  background: var(--bg);
  border-top: 1px solid var(--bd);
  opacity: 0;
  transform: translateY(100%);
  transition: opacity 0.3s ease, transform 0.3s ease;

  &.is-visible { opacity: 1; transform: none; }

  .rm-ticks { display: flex; align-items: center; gap: 12px; }
  .rm-item { display: block; width: 20px; height: 3px; border-radius: 2px; background: var(--mut); transition: width 0.15s ease, background 0.15s ease; }
  .rm-item.is-active { width: 30px; background: var(--gauge-fill); box-shadow: var(--gauge-glow); }
  .rm-label { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--fg); }

  @media (max-width: 1100px) { display: flex; }
}

@media (prefers-reduced-motion: reduce) {
  .section-rail, .section-rail-m { transition: none; }
  .section-rail .rl-label, .section-rail .rl-tick, .section-rail-m .rm-item { transition: none; }
}
```

- [ ] **Step 2: Create the island**

`src/islands/SectionRail.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import './SectionRail.scss';

const SECTIONS = [
  { id: 'work', label: 'FS Sim' },
  { id: 'marl', label: 'MARL' },
  { id: 'helm', label: 'Helm' },
  { id: 'profile', label: 'Profile' },
  { id: 'contact', label: 'Contact' },
] as const;

export default function SectionRail() {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<string>('work');
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const hero = document.getElementById('top');
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null
    );

    let heroObs: IntersectionObserver | undefined;
    if (hero) {
      heroObs = new IntersectionObserver(
        (entries) => entries.forEach((e) => setVisible(!e.isIntersecting)),
        { threshold: 0.12 }
      );
      heroObs.observe(hero);
    }

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    sections.forEach((el) => spy.observe(el));

    return () => {
      heroObs?.disconnect();
      spy.disconnect();
    };
  }, []);

  const activeLabel = SECTIONS.find((s) => s.id === active)?.label ?? '';

  return (
    <>
      <nav
        className={`section-rail${visible ? ' is-visible' : ''}`}
        aria-label="Jump to section"
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`rail-item${active === s.id ? ' is-active' : ''}`}
          >
            <span className="rl-label">{s.label}</span>
            <span className="rl-tick" />
          </a>
        ))}
      </nav>

      <nav
        className={`section-rail-m${visible ? ' is-visible' : ''}`}
        aria-label="Jump to section"
      >
        <span className="rm-ticks">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-label={s.label}
              className={`rm-item${active === s.id ? ' is-active' : ''}`}
            />
          ))}
        </span>
        <span className="rm-label">{activeLabel}</span>
      </nav>
    </>
  );
}
```

- [ ] **Step 3: Verify it type-checks**

Run: `npx astro check`
Expected: no errors. (Behavioural verification happens in Task 11 once it is mounted.)

- [ ] **Step 4: Commit**

```bash
git add src/islands/SectionRail.tsx src/islands/SectionRail.scss
git commit -m "feat(rail): add scroll-spy section rail island (desktop + mobile)"
```

---

## Task 11: Assemble index.astro

**Files:**
- Modify (rewrite): `src/pages/index.astro`

- [ ] **Step 1: Rewrite the page**

```astro
---
import Shell from '../layouts/Shell.astro';
import Hero from '../components/hero/Hero.astro';
import ProjectFeature from '../components/projects/ProjectFeature.astro';
import Profile from '../components/profile/Profile.astro';
import Closing from '../components/shell/Closing.astro';
import SectionRail from '../islands/SectionRail.tsx';
import FsSimCard from '../islands/FsSimCard';
import MarlCard from '../islands/MarlCard';
import HelmArchitecture from '../islands/HelmArchitecture';
---
<Shell title="Branson Tay — Portfolio" hideBar>
  <Hero />

  <div class="band-wrap">
    <ProjectFeature
      anchorId="work"
      panelId="PRJ/001"
      tier="FEATURED"
      title="Quasi-Static Lap Time Simulator"
      kicker="Lap-time solver built from first principles, and fitted tyre model"
      points={[
        'Actively used by Leeds Gryphon Racing to determine design trade-offs',
        'Predicts pace per track from mass, aero, tyres, gearing, tyres',
        'Python FastAPI web app for engineers to easily use with RAG AI chatbot',
      ]}
      why="Let engineers reason design choices in minutes, instead of hours of expensive track time"
      stack={['python', 'linear programming', 'web development', 'data modelling']}
      route="https://lgr-simulator.fly.dev/"
      routeLabel="Launch simulator"
    >
      <FsSimCard client:load />
    </ProjectFeature>
  </div>

  <div class="band-wrap">
    <ProjectFeature
      anchorId="marl"
      panelId="PRJ/002"
      tier="RESEARCH"
      title="MARL Racing Sim"
      kicker="When teamwork helps and when it hurts."
      points={[
        'Multi-Agent Reinforcement Learning in a custom-built F1-inspired action space',
        'Find learning strategies for teammates in a dynamic competitive environment',
        'Maps when team play speeds learning, and when it stalls it',
      ]}
      why="Investigate when cooperation and competition hurt AI agents working together."
      stack={['python', 'pytorch', 'dqn family']}
      route="/report"
      routeLabel="View report"
      reverse
    >
      <MarlCard client:load />
    </ProjectFeature>
  </div>

  <div class="band-wrap">
    <ProjectFeature
      anchorId="helm"
      panelId="PRJ/003"
      tier="SHIPPING"
      title="Helm"
      kicker="Automatic CV generator app, built with an agentic harness on a self-improving loop."
      points={[
        'Live consumer product, pre-revenue',
        'Generates a tailored CV from one job description',
        'Agentic harness I tune the extractor against, scored by unit + e2e evals',
      ]}
      why="Teach myself system design, and self-improving harnesses in production environments"
      stack={['typescript', 'fastapi', 'k8s', 'sqs', 'cloudflare']}
      route="/helm"
    >
      <HelmArchitecture client:load />
    </ProjectFeature>
  </div>

  <Profile />
  <Closing />

  <SectionRail client:idle />
</Shell>

<style lang="scss">
.band-wrap {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 48px;

  @media (max-width: 900px) { padding: 0 26px; }
}
</style>
```

> Note: the three `ProjectFeature` bands keep the existing copy from the prior `index.astro`. They are wrapped in `.band-wrap` to match the centred 1180 column used by `.wrap` in the hero/profile/closing. If the project island cards need full width, this wrapper still allows it within the column.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: passes.

- [ ] **Step 3: Behavioural + visual verification script**

Create `scripts/verify-landing.mjs` (set `PORT` to whatever `npm run dev` printed):

```js
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
```

- [ ] **Step 4: Run it**

Run (two shells): `npm run dev` then `PORT=<printed-port> node scripts/verify-landing.mjs`
Expected console: `theme: day -> night OK`; `rail visible: true | active set: true`; `hash after contact click: #contact`; `mobile strip visible: true`; `done`.
Then eyeball `scripts/_out/landing-*.png` against `landing-clone-v8.html` — hero, three bands, profile, closing, rail, mobile strip should match in both themes.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro scripts/verify-landing.mjs
git commit -m "feat(landing): assemble narrative page with hero, bands, profile, closing, rail"
```

---

## Task 12: Final review pass

**Files:** none (review only)

- [ ] **Step 1: Phosphor discipline audit**

Run: `npm run dev`, open landing in night mode. Confirm green (`--acc`) appears ONLY on: the hero status dot + "OPEN TO WORK", the `PRJ/*` panel IDs, the `PROFILE` id, the `SEP 2026` availability readout, and the active rail/strip tick. It must NOT appear on the headline, CTAs, rail/nav text, name, or body. Fix any violation by switching the offending colour to `--fg`, `--amb`/`--primary`, or `--mut`.

- [ ] **Step 2: Copy audit**

Confirm no em-dashes in prose copy (hero sub, bio, closing). Date ranges using `—` are fine.

- [ ] **Step 3: Responsive audit**

Resize from 1440 down past 1100 (rail → bottom strip) and to 390 (mobile). Confirm hero CTAs stack, profile grids collapse, nothing overflows horizontally.

- [ ] **Step 4: Cross-page check**

Open a deep page (`/helm` or `/report`) and confirm the `InstrumentBar` still renders (the toggle styled correctly from the global partial) and there is no `TargaBar`.

- [ ] **Step 5: Final commit (if any fixes)**

```bash
git add -A
git commit -m "fix(landing): phosphor/copy/responsive review fixes"
```

---

## Self-review notes (author)

- **Spec coverage:** hero (T9), directional CTAs + calibrate (T9), inspiration swap (T9), 3 bands + ids + chip fix (T5/T11), profile incl. experience/education/stack/looking-for (T6/T7), contact close (T8), section rail desktop+mobile scroll-spy (T10/T11), no-header landing + TargaBar drop (T3/T4/T11), `--primary-tint` (T1), toggle decoupling so it works on the landing (T2), profile data module (T6). All §9 spec components mapped.
- **Open items (spec §11):** resolved — no rail TechNote, TargaBar dropped, ownership confirmed.
- **Known adaptation:** TDD is replaced with build/type checks + Playwright behavioural assertions + visual diff against the approved clone, since this is presentational work.
