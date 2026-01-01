import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({}),
    'global': 'globalThis',
  },
  build: {
    outDir: '../dist-viewer',
    lib: {
      entry: path.resolve(__dirname, 'src/main.tsx'),
      name: 'ConceptMapViewer',
      formats: ['iife'], // Single self-contained bundle
      fileName: 'viewer'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
      }
    },
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    }
  }
});
