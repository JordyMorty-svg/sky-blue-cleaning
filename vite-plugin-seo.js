/*
 * Build-time SEO: the structured data Google reads, and the sitemap.
 *
 * Both are GENERATED from src/data/services.jsx and src/data/business.js
 * rather than written by hand. That is the whole design. A hand-written
 * sitemap is correct the day it's written and wrong the day somebody adds a
 * seventh service, and nothing tells you — Google simply never finds the new
 * page. Generated, adding a service to services.jsx is the only step.
 *
 *   - LocalBusiness JSON-LD is injected into index.html (dev and build), so
 *     it's in the raw HTML every crawler receives, JavaScript or not.
 *   - sitemap.xml is emitted into dist/ on build. It is not in public/ and
 *     not committed: there is no copy to go stale.
 *
 * services.jsx is JSX — it holds the icons — so Node can't import it here.
 * It's read as text instead, and only two fields are taken from it: `slug`
 * and `title`. That's safe only because the parse refuses to guess: if the
 * counts don't line up, the BUILD FAILS with a message saying so, rather than
 * quietly publishing a sitemap missing a page.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BUSINESS } from "./src/data/business.js";

const SERVICES_FILE = fileURLToPath(new URL("./src/data/services.jsx", import.meta.url));

/**
 * `[{ slug, title }]`, in the order the site shows them.
 *
 * Cross-checked three ways — slugs, titles, and `quote:` modes must all
 * number the same — because the failure this guards against is silent. A
 * service whose `title` got wrapped onto a second line by a formatter would
 * otherwise vanish from the sitemap and the structured data while the page
 * itself kept working, and nobody would notice for months.
 */
export function readServices(source) {
  const slugs = [...source.matchAll(/^\s+slug: "([^"]+)",\s*$/gm)].map((m) => m[1]);
  const titles = [...source.matchAll(/^\s+title: "([^"]+)",\s*$/gm)].map((m) => m[1]);
  const modes = [...source.matchAll(/^\s+quote: "([^"]+)",\s*$/gm)].length;

  if (!slugs.length) {
    throw new Error("vite-plugin-seo: found no `slug: \"...\"` lines in src/data/services.jsx");
  }
  if (slugs.length !== titles.length || slugs.length !== modes) {
    throw new Error(
      `vite-plugin-seo: src/data/services.jsx has ${slugs.length} slugs, ${titles.length} titles ` +
        `and ${modes} quote modes — they should match. Keep \`slug: "..."\` and \`title: "..."\` ` +
        `each on a single line so the sitemap can read them.`
    );
  }
  for (const s of slugs) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      throw new Error(`vite-plugin-seo: "${s}" is not a URL-safe slug`);
    }
  }
  if (new Set(slugs).size !== slugs.length) {
    throw new Error("vite-plugin-seo: two services share a slug");
  }

  return slugs.map((slug, i) => ({ slug, title: titles[i] }));
}

const serviceUrl = (business, slug) => `${business.url}/services/${slug}`;

/**
 * A plain sitemap.
 *
 * No <lastmod>, <changefreq> or <priority>. Google ignores the last two
 * outright, and only trusts <lastmod> from sites where it has proven
 * accurate — a date stamped on every build would be wrong on every build,
 * and teach Google to ignore it.
 */
export function sitemapXml(services, business = BUSINESS) {
  const urls = [`${business.url}/`, ...services.map((s) => serviceUrl(business, s.slug))];
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join("\n") +
    "\n</urlset>\n"
  );
}

/**
 * schema.org LocalBusiness, as JSON-LD.
 *
 * What is deliberately NOT here, and why:
 *
 *   - streetAddress / geo. A service-area business; Google's guidance is not
 *     to publish a street address, and the Business Profile hides it too.
 *   - openingHours. Not written down anywhere in the site. Structured data
 *     that disagrees with the Business Profile is worse than none, so this
 *     waits until the hours are decided rather than being guessed.
 *   - priceRange. Same reason.
 *   - aggregateRating. Google does not show review stars for a business's
 *     ratings of itself, and a number here that isn't the Business Profile's
 *     real count would be misleading.
 */
export function localBusinessJsonLd(services, business = BUSINESS) {
  return {
    "@context": "https://schema.org",
    // The closest schema.org type to window cleaning; a LocalBusiness subtype.
    "@type": "HomeAndConstructionBusiness",
    "@id": `${business.url}/#business`,
    name: business.name,
    alternateName: business.alternateName,
    url: `${business.url}/`,
    logo: `${business.url}/logo.png`,
    image: `${business.url}/logo.png`,
    telephone: business.phoneE164,
    email: business.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: business.locality,
      addressRegion: business.region,
      addressCountry: business.country,
    },
    areaServed: [
      {
        "@type": "City",
        name: business.locality,
        containedInPlace: { "@type": "State", name: business.regionName },
      },
      { "@type": "Place", name: business.serviceArea },
    ],
    hasMap: `https://www.google.com/maps?cid=${business.googleMapsCid}`,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.title,
          url: serviceUrl(business, s.slug),
        },
      })),
    },
  };
}

/**
 * JSON safe to drop inside a <script> element.
 *
 * JSON.stringify doesn't escape "<", so a value containing "</script>" would
 * end the element early and spill the rest into the page as HTML. Nothing
 * here contains one today; this is what stops a service name ever doing it.
 */
export function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default function seo() {
  const load = () => readServices(readFileSync(SERVICES_FILE, "utf8"));

  return {
    name: "sky-blue-seo",

    buildStart() {
      // Rebuild when the service list changes in `vite build --watch`.
      this.addWatchFile(SERVICES_FILE);
    },

    transformIndexHtml() {
      return [
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          children: jsonForScript(localBusinessJsonLd(load())),
          injectTo: "head",
        },
      ];
    },

    generateBundle() {
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: sitemapXml(load()) });
    },
  };
}
