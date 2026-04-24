import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'https://snip-backend-52kc.onrender.com/',
      // proxy redirect requests to backend too
    }
  }
})
