import Hero from "../components/hero/Hero";
import Services from "../components/services/Services";
import QuoteForm from "../components/quoteform/QuoteForm";
import About from "../components/gallery/About";
import Reviews from "../components/reviews/Reviews";

/* The single-page homepage: all the scroll sections in order. */
function Home() {
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
