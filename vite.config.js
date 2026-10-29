import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import { getManifest } from './src/manifest.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

function manifestPlugin() {
  return {
    name: 'generate-manifest',
    generateBundle() {
      const manifest = getManifest(pkg);
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(manifest, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [manifestPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/extension/popup/popup.html'),
        options: resolve(__dirname, 'src/extension/options/options.html'),
        sidepanel: resolve(__dirname, 'src/extension/sidepanel/sidepanel.html'),
        offscreen: resolve(__dirname, 'src/extension/offscreen/offscreen.html'),
        'service-worker': resolve(__dirname, 'src/extension/background/service-worker.js'),
        'content-script': resolve(__dirname, 'src/extension/content/content-script.js'),
        'stockfish-worker': resolve(__dirname, 'src/extension/workers/stockfish-worker.js'),
      },
      output: {
        entryFileNames: chunkInfo => {
          if (chunkInfo.name === 'service-worker') {
            return 'src/extension/background/service-worker.js';
          }
          if (chunkInfo.name === 'content-script') {
            return 'src/extension/content/content-script.js';
          }
          if (chunkInfo.name === 'stockfish-worker') {
            return 'src/extension/workers/stockfish-worker.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
