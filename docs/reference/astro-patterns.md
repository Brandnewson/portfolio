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

## Add patterns here as you encounter them

This section grows with your learning. When you figure out how something works, write it down here in plain English. Future sessions will thank you.
