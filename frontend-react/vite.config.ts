import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const apiUrl = isProd
    ? process.env.VITE_API_URL || 'https://todoapproll.onrender.com'
    : process.env.VITE_API_URL_DEV || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
  }
})
