import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5173,
    headers: {
      'Cache-Control': 'no-cache'
    },
    watch: {
      ignored: [
        '**/_research/**',
        '**/resourses/**',
        '**/rebuild/**',
        '**/*chrome*/**',
        '**/.workbuddy-ai/**',
        '**/chrome-profile/**',
        '**/node_modules/**',
        '**/*.png',
        '**/*.jpg'
      ]
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 3000,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
        }
      }
    }
  }
});
