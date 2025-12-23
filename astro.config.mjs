import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import compress from 'astro-compress';

export default defineConfig({
  // WICHTIG: muss zur kanonischen Domain passen (www vs non-www)
  site: 'https://turmdecker.com',

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    build: {
      assetsInlineLimit: 10 * 1024, // 10 KB
    },
  },

  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
    compress(),
  ],
});
