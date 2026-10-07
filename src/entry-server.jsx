/*
 * The app, rendered to a string at build time.
 *
 * The browser entry is main.jsx: it mounts <App/> into #root. This is the
 * same app with the same routes, rendered under Node by the build so that
 * every page ships as real HTML — a heading, the words, the links — instead
 * of an empty <div id="root">.
 *
 * It is NOT a server. Nothing imports this at runtime; vite-plugin-prerender.js
 * builds it, calls render() once per route, writes the files and throws it
 * away.
 *
 * StaticRouter instead of BrowserRouter for the obvious reason: there is no
 * history and no address bar, just a path handed in.
 */

import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import App from "./App.jsx";
import { services } from "./data/services";
import { LEGAL_PAGES } from "./data/legal";
import { metaForPath } from "./lib/pageMeta";
import { BUSINESS } from "./data/business";

/*
 * A path that cannot be a real page, used to render the "we couldn't find
 * that service" view into its own file. Netlify serves that file for
 * anything unrecognised — see public/_redirects.
 */
export const NOT_FOUND_ROUTE = "/__not-found__";

/**
 * Every page the site has.
 *
 * Read from services.jsx itself, which is the same list the sitemap and the
 * structured data come from. Adding a service to that file is the only step:
 * it gets a page, a sitemap entry and prerendered HTML, or it gets none of
 * them — there is no second list to forget.
 */
export function routes() {
  return [
    "/",
    ...services.map((s) => `/services/${s.slug}`),
    // Prerendered like everything else. public/_redirects sends any URL
    // without a real file to /not-found.html, so a route missing from this
    // list is a route that serves "we couldn't find that service" — which for
    // the privacy policy means Google's reviewer is shown a 404 page.
    ...LEGAL_PAGES.map((p) => `/${p.slug}`),
  ];
}

/**
 * The head tags a route's static HTML should carry.
 *
 * Derived from metaForPath() — the same call the page component makes — so
 * the static tags and the ones JavaScript sets cannot say different things.
 * `null` means "leave whatever index.html already has"; for the homepage
 * that is the point, since index.html's title and description ARE the
 * homepage's.
 */
export function headFor(route) {
  const meta = metaForPath(route);
  const url =
    meta.path && !meta.noindex
      ? `${BUSINESS.url}${meta.path === "/" ? "/" : meta.path}`
      : null;

  return {
    title: meta.title ?? null,
    description: meta.description ?? null,
    canonical: url,
    // Removed rather than left pointing at the homepage: a link preview for
    // a service page that claims to be the homepage is worse than one with
    // no URL at all.
    ogUrl: url,
    noindex: Boolean(meta.noindex),
  };
}

/** The app's markup for one path. */
export function render(route) {
  return renderToString(
    <StrictMode>
      <StaticRouter location={route}>
        <App />
      </StaticRouter>
    </StrictMode>
  );
}
