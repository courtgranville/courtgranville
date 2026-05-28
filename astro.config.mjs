import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

// File-based routing. All 3D ships as vanilla three.js via `<script is:inline>`
// resolving through the CDN import map in Layout.astro (pinned three@0.162) —
// no bundler-side React/R3F, so the stack stays single-source.
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

  integrations: [sitemap()],
});