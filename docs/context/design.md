# Design System

This is a guide rail, not a rigid spec. Branson makes the final call on every aesthetic decision. When in doubt, propose options with reasoning rather than implementing silently.

---

## The core concept

The site has two modes — Day and Night — inspired by specific cars rather than generic light/dark themes. The transition between them mimics entering a tunnel: a black flash, then the new environment reveals itself. Each mode has a distinct character.

**Day mode — 911 Targa (1970s air-cooled)**
Dark graphite exterior, cognac tan leather interior, polished silver targa bar. The mood is understated European confidence. Warm, rich, not showy. Reference: the black 911 Targa with tan leather in the Pinterest board.

**Night mode — Nissan 300ZX (Z31, 1984)**
All-green phosphor instrument cluster. Everything glows. The background is near-black with a subtle green ambient cast on surfaces. The mood is technical, precise, slightly cinematic. Reference: the 300ZX dashboard photo — note the green illuminates surrounding surfaces.

---

## Aesthetic principles

**Earned detail.** Every decorative element should have a reason. The silver targa bar divider exists because it references the actual car's structural bar. The dot connectors on the rule reference rivets. If something is purely decorative with no conceptual anchor, remove it.

**Restraint over maximalism.** The RX-7 dashboard in the reference images is impressive because the green is the only light in the dark. If everything glows, nothing glows. Use the accent colour sparingly.

**Alive but not animated.** The site should feel like a running engine at idle — there is motion, but it is purposeful and unhurried. The breathing status dot, the live MARL agents, the EQ bars. Nothing spins for the sake of spinning.

**Typography as material.** Instrument Sans carries every heading and body run in both themes — a considered editorial sans. IBM Plex Mono is reserved for telemetry surfaces only (panel IDs, labels, readouts). The font itself carries meaning — treat it as a design material, not just a vehicle for words. (Night mode previously swapped headings to Chakra Petch; that swap was dropped in favour of a single heading face across themes.)

---

## Colour tokens

All values live in src/styles/_tokens.scss. This is the authoritative list.

Tokens locked in Session 1 after six rounds of mockup iteration (see `docs/mockup-palettes-v{1..6}.html`).

### Day mode — 911 Targa

| Token | Value | Role |
|---|---|---|
| --bg | #F5EEE0 | Off-white cream — page background |
| --bg2 | #EDE4D0 | Slightly richer cream — surface / panel base |
| --ink | #1E1A16 | Dark graphite — instrument bar, contrast blocks |
| --bd | rgba(90,70,40,0.15) | Subtle warm border |
| --sil | #B8B2A6 | Targa bar — brushed aluminium |
| --sil2 | #D0CAC0 | Lighter silver highlight |
| --acc | #8B5A30 | Cognac — primary accent, CTA, link |
| --acc2 | #5D1A29 | Bordeaux — secondary accent, headings emphasis |
| --txt | #1A120A | Near-black, warm undertone — body text |
| --txt2 | #4A3828 | Mid warm-brown — secondary text |
| --mut | #7A6050 | Muted label / caption |

### Night mode — 300ZX cluster

| Token | Value | Role |
|---|---|---|
| --bg | #090A07 | Warm near-black — page |
| --bg2 | #141210 | Slightly lighter — card / section |
| --ink | #1E1A15 | Graphite — secondary CTA fill, recessed surfaces |
| --bd | rgba(180,160,110,0.12) | Warm bone-tinted border |
| --fg | #E8DFC8 | Bone — body text, hero, **logo**, primary content |
| --fg2 | #CFC6B2 | Slightly dimmed bone — subheadings, paragraphs |
| --mut | #8A7D64 | Muted warm — labels, inactive nav |
| --acc | #14CC4A | **Phosphor green** — live-data only (see discipline below) |
| --amb | #D9A030 | Amber — CTAs, interactive accents, hero emphasis |

### Phosphor glow mixin (night only)
Applied only to live-state elements — status dots, data values, panel IDs on active modules, gauge fills:
```scss
@mixin phosphor-glow {
  color: var(--acc);
  text-shadow: 0 0 8px rgba(20, 204, 74, 0.45), 0 0 18px rgba(20, 204, 74, 0.15);
}
```
The double-layer at different radii is what makes it read as CRT phosphor bloom rather than a flat LED.

### Phosphor discipline (HARD RULE)
Phosphor green draws the eye on purpose — because it's rare. Keep it rare.

**Use phosphor on:** status dots, panel IDs on live modules (`PRJ/001`), live data values (uptime, RPM, temps), gauge fills, "online/active" readouts, FS-sim instrument numerics during a run.

**Never use phosphor on:** logo, top nav, CTAs (all three variants are amber), body text, hero, borders, hover states on links, generic decoration, section headers.

**Test before adding green:** *Is this element reporting live state, or drawing the eye to something happening right now?* If no — use `--fg`, `--amb`, or `--mut` instead.

### CTA system (both modes)
Three variants, consistent in shape across day and night. All squared (border-radius 0) — the instrument aesthetic uses sharp edges.

| Variant | Day | Night |
|---|---|---|
| Primary | Cognac fill `var(--acc)`, cream text | Amber outline 1px `var(--amb)`, amber text; hover fills amber with ink text |
| Secondary | Bordeaux outline `var(--acc2)`, bordeaux text | Graphite fill `var(--ink)`, amber text `var(--amb)`; hover lightens to `#28221B` |
| Ghost | Cognac text, arrow suffix, no border | Amber text, arrow suffix, no border |

---

## Typography

Two fonts per mode, width-matched via `@font-face { size-adjust: … }` so the tunnel transition swaps typefaces without layout shift.

**Day mode — one "posh and smart" sans across everything:**
- Hero, body, nav, labels, CTAs: **Instrument Sans** (400, 500, 600, 700)
- No monospace surfaces in day mode — Courier-style text was tested in v3 and rejected as breaking the aesthetic.

**Night mode — two-font system (same as day):**
- Hero title, headings, body, nav, CTAs: **Instrument Sans** — one heading face across both themes (Chakra Petch was dropped; no font swap on toggle)
- Instrument readouts, panel IDs, data values, gauges: **IBM Plex Mono** (400, 500, 600) — mono is reserved for telemetry, not prose

**Letter spacing:** Generous on labels and IDs — 0.18em to 0.26em. This is how instrument panels read. Body text stays at 0 to -0.005em.

**Never use:** Inter, Roboto, Arial, any system sans-serif, Courier in day mode, or phosphor green on any typography that isn't a live-state readout.

---

## Layout principles

**The cockpit metaphor.** The site is structured like sitting inside a car. The instrument bar at the top is the binnacle. The hero is the view through the windscreen. The project panels are the instruments on the dashboard — staggered like real gauges, not aligned in a grid.

**Stagger is intentional.** Project panels are offset vertically (panel 1 drops ~22px, panel 2 sits highest, panel 3 drops ~14px). This mirrors how instrument clusters place gauges at ergonomic positions based on importance, not alignment.

**Silver rules as structural dividers.** The 2px silver rule between hero and panels is the targa bar — a physical structural element, not a decorative line. The dots on it are rivet references. Do not make it thinner or remove the dots.

**Panel anatomy.** Every project panel has: a thin top border in the accent colour, a header row (panel ID + route or status), a content area, and a gauge or progress element at the bottom. Consistency here is important — it reinforces the instrument cluster metaphor.

---

## Interaction principles

**The tunnel transition.** Day → Night or Night → Day both use a pure black flash. Never white, never cream. The flash peaks at ~97% opacity for ~175ms, theme variables swap underneath, then it fades out. Total duration: 520ms. The timing is in src/styles/_animations.scss.

**Hover states.** Panels lift 2px on hover with the top border colour brightening to the accent. No shadows — the lift is the signal. This is consistent with how physical buttons feel when you near them.

**The (i) tech note panels.** These open as in-flow disclosure elements — they push content down rather than overlaying it. This keeps the cockpit feel (things appear on the dashboard, not floating above it).

**The boot sequence.** On first load, an ECU-style initialisation sequence plays before the site reveals. This covers hydration time and sets the tone. It is a feature, not a loading screen. See src/components/ui/BootSequence.astro.

---

## What to avoid

- AI gradient aesthetics — no purple-to-pink gradients, no mesh backgrounds
- Cold black (#000000) — always use warm near-black (#090A07 or similar)
- Pure white — always cream or warm off-white
- Neon green — the phosphor should feel like a CRT tube, not a gaming LED. #14CC4A, not #00FF00
- Overanimation — if more than three things are animating simultaneously, something should stop
- Rounded corners on panel headers — the instrument aesthetic uses sharp or very slightly rounded edges (2-3px max)
