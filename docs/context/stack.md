# Stack — Decisions and Rationale

Every decision here was made deliberately. Before suggesting a change, read the rationale. If a better option exists, flag it with reasoning rather than just swapping it.

---

## Framework — Astro

**Decision:** Astro with islands architecture.
**Why:** The portfolio is mostly static content — hero, knowledge entries, project descriptions. Only three things need JavaScript at runtime: the MARL canvas, the FS sim sliders, and the search widget. Astro renders everything else to static HTML at build time and hydrates only those three islands. A React SPA would ship a full JS bundle for a page that is 80% text and CSS. Astro ships near-zero JS unless the island is in the viewport.
**Watch out for:** The distinction between .astro components (server-rendered, no reactivity) and .tsx islands (client-side, reactive). If something doesn't need to respond to user input, it should be .astro.

## Adapter — Cloudflare Pages

**Decision:** @astrojs/cloudflare adapter.
**Why:** Free tier covers the entire portfolio indefinitely. Edge functions via Cloudflare Workers handle the DeepSeek proxy at zero cold start. Git-integrated deploys — every push to main triggers a rebuild. Domain registrar is also Cloudflare (~£10/yr, no markup).
**Watch out for:** The Cloudflare adapter runs in a Workers runtime, not Node.js. Some Node APIs are unavailable. Use the Web Fetch API, not node-fetch. File system access at runtime is not available — all data must be either bundled at build time or fetched from an external source.

## UI Framework — React (islands only)

**Decision:** @astrojs/react for interactive islands.
**Why:** Nano-stores has first-class React integration. Canvas 2D and slider state management are straightforward in React hooks. Branson already knows React from Helm.
**Watch out for:** React is only used inside src/islands/. Do not use React components in src/components/ — those are .astro files.

## Styling — SCSS + CSS Custom Properties

**Decision:** SCSS with a token-first architecture. No Tailwind.
**Why:** The day/night theme system is entirely CSS custom property-driven. Tailwind cannot natively express `[data-theme="night"] .panel { background: var(--pb); }` cleanly — it would require extensive config or arbitrary values everywhere. The design is bespoke enough that utility classes add friction rather than speed. SCSS gives nesting for the theme selector chains, mixins for repeated instrument panel patterns, and partials to keep concerns separated. Tokens are defined once in _tokens.scss and auto-imported via Vite config.
**Watch out for:** The additionalData config in astro.config.mjs auto-imports _tokens.scss into every SCSS file via `@use`. This means token variables are available everywhere without manual imports. Do not @import _tokens.scss manually in component files — it will be double-imported.

## State — Nano-stores

**Decision:** Nanostores for cross-island reactive state.
**Why:** The day/night theme toggle needs to affect every island simultaneously — the MARL canvas colours, the search widget styling, the music widget EQ bars. Islands don't share a React tree, so normal React state doesn't cross island boundaries. Nanostores solves this: a shared atom in src/stores/theme.ts, subscribed to by any island that needs it. The bundle cost is ~1KB vs ~45KB for a state library like Zustand.
**Watch out for:** The theme atom also needs to sync with the `data-theme` attribute on the HTML element (which SCSS reads). The ThemeToggle island is responsible for both updating the atom and setting the attribute. See src/islands/ThemeToggle.tsx.

## Animation — CSS keyframes + Motion One

**Decision:** CSS keyframes for the tunnel transition and breathing animations. Motion One for scroll-triggered reveals and the boot sequence.
**Why:** The tunnel transition is a single @keyframes animation — no JavaScript needed, no library. Motion One is chosen over GSAP specifically because it is 3KB vs 67KB and covers the use cases (scroll-triggered stagger, entrance animations). If you find yourself reaching for a GSAP feature, check Motion One's docs first.
**Watch out for:** Motion One uses the Web Animations API under the hood. It is not supported in very old browsers but this portfolio's audience (engineers, recruiters in tech) is on modern browsers. Not a concern.

## MARL Visualisation — Canvas 2D

**Decision:** Native Canvas 2D API. No Three.js, no WebGL.
**Why:** The racing simulation is a 2D oval with six coloured dots and motion trails. Canvas 2D handles this at 60fps with zero dependencies. Three.js would add ~400KB for a visual that does not benefit from 3D rendering. If a 3D Spa-Francorchamps render becomes a goal in v2, Three.js can be added then. Build the simplest thing that communicates the research.

## FS Sim Data — Pre-computed LP Lookup Table

**Decision:** Python LP solver runs in GitHub Actions on a schedule, outputs src/data/lookup_table.json, which is committed and shipped with the site.
**Why:** Exposing the Python sim as a live API requires a server with a cold start, costs money on free tier, and adds latency. The LP solver is deterministic — same inputs always produce the same output. Pre-computing a grid of ~2000 parameter combinations and shipping the JSON means the frontend does nearest-neighbour interpolation in <1ms with no network request. The data is regenerated monthly or on manual trigger via workflow_dispatch.
**Watch out for:** scripts/generate-lookup.py must be kept in sync with the sim's parameter space. If you add a new variable to the sim, update the script and re-run the workflow.

## Search — Four-layer Pipeline

**Decision:** Levenshtein (custom) → synonym expansion (JSON) → Fuse.js → pre-computed embeddings (Transformers.js ONNX).
**Why each layer:**
- Levenshtein: catches typos before anything else. 15 lines of JS, no library.
- Synonym JSON: domain-aware expansion. Docker → CI/CD. Catches semantic adjacency that the user explicitly maps.
- Fuse.js: fuzzy string search against the long-form knowledge entry bodies. Handles partial matches.
- Embeddings: true semantic similarity. Pre-computed at build time (OpenAI text-embedding-3-small, ~$0.00 for ~100 entries). Runtime inference via Transformers.js ONNX model (~8MB, loads once, runs client-side).
**Watch out for:** The ONNX model has a 1-3 second load time on first query. Preload it on page load so the first search feels instant.

## DeepSeek Integration — Cloudflare Worker Proxy

**Decision:** DeepSeek V3 API, proxied via a Cloudflare Worker, streamed via SSE, Tier 2 (fires alongside instant results, never blocks them).
**Why:** API key must never be in the browser. The Worker holds the key as an environment variable and rate-limits via KV store (10 DeepSeek queries per IP per hour). Streaming means the response types out in real time — the latency becomes a feature (phosphor typewriter effect) rather than a blocker. max_tokens: 120 keeps responses sharp and cost at ~$0.000008 per query.
**Watch out for:** The Worker must return CORS headers for the portfolio domain. See src/workers/deepseek-proxy.ts.

## Knowledge Base — Astro Content Collections

**Decision:** Markdown files in src/content/knowledge/ and src/content/tech-notes/, validated by Zod schemas in src/content/config.ts.
**Why:** Adding a knowledge entry is a git commit, not a database operation. Content Collections give typed access to frontmatter in components. The same entries that power the search widget also populate the (i) TechNote panels. No CMS, no database, no auth — just files.

## Music — Curated static playlist

**Decision:** A hardcoded playlist of mp3 files in public/audio/ with metadata in a JSON config. No live API.
**Why:** Reflects music taste as a personality signal rather than live scrobbling data. Kavinsky, M83, Bonobo, Jon Hopkins — these are chosen, not real-time. The EQ bars in night mode are CSS animation, not audio-reactive (that would require Web Audio API and add complexity for marginal gain).
