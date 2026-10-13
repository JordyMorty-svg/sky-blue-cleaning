import { useState } from "react";
import "./Work.css";
import Lightbox from "../lightbox/Lightbox";
import pressureBefore from "../../assets/work/pressure-before.jpg";
import pressureAfter from "../../assets/work/pressure-after.jpg";
import storefront from "../../assets/work/commercial-storefront.jpg";
import solar from "../../assets/work/solar-panels.jpg";
import porch from "../../assets/work/result-porch.jpg";
import glasswall from "../../assets/work/result-glasswall.jpg";
import squeegee from "../../assets/work/result-squeegee-reflection.jpg";
import picture from "../../assets/work/hero-window.jpg";

/**
 * Photographs of jobs Sky Blue has actually done.
 *
 * WHY THE PAGE NEEDED THIS. Until now the only pictures on the site were a
 * looping clip of a ladder, two portraits, and six icons. Everything that
 * claimed the work was good was a sentence written by the people doing it.
 * A homeowner deciding between three window cleaners is not reading the
 * sentences; they are looking for evidence that these two have done this
 * before and that the result is worth the money.
 *
 * ---------------------------------------------------------------------------
 * SIDE BY SIDE, NOT A DRAG-TO-COMPARE SLIDER
 * ---------------------------------------------------------------------------
 *
 * A slider was built first and thrown away, which is worth recording so it
 * is not built again.
 *
 * A wipe-slider only works when the two photographs are the same frame: same
 * spot, same height, same light. Sky Blue's pressure-washing pair is shot
 * from two different positions in two different lights — the "before" close
 * and in dappled sun, the "after" further back and overcast. Wiping between
 * them makes the whole path appear to move, and a comparison where the
 * camera jumps reads as a trick even when the work is real.
 *
 * Side by side is honest about being two photographs. It also survives the
 * next pair being imperfect, which matters when the photographer is a man
 * with a pressure washer and not a photographer.
 */

const RESULTS = [
  /* THE GLASS WALL LEADS. It is the most aspirational photograph here —
     a deck, trees, a wall of glass with the pole still leaning against it
     — and the row's job is to make somebody want their own windows to
     look like that. The two squeegee shots that follow are the work
     itself; the two after them are finished houses.

     Action before results, deliberately: a finished window is a state
     anybody's window could already be in, while a hand on a squeegee is
     evidence somebody turned up. */
  { src: glasswall, alt: "A wall of glass beside a deck, cleaned, with the water-fed pole still leaning against it" },
  { src: squeegee, alt: "A squeegee crossing a pane in full sun, the cleaner reflected in the glass behind it" },
  { src: porch, alt: "A covered porch with sliding glass doors cleaned inside and out" },
  { src: picture, alt: "A large picture window cleaned inside and out, reflecting the garden" },
];

function Work() {
  /* ONE LIST FOR THE WHOLE SECTION, in the order they appear on the page.
     The arrows in the viewer then walk the section the way the eye does —
     before, after, the four results, then the two service shots — rather
     than jumping between three separate little galleries. */
  const PHOTOS = [
    { src: pressureBefore, alt: "A concrete path thick with green moss and dirt before pressure washing", caption: "Before — a side path in Corvallis, moss and years of build-up." },
    { src: pressureAfter, alt: "The same path after pressure washing, moss gone and the aggregate visible again", caption: "After — the same path, back to bare aggregate." },
    ...RESULTS.map((r) => ({ src: r.src, alt: r.alt, caption: r.alt })),
    { src: storefront, alt: "Sky Blue's ladder set up on the sidewalk against the front windows of T.S.A. Vintage in downtown Corvallis, the glass reflecting the street and the racks visible inside", caption: "T.S.A. Vintage, downtown Corvallis." },
    { src: solar, alt: "Jordan on a ladder cleaning a rooftop solar array in Corvallis", caption: "Jordan cleaning a rooftop array in Corvallis." },
  ];

  const [shown, setShown] = useState(null);

  /* A <button> around the image, not an onClick on the <img>.
     A div with a click handler is invisible to a keyboard and silent to a
     screen reader; a button is tabbable, announces itself, and fires on
     Enter and Space for free. */
  const zoom = (i, child) => (
    <button
      type="button"
      className="is-zoomable"
      onClick={() => setShown(i)}
      aria-label={`View larger: ${PHOTOS[i].alt}`}
    >
      {child}
    </button>
  );

  return (
    <section className="work" id="work">
      <div className="work__inner">
        {/* Wrapped in a header div with the same max-width and spacing as
            .services__header, so the two sections are the same shape as
            well as the same type. */}
        <div className="work__header">
          <p className="work__eyebrow">Our work</p>
          <h2 className="work__title">See the difference for yourself</h2>
          <p className="work__lead">
            Real jobs around Corvallis and the Willamette Valley. No stock
            photos, no touch-ups.
          </p>
        </div>

        {/* THE BEFORE/AFTER FIRST, because it is the only thing here that
            proves a change rather than showing a state. A clean window is
            a photograph of a clean window; a mossed-over path next to the
            same path scrubbed back to the aggregate is proof of work.

            NARROW, and that is the fix for the first version. These are
            phone photos in portrait, and at half the content width each
            one stood about 700px tall — two of them filled a laptop screen
            with a side path. The comparison does not get better with size
            past the point where you can see the moss; everything after
            that is just scrolling. */}
        <div className="work__ba">
          <figure className="work__shot">
            {zoom(0,
            <img
                src={pressureBefore}
                alt="A concrete path thick with green moss and dirt before pressure washing"
                loading="lazy"
                width="1050"
                height="1400"
              />
            )}
            <figcaption className="work__tag work__tag--before">Before</figcaption>
          </figure>
          <figure className="work__shot">
            {zoom(1,
            <img
                src={pressureAfter}
                alt="The same path after pressure washing, moss gone and the aggregate visible again"
                loading="lazy"
                width="1050"
                height="1400"
              />
            )}
            <figcaption className="work__tag work__tag--after">After</figcaption>
          </figure>
        </div>
        <p className="work__caption">
          Pressure washing a side path in Corvallis — moss and years of
          build-up taken back to bare aggregate.
        </p>

        {/* RESIDENTIAL, SAID OUT LOUD, AND BEFORE THE COMMERCIAL BLOCK.

            These three sat directly underneath the storefront in the first
            version, with nothing between them, so they read as more photos
            of T.S.A. Vintage — three pictures of a house filed under a shop.
            Two changes fix it and both are needed: they are labelled, and
            commercial now comes last so nothing residential can sit under
            it and inherit its heading. */}
        {/* "WINDOW CLEANING RESULTS", not "Around the house".

            The first label said where the photos were taken. This one says
            what is being sold — and on a page whose other proof is a
            pressure-washed path and a storefront, the one thing a visitor
            could leave unsure about is whether the window work is any good.
            The heading answers it before they look. */}
        <h3 className="work__subhead">Window cleaning results</h3>
        <ul className="work__grid">
          {RESULTS.map((r, i) => (
            <li className="work__cell" key={r.alt}>
              {/* +2 because the two pressure-washing photos come first in
                  PHOTOS — see the note where it is built. */}
              {zoom(i + 2, <img src={r.src} alt={r.alt} loading="lazy" />)}
            </li>
          ))}
        </ul>

        {/* TWO SERVICE CALLOUTS, SIDE BY SIDE.

            Commercial used to be a lone full-width card, which gave one
            secondary service a billboard and the other — solar — nothing
            at all, despite solar being on the services list above with
            only an icon to its name. A matched pair reads as "we also do
            these two things" rather than as an advert for one of them.

            Both come AFTER the window results, so nothing residential can
            sit under a commercial heading and be read as part of that job. */}
        <div className="work__also">
          <div className="work__card">
            {zoom(PHOTOS.length - 2,
            <img
                className="work__card-photo"
                src={storefront}
                alt="Sky Blue's ladder set up on the sidewalk against the front windows of T.S.A. Vintage in downtown Corvallis, the glass reflecting the street and the racks visible inside"
                loading="lazy"
                width="1200"
                height="1200"
              />
            )}
            <div className="work__card-text">
              <h3 className="work__card-heading">Storefronts too</h3>
              <p>
                Commercial glass on a schedule that suits the business —
                early mornings, before doors open, or whatever keeps us out
                of your customers&apos; way.
              </p>
              <p className="work__card-note">
                Pictured: T.S.A. Vintage, downtown Corvallis.
              </p>
              <a className="work__card-link" href="/services/commercial-window-washing">
                Commercial window washing →
              </a>
            </div>
          </div>

          <div className="work__card">
            {zoom(PHOTOS.length - 1,
            <img
                className="work__card-photo"
                src={solar}
                alt="Jordan on a ladder cleaning a rooftop solar array in Corvallis"
                loading="lazy"
                width="1500"
                height="1500"
              />
            )}
            <div className="work__card-text">
              <h3 className="work__card-heading">And solar panels</h3>
              {/* NAMED, because it is true and it is checked.

                  This card first went up captioned "a rooftop array in
                  Corvallis" — hedged, because the photograph alone could
                  have been somebody at a gutter line and a website should
                  not claim more than its evidence shows. Jordan confirmed
                  it is him, on the panels. So the caption says who and
                  what, which is the difference between a stock-looking
                  photo and a job somebody did. */}
              <p>
                Dust and grime come off the panels so they soak up the sun
                and pull maximum power all year — usually while we are
                already up there doing the windows.
              </p>
              <p className="work__card-note">
                Pictured: Jordan cleaning a rooftop array in Corvallis.
              </p>
              <a className="work__card-link" href="/services/solar-panel-cleaning">
                Solar panel cleaning →
              </a>
            </div>
          </div>
        </div>
      </div>

      <Lightbox
        items={PHOTOS}
        index={shown}
        onClose={() => setShown(null)}
        onIndex={setShown}
      />
    </section>
  );
}

export default Work;
