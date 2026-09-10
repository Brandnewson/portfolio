# Architecture

How the repo is structured, what lives where, and why.

Last verified against the tree: 2026-09-10.

---

## Mental model

Two layers, not three:

1. **Static shell** — everything rendered at build time by Astro. The instrument
   bar, hero, project bands, profile, closing panel, and every `/writing` page.
   No JavaScript ships for any of it.
2. **Interactive islands** — hydrated client-side. Five of them, all React
   (`.tsx`) in `src/islands/`, each with a co-located `.scss` file.

There is **no edge layer**. The site is a fully static build. `@astrojs/cloudflare`
is in `package.json` but is *not* wired into `astro.config.mjs` — there is no
adapter, no `output: 'server'`, no Worker, and no `wrangler.toml`. If you need a
server route, wiring the adapter is a deliberate change, not a given.

---

## File tree

```
portfolio/
├── .github/
│   └── workflows/               # EMPTY (.gitkeep only) — no CI. See "Deploy".
│
├── public/                      # Copied verbatim to the build root
│   ├── Branson-Tay-CV.pdf       # Linked from hero + closing CTAs
│   ├── dissertation.pdf         # Linked from /dissertation
│   ├── og.png                   # 1200x630 social card (see Shell.astro)
│   ├── favicon.svg
│   └── fonts/                   # Self-hosted woff2 — IBM Plex Mono, Instrument Sans
│
├── scripts/                     # Playwright VERIFICATION scripts, not a build step
│   ├── _shot.mjs                # Shared screenshot helper
│   ├── _og.mjs                  # Renders the OG card image
│   ├── measure-font-metrics.mjs
│   └── verify-*.mjs             # One per layout change — run manually against dev
│
├── sims/                        # Placeholder (.gitkeep). No submodules exist.
│
├── src/
│   ├── components/              # Static .astro — no client JS
│   │   ├── hero/Hero.astro              # Name, eyebrow, headline, status, CTAs
│   │   ├── projects/
│   │   │   ├── ProjectFeature.astro     # Full-width project band; island via <slot>
│   │   │   └── OtherProjects.astro      # Breadth list, from data/other-projects.ts
│   │   ├── profile/Profile.astro        # Background — experience, education, stack
│   │   └── shell/
│   │       ├── InstrumentBar.astro      # Top nav (Shell renders it unless hideBar)
│   │       ├── Closing.astro            # "Looking for" panel + contact CTAs
│   │       ├── BackLink.astro           # Back affordance on subpages
│   │       └── BottomBar.astro          # UNUSED — nothing imports it
│   │
│   ├── islands/                 # React, hydrated client-side. Each has a sibling .scss.
│   │   ├── HelmArchitecture.tsx         # Helm system diagram + expand view
│   │   ├── MarlCard.tsx                 # SVG agents animating the Spa centreline
│   │   ├── FsSimCard.tsx                # Mass sweep chart from the baked JSON
│   │   ├── SectionRail.tsx              # Right-edge scroll-position rail
│   │   ├── ThemeToggle.tsx              # Day/Night rocker — writes the theme atom
│   │   └── *.scss                       # Co-located, imported by the .tsx
│   │
│   ├── content.config.ts        # Collection schemas. NOTE: src/ root, not src/content/
│   ├── content/
│   │   ├── tech-notes/          # The only populated collection — 4 markdown notes
│   │   └── knowledge/           # Placeholder (.gitkeep). No collection defined.
│   │
│   ├── data/                    # Plain TS/JSON modules, imported directly. No CI.
│   │   ├── profile.ts           # BIO, EXPERIENCE, EDUCATION, STACK, ROLES, CITIES
│   │   ├── other-projects.ts    # OTHER_PROJECTS breadth list
│   │   ├── spa-path.ts          # Baked Spa-Francorchamps SVG path (250 vertices)
│   │   └── fs-mass-sweep.json   # Pre-computed mass -> lap time sweep
│   │
│   ├── layouts/Shell.astro      # Root layout — head, SEO/OG, anti-flash theme, bar
│   │
│   ├── pages/
│   │   ├── index.astro          # Home — the whole narrative on one page
│   │   ├── contact.astro
│   │   ├── dissertation.astro
│   │   └── writing/
│   │       ├── index.astro      # Tech-note index
│   │       └── [id].astro       # One page per tech note
│   │
│   ├── stores/theme.ts          # Nanostores atom: 'day' | 'night' (+ localStorage)
│   │
│   └── styles/
│       ├── _fonts.scss          # @font-face for the self-hosted woff2
│       ├── _tokens.scss         # ALL CSS custom properties — day + night
│       ├── _reset.scss
│       ├── _components.scss     # Shared patterns
│       └── global.scss          # Entry point. Imported ONCE, from Shell.astro.
│
├── docs/
│   ├── context/                 # stack, design, architecture (this file), progress
│   ├── reference/               # tokens, apis, content-schema, astro-patterns
│   ├── superpowers/             # Dated design specs + plans
│   └── mockup*.html             # Static palette / component explorations
│
├── astro.config.mjs
├── CLAUDE.md
└── package.json
```

---

## Routing

| URL | Source | Notes |
|---|---|---|
| `/` | `pages/index.astro` | Hero, three project bands, profile, other projects, closing |
| `/contact` | `pages/contact.astro` | Channel list |
| `/dissertation` | `pages/dissertation.astro` | MARL research write-up |
| `/writing` | `pages/writing/index.astro` | Tech-note index, sorted by `panel` |
| `/writing/<id>` | `pages/writing/[id].astro` | `getStaticPaths` over the collection |
| `/report` | — | Legacy path -> `/dissertation`, declared in `astro.config.mjs` |

`Shell.astro` wraps every page. It renders `InstrumentBar` unless the page passes
`hideBar` — the home page does, because the hero *is* the header there.

The `/report` entry is worth understanding precisely: because this is a static
build with no adapter, Astro cannot emit a real 301. It generates
`/report/index.html` containing a `<meta http-equiv="refresh">` plus a canonical
link to `/dissertation`. Browsers follow it, but it is not an HTTP redirect — so
it does not pass link equity the way a 301 would, and `curl` without `-L` sees a
200. If a true 301 ever matters, it needs a Cloudflare Pages `_redirects` file.

Note that `/` is a single long page, not a hub. Document scroll is the primary
navigation mechanism, and `SectionRail` reflects position within it.

---

## Home page composition

`index.astro` is where the narrative order lives — changing the page's argument
means reordering here, not editing the components:

```
Hero
ProjectFeature "Helm"        (PRJ/001, FEATURED)  <- <HelmArchitecture client:load />
ProjectFeature "MARL"        (PRJ/002)            <- <MarlCard />
ProjectFeature "FS Sim"      (PRJ/003)            <- <FsSimCard />
Profile                      (background)
OtherProjects                (breadth)
Closing                      (roles / locations / availability + CTAs)
SectionRail                  (fixed overlay, tracks all of the above)
```

`ProjectFeature` is a generic band: title, kicker, points, stack badges, route,
and a `<slot>` the island drops into. Adding a project is a new `<ProjectFeature>`
block with props — not a new component.

---

## Data flow

**All data is baked.** Nothing is generated by CI, and nothing is fetched at
runtime. Every data module is a plain import resolved at build time:

```
src/data/profile.ts        -> Profile.astro, Closing.astro
src/data/other-projects.ts -> OtherProjects.astro
src/data/spa-path.ts       -> MarlCard.tsx      (SVG path + lap duration)
src/data/fs-mass-sweep.json-> FsSimCard.tsx     (mass sweep points)
```

`spa-path.ts` and `fs-mass-sweep.json` were produced *once* from the sim repos
and committed. Their header comments record the provenance and how to regenerate.
Regeneration is a manual, deliberate act — there is no scheduled workflow, and
nothing in this repo depends on the sim repos being present.

**Content collections** — one collection, `tech-notes`, defined in
`src/content.config.ts` via the `glob` loader over `src/content/tech-notes/`.
Frontmatter is Zod-validated (`title`, `panel`, `component`, `mechanism`,
`substrate`). The entry `id` is the filename slug and drives `/writing/<id>`.

**Theme** —

```
ThemeToggle.tsx  -> setTheme() -> $theme atom (stores/theme.ts)
                                    |
              subscribe: sets data-theme on <html> + writes localStorage
                                    |
                    SCSS [data-theme="night"] selectors swap tokens
```

`Shell.astro` also carries an inline `is:inline` script that reads
`localStorage.theme` and sets `data-theme` *before* styles parse. Without it,
night-mode visitors get a day-mode flash on every load. Do not move it into a
bundled module — it must run synchronously in `<head>`.

---

## Deploy

There is no workflow file in this repo. `bransontay.dev` is built and served by
**Cloudflare Pages' Git integration**, configured in the Cloudflare dashboard
rather than in version control: a push to `main` triggers Cloudflare to clone,
run `npm run build`, and publish `dist/`.

Practical consequences:

- Nothing in the repo describes the deploy. If the build config needs changing
  (build command, Node version, env vars), that happens in the Cloudflare
  dashboard, and this file is the only place that says so.
- A green push is not a green deploy. Verify on the live site, not in Actions.
- `package.json` pins `engines.node >= 22.12.0`. Cloudflare's default Node may be
  older; that setting is dashboard-side too.

---

## Key constraints

**Islands boundary** — a `.astro` component cannot pass data reactively into an
island. Props are serialised once at render time. For state that must cross two
islands, use a nanostores atom (`stores/theme.ts` is the working example).

**One global stylesheet** — `global.scss` is imported exactly once, from
`Shell.astro`. Island styles are co-located `.scss` imported from the `.tsx`.
There is no `additionalData` auto-import configured in `astro.config.mjs`, so a
partial that needs tokens must `@use` them itself.

**Verification scripts are manual** — `scripts/verify-*.mjs` are Playwright
scripts run by hand against a local dev server. They are not wired into a test
runner or CI, so they only catch what you remember to run.

**No submodules** — `sims/` is an empty placeholder. `git clone` is enough; there
is nothing to `--recurse-submodules` for.
