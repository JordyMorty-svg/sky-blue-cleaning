/*
 * The privacy policy and the terms of service, as content.
 *
 * SEPARATE FROM THE MARKUP for the same reason services.jsx is: these change
 * for reasons that have nothing to do with layout — a new third party, a new
 * Google requirement, a line a lawyer rewrites — and a change to the words
 * should not mean touching a component.
 *
 * WRITTEN FROM THE CODE, NOT FROM A TEMPLATE. Every third party named below
 * is one this repository actually calls, and every field listed is one the
 * quote form actually sends. A policy that lists Facebook pixels the site
 * does not have, or omits the Google Places call it does, is worse than no
 * policy: it is a published statement about this business that is untrue.
 *
 * Checked against:
 *   src/lib/leadSubmit.js      Web3Forms and Supabase
 *   src/lib/googleMaps.js      Google Places autocomplete
 *   src/lib/analytics.js       Google Ads conversion measurement
 *   src/components/quoteform/  the fields themselves
 *
 * NOT LEGAL ADVICE. This is an honest description of what the software does,
 * which is the hard part and the part a template gets wrong. The liability
 * and payment terms in particular are a starting point for somebody
 * qualified to review, not a substitute for one.
 */

// THE .js IS REQUIRED. Everything else in src/ is only ever loaded through
// Vite, which resolves an extensionless import. This file is also imported by
// vite-plugin-seo.js, which plain Node loads — and Node's ESM resolver does
// not guess extensions. Without it the build still works and verify/seo.mjs
// dies with ERR_MODULE_NOT_FOUND.
import { BUSINESS } from "./business.js";

// Changed by hand when the words change. NOT a build timestamp: "last updated
// today" on every deploy is a lie that makes the date worthless, and the one
// thing a reader wants from it is whether the terms moved since they agreed.
export const LEGAL_UPDATED = "7 October 2026";

export const PRIVACY = {
  slug: "privacy",
  title: "Privacy Policy",
  metaTitle: `Privacy Policy — ${BUSINESS.name}`,
  metaDescription:
    "What Sky Blue Cleaning Co. collects when you ask for a quote, who it is shared with, and how to have it deleted.",
  intro:
    "This policy covers skybluecleaningco.com and the way Sky Blue Cleaning Co. handles information about the people who contact us. It describes what the site actually does, not what a template assumes.",
  sections: [
    {
      heading: "What we collect, and when",
      body: [
        "We collect information in one place: the quote request form. Nothing on this site asks you to create an account, and we do not collect anything about you until you choose to send a request.",
        "When you submit a quote request we receive your name, your phone number and email address (whichever you give us — one is enough), the service address, the details of the job you selected, and anything you write in the notes box. We also receive the approximate coordinates of the address you picked, which come from Google's address suggestions.",
        "If you call or text the number on this site, we keep a record of the call or message so we know what was discussed and what we promised.",
      ],
    },
    {
      heading: "Why we collect it",
      body: [
        "To quote your job, arrange a visit, do the work, invoice it, and follow up afterwards. That is the whole purpose.",
        "We do not sell your information, rent it, trade it, or hand it to data brokers. We do not use it to build advertising audiences.",
      ],
    },
    {
      heading: "Who else sees it",
      body: [
        "Supabase, which hosts the database your request is stored in.",
        "Web3Forms, which delivers your request to us as an email so we see it immediately.",
        "Google Maps Platform. The address box suggests addresses as you type, which means what you type into that box is sent to Google. This happens before you submit anything.",
        "Google Ads. Every page carries Google's advertising tag, which lets us see that an ad led to a quote request. It records that a request happened; it does not send Google the contents of the form.",
        "Quo (formerly OpenPhone), which carries our calls and text messages.",
        "Resend, which delivers the emails we send you.",
        "Netlify, which hosts this site and receives the ordinary web server records described below.",
        "That is the complete list. If it changes, this page changes.",
      ],
    },
    {
      heading: "Cookies and the advertising tag",
      body: [
        "Google's advertising tag sets cookies in your browser so that a quote request can be connected back to an ad click. You can block or delete these in your browser settings, and you can opt out of personalised Google advertising at myadcenter.google.com.",
        "The site does not use any other analytics, tracking pixels or advertising networks.",
      ],
    },
    {
      heading: "Text messages",
      body: [
        "If you give us your phone number we may text you about your quote, confirm an appointment the day before, or ask how the work went. These are about your job, not marketing blasts.",
        "Reply STOP to any message and we will stop texting that number. Message and data rates may apply, and message frequency varies with the job.",
        "We do not share your phone number with anyone for their own marketing.",
      ],
    },
    {
      heading: "How long we keep it",
      body: [
        "Quote requests and job records are kept while you are a customer and for seven years afterwards, because invoices and payment records have to be available for tax purposes.",
        "If a quote never becomes a job, we keep the request for two years so we recognise you if you come back, then delete it.",
      ],
    },
    {
      heading: "Having your information deleted",
      body: [
        `Email ${BUSINESS.email} or call ${BUSINESS.phoneDisplay} and ask. We will delete what we are not legally required to keep, and tell you what is left and why.`,
        "You can also ask for a copy of what we hold about you, or ask us to correct it.",
      ],
    },
    {
      heading: "Google user data",
      body: [
        "This section is about data Sky Blue Cleaning Co. reads from Google's own services, which is a separate matter from the information you give us.",
        "Our internal system connects to the Google Ads API to read the leads Google's Local Services Ads send us — the caller's name and phone number, the time, the service category, and whether Google charged us for the lead. We access it so that a lead we have paid for appears alongside every other enquiry instead of sitting in a separate inbox.",
        "That information is stored in the same private database as our other customer records, is visible only to Sky Blue Cleaning Co., and is kept under the retention periods above.",
        "We do not transfer Google user data to anyone else, do not use it for advertising, do not sell it to data brokers, and do not use it to train any machine learning or artificial intelligence model. Access is read-only: we do not change anything in your Google account, and the connection can be revoked at any time from the Google account that authorised it.",
      ],
    },
    {
      heading: "Server records",
      body: [
        "Our host keeps the ordinary records any web server keeps — IP address, browser, which page was requested and when. These are used to keep the site working and to investigate abuse, and are not combined with the quote form data.",
      ],
    },
    {
      heading: "Children",
      body: [
        "This is a service for property owners and tenants. We do not knowingly collect information from anyone under 13.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "If this policy changes, the date at the top changes with it. Material changes to how we use information already collected will be told to you directly, not just posted here.",
      ],
    },
  ],
};

export const TERMS = {
  slug: "terms",
  title: "Terms of Service",
  metaTitle: `Terms of Service — ${BUSINESS.name}`,
  metaDescription:
    "The terms Sky Blue Cleaning Co. works under: quotes, scheduling, access, payment, weather and breakage.",
  intro:
    "These terms cover window cleaning and related work carried out by Sky Blue Cleaning Co. in and around Corvallis, Oregon. Booking a job means agreeing to them.",
  sections: [
    {
      heading: "Quotes and prices",
      body: [
        "The figure the website calculates is an estimate based on what you tell us. It is not a binding price.",
        "We confirm a firm price before starting work. If what we find on site differs materially from what was described — more windows, a storey we were not told about, paint or construction residue that needs a different job entirely — we will tell you the revised price and wait for you to agree before carrying on.",
        "A written quote is valid for 30 days unless it says otherwise.",
      ],
    },
    {
      heading: "Scheduling and cancellation",
      body: [
        "We confirm appointments in advance and usually text a reminder the day before.",
        "Cancel or reschedule any time up to 24 hours before the appointment at no charge. Inside 24 hours, or if nobody is there and we cannot access the property, we may charge for the trip.",
        "We may reschedule for weather. Window cleaning in heavy rain, high wind or freezing conditions produces a poor result and is unsafe on ladders, so we will move the visit rather than do bad work.",
      ],
    },
    {
      heading: "Access and preparation",
      body: [
        "We need safe access to the windows, inside and out as the job requires. Please move fragile items off sills, secure pets, and leave space to set a ladder on firm ground.",
        "If an area cannot be reached safely we will leave it, tell you, and not charge for it.",
      ],
    },
    {
      heading: "Our work, and what we will not do",
      body: [
        "We clean glass, frames and sills as described in the quote. Screens and tracks are included when the quote says so.",
        "Some marks do not come off with cleaning. Hard water deposits, mineral etching, scratches, paint overspray and damaged or failed seals are conditions of the glass rather than dirt, and we will point them out rather than pretend otherwise. Restoration work for those is quoted separately.",
        "We will not work from a ladder in unsafe conditions, on unstable ground, or at a height beyond our equipment. If that limits what we can do, we will say so before taking the job.",
      ],
    },
    {
      heading: "If something is damaged",
      body: [
        "We carry general liability insurance and proof is available on request.",
        "If we damage something, tell us as soon as you notice it and we will put it right or claim for it. Please tell us within 7 days of the visit, while it is still clear what happened and when.",
        "Glass that is already cracked, chipped or has a failed seal can fail during ordinary cleaning. Where we spot that beforehand we will point it out and ask you to decide whether we clean it.",
      ],
    },
    {
      heading: "If you are not happy with the work",
      body: [
        "Tell us within 7 days and we will come back and redo the affected windows at no charge. That is the remedy we offer and the one we would want ourselves.",
      ],
    },
    {
      heading: "Payment",
      body: [
        "Payment is due when the work is finished unless we have agreed otherwise in writing. We accept card and the other methods listed on your invoice.",
        "Invoices unpaid after 30 days may incur a late fee, and we may decline further work until the account is settled.",
      ],
    },
    {
      heading: "Recurring plans",
      body: [
        "If you are on a recurring schedule, we will contact you before each visit. You can pause or cancel a recurring plan at any time by telling us before the next scheduled visit.",
      ],
    },
    {
      heading: "Photographs",
      body: [
        "We sometimes photograph our work for our own records and occasionally to show it on our website or social media. We never include anything that identifies you or your address, and if you would rather we did not photograph your property at all, just say so — before or after the visit.",
      ],
    },
    {
      heading: "Liability",
      body: [
        "Our responsibility for any claim arising from a job is limited to the amount paid for that job, except where the law does not allow that limit — which includes personal injury caused by our negligence.",
        "Nothing in these terms takes away rights you have under Oregon consumer law.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These terms are governed by the law of the State of Oregon, and any dispute belongs in the courts of Benton County, Oregon.",
      ],
    },
    {
      heading: "Getting in touch",
      body: [
        `Call or text ${BUSINESS.phoneDisplay}, or email ${BUSINESS.email}. A real person answers both.`,
      ],
    },
  ],
};

export const LEGAL_PAGES = [PRIVACY, TERMS];

export const legalBySlug = Object.fromEntries(LEGAL_PAGES.map((p) => [p.slug, p]));
