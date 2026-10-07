import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import seo from './vite-plugin-seo.js'
import prerender from './vite-plugin-prerender.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // Writes the LocalBusiness structured data into index.html and emits
    // sitemap.xml, both generated from src/data/services.jsx.
    seo(),

    // Renders every route to real HTML. Runs last, so each page is cut from
    // the finished index.html — structured data, hashed script tags and all.
    prerender(),
  ],
})
