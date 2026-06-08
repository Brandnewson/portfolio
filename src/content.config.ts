import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Tech notes — the "(i)" explainers for each interactive island, authored as
// markdown in src/content/tech-notes/. Surfaced on the site at /writing (index)
// and /writing/<id> (one rendered page per note). The entry id is the filename
// slug (e.g. helm-architecture.md -> "helm-architecture"); the frontmatter also
// carries an `id` for human reference, which the loader ignores.
const techNotes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/tech-notes' }),
  schema: z.object({
    title: z.string(),
    panel: z.string(),
    component: z.string(),
    mechanism: z.string(),
    substrate: z.string(),
  }),
});

export const collections = {
  'tech-notes': techNotes,
};
