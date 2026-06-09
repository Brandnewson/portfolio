# Astro Patterns

A living reference. Add to this file as you learn new patterns during development.
Write things in your own words — this is your reference, not documentation.

---

## The fundamental distinction: .astro vs .tsx

**.astro files** run at build time on the server. They output HTML. They cannot respond to user events. They can fetch data, read files, use Astro APIs. Think of them as smart HTML templates.

**.tsx (React) files in src/islands/** run in the browser. They can use useState, useEffect, event handlers. They are interactive. They cost JavaScript bundle size.

**Rule of thumb:** if it doesn't need to react to user input, it's .astro. If it does, it's .tsx in src/islands/.

---

## Passing props to islands

Islands are hydrated React components. You pass data into them as props at render time (build time), not at runtime.

```astro
---
// In a .astro file
import MARLCanvas from '../islands/MARLCanvas.tsx'
const initialLambda = 0.5
---

<MARLCanvas
  client:visible          // hydrate when island scrolls into view
  initialLambda={initialLambda}
/>
```

**client directives** control when the island hydrates:
- `client:load` — hydrates immediately on page load
- `client:visible` — hydrates when scrolled into view (good for below-fold islands)
- `client:idle` — hydrates when browser is idle (good for non-critical islands)

---

## Content Collections

Access typed content from src/content/ in .astro files:

```astro
---
import { getCollection } from 'astro:content'
const knowledgeEntries = await getCollection('knowledge')
---
```

Each entry has:
- `entry.slug` — filename without extension
- `entry.data` — the frontmatter (typed by your Zod schema)
- `entry.body` — the markdown body as a string
- `entry.render()` — renders body to HTML (use in templates)

---

## Nano-stores cross-island state

Define the atom once, use it anywhere:

```typescript
// src/stores/theme.ts
import { atom } from 'nanostores'
export const themeAtom = atom<'day' | 'night'>('day')
```

```typescript
// In any island .tsx file
import { useStore } from '@nanostores/react'
import { themeAtom } from '../stores/theme'

function MyIsland() {
  const theme = useStore(themeAtom)
  return <div data-theme={theme}>...</div>
}
```

When ThemeToggle.tsx calls `themeAtom.set('night')`, every island subscribed to it re-renders immediately. This is how the theme propagates across island boundaries.

---

## Shell layout

Shell.astro wraps every page. Pass page content through the default slot:

```astro
---
// src/pages/index.astro
import Shell from '../layouts/Shell.astro'
---

<Shell>
  <Hero />
  <MARLPanel />
  <!-- etc -->
</Shell>
```

---

## SCSS token auto-import

Tokens are auto-imported into every SCSS file via the Vite config in astro.config.mjs. You do not need to manually import _tokens.scss. Just use the variables:

```scss
// In any .scss file or <style lang="scss"> block
.panel {
  background: var(--pb);  // works because _tokens.scss is auto-imported
  border-color: var(--bd);
}
```

---

## Styling a component with SCSS

In a .astro file:

```astro
<div class="panel">...</div>

<style lang="scss">
  .panel {
    background: var(--pb);
    border: 1px solid var(--bd);

    // Nest the night mode override
    :global([data-theme="night"]) & {
      // night-specific overrides if needed beyond token swap
    }
  }
</style>
```

Note: styles in .astro files are scoped by default. Use `:global()` to target elements outside the component.

---

## Gotcha: scoped CSS beats a global rule on specificity

Astro scopes `<style>` rules by appending a `[data-astro-cid-…]` attribute to
every selector. That attribute *adds specificity*. So a scoped rule like
`.inspo .inspo-day { display: none }` compiles to roughly
`.inspo[data-astro-cid] .inspo-day[data-astro-cid]` — four "class-level" hits —
which **outweighs** a plainer `<style is:global>` rule such as
`html[data-theme="day"] .inspo .inspo-day { display: inline }`.

Symptom I hit: the hero's themed inspiration line had its hide rule in the
scoped block and its per-theme show rules in a global block. The scoped hide
silently won in *both* themes, so the line never appeared.

**Fix:** keep the hide and the show at the *same* specificity tier. Move the
`display:none` base into the same global block as the theme `display:inline`
rules, so the more specific `html[data-theme]` selector wins normally. (Don't
reach for `!important` — just stop mixing scoped and global for the same
property on the same element.)

---

## Gotcha: a long-running `astro dev` can serve stale CSS (wedged HMR)

A dev server left running across many file edits (especially edits made while
the process was up but not actively HMR-ing, e.g. across a tool/session change)
can wedge its module graph and serve **stale scoped styles** — the element keeps
its `data-astro-cid` attribute but the matching rules are missing, so everything
renders unstyled (grids collapse to `display:block`, etc.) with **zero console
errors**. It looks like a CSS bug but isn't.

**Tell:** the same page renders correctly from a freshly started `astro dev` on
another port. **Fix:** restart the dev server. When a render looks broken,
confirm against a fresh server before debugging the CSS.

---

## React islands: fullscreen overlays via `createPortal`

To lift an island's UI out of its in-page box (modal / fullscreen viewer),
render it through `createPortal(node, document.body)` so it escapes any parent
`overflow`/stacking context. Pair it with a `useEffect` that, while open, adds an
Escape-key listener and sets `overflow:hidden` on `documentElement` *and* `body`
(restoring both on cleanup) to lock background scroll. If the same SVG is drawn
both inline and in the overlay, give per-instance `<marker>`/def ids (a suffix)
so the two copies don't collide on a duplicate DOM id. See
`src/islands/HelmArchitecture.tsx`.

---

## Add patterns here as you encounter them

This section grows with your learning. When you figure out how something works, write it down here in plain English. Future sessions will thank you.
