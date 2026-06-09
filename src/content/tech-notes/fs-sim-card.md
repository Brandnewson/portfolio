---
id: fs-sim-card
title: FS Quasi-Static Sim card
panel: PRJ/003
component: src/islands/FsSimCard.tsx
mechanism: mass-slider
substrate: quasi-static-lap-time-sweep
---

The FS Sim card lets a visitor drag a mass slider across a 21-point sweep
(200–300 kg, 5 kg steps) and watch lap time, top speed, and G-force readouts
update in real time. The curve plot holds a phosphor dot that rides the polyline
as the slider moves.

## What the visitor sees

A small SVG curve plotting `lap_time_s` across all 21 mass points, with
min/max lap-time labelled in mono at the bottom corners. A phosphor-glow dot
tracks the slider position. A faint dashed vertical marks 250 kg (baseline).

Below the curve: a native `<input type="range">` (min 200, max 300, step 5)
with three tick labels: `200`, `250 · baseline` (with a phosphor pip), `300`.

A 2×2 readout grid shows four values derived from the active data point:

- **LAP TIME (s)** — phosphor value + delta line vs 250 kg baseline
- **TOP SPEED (km/h)** — neutral `--fg`
- **MAX G LONG** — neutral `--fg`
- **MAX G LAT** — neutral `--fg`, always 1.3125 (the teaching moment)

An italic caption links to the full writeup at `/writing/quasi-static-sim`
(404s until the article is written — expected).

## Phosphor discipline

Three phosphor elements, no more:
1. The curve dot — live position indicator
2. The LAP TIME tile value — primary outcome signal
3. The baseline tick pip on the slider — static anchor for the stock-car reference

All other readouts are neutral mono, consistent with the memory rule: phosphor
green is for live/attention elements only.

## Data

`src/data/fs-mass-sweep.json` — 21 points, imported directly into the island
at build time. No fetch, no loading state. Notable: `max_abs_g_lat` is flat at
1.3125 across the entire sweep — tyre-limited, not a bug. This is the canonical
quasi-static-sim limitation that the article writeup explains.

## Performance

No rAF loop. Updates are React state-driven on slider `onChange` only. 21
array lookups per interaction — negligible cost.

## Why native `<input type="range">`

Mass is continuous within a fixed range. The native slider is keyboard-
accessible by default (arrow keys step by 5 kg), ARIA-labelled, and fully
themable via `::-webkit-slider-thumb` / `::-moz-range-thumb` without a custom
scrubber implementation. The step=5 snapping guarantees exact index lookup in
the data array.

## Future hooks

- If more sweeps are added (tyre compound, drag, downforce level) the slider
  would need to become tabbed — but mass-only is the locked scope for this card.
- The article at `/writing/quasi-static-sim` needs to be written before the
  "Read writeup →" link resolves.
