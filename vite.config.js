import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import seo from './vite-plugin-seo.js'

// https://vite.dev/config/
export default defineConfig({
  // seo() writes the LocalBusiness structured data into index.html and emits
  // sitemap.xml, both generated from src/data/services.jsx.
  plugins: [react(), seo()],
})
