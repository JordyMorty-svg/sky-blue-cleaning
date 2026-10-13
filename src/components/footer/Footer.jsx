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

        {/* FIVE SHORT WORDS, SET AS A ROW ON A PHONE rather than five
            full-width rows of one word each — see .footer__links--inline.
            "Our work" is here because the navbar has it; a footer nav that
            is a subset of the header nav is the kind of difference nobody
            decides on, they just forget. */}
        <div className="footer__col footer__col--explore">
          <h3 className="footer__heading">Explore</h3>
          <ul className="footer__links footer__links--inline">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/#services">Services</Link></li>
            <li><Link to="/#work">Our work</Link></li>
            <li><Link to="/#about">About</Link></li>
            <li><Link to="/#quote">Get a Quote</Link></li>
          </ul>
        </div>

        <div className="footer__col footer__col--services">
          <h3 className="footer__heading">Services</h3>
          <ul className="footer__links">
            {services.map((service) => (
              <li key={service.slug}>
                <Link to={`/services/${service.slug}`}>{service.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* FIRST ON A PHONE, by `order` in the stylesheet. Somebody who has
            scrolled to the bottom of a ten-screen page is not looking for
            the sitemap; they are looking for the number. On a laptop it
            stays in the fourth column where the grid puts it. */}
        <div className="footer__col footer__col--contact">
          <h3 className="footer__heading">Contact</h3>
          {/* ITS OWN ELEMENT, not the first item of the list. On a phone it
              becomes a bordered, full-width tap target, which is the one
              thing this block exists to offer — a phone number set as the
              first of four grey links is a line of text that happens to be
              callable. */}
          <a className="footer__call" href={`tel:+${PHONE_DIGITS}`}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {PHONE_DISPLAY}
          </a>
          <ul className="footer__links">
            <li><a href={`sms:+${PHONE_DIGITS}`}>Text us</a></li>
            <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
            <li><span className="footer__area">Corvallis &amp; the Willamette Valley</span></li>
          </ul>
        </div>
      </div>

      <div className="footer__bottom">
        <p>&copy; {new Date().getFullYear()} Sky Blue Cleaning Co. All rights reserved.</p>
        {/* THE PRIVACY LINK IS NOT DECORATION. Google's OAuth policy requires
            the privacy policy to be linked from the app's homepage, and the
            footer is on every page — so the homepage carries it without a
            second place to remember. */}
        <p className="footer__legal">
          <Link to="/privacy">Privacy Policy</Link>
          <span aria-hidden="true"> &middot; </span>
          <Link to="/terms">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
