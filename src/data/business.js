/*
 * The business itself: name, address on the web, how to reach it.
 *
 * Plain data with no imports, on purpose. Three different things read it:
 *
 *   - the browser, through lib/leadSubmit.js (footer, both quote forms)
 *   - the browser, through lib/usePageMeta.js (canonical URLs)
 *   - Node, at BUILD time, through vite-plugin-seo.js (the structured data
 *     Google reads, and the sitemap)
 *
 * The last one is why this can't live in leadSubmit.js, where the phone
 * number used to be: that file imports the Supabase client, which reads
 * import.meta.env and can't be loaded outside Vite. Keeping the facts here
 * means the number a customer taps in the footer and the number Google is
 * told about can never disagree.
 */

export const BUSINESS = {
  name: "Sky Blue Cleaning Co.",

  /*
   * The homepage's <title> and meta description — the sentence that shows up
   * in a Google result.
   *
   * These used to live only in index.html, and the app read them back out of
   * the document when it needed them. That worked while index.html was served
   * for every URL: whatever the document shipped with WAS the homepage's.
   *
   * Prerendering ended that. Every page now ships its own title, so an app
   * booted on /services/gutter-cleaning read "Gutter Cleaning…" as the
   * homepage's title, and clicking Home left the tab saying so. (verify/seo.mjs
   * caught it, in a check written for an unrelated bug months earlier.)
   *
   * So they are stated once, here, and used twice: vite-plugin-seo.js writes
   * them into index.html at build time, and lib/usePageMeta.js uses them
   * whenever a route doesn't set its own. Neither reads them off the page.
   *
   * The description is kept under 155 characters — Google truncates around
   * there, and the SEO checker wants 120-155.
   */
  homeTitle: "Sky Blue Cleaning Co. - Window Washing in Corvallis, OR",
  homeDescription:
    "Family-run window washing in Corvallis and the Willamette Valley. Windows, " +
    "gutters and screens, residential and commercial. Fully insured — free quote.",

  // What the Google Business Profile is currently called. Declared as an
  // alternateName so Google can tie this site to that listing. The better
  // fix is for the two names to match — see the note in the project docs.
  alternateName: "Sky Blue Window Cleaning",

  // No trailing slash. The canonical host — the bare domain, which is what
  // www.skybluecleaningco.com redirects to. A canonical URL pointing at a
  // host that redirects is an error Google reports, so this must be the one
  // the address bar ends up on.
  url: "https://skybluecleaningco.com",

  phoneDisplay: "(541) 730-3593",
  phoneDigits: "15417303593", // for tel:/sms: links, no spaces
  phoneE164: "+15417303593",

  email: "company@skybluecleaningco.com",

  // A service-area business: the crew goes to the customer. So a town and a
  // region, and deliberately no street address — Google's own guidance for
  // service-area businesses is not to publish one.
  locality: "Corvallis",
  region: "OR",
  regionName: "Oregon",
  country: "US",
  serviceArea: "Willamette Valley",

  // The Google Business Profile, by customer ID. Decoded from the maps link
  // the Reviews section already uses (0x20b59432f17d2940).
  googleMapsCid: "2356952926519109952",
};
