import "./Services.css";

const services = [
  {
    title: "Residential Window Washing",
    copy: "Interior and exterior glass, sills, and tracks left spotless, inside and out, top to bottom.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </svg>
    ),
  },
  {
    title: "Commercial Window Washing",
    copy: "Storefronts, offices, and multi-story glass kept crystal clear on a schedule that works for you.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16" />
        <path d="M15 9h4a1 1 0 0 1 1 1v11" />
        <line x1="8" y1="8" x2="8" y2="8" />
        <line x1="11" y1="8" x2="11" y2="8" />
        <line x1="8" y1="12" x2="8" y2="12" />
        <line x1="11" y1="12" x2="11" y2="12" />
      </svg>
    ),
  },
  {
    title: "Gutter Cleaning",
    copy: "We clear out leaves and debris so water flows where it should, and stays off your foundation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l9-6 9 6" />
        <path d="M4 10v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
        <path d="M8 21v-3" />
        <path d="M16 21v-3" />
      </svg>
    ),
  },
  {
    title: "Screen Cleaning & Repair",
    copy: "Screens washed, re-fitted, and patched up so they actually keep the bugs out again.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="1" />
        <path d="M8 4v16M12 4v16M16 4v16M4 8h16M4 12h16M4 16h16" strokeWidth="1" />
      </svg>
    ),
  },
  {
    title: "Pressure Washing",
    copy: "Driveways, siding, decks, and walkways blasted back to like-new, grime, moss, and all.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h6l1-4h4l1 4h6" />
        <path d="M14 7l6-4" />
        <path d="M14 7v4" />
        <path d="M9 7h5v4H9z" />
      </svg>
    ),
  },
  {
    title: "Solar Panel Cleaning",
    copy: "Dust and grime off your panels so they soak up sun and pull maximum power all year.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3" />
        <path d="M12 2v1M12 13v1M6 8H5M19 8h-1M7.5 3.5l.7.7M16.5 3.5l-.7.7" />
        <path d="M4 21l2-6h12l2 6z" />
        <path d="M10 15l-1 6M14 15l1 6" />
      </svg>
    ),
  },
];

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
          <article className="services__card" key={service.title}>
            <span className="services__icon">{service.icon}</span>
            <h3 className="services__card-title">{service.title}</h3>
            <p className="services__card-copy">{service.copy}</p>
          </article>
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