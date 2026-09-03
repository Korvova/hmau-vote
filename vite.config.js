import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Статические css/js из public (main.css, libs.css, js/*) не хэшируются Vite и
// кэшируются nginx на год — добавляем ?v=<время сборки>, чтобы обновления доезжали
const cacheBustStatic = () => ({
  name: 'cache-bust-static',
  transformIndexHtml(html) {
    const v = Date.now();
    return html.replace(/(\/hmau-vote\/(?:css|js)\/[^"'?]+?\.(?:css|js))(["'])/g, `$1?v=${v}$2`);
  },
});

// Dev API target: override with VITE_API_PORT when :5000 is taken locally
const apiTarget = `http://localhost:${process.env.VITE_API_PORT || 5000}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cacheBustStatic()],
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
      // Загруженные файлы под префиксом сайта (как на проде через nginx)
      '/hmau-vote/uploads': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/hmau-vote/, ''),
      },
      // Загруженные файлы (материалы повестки, логотипы) отдаёт API
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
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
