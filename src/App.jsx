import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import ScrollManager from './components/ScrollManager';
import Home from './pages/Home';
import ServiceDetail from './pages/ServiceDetail';

function App() {
  return (
    <>
      <ScrollManager />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/services/:slug" element={<ServiceDetail />} />
        <Route path="*" element={<ServiceDetail />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
