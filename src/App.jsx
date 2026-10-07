import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import ScrollManager from './components/ScrollManager';
import Home from './pages/Home';
import ServiceDetail from './pages/ServiceDetail';
import LegalPage from './pages/LegalPage';
import { PRIVACY, TERMS } from './data/legal';

function App() {
  return (
    <>
      <ScrollManager />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        {/* Before the catch-all. The "*" route below renders ServiceDetail's
            "we couldn't find that service" view, so a legal route declared
            after it would show a not-found page at a URL Google was told to
            go and read. */}
        <Route path="/privacy" element={<LegalPage page={PRIVACY} />} />
        <Route path="/terms" element={<LegalPage page={TERMS} />} />
        <Route path="*" element={<ServiceDetail />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
