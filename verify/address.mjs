// The address field, driven in a real browser against the real built site.
//
//   VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=x \
//   VITE_GOOGLE_MAPS_API_KEY=x npm run build
//   node verify/address.mjs
//
// Google is STUBBED — `window.google.maps` is installed before the app's
// scripts run, so nothing here touches the network or spends a penny of
// quota, and the suggestions are known values that can be asserted on.
// What is NOT stubbed is the component, the forms, or the submit path.
//
// The assertions land on what reaches the DATABASE, by intercepting the
// request the page makes to Supabase. That is the thing that matters: a
// dropdown that looks right but sends no coordinates has failed.
//
// The assertions marked THE POINT are the reasons this exists.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

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
  console.log("No dist/ — run the build first (see the header).");
  process.exit(1);
}

// --- a stand-in for Netlify -------------------------------------------------

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

// --- the fake Google --------------------------------------------------------
//
// Shaped like the real Places Data API: fetchAutocompleteSuggestions returns
// `{ suggestions: [{ placePrediction }] }`, a prediction has `.text.text` and
// `.toPlace()`, and a Place is filled in by `fetchFields`. If Google changes
// that shape this stub goes stale — which is the standing weakness of any
// stub, and the reason the shape is written out here rather than hidden.

const GOOGLE_STUB = `
window.__calls = { suggest: [], fields: [], tokens: 0 };
const mkPlace = (formatted, lat, lng) => ({
  formattedAddress: null,
  location: null,
  async fetchFields(opts) {
    window.__calls.fields.push(opts);
    this.formattedAddress = formatted;
    this.location = { lat: () => lat, lng: () => lng };
    return { place: this };
  },
});
const PREDICTIONS = [
  ["1014 NE Diane Pl, Corvallis, OR 97330", 44.5931089, -123.2442839],
  ["1014 NE Diane St, Albany, OR 97321", 44.6365, -123.1059],
];
window.google = {
  maps: {
    importLibrary: async () => window.google.maps.places,
    places: {
      AutocompleteSessionToken: function () { this.id = ++window.__calls.tokens; },
      AutocompleteSuggestion: {
        async fetchAutocompleteSuggestions(req) {
          window.__calls.suggest.push(req);
          if (window.__failSuggest) throw new Error("quota");
          return {
            suggestions: PREDICTIONS.map(([text, lat, lng]) => ({
              placePrediction: {
                text: { text },
                toPlace: () => mkPlace(text, lat, lng),
              },
            })),
          };
        },
      },
    },
  },
};
`;

// Captures the lead row the page tries to insert, and answers as Supabase
// and Web3Forms would, so the form reaches its "sent" state.
const NETWORK_STUB = `
window.__inserted = null;
const realFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.includes("/rest/v1/leads")) {
    try { window.__inserted = JSON.parse(init.body); } catch { window.__inserted = init.body; }
    return new Response("[]", { status: 201, headers: { "content-type": "application/json" } });
  }
  if (url.includes("web3forms")) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "content-type": "application/json" },
    });
  }
  return realFetch(input, init);
};
`;

const browser = await chromium.launch(
  existsSync("/opt/pw-browsers/chromium") ? { executablePath: "/opt/pw-browsers/chromium" } : {}
);

async function newPage({ google = true } = {}) {
  const page = await browser.newPage({ viewport: { width: 500, height: 900 } });
  if (google) await page.addInitScript(GOOGLE_STUB);
  await page.addInitScript(NETWORK_STUB);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.errors = errors;
  return page;
}

// The request form on a service page: one step, name + phone + address.
const FORM_URL = `${base}/services/gutter-cleaning`;

// ---------------------------------------------------------------------------
console.log("\n-- suggestions --\n");

{
  const page = await newPage();
  await page.goto(FORM_URL);
  chk("the page renders without throwing", page.errors.length === 0, page.errors[0]);

  const box = page.locator("#rq-address");

  // Under the minimum: Google should not be asked at all. Every keystroke is
  // a billable request, and "10" matches most of the country anyway.
  await box.fill("10");
  await page.waitForTimeout(450);
  chk("THE POINT: two characters asks Google nothing",
    (await page.evaluate(() => window.__calls.suggest.length)) === 0,
    "each request costs money and short prefixes match everything");

  await box.fill("1014 NE");
  await page.waitForTimeout(450);
  const items = page.locator(".addr__item");
  chk("typing enough shows the suggestions", (await items.count()) === 2,
    `${await items.count()} shown`);
  chk("and they read as addresses",
    (await items.first().innerText()).includes("Corvallis"));

  const req = await page.evaluate(() => window.__calls.suggest.at(-1));
  chk("the search is limited to the US",
    JSON.stringify(req.includedRegionCodes) === '["us"]',
    JSON.stringify(req.includedRegionCodes));
  chk("and carries a session token — that is what keeps typing free",
    Boolean(req.sessionToken));

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- picking one --\n");

{
  const page = await newPage();
  await page.goto(FORM_URL);

  await page.fill("#rq-name", "Jane O'Brien");
  await page.fill("#rq-phone", "5415550134");

  await page.fill("#rq-address", "1014 NE");
  await page.waitForTimeout(450);
  await page.locator(".addr__item").first().click();

  chk("the box fills with the full address",
    (await page.inputValue("#rq-address")) === "1014 NE Diane Pl, Corvallis, OR 97330",
    await page.inputValue("#rq-address"));

  const fields = await page.evaluate(() => window.__calls.fields);
  chk("only the two fields needed are requested — the rest cost more",
    JSON.stringify(fields[0]?.fields) === '["formattedAddress","location"]',
    JSON.stringify(fields[0]?.fields));

  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.__inserted !== null, { timeout: 5000 });
  const lead = await page.evaluate(() => window.__inserted);

  chk("THE POINT: the lead carries the coordinates of the chosen address",
    Math.abs(lead.latitude - 44.5931089) < 1e-6 && Math.abs(lead.longitude + 123.2442839) < 1e-6,
    JSON.stringify({ lat: lead.latitude, lng: lead.longitude }));
  chk("...as numbers, not Google objects — they go straight into the row",
    typeof lead.latitude === "number" && typeof lead.longitude === "number");
  chk("and the address is the formatted one, not what was typed",
    lead.address === "1014 NE Diane Pl, Corvallis, OR 97330", lead.address);

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- two searches in a row --\n");

{
  // Google bills a SESSION, not a keystroke: every request made under one
  // token is free once that token is closed by a details request. Keeping
  // the same token across a second search silently reverts the whole thing
  // to per-request pricing — nothing breaks, the bill just grows. Only a
  // test that performs two full searches can see it.
  const page = await newPage();
  await page.goto(FORM_URL);

  await page.fill("#rq-address", "1014 NE");
  await page.waitForTimeout(450);
  await page.locator(".addr__item").first().click();
  await page.waitForTimeout(100);

  await page.fill("#rq-address", "1016 SW");
  await page.waitForTimeout(450);

  const ids = await page.evaluate(() =>
    window.__calls.suggest.map((r) => r.sessionToken?.id)
  );
  chk("THE POINT: a second search opens a new session token",
    ids.length >= 2 && ids[0] !== ids[ids.length - 1],
    `tokens seen: ${JSON.stringify(ids)} — reusing one bills every keystroke`);

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- typing your own address --\n");

{
  const page = await newPage();
  await page.goto(FORM_URL);

  await page.fill("#rq-name", "Rural Ron");
  await page.fill("#rq-phone", "5415550777");
  await page.fill("#rq-address", "The old mill house, up past the creek");
  await page.waitForTimeout(450);

  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.__inserted !== null, { timeout: 5000 });
  const lead = await page.evaluate(() => window.__inserted);

  chk("THE POINT: an address Google doesn't know still submits",
    lead.address === "The old mill house, up past the creek", lead.address,
  );
  chk("THE POINT: with no coordinates — the honest signal it wasn't verified",
    lead.latitude === null && lead.longitude === null,
    JSON.stringify({ lat: lead.latitude, lng: lead.longitude }));

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- picking one, then editing it --\n");

{
  const page = await newPage();
  await page.goto(FORM_URL);

  await page.fill("#rq-name", "Second Thoughts");
  await page.fill("#rq-phone", "5415550888");

  await page.fill("#rq-address", "1014 NE");
  await page.waitForTimeout(450);
  await page.locator(".addr__item").first().click();

  // Same street, different house. The coordinates belong to the old one.
  await page.fill("#rq-address", "1016 NE Diane Pl, Corvallis, OR 97330");
  await page.keyboard.press("Escape");

  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.__inserted !== null, { timeout: 5000 });
  const lead = await page.evaluate(() => window.__inserted);

  chk("THE POINT: editing after picking drops the coordinates",
    lead.latitude === null && lead.longitude === null,
    "otherwise the pin sits confidently on the wrong house");

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- the keyboard --\n");

{
  const page = await newPage();
  await page.goto(FORM_URL);

  await page.click("#rq-address");
  await page.fill("#rq-address", "1014 NE");
  await page.waitForTimeout(450);

  chk("the input announces itself as a combobox",
    (await page.getAttribute("#rq-address", "role")) === "combobox" &&
      (await page.getAttribute("#rq-address", "aria-expanded")) === "true");

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  const activeId = await page.getAttribute("#rq-address", "aria-activedescendant");
  // Looked up inside the page rather than with a selector: React's useId
  // generates ids like ":r1:", which are not valid CSS selectors without
  // escaping, and CSS.escape does not exist in Node.
  const pointsAtARealRow = await page.evaluate(
    (id) => Boolean(id && document.getElementById(id)),
    activeId
  );
  chk("arrowing down moves the highlight, and says which row",
    pointsAtARealRow, activeId ?? "(none)");
  chk("the highlighted row is the second one",
    (await page.locator(".addr__item--active").innerText()).includes("Albany"));

  await page.keyboard.press("Enter");
  chk("Enter picks the highlighted one",
    (await page.inputValue("#rq-address")).includes("Albany"),
    await page.inputValue("#rq-address"));

  await page.fill("#rq-address", "1014 NE D");
  await page.waitForTimeout(450);
  await page.keyboard.press("Escape");
  chk("Escape closes the list",
    (await page.locator(".addr__item").count()) === 0);

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- when Google isn't there --\n");

{
  // No stub at all: window.google never exists, and the real script can't
  // load from localhost. This is the offline / blocked / no-key case.
  const page = await newPage({ google: false });
  await page.goto(FORM_URL);

  await page.fill("#rq-name", "No Google");
  await page.fill("#rq-phone", "5415550999");
  await page.fill("#rq-address", "1014 NE Diane Pl");
  await page.waitForTimeout(800);

  chk("no dropdown, and no error shown to the customer",
    (await page.locator(".addr__item").count()) === 0);

  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.__inserted !== null, { timeout: 5000 });
  const lead = await page.evaluate(() => window.__inserted);

  chk("THE POINT: the quote still submits with the typed address",
    lead.address === "1014 NE Diane Pl" && lead.name === "No Google",
    "losing suggestions must never cost a lead");

  await page.close();
}

{
  // Google loads, then refuses — quota exhausted, or a bad request.
  const page = await newPage();
  await page.addInitScript("window.__failSuggest = true;");
  await page.goto(FORM_URL);

  await page.fill("#rq-name", "Quota Gone");
  await page.fill("#rq-phone", "5415551000");
  await page.fill("#rq-address", "1014 NE Diane Pl");
  await page.waitForTimeout(600);

  chk("a failing Google is silent, not an error message",
    (await page.locator(".addr__item").count()) === 0 && page.errors.length === 0,
    page.errors[0]);

  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.__inserted !== null, { timeout: 5000 });
  chk("and the lead still lands",
    (await page.evaluate(() => window.__inserted)).address === "1014 NE Diane Pl");

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- the estimator on the homepage uses the same field --\n");

{
  const page = await newPage();
  await page.goto(`${base}/`);
  chk("the homepage address field is wired up too",
    (await page.locator("#q-address").count()) === 1 &&
      (await page.getAttribute("#q-address", "role")) === "combobox");
  await page.close();
}

await browser.close();
server.close();

console.log(bad === 0 ? "\nall ok — the address field holds\n" : `\n${bad} FAILED\n`);
process.exit(bad === 0 ? 0 : 1);
