# Landing Narrative Redesign — Design Spec

**Date:** 2026-06-08
**Status:** Approved (design locked, pre-build)
**Visual source of truth:** `.superpowers/brainstorm/37566-1780927336/content/landing-clone-v8.html`
(high-fidelity clone, day + night, working theme toggle + section rail — open in a browser via the brainstorm companion or directly)

---

## 1. Problem & goal

On first load the landing had no visual hierarchy — every element carried equal weight, so a visitor had to *read* to orient instead of being *led*. The top nav menu (`work / writing / about / contact`) was already removed in a prior change (its links pointed at sections that didn't exist, and a menu fights the instrument metaphor).

This spec redesigns the landing into a **guided narrative scroll** with a single dominant focal point on load, directed entry into the work, and a sustainable way to move between sections.

### Positioning hierarchy (drives all copy)

1. **Claim (leads):** a builder who ships. The verifiable, thirty-second read that FDE / founding-engineer roles screen for. Evidenced by Helm, the lap-time simulator, the MARL work, and the Jaguar placement.
2. **Angle (underneath):** the intersection of **AI and physical / engineering systems**. Framed as a gravitational pull, *not* an expert claim — so physical-AI companies (PhysicsX and competitors) see themselves in him without narrowing him out of broader AI / FDE roles.
3. **Evidence:** the three project bands.

Funnel stays wide; physical-AI companies still self-select in.

---

## 2. Scope

**In scope:** hero, section navigation (desktop rail + mobile strip), profile section, contact close, all landing copy, token/phosphor usage, and the no-header landing shell.

**Out of scope (reuse as-is):** the three project island cards (`FsSimCard`, `MarlCard`, `HelmArchitecture`) and `ProjectFeature.astro` band layout; deep pages (`/helm`, `/report`, sim pages); search; boot sequence.

**Coordination:** `src/pages/index.astro` and `src/components/hero/Hero.astro` are under concurrent edit by another session. The working tree is shared — **do not switch branches**, and sequence the build to avoid clobbering. Confirm ownership before editing those two files.

---

## 3. Page structure (top → bottom)

| # | Section | Anchor | Notes |
|---|---------|--------|-------|
| 1 | Hero | `#top` | Full viewport. Name → eyebrow → headline → sub → status → calibrate → 3 directional CTAs |
| 2 | FS Sim | `#work` | PRJ/001 · FEATURED · primary CTA target |
| 3 | MARL | `#marl` | PRJ/002 · RESEARCH · reversed layout |
| 4 | Helm | `#helm` | PRJ/003 · SHIPPING |
| 5 | Profile | `#profile` | "Background" — bio, experience, education, stack, looking-for |
| 6 | Contact | `#contact` | Closing CTA + footer |
| — | Section rail | — | Desktop right-edge / mobile bottom strip; appears after hero |

Narrative: **builder who ships → drawn to AI-meets-physical → three projects as proof → full profile → contact.**

---

## 4. Shell / header

- **Landing has no `InstrumentBar`.** The hero is full-bleed; identity lives in the hero (`Branson Tay` masthead) and the theme toggle becomes the hero's "calibrate" beat.
- **Deep pages keep `InstrumentBar`** (logo + toggle) — they need a persistent home for identity + toggle.
- The hero toggle **must reuse the existing `ThemeToggle` island + `stores/theme.ts`** (not a new toggle) so theme persistence, the anti-flash script, and the tunnel transition all still apply. The black "flash" in the clone is a stand-in for the real tunnel transition in `_animations.scss`.
- `TargaBar` (5px silver) on the landing: **open question** — keep as a thin top flourish or drop for a fully clean full-bleed hero. Default: drop on landing.

---

## 5. Section-by-section anatomy & locked copy

### 5.1 Hero (`#top`)

- **Name:** `Branson Tay` — `--font-hero`, ~clamp(22–32px), weight 700, with a 34px `--rule` underline. Distinct from the eyebrow (the earlier bug was the name buried in the eyebrow).
- **Eyebrow:** `Full-stack engineer · AI × physical systems` — mono, uppercase, `--primary`. (The *domain* is the angle, not a role list.)
- **H1:** `I build applied-AI tools that ship.` — `--font-hero`, clamp(40–80px); `ship.` in `--emphasis` (bordeaux day / amber night).
- **Sub:** `A full-stack engineer who ships real things end to end. What pulls me is the intersection of AI and physical systems, where learning models meet real hardware and dynamics.`
- **Status line:** live-dot + `OPEN TO WORK · LONDON + NYC · FROM SEP 2026`. `OPEN TO WORK` uses `--phos` (live state).
- **Calibrate beat:** label `Calibrate your view →` + `ThemeToggle` (DAY/NIGHT) + a subtle inspiration line that swaps on theme:
  - Day: *Inspired by a 911 Targa sitting in Maranello*
  - Night: *Inspired by a 300ZX cruising on the motorway*
- **Directional CTAs (3):** each a card with label, ↓ glyph, and a sub-descriptor.
  - **Featured project** → `#work` — *primary*, lighter treatment (accent border + faint `--primary-tint`, 3px left border). Sub: "Quasi-static lap-time simulator".
  - **Profile** → `#profile` — secondary. Sub: "Experience, stack, availability".
  - **Contact** → `#contact` — secondary. Sub: "Email & links".

### 5.2 Project bands (`#work`, `#marl`, `#helm`)

Reuse `ProjectFeature.astro` and the existing island cards. Order: FS Sim (featured) → MARL (reverse) → Helm. Copy already lives in `index.astro` and is unchanged here.

**Fix:** the `.stack` skill chips currently render default list bullets — add `list-style: none` to `.stack` in `ProjectFeature.astro`. Chips stay as squared bordered text.

### 5.3 Profile (`#profile`) — "Background"

- **Eyebrow:** `PROFILE · WHO I AM`. **Heading:** `Background`.
- **Bio:** `I sit at the intersection of mechanical engineering and computer science. I want to build in that overlap, capitalising on both, and push toward physical AI, where learning systems meet real hardware and dynamics.`
- **Two columns — Experience | Education:**
  - **Experience** (timeline, reverse-chron):
    - `2024 — 25` · **Jaguar TCS Racing** · Junior Strategy & Software Engineer · Kidlington, UK
    - `2020 — 22` · **Republic of Singapore Navy** · Marine Systems Specialist Technician · Singapore
    - `2019 — 20` · **Travelindr** · Co-founder & CEO · Singapore
  - **Education** (long-form, reverse-chron — Leeds first):
    - **University of Leeds** (`2022 — 26`) · BSc Computer Science, Year in Industry · Leeds, UK — "The software half. Formula Student Performance & Simulation sub-team lead across aero, tyres, powertrain and vehicle dynamics; final-year project on multi-agent reinforcement learning for race strategy."
    - **Ngee Ann Polytechnic** (`2017 — 20`) · Diploma, Mechanical Engineering · Singapore — "The mechanical foundation: gearbox design to load, speed and dimensional spec, CAD/CAM fabrication, and core engineering method. Graduated with the Good Progress and School of Engineering Merit awards."
- **Stack** (full width, 2-column rows):
  - Languages — Python, TypeScript, C++, Rust, MATLAB, Java
  - AI / ML — PyTorch, RAG, Claude Code, Codex, agentic harnesses, NumPy / SciPy
  - Web / Infra — React, Node, FastAPI / Flask, MongoDB, AWS, Azure, Docker, CI/CD
  - Tools — Git, Docker, Azure DevOps, ATLAS telemetry
- **Looking for** (bordered `--panel-bg` panel, 3 columns):
  - **Roles:** Forward-Deployed Engineer · Applied AI Engineer · Solutions Architect · Full-stack Engineer
  - **Locations:** London (51.5°N · 0.1°W) · New York (40.7°N · 74.0°W) — names in `--font-hero`, coords in mono
  - **Available:** `SEP 2026` with live-dot — uses `--phos` (availability = live status)

### 5.4 Contact (`#contact`) — closing

- Short centred `--rule`.
- **H2:** `Let's build something that ships.`
- **Body:** `Open to Forward-Deployed, Applied AI, Solutions Architect, and Full-stack roles in London and New York from September 2026.`
- **CTAs:** primary `mailto:bransontay@gmail.com`; secondary `↓ Résumé` (`/resume.pdf`, download).
- **Footer:** GitHub · LinkedIn · © 2026 Branson Tay.

---

## 6. Section navigation (rail + mobile strip)

Single sustainable jump-aid; replaces both per-section "next" CTAs and any scroll-back-to-hero friction.

- **Desktop (≥ 1100px):** fixed vertical rail at the right edge. One tick per section (`work / marl / helm / profile / contact`). Labels hidden by default, revealed on hover and for the active item. Active tick extends and uses `--gauge-fill` + `--gauge-glow` (a live "position" readout → legitimately phosphor at night). Rail fades in once the hero leaves the viewport.
- **Mobile (< 1100px):** the rail rotates into a slim fixed **bottom strip** — horizontal ticks + the current section's name (mono). Same scroll-spy and tap-to-jump. Slides up after the hero.
- **Behaviour:** `IntersectionObserver` for both (a) show/hide vs. the hero and (b) scroll-spy (`rootMargin: -45% 0 -45%` so a section activates as it crosses mid-viewport). Anchor links + smooth scroll. Respect `prefers-reduced-motion`.

**Implementation:** interactive → an island, `src/islands/SectionRail.tsx` (per the .tsx rule). Renders both the desktop rail and mobile strip; hides the inactive one via CSS at the 1100px breakpoint.

---

## 7. Tokens, type & discipline

- **SCSS only**, no inline styles, all colours via `_tokens.scss` custom properties.
- **New semantic token:** `--primary-tint` (faint accent fill) for the lighter primary CTA and any tinted chip. Define for day + night in `_tokens.scss`.
- **Phosphor discipline (hard rule):** green only on live markers — status dot, `OPEN TO WORK`, panel IDs, gauge fills, the `SEP 2026` availability readout, and the active rail tick. **Never** on the headline, CTAs, rail/nav *text*, body, or the name.
- **Type:** name / section titles / hero use `--font-hero` (Instrument Sans day, Chakra Petch night). Body = Instrument Sans. Mono (IBM Plex Mono) for eyebrows, labels, telemetry, and coordinates.
- **Copy rule:** no em-dashes in prose (Branson preference) — use periods/commas. Date ranges may use an en-dash.

---

## 8. Data

Profile content (experience, education, stack, looking-for) goes in a typed data module — `src/data/profile.ts` — so it is editable without touching markup. `Profile.astro` renders from it. Hero/contact copy stays locked in-component (it is the page's pitch, a deliberate edit not configuration), matching the existing `Hero.astro` / `QuickRead.astro` convention.

---

## 9. Components to build / change

| Component | Action |
|---|---|
| `Hero.astro` | Rewrite to the new structure (name masthead, angle eyebrow/sub, status, calibrate beat with `ThemeToggle`, 3 directional CTAs). Coordinate — concurrent edit. |
| `Profile.astro` | New. Renders `Background` from `src/data/profile.ts`. |
| `Closing.astro` (contact) | New. Closing CTA + footer. |
| `SectionRail.tsx` | New island. Desktop rail + mobile strip + scroll-spy. |
| `src/data/profile.ts` | New typed data module. |
| `ProjectFeature.astro` | Add `list-style: none` to `.stack`; add `id` per band (`marl`, `helm`). |
| `Shell.astro` / `index.astro` | Landing renders full-bleed (no `InstrumentBar`); add section anchors. Coordinate — concurrent edit. |
| `_tokens.scss` | Add `--primary-tint` (day + night). |
| `QuickRead.astro` | Retire from the hero (content relocated to Profile). |

---

## 10. Kept / cut log

- **Cut:** top nav menu; heavy filled primary CTA; explicit "two instruments" hint line; "The full readout" heading; QuickRead aside in the hero.
- **Relocated:** QuickRead content → Profile; theme toggle → hero calibrate beat; inspiration line → beside the toggle (swaps on theme).
- **Resolved:** *About* = hero + profile; *Contact* = closing section; *Writing* = folded into projects (no standalone destination).

---

## 11. Open items to confirm at build

1. **TechNote for `SectionRail`** — CLAUDE.md hard rule says every interactive element gets a `(i)` TechNote. Add a short one for the scroll-spy nav, or treat nav chrome as exempt? (Needs Branson's call.)
2. **`TargaBar` on the landing** — keep as a thin top flourish, or drop for a clean full-bleed hero? (Default: drop.)
3. Confirm build ownership of `index.astro` / `Hero.astro` with the concurrent session before editing.
