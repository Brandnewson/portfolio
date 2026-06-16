// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://bransontay.dev',
  integrations: [react()],
  // The MARL research page moved from /report to /dissertation (clearer, more
  // accurate naming). Keep the old path working for any existing links.
  redirects: {
    '/report': '/dissertation',
  },
});
