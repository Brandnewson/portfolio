# Progress Log

Most recent session at the top. Add an entry at the end of every session.

Format:
## YYYY-MM-DD
- What was built or decided
- Any decisions Branson needs to review
- What was left unfinished / what comes next

---

## 2026-04-17 — Session 1 (design lock)

### Decisions made
- **Day palette locked:** `--bg #F5EEE0` / `--ink #1E1A16` / `--acc #8B5A30` (cognac) / `--acc2 #5D1A29` (bordeaux).
- **Night palette locked:** `--bg #090A07` / `--fg #E8DFC8` (bone) / `--acc #14CC4A` (phosphor, live-data only) / `--amb #D9A030` (CTAs).
- **Fonts locked:** Day = Instrument Sans across everything. Night = Chakra Petch (hero) + Instrument Sans (body) + IBM Plex Mono (instrument readouts).
- **CTA system locked:** squared, three variants. Night primary = amber outline, night secondary = graphite `#1E1A15` fill with amber text, night ghost = amber text + arrow. Day mirrors shape in cognac/bordeaux.
- **Phosphor discipline promoted to hard rule** in `design.md`: green is reserved for live-state elements (status, gauges, panel IDs, data values). Never on logo, nav, CTAs, body, or decoration.

### Artefacts produced
- Six iterative palette mockups: `docs/mockup-palettes-v1.html` → `v6.html`.
- `docs/context/design.md` rewritten with locked tokens, phosphor discipline rule, and CTA system.

### What comes next (Session 1 continued / Session 2)
1. **Branson runs the Astro wizard manually** — `npm create astro@latest .` in `C:\Code\portfolio`.
2. After scaffold: install integrations (`@astrojs/react`, `@astrojs/cloudflare`, `sass`, `nanostores`, `@nanostores/react`).
3. Write `src/styles/_tokens.scss` with the locked CSS custom properties + `[data-theme="night"]` swap block + `@mixin phosphor-glow`.
4. Configure `astro.config.mjs` (Cloudflare adapter, React, SCSS `additionalData` auto-import of `_tokens.scss`).
5. Create folder tree per `docs/context/architecture.md` with `.gitkeep` placeholders.
6. Stop for Branson review before `_reset.scss`, `_typography.scss`, or any component.

### Open decisions resolved
- ~~Phosphor green value~~ → `#14CC4A` confirmed; discipline rule added.
- ~~Self-host vs system fonts~~ → self-host Instrument Sans, Chakra Petch, IBM Plex Mono (all Google Fonts) via `@font-face` with `size-adjust` width-matching for the tunnel transition.
- ~~Domain~~ → `bransontay.dev`.

---

## Session 0 — Pre-initialisation

**Context established in Claude.ai (not Claude Code yet)**

### Decisions made
- Framework: Astro + Cloudflare Pages + React islands
- Styling: SCSS + CSS custom properties, no Tailwind
- Theme: Day (911 Targa — cognac/cream/silver) / Night (300ZX — phosphor green CRT)
- Tunnel transition: black flash both directions, 520ms total, theme swaps at 175ms
- Three interactive project panels: MARL racing sim, FS quasi-static sim, Helm showcase
- FS sim data: pre-computed LP lookup table via GitHub Actions monthly cron
- Search: four-layer pipeline (Levenshtein → synonyms → Fuse.js → ONNX embeddings)
- DeepSeek V3: Tier 2, always fires alongside instant results, streamed via Cloudflare Worker proxy
- Knowledge graph: Astro Content Collections (.md files, Zod schemas)
- (i) TechNote panels: every interactive element gets one, content from tech-notes collection
- Music widget: curated static playlist, not live API
- Boot sequence: ECU-style init on first load
- Animation: CSS keyframes + Motion One (not GSAP)
- State: Nano-stores for cross-island theme sync
- Analytics: Cloudflare built-in (free, no cookies)
- Git submodules: formula-student-sim and marl-f1

### Target roles
Full-stack developer, ML/AI engineer, Forward Deployed Engineer, GTM engineer
Target markets: New York and London

### What comes next (Session 1)
1. Run initialisation commands from docs/context/architecture.md
2. Set up folder structure
3. Write src/styles/_tokens.scss — this is the first file, everything depends on it
4. Review tokens with Branson against the design references before proceeding

### Open decisions for Branson to make in Session 1
- Exact phosphor green value — #14CC4A confirmed as base but verify against 300ZX photo in context
- Whether to self-host fonts or use system font stack for launch (self-hosted = more control, system = faster)
- Domain name — have you registered one yet?
