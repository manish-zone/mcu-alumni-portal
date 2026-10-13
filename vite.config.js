import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const autoSanitizePlugin = () => ({
  name: 'auto-sanitize-plugin',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('main.jsx')) {
      return code.replace(/\)\s*;?\s*[a-zA-Z]+\s*$/, ');');
    }
    if (id.includes('App.jsx')) {
      return code
        .replace(/import\s*\{[^}]*HallOfFame[^}]*\}\s*from\s*['"][^'"]+['"];?/g, '')
        .replace(/<HallOfFame\s*\/>/g, '');
    }
    if (id.includes('Navbar.jsx')) {
      return code.replace(/\{[^}]*id:\s*['"]hall-of-fame['"][^}]*\},?/g, '');
    }
    return null;
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    autoSanitizePlugin(),
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',   // → API Gateway (Microservices)
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
    },
  },
})
