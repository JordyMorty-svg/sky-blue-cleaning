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
