import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: [],
        runtimeCaching: [
          {
            urlPattern: /\.convex\.cloud\/api\/storage\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'convex-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Catálogo Candle',
        short_name: 'Candle',
        theme_color: '#06b6d4',
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
