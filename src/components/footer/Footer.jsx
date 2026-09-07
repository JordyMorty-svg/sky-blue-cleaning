import { Link } from "react-router-dom";
import "./Footer.css";
import logoFull from "../../assets/logo-full.png";
import { services } from "../../data/services";
import { CONTACT } from "../../lib/leadSubmit";

const { phoneDisplay: PHONE_DISPLAY, phoneDigits: PHONE_DIGITS, email: EMAIL } = CONTACT;

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
            <li><Link to="/">Home</Link></li>
            <li><Link to="/#services">Services</Link></li>
            <li><Link to="/#about">About</Link></li>
            <li><Link to="/#quote">Get a Quote</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <h3 className="footer__heading">Services</h3>
          <ul className="footer__links">
            {services.map((service) => (
              <li key={service.slug}>
                <Link to={`/services/${service.slug}`}>{service.title}</Link>
              </li>
            ))}
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
