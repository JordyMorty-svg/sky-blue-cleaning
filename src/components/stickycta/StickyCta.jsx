import { useEffect, useRef, useState } from "react";
import "./StickyCta.css";
import { BUSINESS } from "../../data/business";

/**
 * The quote bar that rides along the bottom of a phone screen.
 *
 * ---------------------------------------------------------------------------
 * WHY IT EXISTS
 * ---------------------------------------------------------------------------
 *
 * On a laptop the quote form is one scroll away and the navbar carries a
 * "Get a Free Quote" button the whole time. On a phone the navbar hides that
 * button behind the hamburger, so from the moment somebody scrolls past the
 * hero there is no way to act on the page without either scrolling to find
 * the form or opening a menu first. The home page is about ten screens tall.
 * Somebody convinced by the photographs on screen six has to keep being
 * convinced for four more screens before they can do anything about it.
 *
 * ---------------------------------------------------------------------------
 * WHY IT IS NOT ALWAYS THERE
 * ---------------------------------------------------------------------------
 *
 * Two places it would be worse than useless, and both are handled here
 * rather than by a scroll-position guess:
 *
 *   OVER THE HERO. The hero's own "Get a Free Quote" button is the largest
 *   thing on the first screen. A second copy of it 600px below is noise, and
 *   it eats the bottom of the first impression.
 *
 *   OVER THE FORM. Once the quote form is on screen, a floating button that
 *   scrolls you to the thing you are already looking at is a dead control
 *   sitting on top of the fields you are trying to fill in — it would cover
 *   the Send button at the exact moment it matters.
 *
 * IntersectionObserver rather than a scroll listener, because "is the hero
 * off screen" and "is the form on screen" are precisely what it answers, it
 * answers them without running code on every scroll frame, and it fires once
 * on observe — so a visitor who lands on /#quote from an ad gets the right
 * answer on the first frame instead of after their first flick.
 */
export default function StickyCta() {
  const [show, setShow] = useState(false);

  /* REFS, NOT TWO PIECES OF STATE. The decision needs both facts at once and
     each observer entry only carries one of them; two useStates would make
     the callback read a value it had just scheduled rather than the current
     one, and the bar would lag a scroll behind. */
  const pastHero = useRef(false);
  const atForm = useRef(false);

  useEffect(() => {
    const hero = document.getElementById("home");
    const quote = document.getElementById("quote");
    // Nothing to anchor to — a page without both of these does not get a bar
    // rather than getting one that is wrong about where it is.
    if (!hero || !quote) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === hero) pastHero.current = !e.isIntersecting;
          if (e.target === quote) atForm.current = e.isIntersecting;
        }
        setShow(pastHero.current && !atForm.current);
      },
      {
        // Any sliver counts. The form is taller than the screen, so a
        // threshold above 0 would mean "visible" never became true while
        // somebody scrolled through the middle of it.
        threshold: 0,
        // THE TOP 92px DO NOT COUNT AS ON SCREEN, because the sticky navbar
        // is sitting on them (the same 92px as scroll-margin-top in
        // index.css, and for the same reason). Without this the hero was
        // still "visible" when its last 90 pixels were behind the header:
        // the page looked like it had moved on and the bar had not.
        rootMargin: "-92px 0px 0px 0px",
      }
    );

    obs.observe(hero);
    obs.observe(quote);
    return () => obs.disconnect();
  }, []);

  return (
    /* RENDERED EITHER WAY, HIDDEN WITH visibility.
       Returning null would mean no transition and a bar that pops into
       existence; `display: none` the same. visibility:hidden animates, and
       unlike opacity:0 it also takes the links out of the tab order, so a
       keyboard user does not tab into a button they cannot see. */
    <div className={`stickycta${show ? "" : " stickycta--hidden"}`} aria-hidden={!show}>
      <a
        className="stickycta__call"
        href={`tel:+${BUSINESS.phoneDigits}`}
        aria-label={`Call Sky Blue Cleaning on ${BUSINESS.phoneDisplay}`}
        tabIndex={show ? undefined : -1}
      >
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        Call
      </a>

      {/* A plain hash link, not a button with a scroll handler. The site
          already scrolls correctly for #quote from the navbar and the hero,
          including the clearance under the sticky header (scroll-margin-top
          in index.css) — a second mechanism here would be a second thing
          that can disagree with the first. */}
      <a className="stickycta__quote" href="#quote" tabIndex={show ? undefined : -1}>
        Get a free quote
      </a>
    </div>
  );
}
