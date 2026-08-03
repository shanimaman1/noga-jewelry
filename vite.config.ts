import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Vite 8 bundles with Rolldown — use its native advancedChunks (the
    // Rollup manualChunks compat layer caused leva to be modulepreloaded
    // from index.html, i.e. eagerly downloaded by the homepage).
    // `leva` is only imported from the lazy /lab route; grouping it into a
    // named chunk makes that easy to verify in the build output (leva-*.js),
    // and it must load ONLY when /lab is visited — never preloaded by home.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // react-core FIRST with top priority: without it, Rolldown folded
            // react-dom into the leva group, which made the entry statically
            // import (and modulepreload) leva on the homepage.
            {
              name: 'react-core',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 30,
            },
            // zustand FIRST above three-vendor: @react-three/fiber depends on
            // zustand, and so does src/lib/cart/store.ts (used on every page).
            // Without this, Rolldown folds the shared zustand module into
            // three-vendor, making the 1.1MB three chunk a STATIC dependency of
            // the cart — i.e. modulepreloaded on every route. Splitting zustand
            // into its own tiny chunk keeps three out of the entry graph.
            { name: 'state', test: /node_modules[\\/]zustand[\\/]/, priority: 25 },
            { name: 'leva', test: /node_modules[\\/](leva|@leva-ui)[\\/]/, priority: 20 },
            // NOTE: deliberately NO group for @splinetool — forcing it into a
            // named chunk made Rolldown fold a shared module into it, which
            // turned the huge runtime into a static (preloaded!) dependency of
            // the homepage. The dynamic import in SplineHero splits it fine.
            { name: 'three-vendor', test: /node_modules[\\/](three|@react-three)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
});
