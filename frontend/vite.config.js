import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Without this, the service worker only ever installs on a
      // production build (npm run build + preview) — enabling it here
      // means offline mode also works with the normal `npm run dev`
      // workflow, which is what you're actually testing with.
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'TravelPilot — Your Intelligent Travel Companion',
        short_name: 'TravelPilot',
        description: 'Smart travel companion: trip tracking, AI itinerary planning, expense splitting and SOS safety.',
        theme_color: '#0d9488',
        background_color: '#0a0e1a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Lets client-side routing keep working when you reload on a
        // deep link (e.g. /dashboard) while offline — without this,
        // Workbox has no cached response for that exact URL and the
        // reload just fails instead of falling back to the cached app
        // shell (index.html), which is what actually renders the route.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        // App shell (JS/CSS/HTML/fonts) is precached automatically by the
        // plugin. These runtime rules cover everything fetched afterwards:
        // API calls, map tiles, and uploaded photos.
        runtimeCaching: [
          {
            // Your own backend API — try the network first (so data stays
            // fresh while online), fall back to the last cached response
            // when offline instead of a hard failure.
            urlPattern: ({ url }) => url.pathname.startsWith('/api') || /\/api\//.test(url.href),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // OpenStreetMap tiles used by Leaflet — cache aggressively so
            // maps you've already viewed still render offline.
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
            },
          },
          {
            // Cloudinary-hosted journal/receipt photos.
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'photo-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
