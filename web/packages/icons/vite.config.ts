import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'preview',
  plugins: [react()],
  server: {
    port: 4173,
  },
})
