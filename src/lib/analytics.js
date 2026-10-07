// src/lib/analytics.js
//
// The one place the Google Ads account is named.
//
// WHY THIS FILE EXISTS. The ID used to be written out twice — once in
// index.html, which loads the tag, and once in leadSubmit.js, which fires the
// conversion. In October 2026 a new Ads account was set up, index.html was
// never updated, and the two drifted:
//
//   index.html        AW-18343098144      (the old account)
//   leadSubmit.js     AW-18343098144/...  (a label belonging to it)
//   the live account  AW-18406557035
//
// Everything looked configured. The Search campaign spent money for weeks and
// reported no conversions, because the conversion was addressed to a
// destination the page was not listening to. Nothing anywhere went red.
//
// Now the build reads the ID from here and writes it into index.html — see
// vite-plugin-seo.js — and the conversion reads it from here too. There is
// one string, so there is nothing to drift.

/**
 * The Google Ads account the site reports to.
 *
 * Found in Google Ads under Admin → Google tag, on the account that is
 * actually running the campaign. Not the Customer ID (146-936-2727); that is
 * a different number for a different purpose and they are easy to confuse.
 */
export const GOOGLE_ADS_ID = "AW-18406557035";

/**
 * The conversion action a submitted quote request counts as.
 *
 * Created in Google Ads: Goals → Conversions → New conversion action →
 * Website → "Add a conversion action manually", category *Submit lead form*.
 * Google then shows a snippet containing
 *
 *     send_to: 'AW-18406557035/XXXXXXXXXXXXXXXXXXXX'
 *
 * and the part after the slash is what goes here.
 *
 * A LABEL BELONGS TO ONE ACCOUNT. The previous one — c22yCJXTmNUcEKDu1apE —
 * was issued by AW-18343098144 and means nothing to the account above, which
 * is why it is not simply carried over. Recorded here so nobody finds it in
 * the git history and assumes it was lost by accident.
 *
 * EMPTY IS A SAFE STATE. While this is blank no conversion is reported, which
 * is honest: the alternative is firing an event at an action that does not
 * exist and reading the silence as "tracking works, nobody converted".
 *
 * Set 7 Oct 2026 from the "Submit lead form (1)" action in AW-18406557035.
 */
export const LEAD_CONVERSION_LABEL = "kZadCN-ohpQdEOuK98hE";

/**
 * Where a lead conversion should be sent, or null if it is not set up yet.
 *
 * One function rather than the callers each gluing the two strings together,
 * because the gluing is where the slash goes missing.
 */
export function leadConversionTarget() {
  if (!GOOGLE_ADS_ID || !LEAD_CONVERSION_LABEL) return null;
  return `${GOOGLE_ADS_ID}/${LEAD_CONVERSION_LABEL}`;
}
