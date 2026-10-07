// Conversion tracking that is actually connected: node verify/analytics.mjs
//
// WHAT WENT WRONG, so the checks below have a reason rather than a shape.
//
// The Ads account was named twice: once in index.html, which loads the tag,
// and once in leadSubmit.js, as half of the conversion target. In October
// 2026 a new Ads account was created, index.html was never updated, and the
// two drifted:
//
//   index.html        AW-18343098144      (old account)
//   leadSubmit.js     AW-18343098144/...  (a label belonging to it)
//   the live account  AW-18406557035
//
// The Search campaign spent money for weeks and reported nothing. Every page
// loaded, every form worked, every lead arrived by email and in the CRM. The
// only symptom was an absence, in a dashboard owned by somebody else.
//
// The fix was to state the account once and generate the rest. These checks
// exist because "stated once" is a property that quietly stops being true.
//
// Checks marked THE POINT are the ones this file exists for.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GOOGLE_ADS_ID, LEAD_CONVERSION_LABEL, leadConversionTarget } from "../src/lib/analytics.js";

let bad = 0;
const chk = (what, pass, detail = "") => {
  if (pass) console.log(`ok    ${what}`);
  else {
    bad++;
    console.log(`FAIL  ${what}${detail ? `\n        ${detail}` : ""}`);
  }
};

const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");

console.log("\n-- the account is named once --\n");

{
  chk("there is an Ads account id",
    /^AW-\d{6,}$/.test(GOOGLE_ADS_ID || ""),
    `GOOGLE_ADS_ID = ${JSON.stringify(GOOGLE_ADS_ID)}`);

  // THE CHECK THAT WOULD HAVE CAUGHT IT. index.html must not contain an
  // account id of its own, because the build writes one in from the constant
  // above — and a second one typed into the file is exactly the drift that
  // cost the campaign its reporting.
  const html = strip(readFileSync("index.html", "utf8"));
  const inHtml = html.match(/AW-\d{6,}/g) || [];

  chk("THE POINT: index.html does not name an account of its own",
    inHtml.length === 0,
    `found ${inHtml.join(", ")} written into index.html — the build injects ` +
      `${GOOGLE_ADS_ID} from src/lib/analytics.js, so a second one here is a ` +
      `second answer to the same question and only one of them loads`);

  // ...AND THE BUILD REALLY DOES INJECT IT. Asked of the plugin rather than
  // of its source text: a first version of this check looked for the words
  // GOOGLE_ADS_ID and googletagmanager in the file, and a mutant that wrapped
  // the whole injection in `if (false)` passed it. The words were still
  // there. The tag was not.
  const { default: seoPlugin } = await import("../vite-plugin-seo.js");
  const injected = seoPlugin().transformIndexHtml() || [];
  const scripts = injected.filter((t) => t.tag === "script");

  const loader = scripts.find((t) => /googletagmanager\.com\/gtag\/js/.test(t.attrs?.src || ""));
  chk("THE POINT: ...because the build injects it instead",
    Boolean(loader),
    "with no injection, 'index.html names no account' is satisfied by a site " +
      "carrying no tag at all — which reports nothing just as quietly");

  chk("...for the configured account",
    (loader?.attrs?.src || "").includes(GOOGLE_ADS_ID),
    loader?.attrs?.src || "(no loader)");

  const config = scripts.find((t) => /gtag\('config'/.test(t.children || ""));
  chk("the injected tag also configures the account, not just loads it",
    Boolean(config) && (config.children || "").includes(GOOGLE_ADS_ID),
    "the loader alone sets no destination; without config() the events go nowhere");
}

console.log("\n-- the conversion points at that same account --\n");

{
  chk("there is a conversion label",
    /^[A-Za-z0-9_-]{10,}$/.test(LEAD_CONVERSION_LABEL || ""),
    `LEAD_CONVERSION_LABEL = ${JSON.stringify(LEAD_CONVERSION_LABEL)} — ` +
      `Goals → Conversions → the action → the part after the slash in send_to`);

  const target = leadConversionTarget();

  chk("THE POINT: the conversion target is the configured account",
    typeof target === "string" && target.startsWith(`${GOOGLE_ADS_ID}/`),
    `${target} does not begin with ${GOOGLE_ADS_ID} — a label belongs to one ` +
      `account, and sent anywhere else it is an event addressed to a place ` +
      `the tag is not listening`);

  chk("...with exactly one slash in it",
    (target.match(/\//g) || []).length === 1, target);

  // The old account must not survive anywhere in shipped code. It is fine in
  // a comment explaining the history — that is why comments are stripped.
  const files = [];
  (function walk(d) {
    for (const entry of readdirSync(d)) {
      if (entry === "node_modules" || entry === "dist" || entry === ".git") continue;
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(jsx?|html)$/.test(entry)) files.push(full);
    }
  })(".");

  chk("the walk found the site",
    files.length > 10, `${files.length} files — a broken walk passes everything below`);

  const stale = [];
  for (const file of files) {
    const src = strip(readFileSync(file, "utf8"));
    for (const id of src.match(/AW-\d{6,}/g) || []) {
      if (id !== GOOGLE_ADS_ID) stale.push(`${file}: ${id}`);
    }
  }

  chk("THE POINT: no file ships an account id that is not the configured one",
    stale.length === 0,
    stale.join("; ") + " — this is the exact state the site shipped in for " +
      "weeks, and nothing anywhere reported it");
}

console.log("\n-- every form reports, and only on success --\n");

{
  const forms = [];
  (function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.jsx$/.test(entry)) {
        const src = readFileSync(full, "utf8");
        if (/submitLead\(/.test(src)) forms.push({ file: full, src: strip(src) });
      }
    }
  })("src");

  // WALKED, NOT LISTED. There are two quote forms and there was very nearly
  // only one of them tagged; the CRM's call logging shipped broken for the
  // same reason, where a change was made in the two places somebody knew
  // about and four more existed.
  chk("every form that submits a lead was found",
    forms.length >= 2,
    forms.map((f) => f.file).join(", ") + " — a list somebody maintains by " +
      "hand has the same hole the bug came through");

  for (const form of forms) {
    chk(`${form.file} reports the conversion`,
      /trackQuoteConversion\(\)/.test(form.src),
      "a form that saves a lead and reports nothing is a lead Google never " +
        "attributes to the click that paid for it");

    // ONLY ON SUCCESS. Firing on the button press counts failed submissions
    // as leads, which inflates what a click looks like it is worth — and the
    // number is then used to decide how much more to spend.
    const sent = form.src.indexOf('setStatus("sent")');
    const track = form.src.indexOf("trackQuoteConversion()");
    chk(`...only after the lead actually saved`,
      sent > -1 && track > sent && track - sent < 120,
      `setStatus("sent") at ${sent}, trackQuoteConversion() at ${track} — it ` +
        `belongs inside the if (ok) branch, next to the success state`);
  }
}

console.log("\n-- it cannot throw inside a submit handler --\n");

{
  const src = strip(readFileSync("src/lib/leadSubmit.js", "utf8"));

  // This site prerenders, so `window` genuinely does not exist at build time;
  // and in the browser gtag is missing whenever an ad blocker has eaten
  // googletagmanager.com. Either one throwing here would show the customer an
  // error for a request that went through.
  chk("THE POINT: a missing window or gtag is survived, not assumed",
    /typeof window === "undefined"/.test(src) && /typeof window\.gtag !== "function"/.test(src),
    "the site prerenders and ad blockers are common; a throw here shows an " +
      "error for a lead that was saved");

  chk("an unconfigured label is reported rather than silently skipped",
    /console\.warn/.test(src),
    "a conversion that never fires and one that fires into a dead account " +
      "look identical from Google Ads");

  chk("...but only once per session",
    /let warned = false/.test(src) && /if \(!warned\)/.test(src) &&
      /warned = true/.test(src),
    "one line in the console is a note; one per submit is noise people learn " +
      "to scroll past");
}

console.log(bad === 0 ? "\nall ok — the money and the leads are counted in the same account\n"
                      : `\n${bad} FAILED\n`);
process.exit(bad === 0 ? 0 : 1);
