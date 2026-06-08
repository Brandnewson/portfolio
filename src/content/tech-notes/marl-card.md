---
id: marl-card
title: MARL Racing Sim card
panel: PRJ/001
component: src/islands/MarlCard.tsx
mechanism: phase-scrub
substrate: discrete-overtaking-zones
---

The MARL card lets a visitor scrub through the ten experimental phases of the
"When Teamwork Helps and When It Hurts" thesis. Each phase swaps the agent
roster on a single SVG track and updates a narrative paragraph drawn straight
from the report.

## What the visitor sees

A real Spa-Francorchamps centreline (baked SVG path from the F1 sim's
`SpaCentreLine.csv`, y-flipped and decimated to ~250 vertices). Coloured dots
ride the path — one colour per agent role, identical across day and night:

- **Phosphor green** — Agent 1 (the headline RL agent)
- **Amber** — Agent 2
- **Cyan** — Agent 3
- **Red** — Agent 4
- **White with dark ring** — the Base agent (fixed stochastic comparator)
- **Violet** — the zero-shot LLM (Phase 09 only)

A discrete 10-step slider snaps between phases. The active phase glows in
phosphor green; passed phases shift to amber.

## What the visualisation does NOT claim

The dots are scenic, not simulated. The real model decides actions at nine
discrete overtaking zones per lap — not continuously around the loop. The
card's job is to introduce the research at a glance and give a hook for the
narrative; the actual experimental output lives in `/f1-sim` and the thesis.

## Performance

All agents share one `LAP_DURATION_S` (12 s). The animation loop is a single
`requestAnimationFrame` callback that calls `path.getPointAtLength` once per
agent per frame and writes `cx`/`cy` via `setAttribute`. React state only
tracks the active phase — agent positions never trigger reconciliation.

## Why the colours are theme-independent

Cars in motorsport timing screens have stable colours regardless of the broadcast
graphic. Forcing the agent palette to swap with theme would break role
identification — a reader scrubbing phase 03 → 04 → 05 needs to know "Agent 1 is
still the green one" without re-reading the legend.

## Future hooks

- Discrete-zone markers along the path (data lives in the sim repo's zone
  config) plus attempt-success flashes when an agent crosses a marker.
- A "play sequence" mode that auto-walks phases 1 → 10 at a slow cadence.
- Replace the still narrative panel with a transcript view that highlights
  the sentence currently relevant to the scrubbed phase.
