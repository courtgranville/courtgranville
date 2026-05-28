import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// File-based routing. Two 3D paths coexist (per CLAUDE.md): the WebGL hero stays
// vanilla three.js via `<script is:inline>` resolving through the CDN import map
// in Layout.astro (pinned three@0.162); richer, stateful 3D (the Selected-Work
// model viewer) ships as a React island — react-three-fiber + drei + GSAP,
// bundling npm three@0.184 — hydrated with client:visible so editorial pages
// stay static. The two run in separate contexts; don't load both on one page.
export default defineConfig({
  site: 'https://courtgranville.com',
  trailingSlash: 'always',

  build: {
    format: 'directory',
  },

  vite: {
    css: {
      devSourcemap: true,
    },
  },

  integrations: [sitemap(), react()],
});