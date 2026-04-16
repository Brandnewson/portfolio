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

**Typography as material.** Courier New monospace in night mode feels like instrument labels. Georgia serif in day mode feels like a 1980s road test magazine. The font itself carries meaning — treat it as a design material, not just a vehicle for words.

---

## Colour tokens

All values live in src/styles/_tokens.scss. This is the authoritative list.

### Day mode

| Token | Value | Source reference |
|---|---|---|
| --bg | #F0E8D0 | Cream headlining, 911 interior |
| --bg2 | #E4D8BC | Slightly richer cream, door card |
| --pb | #EAE0C8 | Panel surface |
| --bd | rgba(90,70,40,0.15) | Subtle warm border |
| --sil | #B8B2A6 | Targa bar — brushed aluminium |
| --sil2 | #D0CAC0 | Lighter silver highlight |
| --acc | #8B5A30 | Cognac leather — the dominant accent |
| --acc2 | #4A2E18 | Deep tobacco — E38 body colour |
| --txt | #1A120A | Near-black, warm undertone |
| --txt2 | #6A5040 | Mid warm-brown, secondary text |

### Night mode

| Token | Value | Source reference |
|---|---|---|
| --bg | #090A07 | 300ZX cabin at night |
| --bg2 | #0D0F0A | Slightly lighter surface |
| --pb | #111410 | Panel background, green-ambient tinted |
| --bd | rgba(20,180,58,0.14) | Green-tinted border |
| --sil | #182015 | Silver becomes dark green-grey at night |
| --sil2 | #0F160C | Deeper structural tone |
| --acc | #14CC4A | Phosphor green — warm CRT, not neon lime |
| --acc2 | #0A8830 | Dim phosphor for secondary elements |
| --txt | #8EC888 | Desaturated green body text |
| --txt2 | #2E5828 | Very dim green, hint text |

### Phosphor glow (night mode only)
Applied to `.dv` (data values) and `.pid` (panel IDs) in night mode:
```scss
text-shadow: 0 0 8px rgba(20, 204, 74, 0.45), 0 0 18px rgba(20, 204, 74, 0.15);
```
This simulates the bloom of real CRT phosphor. The double-layer at different radii is what makes it look like a tube rather than an LED.

---

## Typography

**Day mode hero name:** Georgia, Times New Roman, serif — 50px, weight 700. Editorial, road test magazine.
**Night mode hero name:** Courier New, Courier, monospace — same size. Switches during the tunnel flash so the change is invisible.
**All other text (both modes):** Courier New, Courier, monospace. Instrument labels, data readouts, navigation.
**Letter spacing:** Generous on labels and IDs — 0.18em to 0.24em. This is how instrument panels read.
**Never use:** Inter, Roboto, Arial, or any system sans-serif. They break the aesthetic immediately.

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
