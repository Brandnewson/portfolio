# Landing page redesign — IA + component skeleton

Date: 2026-05-13
Status: locked at the page-IA level. Per-section visual brainstorm + build happens iteratively.

## Why this exists

The current landing page is a single horizontal 3-column instrument-cluster grid below the hero. It works as a glance, but doesn't make a strong enough argument to a recruiter or senior engineer scanning the page in 30 seconds. The prototype at `C:\Users\brans\Downloads\branson_portfolio.html` proved out a vertical-featured information hierarchy that builds the argument top-down: a value statement, a 3-bullet "quick read", three featured projects (interactive → research → shipping), then experience, education, contact.

We adopt the prototype's information architecture and layout grammar, but rebuild it inside our existing design system (locked tokens in `src/styles/_tokens.scss`, day/night theming, squared-edge CTA system, phosphor discipline, semantic-token-only styling). The prototype is a layout reference, not a code reference — its rounded buttons, custom colour values, and Tailwind-style inline structure all violate our hard rules and get rewritten.

## Structural decisions (locked)

1. **Project zone shape.** Replace the horizontal 3-column grid entirely with a vertical featured stack. Each project gets a full-width panel with text on one side and an interactive/preview region on the other, alternating sides for visual rhythm.
2. **Project order.** FS Sim (Featured · PRJ/001) → MARL (Research · PRJ/002) → Helm (Shipping · PRJ/003). Lead with the interactive lap-time demo so a recruiter touches the slider in their first scroll.
3. **Quick Read framing.** Top-right of the hero, three bullets, framed as Motorsport · Stack · Now. Exact copy resolved in the Hero section brainstorm.
4. **Hero h1.** Leads with the value statement, not the name. The InstrumentBar logo already says BRANSON; the hero earns the scroll with the pitch.
5. **Helm preview.** Static SVG architecture diagram in a `.astro` component. No island, no hydration. The diagram conveys distributed-systems literacy through correctness, not interaction.

## Page IA — top to bottom

```
TargaBar          (existing)
InstrumentBar     (existing, nav updated)

Hero  #top
  ├─ Left:  eyebrow + h1 statement + lead paragraph + CTA row
  └─ Right: QuickRead aside (3 bullets)

silver rule       (existing targa divider)

Projects  #work
  ├─ ProjectFeature  PRJ/001 Featured  → FS Sim   (text left,  preview right)
  ├─ ProjectFeature  PRJ/002 Research  → MARL     (preview left, text right)
  └─ ProjectFeature  PRJ/003 Shipping  → Helm     (text left,  preview right)

Experience  #about
  ├─ ExperienceFeatured  → Jaguar TCS Racing
  ├─ ExperienceAlso      → Republic of Singapore Navy
  └─ EarlierRail         → Travelindr · CoHive · e-commerce (pills)

Education
  └─ EducationGrid       → Leeds · Ngee Ann (two cards side by side)

Contact  #contact
  └─ ContactSection      → headline + email / LinkedIn / GitHub CTAs

BottomBar         (existing)
```

## Component map

| Component | Status | Path |
|---|---|---|
| `Hero.astro` | modified — h1 swap, right column replaces roles list with QuickRead | `src/components/hero/Hero.astro` |
| `QuickRead.astro` | new | `src/components/hero/QuickRead.astro` |
| `ProjectFeature.astro` | new — full-width featured project shell with `reverse` prop and slots for preview and "why" callout | `src/components/projects/ProjectFeature.astro` |
| `HelmArchitecture.astro` | new — static SVG diagram | `src/components/projects/HelmArchitecture.astro` |
| `ExperienceFeatured.astro` | new | `src/components/about/ExperienceFeatured.astro` |
| `ExperienceAlso.astro` | new | `src/components/about/ExperienceAlso.astro` |
| `EarlierRail.astro` | new | `src/components/about/EarlierRail.astro` |
| `EducationCard.astro` | new (×2 in a grid) | `src/components/about/EducationCard.astro` |
| `ContactSection.astro` | new | `src/components/contact/ContactSection.astro` |
| `ProjectPanel.astro` | retired after redesign lands | — |
| `InstrumentBar.astro` | modified — drop `#writing` link until the writing hub ships, `#about` anchors to experience | `src/components/shell/InstrumentBar.astro` |
| `MarlCard.tsx` / `FsSimCard.tsx` | unchanged — rehoused inside `ProjectFeature` slot | `src/islands/*` |

## Nav anchors

- `#work` → first project in the featured stack.
- `#about` → Experience section. Experience and Education share the same anchor (one mental category: "where I came from"). No separate `#education` anchor in the nav.
- `#writing` → drop the nav link for now. Tech notes still live at `/writing/<slug>` per the CLAUDE.md hard rule. Add the nav link back when a writing hub page exists.
- `#contact` → Contact section.

## Build order (per-section brainstorm + implement + review)

Each step is one brainstorm pass and one implementation pass, with Branson reviewing the live result in the browser before the next step begins.

1. Skeleton spec written and committed (this document). ← we are here
2. Hero + QuickRead.
3. `ProjectFeature.astro` shell with placeholder text on all three slots.
4. FS Sim panel — drop in `FsSimCard` island.
5. MARL panel — reversed side, drop in `MarlCard` island.
6. Helm panel — build the SVG architecture diagram.
7. Experience — all three tiers (Featured, Also, Earlier rail).
8. Education — two-card grid.
9. Contact.
10. Nav anchor cleanup + cross-section polish pass (typography, spacing, theme consistency).

## What stays out of this spec

- Exact typography sizes, exact spacing values, exact CTA button shapes per section — resolved per-section in the iterative build.
- Exact copy for the Quick Read bullets, the hero h1, the project bodies, the "why it matters" callouts — resolved per-section.
- Tech note content for the Helm architecture diagram (new tech note required per CLAUDE.md if it becomes interactive later; static SVG version may not require one, but a short note describing the diagram's accuracy is recommended).
- Any new design tokens — semantic tokens should already cover all surfaces. If a section turns up a token gap (e.g. a new "callout" surface), the gap gets added to `_tokens.scss` before the component referencing it lands.

## Hard rules carried forward (from CLAUDE.md and `docs/context/design.md`)

- SCSS only. No Tailwind, no inline styles, no CSS-in-JS.
- All colours via CSS custom properties.
- Phosphor green (`--phos`) only on live-state elements — never on logo, CTAs, body, decoration.
- Squared edges on CTAs (`border-radius: 0`). The prototype's `border-radius: 999px` round buttons are rejected.
- Static `.astro` components for non-interactive content. React islands only for genuinely interactive elements.
- Every new interactive element needs a `(i)` tech note entry. Helm's static SVG diagram does not, but a tech note is allowed if useful.
