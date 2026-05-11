import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/eia': {
        target: 'https://api.eia.gov',
        changeOrigin: true,
        rewrite: (path) => {
          const u = new URL(path, 'http://x');
          const eiaPath = u.searchParams.get('path');
          u.searchParams.delete('path');
          return `/v2/${eiaPath}?${u.searchParams.toString()}`;
        },
      },
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => {
          const u = new URL(path, 'http://x');
          const fredPath = u.searchParams.get('path');
          u.searchParams.delete('path');
          return `/fred/${fredPath}?${u.searchParams.toString()}`;
        },
      },
    },
  },
})
