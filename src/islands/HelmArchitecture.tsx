// HelmArchitecture — interactive system-topology diagram for PRJ/003 (Helm).
//
// Replaces the placeholder preview slot in the Helm project band with a
// UML-flavoured component/deployment diagram of the *real* Helm architecture
// (verified against the repo's README + docs/pipeline-architecture.md). The
// goal is to signal system-design competence to a technical reader: trust
// boundaries, a deployment boundary (k3s), async decoupling (SQS), a clear
// state layer, and isolated external dependencies.
//
// Interaction model:
//   - Every component is a node; edges are labelled with what actually flows.
//   - Hovering (or focusing) a node lights it + its connected edges + its
//     neighbours and dims everything else. Connected edges animate a phosphor
//     "data-flow" dash in the direction of travel.
//   - A detail panel below the diagram TEACHES the hovered node: what it is,
//     and *why* it sits where it does. Hovering the WORKER reveals the
//     6-stage agentic harness — the self-improving loop that is the project's
//     differentiator.
//
// Geometry is data-driven (NODES + EDGES) so coordinates are easy to tune.
// Edges carry explicit orthogonal point lists routed clear of the deployment
// boundaries; labels render over a small background mask so connector lines
// never strike through the text. Copy avoids colons and semicolons by request.

import { Fragment, useState, type ReactNode } from 'react';
import './HelmArchitecture.scss';

type Group = 'edge' | 'app' | 'store' | 'aws' | 'external';

interface NodeDetail {
  role: string;
  tech: string;
  desc: string;
  // Worker only: the 6-stage pipeline shown as a compact inline sequence.
  stages?: string[];
  note?: string;
}

interface Node {
  id: string;
  label: string;
  sub: string;
  group: Group;
  x: number;
  y: number;
  w: number;
  h: number;
  // web is the only public trust boundary — gets a distinct emphasis sublabel.
  trust?: boolean;
  detail: NodeDetail;
}

interface Edge {
  from: string;
  to: string;
  label: string;
  pts: [number, number][];
  labelAt: [number, number];
  dashed?: boolean;
}

const VW = 680;
const VH = 600;

const NODES: Node[] = [
  {
    id: 'browser', label: 'Browser', sub: 'client', group: 'edge',
    x: 95, y: 16, w: 130, h: 36,
    detail: {
      role: 'Client', tech: 'Browser',
      desc: 'The visitor\'s browser is the only thing that ever talks to Helm directly. It carries an authenticated session, uploads an existing CV, and pastes in a target job description, then waits for the finished one-page DOCX to come back.',
    },
  },
  {
    id: 'cloudflare', label: 'Cloudflare', sub: 'DNS · CDN · WAF', group: 'edge',
    x: 95, y: 82, w: 130, h: 40,
    detail: {
      role: 'Edge', tech: 'Cloudflare',
      desc: 'Cloudflare sits in front as DNS, CDN, and a web application firewall. It terminates TLS at the edge for the visitor and opens a second encrypted hop to the origin with a Cloudflare-issued certificate, so traffic stays encrypted the whole way and the origin server is never exposed to the open internet.',
    },
  },
  {
    id: 'web', label: 'web:3000', sub: 'Next.js · trust boundary', group: 'app', trust: true,
    x: 83, y: 188, w: 154, h: 50,
    detail: {
      role: 'Frontend + BFF · public trust boundary', tech: 'Next.js (×2 replicas)',
      desc: 'Next.js is the only service the public can reach, which makes it the single trust boundary where every request is vetted. It checks the sign-in session, applies a per-user rate limit, debits one credit atomically so a failed run can be refunded, parses the uploaded CV into a structured profile, and only then calls the worker over the private network with a shared secret. Nothing downstream ever trusts the user directly.',
    },
  },
  {
    id: 'api', label: 'api:8000', sub: 'FastAPI', group: 'app',
    x: 42, y: 266, w: 126, h: 46,
    detail: {
      role: 'Service · internal only', tech: 'FastAPI',
      desc: 'FastAPI owns the durable record of work. It creates and tracks CV sessions and subscriptions and places generation jobs on the queue. It has no public route of its own, so it is reachable only from web with the internal key, which keeps the billing and session logic off the open internet.',
    },
  },
  {
    id: 'worker', label: 'worker:9000', sub: 'Python · pipeline', group: 'app',
    x: 250, y: 266, w: 158, h: 46,
    detail: {
      role: 'Pipeline + agentic harness', tech: 'Python · Claude API',
      desc: 'The worker is where generation actually happens. It runs a six-stage pipeline that turns a profile plus a job description into scored, deduplicated bullets, then renders a font-measured one-page DOCX.',
      stages: [
        'JD analysis',
        'collect',
        'cross-poll',
        'dedup + score',
        'merged dedup',
        'render',
      ],
      note: 'It is self-improving because every bullet is scored deterministically and cached against a (user, source, content-hash) key. Over time the cache answers more of each request directly, so the model is called less for the same output, while unit and end-to-end evals gate each change so quality never silently regresses.',
    },
  },
  {
    id: 'postgres', label: 'Postgres', sub: 'shared state', group: 'store',
    x: 42, y: 356, w: 126, h: 46,
    detail: {
      role: 'Database', tech: 'Postgres',
      desc: 'One Postgres instance is the shared source of truth for users, CV sessions, the cached bullets, and subscription state. A sidecar takes an hourly dump so the single node can be restored if the box is ever lost.',
    },
  },
  {
    id: 'sqs', label: 'SQS', sub: 'async jobs', group: 'aws',
    x: 262, y: 462, w: 148, h: 40,
    detail: {
      role: 'Message queue', tech: 'AWS SQS (LocalStack in dev)',
      desc: 'The queue decouples accepting a job from doing the work. A caller can hand off a session id and return immediately, while the worker pulls jobs at its own pace, claims one, and writes the result back. If the worker is busy or restarts, jobs wait in line instead of being dropped.',
    },
  },
  {
    id: 's3', label: 'S3', sub: 'artifacts', group: 'aws',
    x: 262, y: 512, w: 148, h: 42,
    detail: {
      role: 'Object storage', tech: 'AWS S3 (LocalStack in dev)',
      desc: 'The finished DOCX is written to object storage under its session id rather than kept on the box, so any replica can serve the download later and artifacts survive a redeploy.',
    },
  },
  {
    id: 'google', label: 'Google', sub: 'OAuth 2.0', group: 'external',
    x: 506, y: 190, w: 160, h: 44,
    detail: {
      role: 'External · identity', tech: 'Google OAuth 2.0',
      desc: 'Google handles sign-in over OAuth 2.0, brokered by NextAuth inside web. Helm never stores a password, it only trusts a verified identity token, which removes a whole class of credential-handling risk.',
    },
  },
  {
    id: 'claude', label: 'Claude API', sub: 'Sonnet · Haiku', group: 'external',
    x: 506, y: 266, w: 160, h: 48,
    detail: {
      role: 'External · LLM', tech: 'Anthropic Claude',
      desc: 'Anthropic\'s Claude does the language work. A Sonnet call analyses the job description and runs the final semantic dedup, while cheaper Haiku calls draft, rephrase, and cross-pollinate bullets. Splitting the work by model keeps a full run close to three and a half cents.',
    },
  },
  {
    id: 'lemon', label: 'Lemon Squeezy', sub: 'billing', group: 'external',
    x: 506, y: 360, w: 160, h: 46,
    detail: {
      role: 'External · billing', tech: 'Lemon Squeezy',
      desc: 'Lemon Squeezy runs hosted checkout and acts as the merchant of record, so Helm never touches card data. Signed webhooks tell it when a payment or refund happens, and that is what grants or removes the credits web checks before every run.',
    },
  },
];

const EDGES: Edge[] = [
  { from: 'browser', to: 'cloudflare', label: 'HTTPS', pts: [[160, 52], [160, 82]], labelAt: [160, 67] },
  { from: 'cloudflare', to: 'web', label: 'Traefik ingress', pts: [[160, 122], [160, 188]], labelAt: [160, 140] },
  { from: 'web', to: 'api', label: 'session API', pts: [[160, 238], [160, 252], [105, 252], [105, 266]], labelAt: [134, 248] },
  { from: 'web', to: 'worker', label: 'POST /pipeline/run', pts: [[160, 238], [160, 252], [329, 252], [329, 266]], labelAt: [248, 248] },
  { from: 'web', to: 'google', label: 'OAuth 2.0', pts: [[237, 212], [506, 212]], labelAt: [362, 204] },
  { from: 'web', to: 'lemon', label: 'checkout · webhooks', pts: [[237, 226], [460, 226], [460, 383], [506, 383]], labelAt: [460, 333] },
  { from: 'api', to: 'sqs', label: 'publish job', pts: [[168, 289], [212, 289], [212, 482], [262, 482]], labelAt: [212, 400] },
  { from: 'api', to: 'postgres', label: 'users · sessions', pts: [[105, 312], [105, 356]], labelAt: [105, 334] },
  { from: 'worker', to: 'postgres', label: 'bullet cache', pts: [[329, 312], [329, 340], [180, 340], [180, 379], [168, 379]], labelAt: [250, 340] },
  { from: 'worker', to: 'sqs', label: 'consume', pts: [[352, 312], [352, 462]], labelAt: [352, 430], dashed: true },
  { from: 'worker', to: 'claude', label: 'Sonnet · Haiku', pts: [[408, 290], [506, 290]], labelAt: [456, 282] },
  { from: 'worker', to: 's3', label: 'PUT cv.docx', pts: [[396, 312], [440, 312], [440, 533], [410, 533]], labelAt: [440, 472] },
];

// Deployment / boundary frames drawn behind the nodes. Separated by a clear
// gap (k3s bottom 418 → AWS top 448) so the two dashed lines never crowd, and
// every connector crosses each line perpendicularly rather than running along.
const BOUNDARIES = [
  { id: 'k3s', label: 'k3s · EC2 (t3.small)', x: 22, y: 150, w: 396, h: 268 },
  { id: 'aws', label: 'AWS', x: 250, y: 448, w: 172, h: 120 },
];

const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

function pathFromPoints(pts: [number, number][]): string {
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
}

export default function HelmArchitecture(): ReactNode {
  const [active, setActive] = useState<string | null>(null);

  // Edges touching the active node, and the neighbour set those edges reach.
  const activeEdges = new Set<number>();
  const neighbours = new Set<string>();
  if (active) {
    EDGES.forEach((e, i) => {
      if (e.from === active || e.to === active) {
        activeEdges.add(i);
        neighbours.add(e.from);
        neighbours.add(e.to);
      }
    });
  }

  const isLit = (id: string) => !active || id === active || neighbours.has(id);
  const node = active ? NODE_BY_ID[active] : null;
  // On desktop the detail floats over the diagram. Flip it to the opposite
  // side of the hovered node so the panel never covers what you're pointing at:
  // right-half nodes (the external rail) push the panel to the left.
  const panelFlip = !!node && node.x + node.w / 2 > VW / 2;

  return (
    <div className="helm-arch">
      <div className="helm-arch-head">
        <span className="helm-arch-title mono">HELM · SYSTEM TOPOLOGY</span>
        <span className="helm-arch-hint mono">{active ? 'select another node' : 'hover or tap a node'}</span>
      </div>

      <div className="helm-arch-scroll">
      <svg
        className="helm-arch-svg"
        viewBox={`0 0 ${VW} ${VH}`}
        role="group"
        aria-label="Helm system architecture diagram"
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <marker
            id="helm-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill="context-stroke" />
          </marker>
        </defs>

        {/* Deployment boundaries (behind everything) */}
        {BOUNDARIES.map((b) => (
          <g key={b.id} className="helm-boundary">
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" />
            <text className="helm-boundary-label mono" x={b.x + 8} y={b.y + 14}>{b.label}</text>
          </g>
        ))}
        <text className="helm-rail-label mono" x={586} y={164} textAnchor="middle">EXTERNAL SaaS</text>

        {/* Edges */}
        <g className="helm-edges">
          {EDGES.map((e, i) => (
            <path
              key={`${e.from}-${e.to}`}
              className={[
                'helm-edge',
                e.dashed && 'is-dashed',
                activeEdges.has(i) && 'is-active',
                active && !activeEdges.has(i) && 'is-dim',
              ].filter(Boolean).join(' ')}
              d={pathFromPoints(e.pts)}
              markerEnd="url(#helm-arrow)"
            />
          ))}
        </g>

        {/* Edge labels (over a mask so lines never strike through text) */}
        <g className="helm-edge-labels">
          {EDGES.map((e, i) => {
            const w = e.label.length * 5.3 + 8;
            const [lx, ly] = e.labelAt;
            return (
              <g
                key={`lbl-${e.from}-${e.to}`}
                className={[
                  'helm-edge-label',
                  activeEdges.has(i) && 'is-active',
                  active && !activeEdges.has(i) && 'is-dim',
                ].filter(Boolean).join(' ')}
              >
                <rect className="helm-edge-label-bg" x={lx - w / 2} y={ly - 7} width={w} height={14} rx="2" />
                <text className="helm-edge-label-text mono" x={lx} y={ly + 3} textAnchor="middle">{e.label}</text>
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g className="helm-nodes">
          {NODES.map((n) => (
            <g
              key={n.id}
              className={[
                'helm-node',
                `is-${n.group}`,
                n.trust && 'is-trust',
                active === n.id && 'is-active',
                active && !isLit(n.id) && 'is-dim',
                active && isLit(n.id) && active !== n.id && 'is-neighbour',
              ].filter(Boolean).join(' ')}
              tabIndex={0}
              role="button"
              aria-label={`${n.label} — ${n.detail.role}`}
              onMouseEnter={() => setActive(n.id)}
              onClick={() => setActive(n.id)}
              onFocus={() => setActive(n.id)}
              onBlur={() => setActive(null)}
            >
              <rect className="helm-node-box" x={n.x} y={n.y} width={n.w} height={n.h} rx="2" />
              <circle className="helm-node-dot" cx={n.x + 9} cy={n.y + 9} r="2.5" />
              <text className="helm-node-label mono" x={n.x + n.w / 2} y={n.y + n.h / 2 - 2} textAnchor="middle">{n.label}</text>
              <text
                className={['helm-node-sub mono', n.trust && 'is-trust'].filter(Boolean).join(' ')}
                x={n.x + n.w / 2}
                y={n.y + n.h / 2 + 11}
                textAnchor="middle"
              >
                {n.sub}
              </text>
            </g>
          ))}
        </g>
      </svg>
      </div>
      <span className="helm-arch-swipe mono" aria-hidden="true">swipe to explore the diagram →</span>

      {/* Detail panel — floats top-right/left over the diagram on desktop,
          stacks below on mobile. */}
      <div
        className={['helm-arch-detail', node ? 'is-detail' : 'is-legend', panelFlip && 'is-flip'].filter(Boolean).join(' ')}
        aria-live="polite"
      >
        {node ? (
          <div className="helm-detail">
            <div className="helm-detail-head">
              <span className="helm-detail-name mono">{node.label}</span>
              <span className="helm-detail-role mono">{node.detail.role}</span>
            </div>
            <p className="helm-detail-tech mono">{node.detail.tech}</p>
            <p className="helm-detail-desc">{node.detail.desc}</p>
            {node.detail.stages && (
              <p className="helm-stages mono" role="list" aria-label="6-stage pipeline">
                {node.detail.stages.map((s, i) => (
                  <Fragment key={s}>
                    {i > 0 && <span className="helm-stage-sep" aria-hidden="true"> › </span>}
                    <span className="helm-stage" role="listitem">
                      <span className="helm-stage-n">{i + 1}</span>{s}
                    </span>
                  </Fragment>
                ))}
              </p>
            )}
            {node.detail.note && <p className="helm-detail-note">{node.detail.note}</p>}
          </div>
        ) : (
          <div className="helm-legend">
            <div className="helm-legend-row">
              <span className="helm-legend-key mono"><span className="helm-swatch is-k3s" />k3s cluster · EC2</span>
              <span className="helm-legend-key mono"><span className="helm-swatch is-aws" />AWS managed</span>
              <span className="helm-legend-key mono"><span className="helm-swatch is-ext" />external SaaS</span>
            </div>
            <p className="helm-legend-note">Helm exposes one public surface (<span className="mono">web</span>) and keeps every other service private behind a shared key. Hover any component to see what it does, and why it sits where it does.</p>
          </div>
        )}
      </div>
    </div>
  );
}
