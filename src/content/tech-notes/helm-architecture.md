---
id: helm-architecture
title: Helm System Topology diagram
panel: PRJ/003
component: src/islands/HelmArchitecture.tsx
mechanism: node-hover
substrate: deployment-topology
---

The Helm band's preview is an interactive UML-flavoured component/deployment
diagram of the real Helm system, drawn from the repo's `README.md` and
`docs/pipeline-architecture.md`. Its job is to let a technical reader confirm,
at a glance, that the product is *correctly architected* — trust boundaries,
a deployment boundary, async decoupling, and isolated external dependencies.

## What the visitor sees

A layered top-to-bottom topology following the real request path:

- **Browser → Cloudflare** (DNS · CDN · WAF, Full-strict TLS) → **Traefik
  ingress**, crossing into the dashed **k3s · EC2** deployment boundary.
- **web:3000** (Next.js) — the only public surface, marked as the trust
  boundary in the emphasis colour. It verifies the session, rate-limits,
  debits a credit, parses the CV, then proxies generation.
- **api:8000** (FastAPI) and **worker:9000** (Python) sit behind web on an
  internal HMAC key. **Postgres** is the shared state; **SQS** and **S3** live
  in a separate dashed **AWS** boundary.
- An **EXTERNAL SaaS** rail on the right — Google OAuth, Claude API, Lemon
  Squeezy — kept visually outside the cluster.

Every edge is labelled with what actually flows (`POST /pipeline/run`,
`publish job`, `Sonnet · Haiku`, `PUT cv.docx`, …).

## The interaction

Hovering or focusing a node lights it, its connected edges, and its immediate
neighbours, and dims everything else. Lit edges animate a phosphor dash in the
direction of data flow — the only animated, phosphor element, and it appears
only on hover (attention state), so the live-element discipline holds.

A detail panel below the diagram shows the hovered node's role, runtime, and
responsibility. Hovering **worker:9000** additionally reveals the 6-stage
agentic harness (JD analysis → collection → cross-pollination → dedup+score →
merged dedup → render) plus the self-improving note: deterministic scoring and
a bullet cache keyed by `(user, source, content-hash)` that grows and displaces
LLM calls, gated by unit + e2e evals. This is where the project's differentiator
gets its spotlight without cluttering the topology.

## Expanding the diagram

At rest the diagram is compact — it shares the band with the Helm copy at the
same width as the FS Sim widget, which keeps the layout tidy but leaves the
topology small. An **Expand ⤢** control in the diagram header lifts it into a
full-screen overlay (rendered through `createPortal` to `document.body`, so it
escapes the band's box) where it renders far larger and a **− zoom +** control
(100 %–250 %) enlarges it further, panning inside a scrollable stage. The same
hover/detail behaviour works in the overlay, with the detail panel below the
canvas. The backdrop, an **✕ Close** button, and the **Escape** key all dismiss
it, and page scroll is locked while it is open. Zoom lives only in the overlay
(there is room there); the inline view stays a clean, fixed-size preview.

## Why phosphor stays disciplined

Nodes and connectors use neutral surface/border tokens. The hovered node's
status dot, its focus ring, and the active dash-flow all reference `--phos` /
`--phos-filter`, which resolve to muted (no glow) in day and phosphor-green in
night. So phosphor only ever marks the live/attention element, and the SCSS
needs no `[data-theme]` branching.

## What the diagram does NOT claim

It is a logical topology, not a live status board — nothing polls the running
cluster. Replica counts and the async-vs-sync nuance (the SQS path exists for
scale but the primary generation call is a synchronous web→worker proxy) live
in the hover detail rather than on the canvas, to keep the default view legible.

## Future hooks

- A second toggled "pipeline" view that expands the worker into the full
  6-stage flow with per-stage LLM/deterministic tags.
- Edge tooltips carrying the actual payload shape (ProfileDraft, session_id).
- A subtle always-on pulse along the primary request path if the resting
  diagram ever feels too static.
