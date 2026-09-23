// Checks the SEO output of a real build: `npm run build && node verify/seo.mjs`
//
// Two halves.
//
//   1. The raw files in dist/ — what a crawler receives before any JavaScript
//      runs. sitemap.xml, robots.txt, and the structured data in index.html.
//   2. The pages as Google actually indexes them, rendered in Chromium: the
//      title, description and canonical URL each route ends up with.
//
// The second half needs Playwright (`npm i -D playwright`). Without it, the
// first half still runs and the second is skipped with a note.
//
// The assertions marked THE POINT are the ones this change exists for.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readServices, sitemapXml } from "../vite-plugin-seo.js";
import { BUSINESS } from "../src/data/business.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

let bad = 0;
const chk = (what, pass, detail = "") => {
  if (pass) console.log(`ok    ${what}`);
  else {
    bad++;
    console.log(`FAIL  ${what}${detail ? `\n        ${detail}` : ""}`);
  }
};

if (!existsSync(join(dist, "index.html"))) {
  console.log("No dist/ — run `npm run build` first.");
  process.exit(1);
}

const services = readServices(readFileSync(join(root, "src/data/services.jsx"), "utf8"));
const SITE = BUSINESS.url;

// ---------------------------------------------------------------------------
console.log("\n-- reading the service list --\n");

chk("all six services are found", services.length === 6, `found ${services.length}`);

{
  let threw = "";
  try {
    readServices('    slug: "a",\n    title: "A",\n    quote: "x",\n    slug: "b",\n    quote: "y",\n');
  } catch (e) {
    threw = e.message;
  }
  chk("THE POINT: a service whose title can't be read fails the build, not the sitemap",
    /2 slugs, 1 titles/.test(threw), threw || "did not throw");
}

{
  let threw = "";
  try {
    readServices("nothing here");
  } catch (e) {
    threw = e.message;
  }
  chk("an unreadable file fails loudly rather than producing an empty sitemap",
    /found no/.test(threw), threw || "did not throw");
}

{
  let threw = "";
  try {
    readServices('    slug: "Gutter Cleaning",\n    title: "G",\n    quote: "x",\n');
  } catch (e) {
    threw = e.message;
  }
  chk("a slug that isn't URL-safe is refused", /not a URL-safe slug/.test(threw), threw || "did not throw");
}

// ---------------------------------------------------------------------------
console.log("\n-- the sitemap --\n");

const sitemap = readFileSync(join(dist, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

chk("sitemap.xml is in the build", locs.length > 0);
chk("it lists the homepage", locs[0] === `${SITE}/`, locs[0]);
chk("THE POINT: every service page is in it",
  services.every((s) => locs.includes(`${SITE}/services/${s.slug}`)),
  `missing: ${services.filter((s) => !locs.includes(`${SITE}/services/${s.slug}`)).map((s) => s.slug).join(", ")}`);
chk("and nothing that isn't a real page", locs.length === services.length + 1, `${locs.length} urls`);
chk("every URL is on the canonical host, never www",
  locs.every((u) => u.startsWith(`${SITE}/`) && !u.includes("://www.")));
chk("no <lastmod> stamped with a build date Google would learn to distrust", !/<lastmod>/.test(sitemap));
chk("the built file is exactly what the generator produces", sitemap === sitemapXml(services));

const robots = readFileSync(join(dist, "robots.txt"), "utf8");
chk("robots.txt points crawlers at the sitemap", robots.includes(`Sitemap: ${SITE}/sitemap.xml`));
chk("and blocks nothing", !/^Disallow:\s*\S/m.test(robots));

// ---------------------------------------------------------------------------
console.log("\n-- structured data in the raw HTML --\n");

const html = readFileSync(join(dist, "index.html"), "utf8");
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

chk("exactly one JSON-LD block", blocks.length === 1, `${blocks.length}`);

let ld = null;
try {
  ld = JSON.parse(blocks[0]?.[1] ?? "");
} catch (e) {
  chk("it parses as JSON", false, e.message);
}

if (ld) {
  chk("it parses as JSON", true);
  chk("it is a LocalBusiness type", ld["@type"] === "HomeAndConstructionBusiness", ld["@type"]);
  chk("the name matches the site", ld.name === BUSINESS.name);
  chk("the phone is the business line, in international form",
    ld.telephone === "+15417303593", ld.telephone);
  chk("THE POINT: the phone Google is told is the one in the footer",
    ld.telephone === `+${BUSINESS.phoneDigits}`);
  chk("the town and state are there", ld.address?.addressLocality === "Corvallis" && ld.address?.addressRegion === "OR");
  chk("no street address — a service-area business shouldn't publish one", !ld.address?.streetAddress);
  chk("no invented opening hours", !("openingHours" in ld) && !("openingHoursSpecification" in ld));
  chk("no self-awarded review stars", !("aggregateRating" in ld));
  chk("it links to the Google Business Profile", /maps\?cid=\d+$/.test(ld.hasMap ?? ""), ld.hasMap);

  const offered = (ld.hasOfferCatalog?.itemListElement ?? []).map((o) => o.itemOffered?.url);
  chk("THE POINT: it lists the same services as the sitemap, from the same source",
    JSON.stringify(offered) === JSON.stringify(locs.slice(1)),
    JSON.stringify(offered));

  const logo = ld.logo?.replace(SITE, "");
  chk("the logo it points at is actually in the build", logo && existsSync(join(dist, logo)), ld.logo);
}

chk("THE POINT: the raw HTML has NO canonical link",
  !/<link[^>]+rel=["']canonical["']/i.test(html),
  "it is served for every route, so a canonical here would claim every page is the homepage");

// ---------------------------------------------------------------------------
console.log("\n-- the pages, rendered --\n");

let chromium = null;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("skip  Playwright isn't installed — `npm i -D playwright` to check the rendered pages");
}

if (chromium) {
  // A stand-in for Netlify: a file if it exists, otherwise index.html — the
  // same thing public/_redirects tells Netlify to do.
  const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
    ".xml": "application/xml", ".txt": "text/plain", ".png": "image/png",
    ".jpg": "image/jpeg", ".mp4": "video/mp4" };
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(dist, path);
    if (!file.startsWith(dist) || !existsSync(file) || statSync(file).isDirectory()) {
      file = join(dist, "index.html");
    }
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;

  const browser = await chromium.launch(
    existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {}
  );
  const page = await browser.newPage();

  // If the app throws on load, React never mounts, no route ever runs its
  // hook, and every page shows index.html's defaults — which reads as fifty
  // SEO failures when the real problem is one crash. The first run of this
  // file did exactly that: built without a .env, the Supabase client threw
  // "supabaseUrl is required". So errors are collected and reported first.
  const crashes = [];
  page.on("pageerror", (e) => crashes.push(e.message));
  await page.goto(`${base}/`);
  await page.waitForTimeout(300);
  if (crashes.length) {
    console.log(`FAIL  the app crashed on load, so nothing below would mean anything:\n        ${crashes[0]}`);
    console.log("        (built without VITE_SUPABASE_URL? try:");
    console.log("         VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=x npm run build)");
    await browser.close();
    server.close();
    process.exit(1);
  }
  chk("the app renders without throwing", true);

  const head = () =>
    page.evaluate(() => ({
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content ?? null,
      descriptions: document.querySelectorAll('meta[name="description"]').length,
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
      canonicals: document.querySelectorAll('link[rel="canonical"]').length,
      ogUrl: document.querySelector('meta[property="og:url"]')?.content ?? null,
      robots: document.querySelector('meta[name="robots"]')?.content ?? null,
    }));

  const homeTitle = "Sky Blue Cleaning Co. - Window Washing in Corvallis, OR";

  await page.goto(`${base}/`);
  const home = await head();
  chk("homepage keeps its title", home.title === homeTitle, home.title);
  chk("homepage canonical is the bare domain", home.canonical === `${SITE}/`, home.canonical);

  await page.goto(`${base}/?gclid=abc123`);
  const ad = await head();
  chk("THE POINT: an ad click's ?gclid URL canonicalises to the homepage",
    ad.canonical === `${SITE}/`, ad.canonical);

  const seen = new Set();
  for (const s of services) {
    await page.goto(`${base}/services/${s.slug}`);
    const h = await head();
    seen.add(h.description);
    chk(`${s.slug}: title names the town`,
      h.title === `${s.title} in Corvallis, OR — Sky Blue Cleaning Co.`, h.title);
    chk(`${s.slug}: canonical is its own URL`, h.canonical === `${SITE}/services/${s.slug}`, h.canonical);
    chk(`${s.slug}: description is its own and names Corvallis`,
      h.description && h.description !== home.description && /Corvallis/.test(h.description),
      h.description);
    chk(`${s.slug}: description fits in a search result`, h.description.length <= 160,
      `${h.description.length} chars`);
    chk(`${s.slug}: one description, one canonical — updated, not duplicated`,
      h.descriptions === 1 && h.canonicals === 1, `${h.descriptions} / ${h.canonicals}`);
    chk(`${s.slug}: og:url agrees with the canonical`, h.ogUrl === h.canonical);
    chk(`${s.slug}: indexable`, h.robots === null, h.robots);
  }
  chk("THE POINT: six services, six different descriptions", seen.size === services.length,
    `${seen.size} distinct`);

  // Leaving a service page used to leave the tab titled a bare
  // "Sky Blue Cleaning Co." — the location dropped off the homepage title.
  await page.goto(`${base}/services/gutter-cleaning`);
  await page.click('a[href="/"]');
  await page.waitForFunction(() => location.pathname === "/");
  const back = await head();
  chk("navigating back home restores the homepage title, location and all",
    back.title === homeTitle, back.title);
  chk("...and its canonical", back.canonical === `${SITE}/`, back.canonical);

  await page.goto(`${base}/services/no-such-thing`);
  const missing = await head();
  chk("THE POINT: an unknown URL is marked noindex, not left as a soft 404",
    missing.robots === "noindex", missing.robots);
  chk("...and claims no canonical", missing.canonical === null, missing.canonical);

  await page.goto(`${base}/sitemap.xml`);
  chk("sitemap.xml is served as itself, not swallowed by the SPA fallback",
    (await page.content()).includes("<urlset") || (await page.evaluate(() => document.contentType)).includes("xml"));

  await browser.close();
  server.close();
}

// ---------------------------------------------------------------------------
console.log(bad === 0 ? "\nall ok — SEO holds\n" : `\n${bad} FAILED\n`);
process.exit(bad === 0 ? 0 : 1);
