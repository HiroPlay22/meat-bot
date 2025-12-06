import { defineConfig } from 'vite';
import nunjucks from 'vite-plugin-nunjucks';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname, 'src/web'),
  publicDir: path.resolve(__dirname, 'src/web/assets'),
  build: {
    outDir: path.resolve(__dirname, 'dist/web'),
    emptyOutDir: false,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'src/web/index.html'),
        dashboard: path.resolve(__dirname, 'src/web/dashboard.html'),
        events: path.resolve(__dirname, 'src/web/events.html'),
      },
    },
  },
  plugins: [
    nunjucks({
      templatesDir: path.resolve(__dirname, 'src/web'),
      nunjucksConfigure: {
        noCache: true,
        searchPaths: [
          path.resolve(__dirname, 'src/web'),
          path.resolve(__dirname, 'src/web/templates'),
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});

