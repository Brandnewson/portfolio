// FsSimCard — interactive viz for PRJ/003.
//
// Replaces the placeholder preview slot inside ProjectFeature.astro for the
// FS Quasi-Static Sim card. Renders a mass-sweep lap-time curve with a
// native range slider, a 2×2 readout grid, and an article entry line.
//
// Data is bundle-resolved at build time (imported JSON). No fetch, no
// loading state, no error handling — the 21-point sweep is tiny and
// always present.
//
// Component state: a single `mass` number (kg). All four readout values
// and the delta line derive from it by index lookup in the sorted points
// array. No rAF loop — updates are React state-driven on slider change only.

import { useState } from 'react';
import sweep from '../data/fs-mass-sweep.json';
import './FsSimCard.scss';

// ── Types ──
interface SweepPoint {
  mass_kg: number;
  lap_time_s: number;
  top_speed_kmh: number;
  max_abs_g_lat: number;
  max_abs_g_long: number;
}

// ── Data constants ──
const POINTS: SweepPoint[] = sweep.points as SweepPoint[];
const BASELINE_MASS = sweep.baseline_mass_kg; // 250 kg

// Pre-compute curve stats used in the SVG plot.
const LAP_TIMES = POINTS.map((p) => p.lap_time_s);
const MIN_LAP = Math.min(...LAP_TIMES);
const MAX_LAP = Math.max(...LAP_TIMES);
const MASSES = POINTS.map((p) => p.mass_kg);
const MIN_MASS = Math.min(...MASSES); // 200
const MAX_MASS = Math.max(...MASSES); // 300

// Baseline point (250 kg) used for delta computation.
const BASELINE_POINT = POINTS.find((p) => p.mass_kg === BASELINE_MASS)!;

// ── SVG plot geometry ──
const SVG_W = 400;
const SVG_H = 90;
const PAD_X = 0;
const PAD_Y = 10;

function massToX(mass: number): number {
  return PAD_X + ((mass - MIN_MASS) / (MAX_MASS - MIN_MASS)) * (SVG_W - PAD_X * 2);
}

// Invert Y: lower lap time = higher on the chart (faster is visually "up").
function lapToY(lap: number): number {
  return SVG_H - PAD_Y - ((lap - MIN_LAP) / (MAX_LAP - MIN_LAP)) * (SVG_H - PAD_Y * 2);
}

// Build the polyline points string once (never changes).
const POLYLINE_POINTS = POINTS.map((p) => `${massToX(p.mass_kg)},${lapToY(p.lap_time_s)}`).join(' ');

// X position of the 250 kg baseline gridline.
const BASELINE_X = massToX(BASELINE_MASS);

export default function FsSimCard() {
  const [mass, setMass] = useState<number>(BASELINE_MASS);

  // Derive active data point by exact mass match (slider step=5 guarantees it).
  const point = POINTS.find((p) => p.mass_kg === mass) ?? BASELINE_POINT;

  // Delta vs 250 kg baseline.
  const delta = point.lap_time_s - BASELINE_POINT.lap_time_s;
  const isBaseline = mass === BASELINE_MASS;
  const isFaster = delta < 0;

  // Dot position on the curve.
  const dotX = massToX(point.mass_kg);
  const dotY = lapToY(point.lap_time_s);

  return (
    <div className="fs-sim-card">

      {/* ── 1. Curve plot — grid of [y-axis label | plot, blank | x-axis label] ── */}
      <div className="fs-plot-frame">
        <span className="fs-axis-y mono">LAP TIME →</span>
        <div className="fs-plot-wrap">
          <svg
            className="fs-plot"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Faint dashed gridline at baseline mass (250 kg) */}
            <line
              className="fs-baseline-line"
              x1={BASELINE_X} y1={0}
              x2={BASELINE_X} y2={SVG_H}
            />

            {/* Lap-time polyline */}
            <polyline
              className="fs-curve"
              points={POLYLINE_POINTS}
            />
          </svg>
          {/* Position marker — rendered as an HTML circle absolutely positioned
              over the SVG, so it stays a real circle regardless of the SVG's
              non-uniform width stretch. Follows the MARL agent visual pattern:
              small filled phosphor disc, "you're not meant to touch this." */}
          <span
            className="fs-dot"
            aria-hidden="true"
            style={{
              left: `${(dotX / SVG_W) * 100}%`,
              top: `${(dotY / SVG_H) * 100}%`,
            }}
          />
        </div>
        <span className="fs-axis-x mono">MASS →</span>
      </div>

      {/* ── 2. Mass slider ── */}
      <div className="fs-slider-wrap">
        <label htmlFor="fs-mass-slider" className="fs-slider-label mono">
          MASS (KG)
        </label>
        {/* Snap markers — one tick per 5 kg step (21 total). The middle
            tick (250 kg, baseline) renders phosphor so the stock-car
            reference stays visible without an extra label. */}
        <div className="fs-snap-ticks" aria-hidden="true">
          {POINTS.map((p) => (
            <span
              key={p.mass_kg}
              className={`fs-snap-tick${p.mass_kg === BASELINE_MASS ? ' is-baseline' : ''}`}
            />
          ))}
        </div>
        <input
          id="fs-mass-slider"
          className="fs-slider"
          type="range"
          min={200}
          max={300}
          step={5}
          value={mass}
          onChange={(e) => setMass(Number(e.target.value))}
          aria-valuetext={`${mass} kg`}
        />
        <div className="fs-tick-row mono" aria-hidden="true">
          <span className="fs-tick">200</span>
          <span className="fs-tick fs-tick--baseline">250 · BASELINE</span>
          <span className="fs-tick">300</span>
        </div>
      </div>

      {/* ── 3. Readout grid (2×2) ── */}
      <div className="fs-readouts" role="region" aria-label="Simulation readouts">

        <div className="fs-tile fs-tile--phos">
          <span className="fs-tile-label mono">LAP TIME</span>
          <span className="fs-tile-unit mono">s</span>
          <span className="fs-tile-value mono" aria-live="polite">
            {point.lap_time_s.toFixed(3)}
          </span>
          <span className="fs-tile-delta mono" aria-live="polite">
            {isBaseline ? (
              <em className="fs-delta-baseline">baseline</em>
            ) : (
              <>
                {isFaster ? '−' : '+'}{Math.abs(delta).toFixed(2)} s vs 250 kg
              </>
            )}
          </span>
        </div>

        <div className="fs-tile">
          <span className="fs-tile-label mono">TOP SPEED</span>
          <span className="fs-tile-unit mono">km/h</span>
          <span className="fs-tile-value mono" aria-live="polite">
            {point.top_speed_kmh.toFixed(1)}
          </span>
        </div>

        <div className="fs-tile">
          <span className="fs-tile-label mono">MAX LONGITUDINAL G</span>
          <span className="fs-tile-unit mono">g</span>
          <span className="fs-tile-value mono" aria-live="polite">
            {point.max_abs_g_long.toFixed(3)}
          </span>
        </div>

        <div className="fs-tile">
          <span className="fs-tile-label mono">MAX LATERAL G</span>
          <span className="fs-tile-unit mono">g</span>
          <span className="fs-tile-value mono" aria-live="polite">
            {point.max_abs_g_lat.toFixed(4)}
          </span>
        </div>

      </div>

    </div>
  );
}
