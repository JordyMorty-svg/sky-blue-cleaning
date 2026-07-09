# Sky Blue Cleaning Co. — Website

Marketing site for Sky Blue Cleaning Co., a family-run window washing business
serving Corvallis and the Willamette Valley, Oregon.

**Live site:** https://skybluecleaningco.com

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) (JavaScript, no TypeScript)
- Plain CSS — one stylesheet per component, BEM-style class names
- [Web3Forms](https://web3forms.com/) for quote form submissions (no backend)
- Hosted on [Netlify](https://netlify.com), auto-deploys from `main`

## Local development

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build to dist/
npm run preview  # preview the production build locally
```

## Project structure

```
src/
  assets/            # optimized images + hero video loop
  components/
    navbar/          # sticky nav
    hero/            # headline + looping video (hero-loop.mp4)
    services/        # six service cards
    about/           # brand story + team bios (Hayden & Jordan)
    reviews/         # curated Google reviews + review links
    quoteform/       # live price estimator + Web3Forms submission
    footer/          # contact info, links, insurance line
  App.jsx            # assembles all sections in page order
```

The site is a single page; the navbar links scroll to section anchors
(`#home`, `#services`, `#about`, `#reviews`, `#quote`, `#contact`).

## Things you'll want to find later

| What | Where |
|---|---|
| Pricing (base rates, per-window, interior add-on) | `PRICING` object at the top of `src/components/quoteform/QuoteForm.jsx` |
| Business phone / email | Constants at the top of `QuoteForm.jsx` and `Footer.jsx` |
| Web3Forms access key | `WEB3FORMS_ACCESS_KEY` in `QuoteForm.jsx` (public-safe key; only delivers to our inbox) |
| Google review link | `GOOGLE_REVIEWS_URL` in `src/components/reviews/Reviews.jsx` |
| Review text | `reviews` array in `Reviews.jsx` — paste new Google reviews verbatim |
| Team bios | `team` array in `src/components/about/About.jsx` |
| Page title / meta description / favicons | `index.html` + `public/` |

## Media pipeline notes

Raw photos/videos are **not** committed (`.gitignore` blocks `*.mov`; GitHub
rejects files over 100MB). Everything in `src/assets/` is pre-optimized:

- Photos: resized to ~1200px, JPEG quality ~82, EXIF rotation baked in
- Hero video: trimmed to 12s, cropped, 540px wide, 24fps, muted, ~2.2MB MP4
  (`faststart` enabled), with a poster JPEG for instant paint

Keep raw originals in cloud storage, not in this repo.

## Deploying

Push to `main` — Netlify builds and publishes automatically.

- Build command: `npm run build` (NOT `npm run dev` — dev never exits and the
  deploy will hang)
- Publish directory: `dist`