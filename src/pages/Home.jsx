import Hero from "../components/hero/Hero";
import Services from "../components/services/Services";
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
      <QuoteForm />
      <About />
      <Reviews />
    </>
  );
}

export default Home;
