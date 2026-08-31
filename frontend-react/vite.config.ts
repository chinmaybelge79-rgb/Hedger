import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'charts';
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) return 'ui';
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@tanstack/react-query')) return 'vendor';
          }
        },
      },
    },
  },
});