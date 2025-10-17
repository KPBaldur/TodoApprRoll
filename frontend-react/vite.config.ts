import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const apiUrl = isProd
    ? process.env.VITE_API_URL
    : process.env.VITE_API_URL_DEV || 'http://localhost:3000'

  return {
    plugins: [react()],
    // Dev server only (proxy is ignored in production builds)
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL_DEV || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: process.env.VITE_API_URL_DEV || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_API_URL_DEV': JSON.stringify(process.env.VITE_API_URL_DEV || ''),
    },
  }
})
