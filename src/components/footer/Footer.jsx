import "./Footer.css";
import logoFull from "../../assets/logo-full.png";

const PHONE_DISPLAY = "(541) 730-3593";
const PHONE_DIGITS = "15417303593";
const EMAIL = "skybluecleaninggco@gmail.com";

function Footer() {
  return (
    <footer id="contact" className="footer">
      <div className="footer__grid">
        <div className="footer__brand">
          <img
            className="footer__logo"
            src={logoFull}
            alt="Sky Blue Cleaning Co."
            loading="lazy"
          />
          <p className="footer__tagline">
            Family-run window washing and exterior cleaning, serving Corvallis
            and the Willamette Valley.
          </p>
          <p className="footer__insured">Fully insured &middot; General liability &middot; Proof available on request</p>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Explore</h3>
          <ul className="footer__links">
            <li><a href="#home">Home</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#quote">Get a Quote</a></li>
          </ul>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Services</h3>
          <ul className="footer__links">
            <li><a href="#services">Residential windows</a></li>
            <li><a href="#services">Commercial windows</a></li>
            <li><a href="#services">Gutter cleaning</a></li>
            <li><a href="#services">Screens, pressure &amp; solar</a></li>
          </ul>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Contact</h3>
          <ul className="footer__links">
            <li><a href={`tel:+${PHONE_DIGITS}`}>{PHONE_DISPLAY}</a></li>
            <li><a href={`sms:+${PHONE_DIGITS}`}>Text us</a></li>
            <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            <li><span className="footer__area">Corvallis &amp; the Willamette Valley</span></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} Sky Blue Cleaning Co. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;