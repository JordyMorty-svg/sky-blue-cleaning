// The home page on a phone, measured in a real browser:
//
//   VITE_SUPABASE_URL=https://x.supabase.co VITE_SUPABASE_ANON_KEY=x \
//   VITE_GOOGLE_MAPS_API_KEY=x npm run build
//   node verify/mobile-layout.mjs
//
// ---------------------------------------------------------------------------
// WHY THIS FILE EXISTS
// ---------------------------------------------------------------------------
//
// Every other verify script in here reads source text. This one cannot,
// because the three faults it was written after were all invisible in the
// source and only existed once a browser had resolved the cascade:
//
//   THE WORK SECTION HAD NO SIDE GUTTER. `@media (max-width: 760px) { .work
//   { padding: 64px 0 } }` is a plausible line to read past. On a phone it
//   ran the heading into both screen edges and cut the left and right
//   borders off two cards. Every other section was 6%; this one was zero,
//   and nothing in the file says what the others do.
//
//   THE QUOTE SECTION'S NEW PADDING NEVER APPLIED. A `@media (max-width:
//   620px)` block was added above an existing `@media (max-width: 850px)`
//   block that set `padding` on the same selector. Media queries add no
//   specificity, so the later one won and the measured padding did not
//   move. The CSS was correct, present, and dead.
//
//   THE HEADER WAS 2px TOO WIDE AT 320px. Logo, nowrap name and hamburger
//   added up to more than an iPhone SE, so the whole document scrolled
//   sideways — a fault you feel as drift on every vertical swipe long
//   before you can see what is causing it.
//
// None of the three is catchable by grepping, and all three shipped looking
// fine on a laptop. So this measures the rendered page at phone widths and
// asserts the properties, not the declarations.
//
// Checks marked THE POINT are the ones this file exists for.

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
  ".jpg": "image/jpeg", ".mp4": "video/mp4", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".ico": "image/x-icon" };

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

// OFF-ORIGIN IS ABORTED, not merely absent. The page asks for Google Maps
// and a font or two; none of it matters here, and waiting for requests that
// will never resolve is the difference between a four-second check and a
// hung one.
async function phone(width = 390, height = 844) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await page.route("**/*", (r) =>
    new URL(r.request().url()).hostname === "localhost" ? r.continue() : r.abort());
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  return page;
}

/* HAS REACT ACTUALLY TAKEN OVER THE PAGE?
 *
 * This site prerenders, so the markup is all there before a line of React
 * runs and no selector can tell the two states apart — every element the
 * checks look for exists in the static HTML. Only behaviour can.
 *
 * It used to be answered by waiting for the sticky bar, which was the one
 * element React alone rendered. That bar is gone, so this presses the
 * windows stepper and waits for the number to move, then presses the other
 * one to put it back. Two clicks, no residue, and it tests the thing it is
 * actually asking about.
 *
 * It is worth having rather than letting the later checks fail on their
 * own, because the failure it catches has a cause nothing else would name:
 * a build without VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY throws while
 * creating the client, React never mounts, and the page sits there looking
 * completely normal and doing nothing. That has cost an afternoon twice.
 */
async function interactive(page) {
  const read = () => page.evaluate(() =>
    document.querySelector(".quote__stepper-input")?.value ?? null);
  const before = await read();
  await page.evaluate(() => document.querySelectorAll(".quote__stepper-btn")[1]?.click());
  try {
    await page.waitForFunction(
      (b) => document.querySelector(".quote__stepper-input")?.value !== b,
      before, { timeout: 4000 });
  } catch {
    return false;
  }
  await page.evaluate(() => document.querySelectorAll(".quote__stepper-btn")[0]?.click());
  await page.waitForTimeout(80);
  return (await read()) === before;
}

// ---------------------------------------------------------------------------
console.log("\n-- nothing scrolls sideways --\n");

// A phone with no horizontal overflow is not a nicety. A document 2px wider
// than its viewport drifts left and right under every vertical swipe, and
// pinch-zoom starts from the wrong place.
for (const width of [320, 390, 430]) {
  const page = await phone(width);
  const d = await page.evaluate(() => {
    const doc = document.documentElement;
    const culprits = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      // The hero's glow is a decorative circle deliberately hanging off the
      // corner, clipped by overflow:hidden on .hero. It is the one element
      // allowed past the edge.
      if (el.classList.contains("hero__glow")) continue;
      if (r.right > doc.clientWidth + 1) culprits.push(`${el.className || el.tagName} → ${Math.round(r.right)}`);
    }
    return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, culprits: [...new Set(culprits)].slice(0, 5) };
  });

  chk(`THE POINT: ${width}px wide document fits a ${width}px screen`,
    d.scrollWidth <= d.clientWidth,
    `scrollWidth ${d.scrollWidth} vs ${d.clientWidth}; past the right edge: ` +
      `${d.culprits.join(", ") || "nothing identified — check a transform"}`);

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- every section has a gutter --\n");

{
  const page = await phone(390);
  const pads = await page.evaluate(() =>
    [...document.querySelectorAll("section[id], footer")].map((s) => ({
      name: s.id || s.className.split(" ")[0],
      left: Math.round(parseFloat(getComputedStyle(s).paddingLeft)),
      right: Math.round(parseFloat(getComputedStyle(s).paddingRight)),
      top: Math.round(parseFloat(getComputedStyle(s).paddingTop)),
    })));

  // THE CHECK THAT WOULD HAVE CAUGHT THE WORK SECTION. Asked of all of them
  // at once rather than of .work by name: the fault was not that this one
  // section was wrong, it was that one section disagreed with the other six
  // and nothing anywhere said they had to agree.
  const naked = pads.filter((p) => p.left < 16 || p.right < 16);
  chk("THE POINT: no section runs its content into the screen edge",
    naked.length === 0,
    naked.map((p) => `${p.name} has ${p.left}px / ${p.right}px`).join("; ") +
      " — the rest of the page is at 6%, so this one looks broken rather " +
      "than full-bleed, and any bordered card inside it loses its border");

  // THE CHECK THAT WOULD HAVE CAUGHT THE DEAD MEDIA QUERY — and it has to
  // be the VERTICAL padding, which took a mutant to work out.
  //
  // The first version of this check looked at paddingLeft and could not
  // fail. Every section's horizontal padding is 6% at every width, so
  // deleting a whole mobile block changes nothing on that axis: 6% of 390
  // is 23px either way. The check was green against a page where the rule
  // it was written for had been removed.
  //
  // The top padding is where desktop and mobile actually differ — 96px
  // against 56px — so it is the one that can tell whether anything
  // applied. Anything at or above 80px at phone width means a mobile block
  // exists in the file, reads correctly, and is being overridden by a
  // later one of equal specificity. Media queries add no specificity; only
  // source order decides, and that is not visible from the block itself.
  const unshrunk = pads.filter((p) => p.top >= 80);
  chk("...and none is still at its desktop padding",
    unshrunk.length === 0,
    unshrunk.map((p) => `${p.name} is ${p.top}px from the top`).join("; ") +
      " — the desktop value is 96px, so this section's mobile rule either " +
      "does not exist or is being overridden by a later @media block");

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- anchors clear the sticky header --\n");

{
  const page = await phone(390);

  // Both ways of reaching a section — a plain #hash and ScrollManager's
  // scrollIntoView — put the target's top edge at y=0, which is behind the
  // sticky navbar. scroll-margin-top is what moves it clear.
  //
  // THE LIST IS READ OFF THE PAGE'S OWN LINKS, not written out here, and
  // that is the whole point of this version. The hand-written list said
  // services, work, quote, about, reviews — six destinations out of seven.
  // The seventh was #contact, which is <footer id="contact"> and therefore
  // not matched by `section[id]`, so tapping Contact in the menu landed
  // with the footer logo behind the header. The check could not fail on it
  // because nobody had told the check it existed.
  //
  // Asking the page which anchors it offers means the next id somebody adds
  // is covered the day they add it, and an anchor pointing at nothing is
  // caught as well.
  const landed = await page.evaluate(async () => {
    const ids = [...new Set(
      [...document.querySelectorAll('a[href*="#"]')]
        .map((a) => (a.getAttribute("href") || "").split("#")[1])
        .filter((h) => h && h !== "")
    )];
    const out = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) { out.push({ id, missing: true }); continue; }
      el.scrollIntoView({ block: "start", behavior: "instant" });
      await new Promise((r) => setTimeout(r, 60));
      out.push({
        id,
        top: Math.round(el.getBoundingClientRect().top),
        navBottom: Math.round(document.querySelector(".navbar").getBoundingClientRect().bottom),
      });
    }
    return out;
  });

  chk("every in-page link points at something that exists",
    landed.length > 0 && !landed.some((l) => l.missing),
    landed.filter((l) => l.missing).map((l) => `#${l.id}`).join(", ") +
      " is linked from the page and is not on it" +
      (landed.length === 0 ? "no in-page anchors found at all — the selector " +
        "that collects them has stopped matching" : ""));

  const buried = landed.filter((l) => !l.missing && l.top < l.navBottom);
  chk(`THE POINT: all ${landed.length} in-page anchors land below the navbar`,
    buried.length === 0,
    buried.map((l) => l.missing ? `#${l.id} does not exist` :
      `#${l.id} lands at ${l.top}px with the navbar ending at ${l.navBottom}px`).join("; ") +
      " — the eyebrow and the first line of the heading are hidden behind " +
      "the bar, so the thing you clicked for is the thing you cannot see");

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- the storey picker --\n");

// HERE RATHER THAN IN A PRICING TEST, because the one-word labels exist for
// a phone: three buttons have to share one row inside a 245px panel, and
// that constraint is only true at this width. The price checks ride along
// because clicking the buttons is how you see either, and because the
// labels and the prices are the same four lines of STOREYS — an edit to one
// is an edit to the other.
{
  const page = await phone(320);

  // THE ONLY SECTION HERE THAT NEEDS REACT. Everything above is computed
  // style and geometry, which the prerendered HTML has on its own; the
  // price checks below need the buttons to actually do something. Asked
  // first and asked plainly, so a dead page says so instead of surfacing
  // as three storeys that all cost $200.
  chk("THE POINT: the page is interactive at all",
    await interactive(page),
    "pressing the windows stepper changed nothing — React has not mounted. " +
      "Almost always a build with no VITE_SUPABASE_URL / " +
      "VITE_SUPABASE_ANON_KEY: the client throws, nothing hydrates, and the " +
      "prerendered page sits there looking perfectly normal");

  const picker = await page.evaluate(() => {
    const btns = [...document.querySelectorAll(".quote__choice")];
    const tops = new Set(btns.map((b) => Math.round(b.getBoundingClientRect().top)));
    return {
      n: btns.length,
      labels: btns.map((b) => b.textContent.trim()),
      rows: tops.size,
      // LINES, COUNTED, NOT WIDTH COMPARED. The first version of this
      // measured scrollWidth against clientWidth, and a mutant that put
      // "Three story" back in the button sailed through it: text does not
      // overflow its box, it WRAPS, so the widths still agreed while the
      // button quietly grew a second line. A Range over the button's
      // contents returns one client rect per line, which is the thing
      // actually being asked about.
      lines: btns.map((b) => {
        const r = document.createRange();
        r.selectNodeContents(b);
        return { text: b.textContent.trim(), n: r.getClientRects().length };
      }),
      clipped: btns.filter((b) => b.scrollWidth > b.clientWidth + 1).map((b) => b.textContent.trim()),
      shortest: Math.min(...btns.map((b) => Math.round(b.getBoundingClientRect().height))),
      labelledBy: document.querySelector(".quote__choices")?.getAttribute("aria-labelledby"),
    };
  });

  chk("THE POINT: all three storeys sit on one row at 320px",
    picker.n === 3 && picker.rows === 1,
    `${picker.n} buttons on ${picker.rows} row(s) — a lone third button on a ` +
      "second row reads as a different kind of option rather than the third " +
      "of three");

  const wrapped = picker.lines.filter((l) => l.n !== 1);
  chk("...each label on a single line",
    wrapped.length === 0 && picker.clipped.length === 0,
    (wrapped.map((l) => `${JSON.stringify(l.text)} takes ${l.n} lines`).join("; ") ||
      `clipped: ${picker.clipped.join(", ")}`) +
      " — this is what one-word labels are for: a two-line button in a " +
      "75px column is how the long labels failed before");

  // The buttons used to say "One story". They say "One", so the question
  // above them is the only thing that says what is being counted — and a
  // screen reader only reaches it if it is tied to the group.
  chk("...and the group carries the question as its label",
    picker.labelledBy === "q-stories-label",
    `aria-labelledby is ${JSON.stringify(picker.labelledBy)} — without it a ` +
      "screen reader announces One, Two, Three and never says of what");

  // Read off the rendered estimate, not off the source: this is the number
  // the customer sees, and a label and a price that disagree is worse than
  // either being wrong alone.
  const bases = [];
  for (let i = 0; i < 3; i++) {
    const row = await page.evaluate((n) => {
      document.querySelectorAll(".quote__choice")[n].click();
      return new Promise((r) => requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          r(document.querySelector(".quote__estimate-row")?.textContent.replace(/\s+/g, " ").trim() || ""))));
    }, i);
    bases.push(row);
  }

  const amounts = bases.map((r) => Number((r.match(/\$(\d+)/) || [])[1]));

  // ONE EQUIVALENT MUTANT, RECORDED RATHER THAN HIDDEN. Changing
  // `const base = storey.base` to `storey.base || 0` in the component
  // survives everything here, and correctly so: every entry in STOREYS has
  // a base, so the fallback never runs. Deleting a base outright — the
  // fault the fallback would be guarding against — is caught by the next
  // check, which sees "$NaN" and an unparseable amount.
  chk("each storey prices its own base",
    amounts.every((a) => Number.isFinite(a) && a > 0),
    bases.join(" | ") + " — a missing amount means the picker and the " +
      "estimate have stopped agreeing on what is selected");

  // THE CHECK THIS SECTION WAS WRITTEN FOR, and it asserts the DECISION
  // rather than the numbers. The prices are Jordan's to change and a test
  // that hard-codes 200/300/500 breaks every time he does. What must not
  // come back is the premise that was wrong: that every floor costs the
  // same to add. One storey to two is a longer pole; two to three is a
  // ladder. The old `first + (floors-1) * step` formula could not express
  // that, priced three at $400, and put a three-storey house below the $705
  // charged for a large two-storey.
  const step12 = amounts[1] - amounts[0];
  const step23 = amounts[2] - amounts[1];
  // STRICTLY GREATER, and a mutant is why. Written as `>=` this passed
  // against 200/300/400 — the exact pricing the check exists to prevent,
  // because a flat $100 step satisfies "not smaller". The claim being made
  // is that the third storey is MORE work to add than the second, so the
  // test has to say more, not at-least.
  chk("THE POINT: the third storey costs more to add than the second",
    step23 > step12 && step12 > 0,
    `$${amounts[0]} / $${amounts[1]} / $${amounts[2]} — steps of $${step12} ` +
      `then $${step23}. A flat step says every floor is the same work, and ` +
      "it is not: the second is a longer pole, the third is a ladder");

  // "Three story base", not "Three base" and not "undefined base". STOREYS
  // carries two labels now — one word for the button, the full noun for
  // everywhere the words stand alone — and the notes written into a lead
  // use the same noun. Dropping it puts "undefined house" in front of
  // whoever reads the lead.
  chk("...and the estimate line names the storey in full",
    /^Three story base/.test(bases[2]),
    `the line reads ${JSON.stringify(bases[2])} — the button may be one ` +
      "word but this line and the lead's notes have no question above them");

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- things a thumb has to hit --\n");

{
  const page = await phone(390);

  // Not every link: a link inside a sentence is a line of text and should
  // be. These are the standalone controls — the ones that look like buttons
  // and are the only way to do the thing they describe.
  const small = await page.evaluate(() => {
    const sels = [
      ".hero__button", ".services__cta", ".navbar__toggle", ".quote__choice",
      ".quote__stepper-btn", ".work__card-link", ".footer__links a",
      // Both added after mutants walked straight past them: shrinking the
      // footer's call button to 18px and stripping the legal links back to
      // 15px were changes this check was supposed to be about and did not
      // see, because a selector list only covers what somebody remembered
      // to put in it.
      ".footer__call", ".footer__legal a",
    ];
    const out = [];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.height < 32) out.push(`${sel} is ${Math.round(r.height)}px tall`);
      }
    }
    return [...new Set(out)];
  });

  chk("the standalone controls are at least 32px tall",
    small.length === 0,
    small.join("; ") + " — 44px is the usual floor for a thumb; 32 is the " +
      "point below which this is worth arguing about");

  await page.close();
}

// ---------------------------------------------------------------------------
console.log("\n-- the header is not see-through --\n");

{
  const page = await phone(390);

  // The navbar was rgba(255,255,255,0.92) over backdrop-filter:blur(8px).
  // iOS needs -webkit-backdrop-filter, so Safari dropped the blur and kept
  // the transparency, and section headings scrolled through the header in
  // ghost grey behind the logo. Asserting the computed alpha rather than the
  // absence of the blur: a bar you can read the page through is the fault,
  // however it got that way.
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector(".navbar")).backgroundColor);
  const alpha = bg.startsWith("rgba") ? parseFloat(bg.split(",")[3]) : 1;

  chk("THE POINT: the navbar's background is opaque",
    alpha >= 1,
    `background-color is ${bg} — iOS has no backdrop-filter without the ` +
      "-webkit- prefix, and 8px of blur does not stop 2rem bold type being " +
      "legible even where it does apply");

  await page.close();
}

await browser.close();
server.close();

console.log(bad === 0 ? "\nall ok — the phone gets the same page, shaped for a phone\n"
                      : `\n${bad} FAILED\n`);
process.exit(bad === 0 ? 0 : 1);
