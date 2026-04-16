# Progress Log

Most recent session at the top. Add an entry at the end of every session.

Format:
## YYYY-MM-DD
- What was built or decided
- Any decisions Branson needs to review
- What was left unfinished / what comes next

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
