

import { useState } from "react";
import "./Navbar.css";
import logoMark from "../../assets/logo-mark.png";

const links = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Reviews", href: "#reviews" },
  { label: "Contact", href: "#contact" },
];

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <a href="#home" className="navbar__logo" onClick={closeMenu}>
        <img className="navbar__icon" src={logoMark} alt="" />
        <span className="navbar__name">
          Sky Blue <span className="navbar__name-accent">Cleaning Co.</span>
        </span>
      </a>

      {/* Desktop links */}
      <ul className="navbar__links">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>

      <a href="#quote" className="navbar__button">
        Get a Free Quote
      </a>

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
            <li key={link.href}>
              <a href={link.href} onClick={closeMenu}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a href="#quote" className="navbar__menu-button" onClick={closeMenu}>
          Get a Free Quote
        </a>
      </div>
    </nav>
  );
}

export default Navbar;