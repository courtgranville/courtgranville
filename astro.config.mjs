import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// Spec §7 — file-based routing; the WebGL hero ships as a client island via
// vanilla `<script is:inline>` so the existing CDN import map is preserved.
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

  integrations: [react(), sitemap()],
});