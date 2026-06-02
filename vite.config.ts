import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  base: isProd ? '/dashboard/' : '/',
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
})
