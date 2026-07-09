import './App.css';
import Navbar from './components/navbar/Navbar';
import Hero from './components/hero/Hero';
import Services from './components/services/Services';
import QuoteForm from './components/quoteform/QuoteForm';
import About from './components/gallery/About';
import Footer from './components/footer/Footer';
import Reviews from './components/reviews/Reviews'

function App() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <QuoteForm />
      <About />
      <Reviews />
      <Footer />
    </>
  );
}

export default App;