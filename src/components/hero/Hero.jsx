import "./Hero.css";
import heroLoop from "../../assets/hero-loop.mp4";
import heroPoster from "../../assets/hero-poster.jpg";

const trustPoints = [
  "Family-run & local",
  "Fully insured",
  "Free, no-pressure quotes",
  "Satisfaction guaranteed",
  "200+ satisfied customers"
];

function Hero() {
  return (
    <section id="home" className="hero">
      <div className="hero__glow" aria-hidden="true" />

      <div className="hero__inner">
        <div className="hero__content">
          <p className="hero__eyebrow">
            <span className="hero__eyebrow-dot" />
            Residential &amp; commercial window washing
          </p>

          <h1 className="hero__title">
            Streak-free windows,
           <br />
            done right.
          </h1>

          <p className="hero__subtitle">
            Streak-free, spot-free window cleaning for homes and businesses in Corvallis
            and across the Willamette Valley. Fully insured, always on time, and
            if you&apos;re not happy, we&apos;ll make it right.
          </p>

          <div className="hero__actions">
            <a href="#quote" className="hero__button hero__button--primary">
              Get a Free Quote
            </a>
            <a href="#about" className="hero__button hero__button--ghost">
              Meet the team
            </a>
          </div>

          <ul className="hero__trust">
            {trustPoints.map((point) => (
              <li className="hero__trust-item" key={point}>
                <svg
                  className="hero__trust-check"
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
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="hero__media">
          <video
            className="hero__video"
            src={heroLoop}
            poster={heroPoster}
            autoPlay
            loop
            muted
            playsInline
            aria-label="Hayden cleaning a window with a water-fed pole"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;