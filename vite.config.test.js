import { defineConfig } from 'vite';
import { resolve } from 'path';
import { multiPagePlugin, entryPoints } from './build/vite-plugin-multi-page';

export default defineConfig({
  build: {
    rollupOptions: {
      input: entryPoints,
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css')
            return 'assets/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  plugins: [multiPagePlugin()],
});
