import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Intercepta cualquier solicitud que empiece por /api
      "/api": {
        target: "https://todoapprroll.onrender.com", // Tu backend en Render
        changeOrigin: true, // Hace que el origen parezca el del backend
        secure: true,       // Importante porque Render usa HTTPS
        rewrite: (path) => path.replace(/^\/api/, "/api"), // Quita /api antes de reenviar
      },
    },
  },
});

