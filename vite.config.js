import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function compressPlugin() {
  return {
    name: 'vite-plugin-static-precompress',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) return;

      const compressFile = (filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (!['.js', '.css', '.html', '.svg', '.json', '.glb', '.vsplat', '.wasm', '.ktx2'].includes(ext)) return;

        const content = fs.readFileSync(filePath);
        if (content.length < 512) return; // skip tiny files

        // Gzip compression
        const gzipped = zlib.gzipSync(content, { level: 9 });
        fs.writeFileSync(`${filePath}.gz`, gzipped);

        // Brotli compression
        const brotli = zlib.brotliCompressSync(content, {
          params: {
            [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY
          }
        });
        fs.writeFileSync(`${filePath}.br`, brotli);
      };

      const traverse = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            traverse(fullPath);
          } else if (entry.isFile()) {
            compressFile(fullPath);
          }
        }
      };

      traverse(distDir);
      console.log('✓ Production assets pre-compressed with Gzip & Brotli (Max Quality)');
    }
  };
}

function osRewritePlugin() {
  return {
    name: 'os-rewrite-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/os' || req.url === '/os/') {
          req.url = '/os/index.html';
        }
        if (req.url === '/portfolio' || req.url === '/portfolio/') {
          req.url = '/portfolio/index.html';
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [compressPlugin(), osRewritePlugin()],
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
        '**/_henry/**',
        '**/_henry_os/**'
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
