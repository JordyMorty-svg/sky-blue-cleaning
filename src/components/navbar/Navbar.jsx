import "./Navbar.css";
import logoMark from "../../assets/logo-mark.png";

function Navbar() {
  return (
    <nav className="navbar">
      <a href="#home" className="navbar__logo">
        <img className="navbar__icon" src={logoMark} alt="" />
        <span className="navbar__name">
          Sky Blue <span className="navbar__name-accent">Cleaning Co.</span>
        </span>
      </a>

      <ul className="navbar__links">
        <li><a href="#home">Home</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#reviews">Reviews</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>

      <a href="#quote" className="navbar__button">
        Get a Free Quote
      </a>
    </nav>
  );
}

export default Navbar;