/*
 * What <head> tags a URL gets. One function, two callers.
 *
 * This used to live inline in the page components, which was fine while the
 * only thing setting head tags was the running app. Prerendering adds a
 * SECOND thing that has to know the answer — the build writes the title,
 * description and canonical into the static HTML before any JavaScript runs.
 *
 * If those two disagree, the page tells Google one thing in its raw HTML and
 * another a moment later, and Google's own guidance is that a canonical set
 * by JavaScript must not contradict the one in the HTML. The only way to be
 * sure they never disagree is for there to be nothing to disagree WITH: the
 * page component and the prerenderer both call this.
 *
 * It takes a pathname rather than a service, because that is the one thing
 * the build and the browser both have.
 */

import { serviceBySlug, serviceTitle } from "../data/services";
import { legalBySlug } from "../data/legal";

/*
 * An unknown URL answers 200 — there is no server to send a 404 — so Google
 * would otherwise see a real-looking page at a nonsense address and report a
 * soft 404. noindex is the honest substitute, and no canonical: a page that
 * shouldn't be indexed has no business nominating a preferred URL.
 */
export const NOT_FOUND = {
  title: "Page not found — Sky Blue Cleaning Co.",
  noindex: true,
};

function tidy(pathname) {
  const p = String(pathname || "/").split("?")[0].split("#")[0];
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/**
 * @param  {string} pathname  e.g. "/services/gutter-cleaning"
 * @return {{title?: string, description?: string, path?: string, noindex?: boolean}}
 *         exactly the shape usePageMeta() takes.
 */
export function metaForPath(pathname) {
  const path = tidy(pathname);

  // The homepage deliberately returns no title and no description. Those are
  // written once, in index.html, and nothing here restates them — so there is
  // only ever one place to change the sentence that shows up in Google.
  if (path === "/") return { path: "/" };

  // THE LEGAL PAGES, before the service lookup.
  //
  // Without this they fall through to NOT_FOUND, which carries noindex — and
  // the prerenderer writes whatever this function says into the static HTML.
  // Google's OAuth review fetches the privacy policy URL; serving it with
  // noindex and no canonical would be telling Google to ignore the page it
  // was sent to read.
  const legal = legalBySlug[path.slice(1)];
  if (legal) {
    return {
      title: legal.metaTitle,
      description: legal.metaDescription,
      path: `/${legal.slug}`,
    };
  }

  const match = /^\/services\/([^/]+)$/.exec(path);
  let slug = null;
  if (match) {
    try {
      slug = decodeURIComponent(match[1]);
    } catch {
      slug = match[1]; // a malformed %-escape is just an unknown page
    }
  }

  const service = slug ? serviceBySlug[slug] : null;
  if (!service) return NOT_FOUND;

  return {
    title: serviceTitle(service),
    description: service.metaDescription,
    path: `/services/${service.slug}`,
  };
}
