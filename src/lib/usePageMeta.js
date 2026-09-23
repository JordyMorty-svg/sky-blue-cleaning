import { useEffect } from "react";
import { BUSINESS } from "../data/business";

/*
 * Per-page <head> tags for a single-page app.
 *
 * Every route shares one index.html, so without this every page tells Google
 * the same title and the same description. Google does run JavaScript before
 * indexing, so tags set here are what it sees — as long as they're set in a
 * way that doesn't contradict the static HTML.
 *
 * Tags are UPDATED IN PLACE, not added. React 19 can render <title> and <meta>
 * from inside a component and hoist them, but it appends: the description in
 * index.html would stay, and the page would carry two. Keeping the static
 * ones and changing their content also means crawlers that don't run
 * JavaScript at all — iMessage, Facebook, Slack link previews — still get a
 * sensible title and description rather than nothing.
 */

// Whatever index.html shipped with, captured once when this module first
// loads — which is before any route renders, so it's always the static
// values. That makes index.html the single place the homepage's title and
// description are written; nothing here restates them.
const DEFAULTS = {
  title: document.title,
  description: readMeta("name", "description"),
  ogTitle: readMeta("property", "og:title"),
  ogDescription: readMeta("property", "og:description"),
};

function readMeta(attr, key) {
  return document.head.querySelector(`meta[${attr}="${key}"]`)?.getAttribute("content") ?? "";
}

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
    const t = title ?? DEFAULTS.title;
    const d = description ?? DEFAULTS.description;

    document.title = t;
    setMeta("name", "description", d);
    setMeta("property", "og:title", title ?? DEFAULTS.ogTitle);
    setMeta("property", "og:description", description ?? DEFAULTS.ogDescription);

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
      document.title = DEFAULTS.title;
      setMeta("name", "description", DEFAULTS.description);
      setMeta("property", "og:title", DEFAULTS.ogTitle);
      setMeta("property", "og:description", DEFAULTS.ogDescription);
      setCanonical(null);
      setMeta("property", "og:url", null);
      setMeta("name", "robots", null);
    };
  }, [title, description, path, noindex]);
}
