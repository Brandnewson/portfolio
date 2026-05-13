# FS Quasi-Static Sim Card — Design Spec

**Date:** 2026-05-13
**Panel:** PRJ/002 — FS Quasi-Static Sim
**Status:** Approved, ready for implementation

## Purpose

Fill the FS Quasi-Static Sim panel slot on the landing page with an interactive
visualisation of a mass-sweep lap-time study. The panel is a **showcase**, not
a deep finding — its job is to signal breadth across web, vehicle dynamics, LP
optimisation, and sim engineering, and to drive curious engineers into an
in-depth technical writeup.

The headline signal we want a visitor to register:
> "This person plots real things, runs real sweeps, and knows what their model
> can't tell them."

Not: "the optimum mass is 210 kg."

## Data

Source: `C:\Code\LGR_FullTrackQSLapTimeSim\artifacts\mass_sweep.json` (4.4 KB).

Shape (excerpt):
```json
{
  "generated_at": "2026-05-13T10:43:27Z",
  "track": "FSUK.txt",
  "baseline_mass_kg": 250.0,
  "mass_kg": { "min": 200.0, "max": 300.0, "step": 5.0 },
  "points": [
    { "mass_kg": 200.0, "lap_time_s": 66.6706, "top_speed_kmh": 119.6998,
      "max_abs_g_lat": 1.3125, "max_abs_g_long": 1.5345 },
    ...21 points total
  ]
}
```

Notable properties:
- 21 points, mass 200 → 300 kg in 5 kg steps.
- `lap_time_s` is non-monotonic — minimum near 210 kg (66.626 s).
- `max_abs_g_lat` is **flat** at 1.3125 across the whole sweep (tyre-limited;
  the canonical quasi-static-sim limitation). The flat value is *not* a bug —
  it is the teaching moment that links to the writeup.

The JSON is copied into the repo at `src/data/fs-mass-sweep.json` and imported
directly into the island. No fetch, no loading state, no error handling — the
data is bundled at build time.

## Architecture

A new client island at `src/islands/FsSimCard.tsx`, mounted into the PRJ/002
panel via the existing `<ProjectPanel>` slot mechanism, identical to how
`MarlCard` is wired into PRJ/001. Hydration: `client:load`.

Colocated styles in `src/islands/FsSimCard.scss`, importing semantic tokens
from `_tokens.scss` — no inline styles, no Tailwind, theme-aware automatically.

Component state: a single `mass` number (kg). Everything else derives from it:
the active data point is found by index in the sorted `points` array; the
delta-vs-baseline is `point.lap_time_s − point_at_250.lap_time_s`.

## Visual layout

Vertical stack inside the panel slot, top to bottom:

### 1. Curve plot

- SVG, ~90 px tall, spans panel width.
- Line traces `lap_time_s` across all 21 points (x = mass, y = lap_time).
- Y-axis values omitted (the shape is the point; precise numbers live in the
  readouts). Min and max lap-time labelled in mono at the bottom corners so
  the curve isn't pure abstraction.
- Faint dashed gridline at the baseline mass (250 kg).
- A phosphor-glow dot rides the curve at the current slider position. The dot
  is the **only** live/phosphor element in the chart, consistent with the
  phosphor-green discipline (live indicator only).

### 2. Mass slider

- Native `<input type="range">` (chosen over a custom scrubber: mass is
  continuous, native is accessible by default, keyboard-controllable, and
  themable via SCSS pseudo-elements).
- `min={200}` `max={300}` `step={5}`. The step makes the slider snap exactly
  to the 21 data points.
- Three tick labels in mono under the track: `200`, `250 · baseline`, `300`.
  The baseline tick gets a small phosphor mark so the centre of the range
  reads as "stock car."
- Styled track and thumb match the panel vocabulary: 1 px border, mono labels,
  phosphor thumb glow.

### 3. Readout grid (2×2)

Four mono tiles, two columns × two rows:

| Tile          | Value source            | Treatment                                  |
| ------------- | ----------------------- | ------------------------------------------ |
| LAP TIME (s)  | `lap_time_s`            | Phosphor value, small delta line below     |
| TOP SPEED (km/h) | `top_speed_kmh`      | Neutral `--fg`                             |
| MAX G LONG    | `max_abs_g_long`        | Neutral `--fg`                             |
| MAX G LAT     | `max_abs_g_lat`         | Neutral `--fg`                             |

The LAP TIME tile shows a small mono delta line under the primary value:
- `−0.44 s vs 250 kg` when faster than baseline
- `+0.12 s vs 250 kg` when slower
- `baseline` (italic, mono, dimmed) when at exactly 250 kg

Only LAP TIME is phosphor. The others are neutral — eye-routing comes from
contrast, not colour spam. Phosphor on the lap-time tile + the curve dot pulls
the gaze through the two live elements that move with the slider.

### 4. Article entry line

A small italic caption directly below the readouts:

> *Lateral g pinned at 1.3125 — limit of quasi-static modelling.* [Read writeup →](/writing/quasi-static-sim)

The "Read writeup →" link is the entry point to the technical article. Until
the article exists at `/writing/quasi-static-sim`, the link 404s; this is
acceptable for now and tracked as a follow-up.

## Visual hierarchy summary

Three live/phosphor signals at any one time:
1. The phosphor dot on the curve (shows position)
2. The LAP TIME tile value (shows primary outcome)
3. The baseline tick on the slider (static — anchors the range)

Everything else is neutral mono. The italic article line is the only
non-mono, non-uppercase element in the whole panel — it deliberately reads as
"prose" against the technical surroundings to flag *this is the click for
context.*

## Interactions

- Drag slider → `mass` updates → curve dot moves, all four readouts update,
  delta line recomputes against the 250 kg baseline.
- Keyboard left/right on the focused slider → ±5 kg (native range step).
- Theme switch (day/night) → SCSS tokens swap, no JS involvement.

No animation loop (unlike MARL). Updates are React state-driven and only fire
on slider change.

## Non-concerns

- **Loading / error states:** none. Data is bundle-resolved at build time.
- **Out-of-range values:** impossible — slider min/max/step constrain input.
- **Tests:** by-eye in the browser, same as MARL. No formal test suite yet
  exists in this repo.
- **Performance:** 21 points, no rAF loop, no measurable cost.

## Files touched

| File                                         | Action  |
| -------------------------------------------- | ------- |
| `src/data/fs-mass-sweep.json`                | new     |
| `src/islands/FsSimCard.tsx`                  | new     |
| `src/islands/FsSimCard.scss`                 | new     |
| `src/content/tech-notes/fs-sim-card.md`      | new (per CLAUDE.md: every new interactive element needs a TechNote entry) |
| `src/pages/index.astro`                      | wire `<FsSimCard client:load />` into PRJ/002 slot |

## Follow-ups (out of scope here)

- Write the article at `src/pages/writing/quasi-static-sim.astro` (or
  equivalent). Until then `/writing/quasi-static-sim` will 404.
- If more sweeps are ever added (tyre, drag, downforce) the slider would need
  to become tabbed — but per design conversation, mass-only is the locked
  scope.
