import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/image-to-pdf/',
  plugins: [
    react(),
    {
      name: 'development-csp',
      apply: 'serve',
      // Vite injects styles and its live-reload client during development.
      // Production builds retain the restrictive policy in index.html.
      transformIndexHtml(html) {
        return html.replace(
          /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
          '',
        );
      },
    },
  ],
  build: { target: 'es2022' },
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
  },
});
