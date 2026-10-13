import "./Hero.css";
/* THE SQUEEGEE MID-PULL, which is the best photograph this business has.
   Three things in one frame: a hand doing the work, the clean stripe
   appearing behind the blade, and sky reflected in what has already been
   done. Every hero before it showed a finished window — a state, which
   any window could be in. This shows the change happening, and it is the
   only picture here that could not be a stock photo of a nice house. */
import heroWindow from "../../assets/work/hero-squeegee.jpg";

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
            {/* THE SECOND BUTTON POINTS AT THE PHOTOGRAPHS, not at the
                bios. "Meet the team" sent somebody who was not ready to
                ask for a price down to two portraits and a paragraph —
                pleasant, and not evidence of anything. The question in
                their head at this point is "are these two any good", and
                the answer to that is the wall of before-and-afters in
                #work. About is still a tap away in the nav and in the
                footer for anybody who wants it. */}
            <a href="#work" className="hero__button hero__button--ghost">
              See our work
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

        {/* A CLEAN WINDOW, not a ladder.

            This was a looping clip of a telescopic ladder against some
            siding — equipment, no glass, no result, and nothing a customer
            is buying. The headline says "streak-free windows" and the
            picture beside it showed neither.

            A still, not a video, and that is a choice rather than a
            downgrade: the clip was 2.1MB against 230KB here, it autoplayed
            into a decision nobody asked for, and a sharp photograph of the
            actual finish says the thing the headline is claiming. The video
            stays in the repo for the day there is footage worth looping. */}
        <div className="hero__media">
          <img
            className="hero__photo"
            src={heroWindow}
            alt="A squeegee being pulled across a window, leaving a clear stripe with blue sky and cloud reflected in the cleaned glass"
            width="1125"
            height="1500"
            /* NOT lazy. This is the first thing in the viewport, and a lazy
               hero image is a hero that arrives after the fold has already
               been read. fetchpriority tells the browser to treat it as the
               thing the page is about, which it is. */
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}

export default Hero;