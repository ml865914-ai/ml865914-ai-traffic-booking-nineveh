import './fix-dirname.js';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  // Use repository base path for GitHub Pages (/traffic-booking-nineveh/), or '/' for root/custom domain/local dev
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true' || process.env.DEPLOY_TARGET === 'gh-pages';
  const base = isGitHubPages ? '/traffic-booking-nineveh/' : (process.env.VITE_BASE || '/');

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: base,
          name: 'مكتب عبدالله السيد للحجز المروري',
          short_name: 'مكتب عبدالله السيد',
          description: 'منصة مكتب عبدالله السيد لاستقبال وتنظيم طلبات الحجوزات والخدمات المرورية داخل محافظة نينوى.',
          theme_color: '#0f2942',
          background_color: '#0f2942',
          display: 'standalone',
          dir: 'rtl',
          lang: 'ar',
          start_url: base,
          scope: base,
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
