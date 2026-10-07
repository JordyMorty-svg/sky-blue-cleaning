import { useEffect } from "react";
import { BUSINESS } from "../data/business";

/*
 * Per-page <head> tags for a single-page app.
 *
 * Every route is now PRERENDERED with its own correct tags already in the
 * file, so a crawler, a link-preview scraper and a reader with JavaScript off
 * all get the right ones without this hook running at all. What this is still
 * for is navigation: clicking from the homepage to a service page never
 * fetches a document, so nothing but this changes the tab's title, the
 * canonical an ad click lands on, or what a share sheet reads.
 *
 * Which makes agreeing with the static HTML the whole job. Both sides get
 * their answer from lib/pageMeta.js — the build calls it, the page component
 * calls it — so there is no second opinion to drift.
 *
 * Tags are UPDATED IN PLACE, not added. React 19 can render <title> and <meta>
 * from inside a component and hoist them, but it appends: the prerendered
 * description would stay and the page would carry two, which is its own SEO
 * fault.
 */

/*
 * What a page falls back to when it sets no title or description of its own:
 * the homepage's.
 *
 * This used to be read off the document — document.title as it stood when the
 * module first loaded. That was correct precisely because index.html was
 * served for every URL, so whatever the document shipped with was always the
 * homepage's.
 *
 * Prerendering ended that. /services/gutter-cleaning now ships its own title
 * in its own file, so an app booted there captured "Gutter Cleaning in
 * Corvallis, OR" as the homepage's title, and clicking Home left the tab
 * saying so. The strings moved to business.js, which both this and the build
 * read — so there is nothing left to capture, and nothing to get wrong.
 */
const HOME = {
  title: BUSINESS.homeTitle,
  description: BUSINESS.homeDescription,
};

/** Set a <meta>, creating it if absent. `null` removes it. */
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (content == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Set <link rel="canonical">, creating it if absent. `null` removes it. */
function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (href == null) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * @param {object}  meta
 * @param {string}  [meta.title]        full <title>; omit for the homepage default
 * @param {string}  [meta.description]  omit for the homepage default
 * @param {string}  [meta.path]         e.g. "/services/gutter-cleaning" — becomes the canonical URL
 * @param {boolean} [meta.noindex]      a page that must not be indexed
 */
export function usePageMeta({ title, description, path, noindex = false } = {}) {
  useEffect(() => {
    const t = title ?? HOME.title;
    const d = description ?? HOME.description;

    document.title = t;
    setMeta("name", "description", d);
    setMeta("property", "og:title", title ?? HOME.title);
    setMeta("property", "og:description", description ?? HOME.description);

    // The canonical URL is set here and ONLY here — never in index.html.
    //
    // A static <link rel="canonical" href="/"> in index.html would be in the
    // raw HTML of every route, so /services/gutter-cleaning would first
    // declare itself a copy of the homepage and then, once the JavaScript
    // ran, claim otherwise. Google's guidance is that a canonical set by
    // JavaScript must not contradict one in the original HTML; the only way
    // to guarantee that is for the original HTML to have none.
    //
    // It is worth having at all because of Google Ads: every paid click
    // lands on a URL with ?gclid=… on the end, and without a canonical each
    // of those is a separate page as far as indexing is concerned.
    const url = path && !noindex ? `${BUSINESS.url}${path === "/" ? "/" : path}` : null;
    setCanonical(url);
    setMeta("property", "og:url", url);

    // A route that renders "not found" still answers 200 — there's no server
    // to send a 404 — so Google sees a real-looking page at a nonsense URL
    // and reports it as a soft 404. noindex is the honest substitute.
    setMeta("name", "robots", noindex ? "noindex" : null);

    return () => {
      // Back to exactly what index.html shipped with, so a route that forgets
      // to call this hook inherits the homepage's tags rather than the last
      // page's. (It also fixes the old behaviour, where leaving a service
      // page set the tab to a bare "Sky Blue Cleaning Co." and dropped the
      // location from the homepage title.)
      document.title = HOME.title;
      setMeta("name", "description", HOME.description);
      setMeta("property", "og:title", HOME.title);
      setMeta("property", "og:description", HOME.description);
      setCanonical(null);
      setMeta("property", "og:url", null);
      setMeta("name", "robots", null);
    };
  }, [title, description, path, noindex]);
}
