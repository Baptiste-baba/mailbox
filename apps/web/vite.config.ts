import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // Generates the route tree and splits each route into its own chunk; must run before React.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      // An external registration script: the Content Security Policy forbids inline scripts.
      injectRegister: 'script-defer',
      // No skipWaiting: a new version waits until every window of the app is closed, so nothing is
      // ever reloaded under the user's feet (a draft in progress, for instance).
      registerType: 'prompt',
      // public/manifest.webmanifest, linked from index.html.
      manifest: false,
      workbox: {
        // The whole interface, screens not opened yet included, so that the app starts offline.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        navigateFallback: 'index.html',
        // Mail data never goes through this cache: the app keeps it in its own local store.
        navigateFallbackDenylist: [/^\/api\//, /^\/health$/],
      },
    }),
  ],
});
