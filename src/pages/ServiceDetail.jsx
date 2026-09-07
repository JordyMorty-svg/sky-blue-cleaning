import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import "./ServiceDetail.css";
import { services, serviceBySlug } from "../data/services";
import QuoteForm from "../components/quoteform/QuoteForm";
import QuoteRequestForm from "../components/quoteform/QuoteRequestForm";

function ServiceDetail() {
  const { slug } = useParams();
  const service = serviceBySlug[slug];

  useEffect(() => {
    if (service) {
      document.title = `${service.title} — Sky Blue Cleaning Co.`;
    }
    return () => {
      document.title = "Sky Blue Cleaning Co.";
    };
  }, [service]);

  // Unknown slug — keep it friendly and route people back to the services.
  if (!service) {
    return (
      <main className="service">
        <div className="service__notfound">
          <h1>We couldn&apos;t find that service</h1>
          <p>The page you&apos;re after may have moved. Here&apos;s everything we do:</p>
          <Link className="service__notfound-btn" to="/#services">
            Back to services
          </Link>
        </div>
      </main>
    );
  }

  const others = services.filter((s) => s.slug !== service.slug);

  return (
    <main className="service">
      {/* ---- Hero header ---- */}
      <header className="service__hero">
        <div className="service__hero-inner">
          <p className="service__crumbs">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link to="/#services">Services</Link>
            <span aria-hidden="true">/</span>
            <span className="service__crumbs-current">{service.title}</span>
          </p>

          <span className="service__icon">{service.icon}</span>
          <h1 className="service__title">{service.title}</h1>
          <p className="service__tagline">{service.tagline}</p>
        </div>
      </header>

      {/* ---- Info ---- */}
      <section className="service__body">
        <div className="service__info">
          <p className="service__intro">{service.intro}</p>

          <h2 className="service__points-title">What&apos;s included</h2>
          <ul className="service__points">
            {service.points.map((point) => (
              <li className="service__point" key={point}>
                <svg
                  className="service__point-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Quote ---- */}
        <div className="service__quote">
          {service.quote === "estimator" && <QuoteForm />}
          {service.quote === "commercial" && (
            <QuoteRequestForm service={service} businessInquiry />
          )}
          {service.quote === "request" && <QuoteRequestForm service={service} />}
        </div>
      </section>

      {/* ---- Explore other services ---- */}
      <section className="service__more">
        <h2 className="service__more-title">Explore our other services</h2>
        <div className="service__more-grid">
          {others.map((s) => (
            <Link className="service__more-card" to={`/services/${s.slug}`} key={s.slug}>
              <span className="service__more-icon">{s.icon}</span>
              <span className="service__more-name">{s.title}</span>
              <span className="service__more-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export default ServiceDetail;
