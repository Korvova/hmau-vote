import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev API target: override with VITE_API_PORT when :5000 is taken locally
const apiTarget = `http://localhost:${process.env.VITE_API_PORT || 5000}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/hmau-vote/',
  build: {
    rollupOptions: {
      output: {
        // Add timestamp to filename to bust cache on every build
        entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  },
  server: {
    proxy: {
      // Forward API requests in dev to the backend on :5000
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // Also proxy Socket.IO if used
      '/socket.io': {
        target: apiTarget,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
