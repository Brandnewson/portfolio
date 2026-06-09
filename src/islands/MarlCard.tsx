// MarlCard — interactive viz for PRJ/002.
//
// Replaces the placeholder preview slot inside ProjectFeature.astro for the
// MARL Racing Sim card. Renders the real Spa-Francorchamps centreline plus
// per-phase animated agents, a discrete phase slider, and a narrative panel.
//
// All agents share one lap duration (LAP_DURATION_S in spa-path.ts). Per-phase
// differentiation is by agent count, colour, and starting offset only — never
// speed. This matches the experimental setup: agents make discrete decisions
// at overtaking zones, not continuous racing.
//
// Performance: agent positions update via setAttribute inside a single
// requestAnimationFrame loop. React state is only used for the current phase.
// Re-renders happen on phase change; the loop is unaffected.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SPA_PATH_D, SPA_VIEWBOX, LAP_DURATION_S } from '../data/spa-path';
import './MarlCard.scss';

// ── Phase content (narratives drawn from the thesis, TAY26-FINAL) ──
type AgentRole = 'a1' | 'a2' | 'a3' | 'a4' | 'base' | 'llm';

interface AgentSpec {
  id: string;
  role: AgentRole;
  offset: number; // 0..1, starting position around the loop
}

interface Phase {
  n: number;
  label: string;
  body: ReactNode;
  agents: AgentSpec[];
}

const ROLE_LABEL: Record<AgentRole, string> = {
  a1: 'Agent 1',
  a2: 'Agent 2',
  a3: 'Agent 3',
  a4: 'Agent 4',
  base: 'Base agent',
  llm: 'LLM (zero-shot)',
};

const PHASES: Phase[] = [
  {
    n: 1,
    label: 'PHASE 01 · DOES IT LEARN?',
    body: (
      <>
        <strong>Purpose:</strong> Let's verify if the simulator works as an experimentation platform, and DQN (Deep-Q-Network) learns. One vanilla DQN against a base agent with simple heuristics.
        <br />
        <strong>Conclusion:</strong> All three seeds for our DQN agents beat the base agent more than 50% of the time. We got DQN to work!
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'base', role: 'base', offset: 0.5 },
    ],
  },
  {
    n: 2,
    label: 'PHASE 02 · CHOOSING THE SUBSTRATE',
    body: (
      <>
        <strong>Purpose:</strong> Find out which DQN variant works best. We compare Vanilla, Double, Dueling, and Rainbow-lite against a base agent.
        <br />
        <strong>Conclusion:</strong> Rainbow-lite wins at 0.835 win-rate and is the most stable under noise. It becomes the substrate for every later phase, with vanilla acting as the baseline.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'base', role: 'base', offset: 0.5 },
    ],
  },
  {
    n: 3,
    label: 'PHASE 03 · WHAT EMERGES UNDER COMPETITION',
    body: (
      <>
        <strong>Purpose:</strong> Investigate the emergent behaviors when we make 2 DQN agents compete and learn when against each other. Two agents, zero-sum, no shared reward. 
        <br />
        <strong>Conclusion:</strong> They specialise, one takes the hard corners, one plays safe. This is the Hawk-dove equilibrium from game theory at play, discovered without being told.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'a2', role: 'a2', offset: 0.5 },
    ],
  },
  {
    n: 4,
    label: 'PHASE 04 · SHARING REWARD IN A ZERO-SUM GAME',
    body: (
      <>
        <strong>Purpose:</strong> Find out how to measure the competition vs cooperation by blending the reward between two agents. We introduce a reward-blending parameter α. At 0, each agent gets only their own reward (full competition). At 1, each agent gets only the other's reward (full cooperation). What happens in between?
        <br />
        <strong>Conclusion:</strong> Above α=0.75, eight of nine trials collapse, every overtake now costs through the teammate term. Cooperation in a zero-sum game becomes mutual passivity.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'a2', role: 'a2', offset: 0.5 },
    ],
  },
  {
    n: 5,
    label: 'PHASE 05 · ADD A COMMON OPPONENT',
    body: (
      <>
        <strong>Purpose:</strong> What if we made this a general-sum game instead of a zero-sum game by adding a common opponent to the environment?
        <br />
        <strong>Conclusion:</strong> Add the Base agent as a third car to try and beat. At α=0.75 joint beat-base rises 83% over no-sharing, the same α that broke the zero-sum game is now the peak. A personal lesson from here is maybe we shouldn't treat life as zero sum huh.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'a2', role: 'a2', offset: 0.35 },
      { id: 'base', role: 'base', offset: 0.7 },
    ],
  },
  {
    n: 6,
    label: 'PHASE 06 · SCALING TO TWO TEAMS',
    body: (
      <>
        <strong>Purpose:</strong> If it works with one team, what about two teams? Does the performance keep improving, or does it collapse like in the zero-sum case? Organised as two teams of two plus the fixed adversary
        <br />
        <strong>Conclusion:</strong> The +83% win-rate at three agents flips to −31% at five. All 36 trials show negative within-team correlation, agents anti-coordinate with their own teammate.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'a2', role: 'a2', offset: 0.2 },
      { id: 'a3', role: 'a3', offset: 0.5 },
      { id: 'a4', role: 'a4', offset: 0.7 },
      { id: 'base', role: 'base', offset: 0.85 },
    ],
  },
  {
    n: 7,
    label: 'PHASE 07 · WHERE IS THE CLIFF?',
    body: (
      <>
        <strong>Purpose:</strong> Pinpoint the agent count at which cooperation breaks down, by testing three DQN agents and rerunning five agents under a wider alpha sweep.
        <br />
        <strong>Conclusion:</strong> The boundary sits at four agents. Three agents showed a small positive effect. Four was within noise. Five was negative, and no alpha value recovered it.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'a2', role: 'a2', offset: 0.33 },
      { id: 'a3', role: 'a3', offset: 0.66 },
      { id: 'base', role: 'base', offset: 0.85 },
    ],
  },
  {
    n: 8,
    label: 'PHASE 08 · CURRICULUM SCHEDULING',
    body: (
      <>
        <strong>Purpose:</strong> Test whether starting agents in pure competition and gradually introducing cooperative reward recovers performance at scale.
        <br />
        <strong>Conclusion:</strong> Train independently first (α=0), then ramp α over 300 episodes. Curriculum recovers ~70% of lost performance but never beats the competitive baseline. This separated two failure modes. Curriculum fixes training-order damage, while credit assignment at scale needs an architectural change.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'a2', role: 'a2', offset: 0.2 },
      { id: 'a3', role: 'a3', offset: 0.4 },
      { id: 'a4', role: 'a4', offset: 0.7 },
      { id: 'base', role: 'base', offset: 0.85 },
    ],
  },
  {
    n: 9,
    label: 'PHASE 09 · LLM VALIDITY CHECK',
    body: (
      <>
        <strong>Purpose:</strong> Investigate whether a zero-shot language model with a hand-authored prompt can match a trained DQN agent in this simulator.
        <br />
        <strong>Conclusion:</strong> It matched within a couple of percentage points across all noise levels. The simulator's strategy space is narrow enough that prompt-encoded reasoning solves it, which qualifies the scope of the MARL findings without invalidating them.
      </>
    ),
    agents: [
      { id: 'llm', role: 'llm', offset: 0.0 },
      { id: 'base', role: 'base', offset: 0.5 },
    ],
  },
  {
    n: 10,
    label: 'PHASE 10 · A DIFFERENT COOPERATIVE FORMULATION',
    body: (
      <>
        <strong>Purpose:</strong> Test whether a mean-field difference-reward formulation, which credits each agent for its own counterfactual contribution, recovers cooperation at the scaling boundary.
        <br />
        <strong>Conclusion:</strong> The approximation inverts the cooperative gradient, amplifying own-reward incentive and penalising teammate improvement. Empirical results matched the maths and confirmed the negative prediction.
      </>
    ),
    agents: [
      { id: 'a1', role: 'a1', offset: 0.0 },
      { id: 'a2', role: 'a2', offset: 0.33 },
      { id: 'a3', role: 'a3', offset: 0.66 },
      { id: 'base', role: 'base', offset: 0.85 },
    ],
  },
];

export default function MarlCard() {
  const [phase, setPhase] = useState(1);
  const [paused, setPaused] = useState(false);
  const pathRef = useRef<SVGPathElement | null>(null);
  const agentRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const phaseRef = useRef(phase);
  const pausedRef = useRef(paused);
  const pauseStartRef = useRef<number | null>(null);

  // Keep phaseRef in sync so the rAF loop sees the latest phase without
  // restarting on every change.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Sync paused flag to ref + shift startRef on resume so the lap continues
  // from where it was frozen instead of jumping forward by the pause duration.
  useEffect(() => {
    const wasPaused = pausedRef.current;
    pausedRef.current = paused;
    if (paused && !wasPaused) {
      pauseStartRef.current = performance.now();
    } else if (!paused && wasPaused && pauseStartRef.current != null) {
      startRef.current += performance.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
  }, [paused]);

  // Start the animation loop once the path element is mounted.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const pathLength = path.getTotalLength();
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = (now - startRef.current) / 1000;
      const lapT = (elapsed / LAP_DURATION_S) % 1;
      const current = PHASES[phaseRef.current - 1];

      for (const agent of current.agents) {
        const circle = agentRefs.current.get(agent.id);
        if (!circle) continue;
        const t = (lapT + agent.offset) % 1;
        const point = path.getPointAtLength(t * pathLength);
        circle.setAttribute('cx', String(point.x));
        circle.setAttribute('cy', String(point.y));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // No manual ref-map clearing needed: React's ref callbacks (below) add on
  // mount and delete on unmount, keeping agentRefs in sync as phase changes.

  const current = PHASES[phase - 1];

  // Legend: unique roles in this phase, in declaration order.
  const seen = new Set<AgentRole>();
  const legendRoles: AgentRole[] = [];
  for (const a of current.agents) {
    if (!seen.has(a.role)) {
      seen.add(a.role);
      legendRoles.push(a.role);
    }
  }

  return (
    <div className="marl-card">
      <div className="marl-viz">
        <svg
          className="marl-track"
          viewBox={`0 0 ${SPA_VIEWBOX.width} ${SPA_VIEWBOX.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <path ref={pathRef} className="marl-track-line" d={SPA_PATH_D} />
          <g>
            {current.agents.map((agent) => (
              <circle
                key={agent.id}
                ref={(el) => {
                  if (el) agentRefs.current.set(agent.id, el);
                  else agentRefs.current.delete(agent.id);
                }}
                r={4}
                className={`marl-agent role-${agent.role}`}
              />
            ))}
          </g>
        </svg>
        <div className="marl-controls">
          <button
            type="button"
            className={`marl-ctrl mono${paused ? ' is-paused' : ''}`}
            aria-pressed={paused}
            aria-label={paused ? 'Resume agent motion' : 'Pause agent motion'}
            onClick={() => setPaused((p) => !p)}
          >
            {paused ? 'PLAY' : 'PAUSE'}
          </button>
          <div className="marl-ctrl-row">
            <button
              type="button"
              className="marl-ctrl mono"
              aria-label="Previous phase"
              disabled={phase === 1}
              onClick={() => setPhase((p) => Math.max(1, p - 1))}
            >
              ‹ PREV
            </button>
            <button
              type="button"
              className="marl-ctrl mono"
              aria-label="Next phase"
              disabled={phase === PHASES.length}
              onClick={() => setPhase((p) => Math.min(PHASES.length, p + 1))}
            >
              NEXT ›
            </button>
          </div>
        </div>
      </div>

      <div className="marl-slider" role="group" aria-label="Research phase">
        <div className="marl-slider-rule" aria-hidden="true" />
        {PHASES.map((p) => (
          <button
            key={p.n}
            type="button"
            className={`marl-step${p.n === phase ? ' is-active' : ''}${p.n < phase ? ' is-passed' : ''}`}
            aria-label={`Phase ${p.n}`}
            aria-pressed={p.n === phase}
            onClick={() => setPhase(p.n)}
          >
            <span className="marl-step-num mono" aria-hidden="true">
              {String(p.n).padStart(2, '0')}
            </span>
          </button>
        ))}
      </div>
      <p className="marl-slider-hint mono" aria-hidden="true">Click dots to scrub phases</p>

      <div className="marl-narrative">
        <p className="marl-phase-label mono">{current.label}</p>
        <p className="marl-phase-body">{current.body}</p>
      </div>

      <div className="marl-legend">
        {legendRoles.map((role) => (
          <span key={role} className="marl-legend-key mono">
            <span className={`dot role-${role}`} />
            {ROLE_LABEL[role]}
          </span>
        ))}
      </div>
    </div>
  );
}
