import { Link } from "react-router-dom";
import "./Services.css";
import { services } from "../../data/services";

function Services() {
  return (
    <section id="services" className="services">
      <div className="services__header">
        <p className="services__eyebrow">What we do</p>
        <h2 className="services__title">Everything that keeps your place looking sharp</h2>
        <p className="services__subtitle">
          We are a local, family owned business in the Willamette valley. With us, there's no need to juggle three different
          companies to keep your home or business clean.
        </p>
      </div>

      <div className="services__grid">
        {services.map((service) => (
          <Link
            className="services__card"
            key={service.slug}
            to={`/services/${service.slug}`}
          >
            <span className="services__icon">{service.icon}</span>
            <h3 className="services__card-title">{service.title}</h3>
            <p className="services__card-copy">{service.card}</p>
            <span className="services__card-link">
              Learn more &amp; get a quote <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="services__footer">
        <p className="services__footer-text">Not sure what you need? Just ask.</p>
        <a href="#quote" className="services__cta">Get a Free Quote</a>
      </div>
    </section>
  );
}

export default Services;
