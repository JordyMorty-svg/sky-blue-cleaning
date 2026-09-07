import { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import logoMark from "../../assets/logo-mark-3.png";

// Section links point at the homepage anchors, so they work from any page.
const links = [
  { label: "Home", to: "/" },
  { label: "Services", to: "/#services" },
  { label: "About", to: "/#about" },
  { label: "Reviews", to: "/#reviews" },
  { label: "Contact", to: "/#contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__logo" onClick={closeMenu}>
        <img className="navbar__icon" src={logoMark} alt="" />
        <span className="navbar__name">
          Sky Blue <span className="navbar__name-accent">Cleaning Co.</span>
        </span>
      </Link>

      {/* Desktop links */}
      <ul className="navbar__links">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>

      <Link to="/#quote" className="navbar__button">
        Get a Free Quote
      </Link>

      {/* Mobile hamburger */}
      <button
        type="button"
        className={`navbar__toggle ${menuOpen ? "navbar__toggle--open" : ""}`}
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        <span className="navbar__toggle-line" />
        <span className="navbar__toggle-line" />
        <span className="navbar__toggle-line" />
      </button>

      {/* Mobile menu panel */}
      <div
        id="mobile-menu"
        className={`navbar__menu ${menuOpen ? "navbar__menu--open" : ""}`}
      >
        <ul className="navbar__menu-links">
          {links.map((link) => (
            <li key={link.to}>
              <Link to={link.to} onClick={closeMenu}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/#quote" className="navbar__menu-button" onClick={closeMenu}>
          Get a Free Quote
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
