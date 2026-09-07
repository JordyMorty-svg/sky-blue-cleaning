/*
 * Single source of truth for the services offered.
 *
 * Used by:
 *   - components/services/Services.jsx  (the homepage card grid)
 *   - pages/ServiceDetail.jsx           (the per-service info + quote page)
 *
 * `quote` picks which quote experience the detail page shows:
 *   "estimator"  -> the live window-pricing estimator (residential windows)
 *   "commercial" -> business-inquiry page, per-pane pricing, reach out for a quote
 *   "request"    -> a simple "request a quote" contact form, tagged with the service
 */

const icons = {
  residential: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="12" y1="3" x2="12" y2="21" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  commercial: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
      <path d="M15 9h4a1 1 0 0 1 1 1v11" />
      <line x1="8" y1="8" x2="8" y2="8" />
      <line x1="11" y1="8" x2="11" y2="8" />
      <line x1="8" y1="12" x2="8" y2="12" />
      <line x1="11" y1="12" x2="11" y2="12" />
    </svg>
  ),
  gutter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10l9-6 9 6" />
      <path d="M4 10v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <path d="M8 21v-3" />
      <path d="M16 21v-3" />
    </svg>
  ),
  screen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M8 4v16M12 4v16M16 4v16M4 8h16M4 12h16M4 16h16" strokeWidth="1" />
    </svg>
  ),
  pressure: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h6l1-4h4l1 4h6" />
      <path d="M14 7l6-4" />
      <path d="M14 7v4" />
      <path d="M9 7h5v4H9z" />
    </svg>
  ),
  solar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3" />
      <path d="M12 2v1M12 13v1M6 8H5M19 8h-1M7.5 3.5l.7.7M16.5 3.5l-.7.7" />
      <path d="M4 21l2-6h12l2 6z" />
      <path d="M10 15l-1 6M14 15l1 6" />
    </svg>
  ),
};

export const services = [
  {
    slug: "residential-window-washing",
    title: "Residential Window Washing",
    card: "Interior and exterior glass, sills, and tracks left spotless, inside and out, top to bottom.",
    icon: icons.residential,
    quote: "estimator",
    tagline: "Spotless glass, inside and out.",
    intro:
      "The centerpiece of what we do. We hand-clean the exterior glass, wipe down the sills, and clear the tracks, so the whole window looks new, not just the pane. Outside, we use a water-fed pole system that rinses with pure water and dries streak-free, which lets us reach second-story glass safely from the ground. Want the inside done too? Interior glass is a simple add-on.",
    points: [
      "Exterior glass hand-detailed (interior available as an add-on)",
      "Sills wiped and tracks cleared of dirt and cobwebs",
      "Screens scrubbed with soap, then rinsed with screen cleaner so they sparkle",
      "Water-fed pole for safe, streak-free second-story reach",
      "One-time or on a recurring schedule you set",
    ],
    quoteHeading: "Build your window quote",
    quoteBlurb:
      "Use the estimator to see a ballpark price in seconds, then send it over. We confirm the final number with a free on-site look, no obligation.",
  },
  {
    slug: "commercial-window-washing",
    title: "Commercial Window Washing",
    card: "Storefronts, offices, and multi-story glass kept crystal clear on a schedule that works for you.",
    icon: icons.commercial,
    quote: "commercial",
    tagline: "Clear glass keeps your storefront working.",
    intro:
      "Storefronts, offices, restaurants, and multi-tenant buildings kept crystal clear on a schedule that fits your business, weekly, monthly, or one-time. Clean glass is the first thing a customer sees, and we keep it looking that way without getting in the way of your day.",
    points: [
      "Storefronts, offices, and multi-story glass",
      "Weekly, biweekly, monthly, or one-time visits",
      "Scheduled around your open hours",
      "Fully insured, with a consistent crew you'll recognize",
      "Interior and exterior, plus entry glass and partitions",
    ],
    quoteHeading: "Request a business quote",
    quoteBlurb:
      "Commercial window cleaning is priced per pane, and the rate depends on the size of the panes, how much glass there is, access, and how often you want us out. Because every building is different, we don't post a flat price, tell us a bit about your property and we'll put together a quote built for it.",
  },
  {
    slug: "gutter-cleaning",
    title: "Gutter Cleaning",
    card: "We clear out leaves and debris so water flows where it should, and stays off your foundation.",
    icon: icons.gutter,
    quote: "request",
    tagline: "Keep water flowing where it should.",
    intro:
      "Clogged gutters send water over the edge and down your walls, exactly where you don't want it, near the foundation. We clear out the leaves, needles, and debris by hand, flush the downspouts, and bag it all up so your gutters actually do their job when the Valley rain comes.",
    points: [
      "Gutters cleared of leaves, needles, and debris by hand",
      "Downspouts flushed and checked for flow",
      "Debris bagged and hauled off, not left in your beds",
      "A heads-up if we spot loose brackets or damage",
      "Pairs well with a window visit in the same trip",
    ],
    quoteHeading: "Request a gutter quote",
    quoteBlurb:
      "Tell us a little about your home and we'll get you a quote. We confirm the final number with a free on-site look, no obligation.",
  },
  {
    slug: "screen-cleaning-repair",
    title: "Screen Cleaning & Repair",
    card: "Screens washed, re-fitted, and patched up so they actually keep the bugs out again.",
    icon: icons.screen,
    quote: "request",
    tagline: "Screens that keep the bugs out again.",
    intro:
      "Window screens collect dust, pollen, and cobwebs, and over time the mesh tears or the frames warp and stop sitting right. We wash them clean, re-fit them so they seat properly, and can re-mesh or patch the ones that have given up, so your screens keep doing their one job.",
    points: [
      "Screens washed free of dust, pollen, and cobwebs",
      "Re-fitted so they seat properly in the frame",
      "Torn mesh re-screened or patched",
      "Bent or loose frames adjusted where we can",
      "Done alongside a window cleaning or on its own",
    ],
    quoteHeading: "Request a screen quote",
    quoteBlurb:
      "Tell us a little about your home and roughly how many screens need attention, and we'll get you a quote. We confirm the final number with a free on-site look, no obligation.",
  },
  {
    slug: "pressure-washing",
    title: "Pressure Washing",
    card: "Driveways, siding, decks, and walkways blasted back to like-new, grime, moss, and all.",
    icon: icons.pressure,
    quote: "request",
    tagline: "Grime and moss, gone.",
    intro:
      "Driveways, siding, decks, patios, and walkways get a green-gray film of moss and grime in our climate. We pressure wash the hard surfaces and soft-wash the more delicate ones, so everything comes back to like-new without damaging the surface underneath.",
    points: [
      "Driveways, walkways, and patios",
      "Siding, fences, and decks",
      "Moss, algae, dirt, and mildew lifted away",
      "Soft-wash on surfaces that shouldn't take high pressure",
      "A big lift to curb appeal in a single visit",
    ],
    quoteHeading: "Request a pressure washing quote",
    quoteBlurb:
      "Tell us what you'd like cleaned and roughly the area, and we'll get you a quote. We confirm the final number with a free on-site look, no obligation.",
  },
  {
    slug: "solar-panel-cleaning",
    title: "Solar Panel Cleaning",
    card: "Dust and grime off your panels so they soak up sun and pull maximum power all year.",
    icon: icons.solar,
    quote: "request",
    tagline: "Dirty panels are lazy panels.",
    intro:
      "Dust, pollen, and grime build a film on solar panels that quietly cuts how much power they make. We clean them with pure water and a soft touch, no harsh chemicals, no scratching, so they soak up the sun and earn their keep the way they're supposed to.",
    points: [
      "Panels cleaned with pure water, no harsh chemicals",
      "Soft-bristle, no-scratch method",
      "Ground-level and single-story roof panels",
      "Restores output lost to dust, pollen, and film",
      "Best on a light recurring schedule",
    ],
    quoteHeading: "Request a solar panel quote",
    quoteBlurb:
      "Tell us a little about your setup and roughly how many panels, and we'll get you a quote. We confirm the final number with a free on-site look, no obligation.",
  },
];

export const serviceBySlug = Object.fromEntries(
  services.map((s) => [s.slug, s])
);
