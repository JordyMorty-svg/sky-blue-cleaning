// What happens when somebody presses the button:
//   node verify/lead-submit.mjs
//
// WHAT THIS FILE EXISTS FOR. On 12 October 2026 a form was submitted, the
// lead landed in the CRM, the customer saw the thank-you screen, and nobody
// at Sky Blue was told for two hours.
//
// The page sent two requests in parallel: the Supabase insert, and a POST to
// api.web3forms.com whose only job was to email the business. The second one
// never arrived — Web3Forms has no record of the request at all, which from
// the far end is what an ad blocker looks like, and that domain is on
// several blocklists. The submission was counted a success because the
// insert worked, which was right about the lead and wrong about the only
// person who could act on it.
//
// Both halves ran in the CUSTOMER'S BROWSER. That is the whole bug: a
// notification the customer's browser can stop is a notification that will
// one day be stopped, silently, on the submission that mattered most.
//
// The alert moved to the CRM's one-minute sweep, which reads a row that is
// already committed — db/lead-alerts.sql and netlify/lib/leadAlerts.mjs in
// the CRM repo. This file holds the website to its half of that: write the
// lead, say so honestly, and do not pretend anything else is a backstop.
//
// Checks marked THE POINT are the ones this file exists for.

import { readFileSync } from "node:fs";

let bad = 0;
const chk = (what, pass, detail = "") => {
  if (pass) console.log(`ok    ${what}`);
  else {
    bad++;
    console.log(`FAIL  ${what}${detail ? `\n        ${detail}` : ""}`);
  }
};

// Comments out before any source-text assertion. The header above names
// api.web3forms.com four times, which is precisely the string half these
// checks are looking for the ABSENCE of — unstripped, this file fails
// itself.
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/(^|[^:"'`\\])\/\/[^\n]*/g, "$1");

const FORMS = [
  "src/components/quoteform/QuoteForm.jsx",
  "src/components/quoteform/QuoteRequestForm.jsx",
];

console.log("\n-- the third party is gone --\n");

{
  const lib = strip(readFileSync("src/lib/leadSubmit.js", "utf8"));

  chk("THE POINT: nothing posts to Web3Forms any more",
    !/web3forms/i.test(lib),
    "it is the thing that failed, it has no record of what it dropped, and " +
      "with the CRM sweeping every minute it is pure redundancy that can " +
      "still fail silently");

  chk("...and the access key is not left lying in the bundle",
    !/access_key/i.test(lib) && !/4da845f5/.test(lib),
    "a dead key in a public JS bundle is a thing somebody later wonders " +
      "whether they are allowed to delete");

  for (const f of FORMS) {
    const src = strip(readFileSync(f, "utf8"));
    chk(`${f.split("/").pop()} no longer builds an email payload`,
      !/emailFields/.test(src),
      "twenty lines of the same data in a second shape, formatted for an " +
        "email nobody sends");
  }
}

console.log("\n-- one path, and it is the one that matters --\n");

{
  const lib = strip(readFileSync("src/lib/leadSubmit.js", "utf8"));

  chk("the lead still goes into the CRM",
    /insertLead\(lead\)/.test(lib),
    "this is now the only thing a submission does, so it is the only thing " +
      "that can be wrong");

  chk("THE POINT: ok means the row landed, and nothing else",
    /return \{ ok: true \}/.test(lib) && !/web3Ok/.test(lib),
    "`ok: web3Ok || dbOk` is what told the customer the form had gone " +
      "through on the day nobody was told about it");

  chk("a rejection is caught, not just a returned error",
    /catch \(err\)/.test(lib) && /ok: false, error: err/.test(lib),
    "PostgREST returns an error object for a bad insert and THROWS for a " +
      "dead network — the second is exactly the case where the customer " +
      "most needs to be told to ring instead");

  // ASSERTS THE MECHANISM, NOT A CONSTANT. This used to grep for "42703",
  // which stopped being in the code the day the matching moved from the
  // error code to the message — the behaviour was identical and the check
  // failed anyway. A test that breaks when a correct refactor lands is a
  // test people learn to edit rather than read.
  chk("the retry-on-refusal guard survives",
    /does not exist/i.test(lib) &&
      /violates check constraint/i.test(lib) &&
      /retrying without it/.test(lib),
    "a field added to this payload before it is migrated, or refused by a " +
      "CHECK nobody can read, used to cost the whole insert. That guard is " +
      "now the only thing between one bad field and a lost lead, because " +
      "there is no second path to catch it");
}

console.log("\n-- and it is RUN, not just read --\n");

// EVERY CHECK ABOVE READS SOURCE, and a mutation run showed what that is
// worth on its own: deleting the whole `if (result?.error)` branch — so a
// failed insert reports success to the customer — passed all of them. A
// grep can see that the happy path is right. It cannot see a missing
// unhappy one.
//
// So submitLead is bundled with a fake Supabase and actually called. The
// only thing stubbed is the network boundary; the function under test is
// the real one.

{
  const { writeFileSync, rmSync } = await import("node:fs");
  const { pathToFileURL } = await import("node:url");

  // NO BUNDLER. This repo does not depend on esbuild — Vite carries its own
  // and does not expose it — and adding a build tool so a test can stub one
  // import would be a worse trade than the three lines below.
  //
  // Instead: the real source, with ONE import line rewritten, written next
  // to the original so its other relative imports (./analytics,
  // ../data/business — both plain and Node-safe) still resolve. Everything
  // executed here is the shipped code except the network boundary.
  const SRC = "src/lib/leadSubmit.js";
  const TMP = "src/lib/__leadSubmit.undertest.mjs";
  const STUB = "src/lib/__supabase.stub.mjs";

  // The shape @supabase/supabase-js actually returns, written out rather
  // than hidden: a failed insert RESOLVES with { error }, it does not
  // reject. A stub that got that backwards would test nothing.
  writeFileSync(STUB, `
    export let nextResult = { error: null };
    export let inserts = [];
    export function __set(r) { nextResult = r; inserts = []; }
    export const supabase = {
      from() {
        return {
          insert(row) {
            inserts.push(row);
            if (nextResult instanceof Error) return Promise.reject(nextResult);
            return Promise.resolve(nextResult);
          },
        };
      },
    };
  `);

  const original = readFileSync(SRC, "utf8");
  const rewritten = original
    .replace(/from "\.\.\/supabaseClient"/, 'from "./__supabase.stub.mjs"')
    // EXTENSIONS, because Vite adds them and Node does not. The same split
    // that put contactFilters.js in a module of its own over in the CRM
    // repo: `from "./analytics"` resolves in a build and throws
    // ERR_MODULE_NOT_FOUND under plain node. Only the extensionless
    // relative ones — the stub above already ends in .mjs.
    .replace(/from "(\.\.?\/[^"]*)"/g, (m, path) =>
      /\.[a-z]+$/.test(path) ? m : `from "${path}.js"`
    );

  chk("the stub actually replaced the client",
    rewritten !== original,
    "a rewrite that matched nothing would run the real client, fail to " +
      "read import.meta.env under Node, and throw somewhere confusing");

  writeFileSync(
    TMP,
    rewritten + '\nexport { __set, inserts } from "./__supabase.stub.mjs";\n'
  );

  try {
    const mod = await import(pathToFileURL(TMP).href);
    const lead = { name: "Kristina", phone: "541-555-0101", source: "website" };

    mod.__set({ error: null });
    const good = await mod.submitLead({ lead });
    chk("a clean insert reports success, and inserts once",
      good.ok === true && mod.inserts.length === 1);

    mod.__set({ error: { code: "23505", message: "duplicate key" } });
    const failed = await mod.submitLead({ lead });
    chk("THE POINT: an insert that returns an error reports FAILURE",
      failed.ok === false,
      "this is the mutant that survived every source check in this file. " +
        "ok:true here is the thank-you screen shown to somebody whose " +
        "enquiry reached nobody — the exact bug of 12 October, rebuilt out " +
        "of one deleted if-block");

    mod.__set(new Error("network down"));
    const threw = await mod.submitLead({ lead });
    chk("...and so does one that throws",
      threw.ok === false,
      "a dead network rejects rather than resolving, and it is the case " +
        "where the customer most needs to be told to ring instead");

    mod.__set({
      error: { code: "42703", message: 'column "skylights" of relation "leads" does not exist' },
    });
    const retried = await mod.submitLead({ lead: { ...lead, skylights: 2 } });
    chk("THE POINT: an unknown column is dropped and the insert retried",
      mod.inserts.length === 2 &&
        "skylights" in mod.inserts[0] &&
        !("skylights" in mod.inserts[1]) &&
        mod.inserts[1].name === "Kristina",
      "tried " + mod.inserts.length + " times. A field added here before " +
        "it is migrated used to cost the whole lead, and with Web3Forms " +
        "gone there is no second path to catch it. A missing coordinate " +
        "is a detail; a missing lead is a job");

    // THE CONSTRAINT NOBODY CAN READ. leads.stories has a CHECK made in the
    // Supabase dashboard before db/ existed, and offering a third storey on
    // the form is exactly what trips it. Before this branch, a 23514 was an
    // unrecoverable error and the whole enquiry was lost — which only
    // became fatal when Web3Forms went away and this became the only path.
    mod.__set({
      error: {
        code: "23514",
        message: 'new row for relation "leads" violates check constraint "leads_stories_check"',
      },
    });
    const refused = await mod.submitLead({
      lead: { ...lead, stories: "three", notes: "Three story house" },
    });
    chk("THE POINT: a CHECK violation drops that field and the lead still lands",
      mod.inserts.length === 2 &&
        mod.inserts[0].stories === "three" &&
        !("stories" in mod.inserts[1]) &&
        mod.inserts[1].name === "Kristina",
      "tried " + mod.inserts.length + " times — a constraint written in a " +
        "dashboard two years ago must not be able to swallow an enquiry " +
        "whole. The storey count is in notes as well, so dropping the " +
        "column loses the filter, not the fact");

    chk("...and the constraint name is parsed back to its column",
      !("stories" in mod.inserts[1]),
      "Postgres names the CONSTRAINT, not the column — leads_stories_check " +
        "— so the prefix and suffix have to come off or nothing is dropped " +
        "and the retry fails identically");

    // A REFUSAL NAMING SOMETHING THIS FORM NEVER SENT. Dropping a key the
    // payload does not have is a no-op, so retrying would be a second
    // round trip that fails identically — and would report the SECOND
    // error, which may be less informative than the first.
    mod.__set({
      error: { code: "42703", message: 'column "tenant_id" of relation "leads" does not exist' },
    });
    const unrelated = await mod.submitLead({ lead });
    chk("THE POINT: a refusal naming a field we did not send is not retried",
      mod.inserts.length === 1 && unrelated.ok === false,
      "tried " + mod.inserts.length + " times — `culprit in lead` is what " +
        "stops a pointless second insert, and the first error is the one " +
        "worth logging");

    chk("...and a retry that also fails is still a failure",
      retried.ok === false,
      "the stub returns the same error twice, so the retry fails too");
  } finally {
    // In a finally, because a thrown assertion above must not leave two
    // stray modules inside src/ for the next build to pick up.
    rmSync(TMP, { force: true });
    rmSync(STUB, { force: true });
  }
}

console.log("\n-- what the customer is told --\n");

for (const f of FORMS) {
  const src = strip(readFileSync(f, "utf8"));
  const name = f.split("/").pop();

  chk(`${name} still routes a failure to the phone`,
    /call\/text us at/.test(src),
    "with one path left, a failed insert is the only silent-loss case " +
      "remaining — and it is not silent, because the customer is looking " +
      "at it and is given a number");

  chk(`${name} does not claim success on a failure`,
    /if \(ok\) \{/.test(src) && /setStatus\("idle"\)/.test(src),
    "the thank-you screen is a promise that somebody will call");

  chk(`${name} only fires the Ads conversion on a real success`,
    src.indexOf("if (ok) {") < src.indexOf("trackQuoteConversion()"),
    "a conversion counted for a lead that never arrived is a bid raised " +
      "on nothing");
}

console.log(bad === 0
  ? "\nall ok — one path to the CRM, and the CRM does the telling\n"
  : `\n${bad} FAILED\n`);
process.exit(bad === 0 ? 0 : 1);
