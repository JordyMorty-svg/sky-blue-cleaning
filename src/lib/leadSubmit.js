import { supabase } from "../supabaseClient";
// The Ads account and the conversion label live in one place — see the
// header of that file for what happened when they lived in two.
import { leadConversionTarget } from "./analytics";
import { BUSINESS } from "../data/business";

/* ---- Business contact info (shared across every quote surface) ----
 *
 * The values live in data/business.js, which the build also reads to tell
 * Google the same phone number. Re-exported here under the old name so
 * nothing that already imports CONTACT has to change.
 */
export const CONTACT = {
  phoneDisplay: BUSINESS.phoneDisplay,
  phoneDigits: BUSINESS.phoneDigits, // for tel:/sms: links, no spaces
  // The address customers see and reply to, in the footer and on both quote
  // forms as a mailto link.
  //
  // It is NOT where lead notifications go, and nothing on this site decides
  // that any more. A new lead texts Jordan and Hayden from the CRM's own
  // sweep — see netlify/lib/leadAlerts.mjs in the CRM repo, and the note on
  // submitLead below for why it moved there.
  email: BUSINESS.email,
};

/*
 * Insert the lead, and survive a column the table doesn't have.
 *
 * Column names must match the leads table exactly, and a single wrong one
 * fails the whole insert — so a lead would reach the notification email and
 * never reach the CRM, which is the worst of both worlds because it looks
 * like it worked.
 *
 * That is not hypothetical: `latitude` and `longitude` were added to this
 * payload when the address field started returning coordinates, and they are
 * only present on the table because the CRM's map already used them. A
 * future field could easily be added here first and migrated later.
 *
 * So an "undefined column" error is treated as recoverable: PostgREST names
 * the offending column in its message, it gets dropped, and the insert is
 * retried once. A missing coordinate is a detail. A missing lead is a job.
 */
async function insertLead(lead) {
  const first = await supabase.from("leads").insert(lead);
  if (!first?.error) return first;

  const message = String(first.error.message || "");
  // e.g. `column "latitude" of relation "leads" does not exist`
  const missing = message.match(/column "([^"]+)"/i)?.[1];

  if (first.error.code !== "42703" && !/does not exist/i.test(message)) return first;
  if (!missing || !(missing in lead)) return first;

  console.error(`leads has no "${missing}" column — retrying without it`);
  // Built by copying rather than destructuring the key out: a discarded
  // binding trips no-unused-vars, and silencing the rule to delete a key is
  // a worse trade than three plain lines.
  const rest = { ...lead };
  delete rest[missing];
  return supabase.from("leads").insert(rest);
}

/*
 * Writes the lead into the CRM. That is the whole job now, and the reason it
 * is the whole job is worth the paragraphs.
 *
 * ---------------------------------------------------------------------------
 * WHAT USED TO BE HERE
 * ---------------------------------------------------------------------------
 *
 * Two requests in parallel: this insert, and a POST to api.web3forms.com
 * whose only purpose was to email the business that a lead had arrived. The
 * submission counted as a success if EITHER landed, on the reasoning that
 * one path failing shouldn't cost a real lead.
 *
 * On 12 October 2026 the insert landed and the Web3Forms POST did not.
 * Web3Forms has no record of the request at all, which from the far end is
 * what a blocked request looks like — that domain is on several ad-blocker
 * lists. The customer saw the thank-you screen. The lead sat in the CRM.
 * Nobody was told, and the first contact went out two hours later.
 *
 * The dual path was not wrong about leads. It was wrong about WHO IS TOLD:
 * both halves ran in the customer's browser, so both could be stopped by the
 * customer's browser, and only one of them was ever going to make a phone
 * ring.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE NOTIFICATION WENT
 * ---------------------------------------------------------------------------
 *
 * Into the CRM, which already sweeps for new leads every minute to send the
 * customer "thanks for reaching out". That sweep now texts Jordan and Hayden
 * too — db/lead-alerts.sql and netlify/lib/leadAlerts.mjs in the CRM repo.
 *
 * It is strictly better than what it replaces, in four ways worth naming:
 *
 *   * it reads a row that is already committed, so no browser can stop it
 *   * it covers every source, not just this form — a Google Local Services
 *     lead is exactly as time-sensitive
 *   * a failure is visible, in the Netlify log and on the CRM's Undelivered
 *     page, rather than being a request nobody has a record of
 *   * it is a text, which makes a phone buzz at nine on a Sunday night the
 *     way an email never did
 *
 * So there is one path, and one third party fewer standing between somebody
 * filling in this form and somebody calling them back.
 *
 * ---------------------------------------------------------------------------
 * WHICH MAKES THE FAILURE CASE SIMPLER, NOT RISKIER
 * ---------------------------------------------------------------------------
 *
 * `ok` is now just the insert. If it fails, both quote forms already show
 * the phone number and ask the customer to call or text — which is the
 * honest outcome and always was the better one. The case this removes is the
 * silent one: a submission that reported success to the customer and reached
 * nobody.
 *
 * @param {object} lead  the row to insert into the `leads` table
 * @returns {Promise<{ ok: boolean, error?: unknown }>}
 */
export async function submitLead({ lead }) {
  let result;
  try {
    result = await insertLead(lead);
  } catch (err) {
    // insertLead can reject on a network failure, where PostgREST returning
    // an error object is the ordinary case. Both are "it didn't land".
    console.error("Lead insert threw:", err);
    return { ok: false, error: err };
  }

  if (result?.error) {
    console.error("Supabase insert failed:", result.error);
    return { ok: false, error: result.error };
  }

  return { ok: true };
}

/* Fires the Google Ads conversion — only call on a real successful submit. */
export function trackQuoteConversion() {
  // NOT SET UP YET. Reported once rather than silently doing nothing: a
  // conversion that never fires and a conversion that fires into a dead
  // account look identical from Google Ads, and both read as "nobody
  // converted". See src/lib/analytics.js.
  const target = leadConversionTarget();
  if (!target) {
    if (!warned) {
      warned = true;
      console.warn(
        "[analytics] a quote was submitted but no conversion was reported — " +
          "LEAD_CONVERSION_LABEL is not set in src/lib/analytics.js"
      );
    }
    return;
  }

  // typeof checks, not optional chaining. This site prerenders, so `window`
  // genuinely does not exist at build time — and in the browser gtag is
  // missing whenever an ad blocker has eaten googletagmanager.com, which is
  // common enough that it must not throw inside a submit handler and leave
  // the customer looking at an error for a request that went through.
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", "conversion", { send_to: target });
}

// Module-scope, so a second submission in the same session does not print it
// again. One line in the console is a note; one per submit is noise somebody
// learns to scroll past.
let warned = false;
