import Hero from "../components/hero/Hero";
import Services from "../components/services/Services";
import Work from "../components/work/Work";
import QuoteForm from "../components/quoteform/QuoteForm";
import About from "../components/gallery/About";
import Reviews from "../components/reviews/Reviews";
import { usePageMeta } from "../lib/usePageMeta";
import { metaForPath } from "../lib/pageMeta";

/* The single-page homepage: all the scroll sections in order. */
function Home() {
  // Title and description come from index.html untouched; this only claims
  // the canonical URL, so /?gclid=… from an ad click counts as the homepage.
  //
  // Via metaForPath so the build and the browser read the same answer — see
  // the note in lib/pageMeta.js.
  usePageMeta(metaForPath("/"));

  return (
    <>
      <Hero />
      <Services />
      {/* PROOF BEFORE PRICE.

          Between the service list and the quote calculator, deliberately.
          Services says what we do; the calculator asks for a decision. A
          visitor who reaches the form without having seen a finished job is
          being asked to act on six icons and a paragraph.

          It is also the right place for the one before/after that exists:
          somebody scrolling past "pressure washing" in the card above hits
          the proof of it twenty pixels later. */}
      <Work />
      <QuoteForm />
      <About />
      <Reviews />
    </>
  );
}

export default Home;
