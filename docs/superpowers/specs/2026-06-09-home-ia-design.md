# Home page information architecture — refinement pass

Date: 2026-06-09
Owner: Branson
Status: agreed, pending implementation (by a separate instance)

## Goal

Tighten the landing page for the two readers it actually serves, optimising for
opening mid-tier full-stack / AI / forward-deployed roles in New York and London.

- The **senior engineer** wants to see the work and read the code.
- The **recruiter** wants to confirm fit (role, location, availability) and grab a CV.

Guiding principle: **lead with the work, not the ask. Show before you tell.**
The projects are the proof; profile and contact are supporting context and
conversion. Neither reader leads with "about me" or "get in touch", so neither
goes first.

## Reader scan order (the rationale for section order)

Recruiter, filtering for fit:
1. What does he do — hero tagline
2. Location + availability — must be high
3. Is he legit / senior — glance at projects + experience
4. CV — grab it
5. Contact — only once interested

Engineer, evaluating capability:
1. What has he built — projects
2. Is it good, can I see code — project depth + repo links
3. Who is he / background — profile + experience
4. How to reach him — contact

Both converge on: positioning first, work next, contact last.

## Agreed section order

1. Hero — identity, positioning, location + availability, primary CTA (Helm),
   quick-links (GitHub, LinkedIn, Contact, CV)
2. Featured projects — Helm featured and first, then MARL, then Quasi-Static Sim
3. Other projects — collapsible breadth list
4. Profile / Background — bio, experience, education, stack
5. Closing — contact / footer CTA

## Decisions

### Featured project = Helm
Helm is the "I shipped a live product" proof, which is what mid-tier full-stack
and FDE roles screen for. The sims prove rigor, Helm proves delivery. Lead with
delivery.

### Hero CTA hierarchy
- The day / night toggle is a utility control, not a CTA. It stays as the
  "calibrate" control and is out of the CTA budget.
- One primary CTA — the featured project (Helm).
- One secondary quick-links cluster — GitHub, LinkedIn, Contact, Download CV.
  The CV link carries slightly more visual weight than the others, because the
  primary CTA serves the engineer (see the work) while the recruiter's first
  want is the CV. Weighting CV inside the secondary cluster serves the recruiter
  without stealing primacy from the featured project.
- "Profile" as a standalone jump-link is dropped — it was ambiguous (profile of
  what), and the section is still reachable by scroll and the SectionRail.

### Other projects — placement and form
- Sits directly after the featured projects and before Profile, so the breadth
  signal lands while the reader is still forming an impression of the work
  (counterweights the "two racing sims" read before it sets).
- Native `<details>` / `<summary>` disclosure — zero dependency, free keyboard
  and aria support (honours the "check the native API first" rule).
- Collapsed state must still show title plus a one-line summary per project, so
  a skimmer who never expands still gets the breadth signal. Expanding reveals
  bullets and links.
- 3 to 5 genuinely real entries only. Filler next to the strong three subtracts.

### Stack
Stays where it is — canonical grouped list in Profile, plus per-project chips on
each band. Single-page site, so ctrl-F finds the canonical list at any height.
No proficiency bars (they read junior).

### Code links
- MARL sim and Quasi-Static sim get GitHub repo links. A linked repo gets
  clicked and read, so each must have a real README and run.
- Helm has no public repo. Rather than leave the absence unexplained, state it
  as a strength — Helm runs as a live product so the source stays private, and
  the architecture diagram stands in for the code. That framing reads stronger
  than a code dump.

## Already in place (preserve, do not rebuild)

- Helm featured, first, PRJ/001.
- Location + availability already above the fold in the hero status line.
- Profile already below the projects.
- Stack already split (canonical in Profile + per-project chips).
- Per-project "what it proves" already exists as the `why` line on each band.

## Remaining work

1. Hero — replace the Profile / Contact jump-CTAs with the quick-links cluster
   (GitHub, LinkedIn, Contact, weighted CV). Keep the featured-project primary
   CTA and the theme toggle.
2. ProjectFeature — add an optional repo link prop, render a second secondary
   button. Wire repos for MARL and Quasi-Static. Add the Helm privacy line.
3. Other projects — new collapsible component after the bands, before Profile,
   data-driven, collapsed shows title + one-liner.
4. Fix the PRJ-number desync in the tech-notes frontmatter so `/writing` matches
   the home order (helm-architecture -> PRJ/001, fs-sim-card -> PRJ/003,
   marl-card stays PRJ/002).
5. Fix the `/#work` anchor so the back-links land at the top of the work
   (the Helm band), not the last band.
6. CV asset in public, wire the CV download, and fix the shouty report download
   filename to a clean convention.

## Other projects — curated content

Curated from a longer list down to 5, optimised for distinct domains so the
section reads as breadth rather than more motorsport. Order leads with the
positioning-aligned, non-racing pieces so range registers before the two
motorsport entries. Cut from the long list: Radiator Thermal Sim (weakest,
overlaps the CFD sim), EV BMS Emulator (overlaps the ICE DAQ as FS embedded
C++, kept the DAQ for its collaboration signal), CoHive internship (it is
experience, not a built project, belongs in the Profile timeline).

1. Aerodynamic Concept RAG Analyser — Python, RAG, vector DBs, LLMs, MCP, FastAPI
2. Azure Serverless Distributed Pipeline — Python, Azure Functions, Blob, Queue, serverless
3. E-commerce Shopify Store — Shopify, Facebook Ads, Photoshop, Premiere Pro
4. FS ICE Data Acquisition System — C++, Arduino, Git
5. 2D CFD Radiator Optimisation Simulator — Rust, numerical methods, parallelism

## Repos and assets

- Quasi-Static Sim repo: https://github.com/LGRSimulations/LGR_FullTrackQSLapTimeSim
- MARL repo: https://github.com/Brandnewson/F1_StrategySimulator
- Helm: no public repo (live product). Privacy line stands in.
- CV: wire the button to `/Branson-Tay-CV.pdf`. FLAG — the current source CV is
  motorsport-branded, which contradicts the full-stack/AI/FDE positioning. The
  downloadable CV should be re-oriented before deploy. The button path is wired
  so the correct PDF can be dropped in without a code change.

## Constraints (unchanged project rules)

- SCSS only, all colours via tokens in `_tokens.scss`, no Tailwind / inline /
  CSS-in-JS.
- Phosphor green only on live / attention elements.
- No em-dashes, colons, or semicolons in site copy.
- No new dependency without checking the native API first.
- Verify in both day and night themes before handoff.
