// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true }
  }),
  site: 'https://www.madez.dev',
  vite: {
    plugins: [tailwindcss()],
    // gsap ships its plugin subpaths as CommonJS; without this the Vercel
    // SSR build externalizes them and Node ESM can't read the named exports
    // (`Named export 'ScrollTrigger' not found`), 500-ing every page. Bundling
    // gsap into the server output lets Vite apply the CJS interop, as in dev.
    ssr: {
      noExternal: ['gsap', '@gsap/react'],
    },
  },

  integrations: [react()],
});