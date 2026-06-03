import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    allowedHosts: 'all',
    proxy: {
      '/api': 'http://localhost:2019',
    },
    watch: {
      ignored: ['**/layout.json'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
