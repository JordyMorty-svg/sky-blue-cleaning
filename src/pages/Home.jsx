import Hero from "../components/hero/Hero";
import Services from "../components/services/Services";
import QuoteForm from "../components/quoteform/QuoteForm";
import About from "../components/gallery/About";
import Reviews from "../components/reviews/Reviews";
import { usePageMeta } from "../lib/usePageMeta";

/* The single-page homepage: all the scroll sections in order. */
function Home() {
  // Title and description come from index.html untouched; this only claims
  // the canonical URL, so /?gclid=… from an ad click counts as the homepage.
  usePageMeta({ path: "/" });

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
