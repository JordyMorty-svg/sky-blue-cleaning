import { supabase } from "../supabaseClient";
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
  // The address customers see and reply to. Shown in the footer and on both
  // quote forms as a mailto link; it is NOT where lead notifications are
  // delivered — Web3Forms sends those to whatever address its access key is
  // registered to, which is configured in the Web3Forms account, not here.
  email: BUSINESS.email,
};

const WEB3FORMS_ACCESS_KEY = "4da845f5-1959-4972-8192-e060287fc8b2";

/*
 * Sends a lead down both paths at once:
 *   - Web3Forms  -> emails the lead to the business inbox
 *   - Supabase   -> writes the lead row into the CRM `leads` table
 *
 * Neither waits on the other. As long as the lead lands SOMEWHERE, the
 * customer's submission counts as a success — one path failing shouldn't
 * cost a real lead.
 *
 * @param {object} emailFields  extra fields to include in the Web3Forms email
 * @param {object} lead         the row to insert into the `leads` table
 * @returns {Promise<{ ok: boolean, web3Ok: boolean, dbOk: boolean }>}
 */
export async function submitLead({ emailFields, lead }) {
  const web3Submit = fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      from_name: "Sky Blue Cleaning Co. website",
      ...emailFields,
    }),
  }).then((r) => r.json());

  // Column names must match the leads table exactly.
  const dbSubmit = supabase.from("leads").insert(lead);

  const [web3Result, dbResult] = await Promise.allSettled([web3Submit, dbSubmit]);

  const web3Ok = web3Result.status === "fulfilled" && web3Result.value?.success;
  const dbOk = dbResult.status === "fulfilled" && !dbResult.value?.error;

  // Log failures quietly for debugging, without alarming the customer.
  if (!dbOk) console.error("Supabase insert failed:", dbResult);
  if (!web3Ok) console.error("Web3Forms failed:", web3Result);

  return { ok: web3Ok || dbOk, web3Ok, dbOk };
}

/* Fires the Google Ads conversion — only call on a real successful submit. */
export function trackQuoteConversion() {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "conversion", {
      send_to: "AW-18343098144/c22yCJXTmNUcEKDu1apE",
    });
  }
}
