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
import { checkMarkup, injectInto } from "../vite-plugin-prerender.js";
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

// ---------------------------------------------------------------------------
console.log("\n-- the pages before any JavaScript runs --\n");
//
// This section is the SEO checker's four red marks — H1, Content Depth,
// Internal Links, Canonical Tag — all of which were one problem: the site
// shipped an empty <div id="root"> and let JavaScript fill it in. Everything
// below reads the raw bytes on disk, which is what a link-preview scraper or
// a crawler that doesn't run JavaScript receives.
//
// Note what changed about the canonical. The old version of this file
// asserted the raw HTML had NO canonical, and that was right: index.html was
// served for every URL, so a canonical in it would have told Google each
// service page was a copy of the homepage. Now each page is its own file, so
// each one can and must carry its own. The invariant didn't go away, it moved:
// no page may claim to be a different page.

const page = (route) => {
  const file = route === "/" ? "index.html" : `${route.replace(/^\//, "")}/index.html`;
  return readFileSync(join(dist, file), "utf8");
};
const body = (h) => h.split('<div id="root">')[1] ?? "";
const visibleWords = (h) =>
  body(h)
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
const tag = (h, re) => h.match(re)?.[1] ?? null;
const count = (h, re) => h.match(re)?.length ?? 0;

const CANON = /<link rel="canonical" href="([^"]*)"/;
const DESC = /name="description"\s*\n?\s*content="([^"]*)"/;

for (const route of ["/", ...services.map((s) => `/services/${s.slug}`)]) {
  const h = page(route);
  const where = route === "/" ? "homepage" : route.replace("/services/", "");

  chk(`${where}: THE POINT — the raw HTML has the page in it, not an empty div`,
    visibleWords(h) > 100, `${visibleWords(h)} words`);
  chk(`${where}: exactly one <h1>`, count(body(h), /<h1[\s>]/gi) === 1,
    `${count(body(h), /<h1[\s>]/gi)}`);
  chk(`${where}: internal links a crawler can follow`,
    new Set([...body(h).matchAll(/href="(\/[^"]*)"/g)].map((m) => m[1])).size >= 5);
  chk(`${where}: THE POINT — its canonical is its own URL, not the homepage's`,
    tag(h, CANON) === `${SITE}${route === "/" ? "/" : route}`, tag(h, CANON));
  chk(`${where}: one canonical, not two`, count(h, /rel="canonical"/g) === 1);
  chk(`${where}: og:url agrees with it`,
    tag(h, /property="og:url" content="([^"]*)"/) === tag(h, CANON));
  chk(`${where}: indexable`, !/name="robots"/.test(h));
  chk(`${where}: one description`, count(h, /name="description"/g) === 1);
}

{
  const descs = ["/", ...services.map((s) => `/services/${s.slug}`)].map((r) => tag(page(r), DESC));
  chk("THE POINT: seven pages, seven different descriptions in the raw HTML",
    new Set(descs).size === descs.length, `${new Set(descs).size} distinct`);
  const titles = ["/", ...services.map((s) => `/services/${s.slug}`)].map((r) =>
    tag(page(r), /<title>([\s\S]*?)<\/title>/));
  chk("...and seven different titles", new Set(titles).size === titles.length);
  chk("every description still fits a search result",
    descs.every((d) => d && d.length <= 160),
    descs.map((d) => d?.length).join(", "));
}

{
  // The SPA fallback. Netlify serves a real file when one exists and this
  // when none does, so it is what a typo'd or long-dead URL gets — and the
  // one page that must NOT claim to be a page.
  const nf = readFileSync(join(dist, "not-found.html"), "utf8");
  chk("not-found.html is in the build", nf.length > 0);
  chk("THE POINT: an unknown URL is noindex, not a soft 404",
    /name="robots" content="noindex"/.test(nf));
  chk("...and claims no canonical", !CANON.test(nf),
    "a page that shouldn't be indexed has no business nominating a preferred URL");
  chk("...and no og:url, so a preview can't call it the homepage",
    !/property="og:url"/.test(nf));
  chk("...but still renders something a person can read",
    visibleWords(nf) > 50, `${visibleWords(nf)} words`);

  const redirects = readFileSync(join(dist, "_redirects"), "utf8");
  chk("THE POINT: the fallback points at not-found.html, not the homepage",
    /^\/\*\s+\/not-found\.html\s+200\s*$/m.test(redirects),
    "pointing it at /index.html would serve the homepage's words and canonical under a nonsense URL");
}

{
  // Link previews — the half of this that Google has nothing to do with.
  const h = page("/");
  const img = tag(h, /property="og:image" content="([^"]*)"/);
  chk("a link preview has an image to show", Boolean(img), "no og:image");
  chk("og:image is an absolute URL — a scraper has no base to resolve a path against",
    img?.startsWith("https://"), img);
  chk("and the image is actually in the build",
    img && existsSync(join(dist, img.replace(SITE, ""))), img);
  chk("og:image declares its size, so the preview reserves the right shape",
    /property="og:image:width" content="1200"/.test(h) &&
      /property="og:image:height" content="630"/.test(h));
  chk("the meta description fits in a Google result", (tag(h, DESC) ?? "").length <= 160,
    `${(tag(h, DESC) ?? "").length} chars`);
}

// ---------------------------------------------------------------------------
console.log("\n-- the guards that keep it that way --\n");
//
// The whole point of prerendering is that a page is never empty again. So the
// check that a page is never empty has to be known to work — these feed it
// the failures it exists to catch.

{
  const bad = [
    ["an empty render", "<div></div>", /only 1 words|only 0 words/],
    ["a page with no heading", `<p>${"word ".repeat(80)}</p>`, /no|0 <h1>/],
    ["a page with two headings", `<h1>a</h1><h1>b</h1><p>${"word ".repeat(80)}</p>`, /2 <h1>/],
  ];
  for (const [what, markup, expected] of bad) {
    let threw = "";
    try {
      checkMarkup("/test", markup);
    } catch (e) {
      threw = e.message;
    }
    chk(`THE POINT: ${what} stops the build`, expected.test(threw), threw || "did not throw");
  }

  let ok = true;
  try {
    checkMarkup("/test", `<h1>Gutter Cleaning</h1><p>${"word ".repeat(80)}</p>`);
  } catch {
    ok = false;
  }
  chk("...and a real page does not", ok);
}

{
  // The rewriting itself, without needing a build.
  const shell =
    '<html><head><title>Old</title>\n<meta name="description" content="old" />\n' +
    '<meta property="og:title" content="old" />\n<meta property="og:description" content="old" />\n' +
    '<meta property="og:url" content="https://skybluecleaningco.com/" />\n</head>' +
    '<body><div id="root"></div></body></html>';

  const out = injectInto(shell, {
    markup: "<h1>Hi</h1>",
    title: "New",
    description: "new",
    canonical: "https://skybluecleaningco.com/services/x",
    ogUrl: "https://skybluecleaningco.com/services/x",
  });
  chk("injecting replaces the title rather than adding a second",
    (out.match(/<title>/g) ?? []).length === 1 && out.includes("<title>New</title>"));
  chk("it replaces the description rather than adding a second",
    (out.match(/name="description"/g) ?? []).length === 1 && out.includes('content="new"'));
  chk("it adds the canonical", out.includes('rel="canonical" href="https://skybluecleaningco.com/services/x"'));
  chk("and the markup lands inside #root", out.includes('<div id="root"><h1>Hi</h1></div>'));

  const none = injectInto(shell, { markup: "<h1>Hi</h1>", noindex: true });
  chk("THE POINT: a page with no canonical has og:url removed, not left pointing home",
    !none.includes("og:url"));
  chk("...and keeps index.html's title when given none", none.includes("<title>Old</title>"));

  let threw = "";
  try {
    injectInto("<html><head></head><body></body></html>", { markup: "<h1>x</h1>" });
  } catch (e) {
    threw = e.message;
  }
  chk("a shell with no #root fails loudly instead of writing a page with no content",
    /nowhere to put/.test(threw), threw || "did not throw");
}

{
  // The bug that actually shipped, kept as a test.
  //
  // index.html has a comment saying the title is inserted at build time, and
  // that comment contains the characters "<title>". The first version of the
  // rewriting matched it, ran to the real </title> near the end of the head,
  // and deleted everything in between — Open Graph tags, structured data,
  // favicons, the lot. The build was green; six pages shipped with no link
  // preview. Nothing but a test keeps that from coming back.
  const shell =
    "<html><head>\n" +
    "<!-- The <title> and description are inserted here at build time. -->\n" +
    '<meta property="og:image" content="https://skybluecleaningco.com/og-card.png" />\n' +
    '<script type="application/ld+json">{"@type":"HomeAndConstructionBusiness"}</script>\n' +
    "<title>Home</title>\n" +
    "</head><body><div id=\"root\"></div></body></html>";

  const out = injectInto(shell, { markup: "<h1>Hi</h1>", title: "Gutter Cleaning" });
  chk("THE POINT: a comment mentioning <title> is not mistaken for the title",
    out.includes("<title>Gutter Cleaning</title>"), out.match(/<title>[\s\S]*?<\/title>/)?.[0]);
  chk("...and the tags between the comment and the real title survive",
    out.includes("og:image") && out.includes("ld+json"),
    "the first version of this deleted them and the build stayed green");
  chk("...and the comment itself is left alone", out.includes("inserted here at build time"));

  // index.html really does contain that comment, so this is not a museum piece.
  chk("index.html still has the comment that caused it",
    /<!--[\s\S]*?<title>[\s\S]*?-->/.test(readFileSync(join(root, "index.html"), "utf8")),
    "if this ever goes away the check above stops testing anything real");
}

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
  // A stand-in for Netlify, and it has to match it on one specific point: a
  // real file wins, and only when there is none does the _redirects fallback
  // apply. That is what makes /services/gutter-cleaning serve its own
  // prerendered file rather than the homepage shell, so getting it wrong here
  // would test a site that doesn't exist.
  const server = createServer((req, res) => {
    const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(dist, path);
    if (file.startsWith(dist) && existsSync(file) && statSync(file).isDirectory()) {
      file = join(file, "index.html"); // pretty URL -> the folder's index
    }
    if (!file.startsWith(dist) || !existsSync(file)) {
      file = join(dist, "not-found.html"); // public/_redirects
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
