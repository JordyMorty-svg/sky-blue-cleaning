import { Fragment, useState } from "react";
import "./Work.css";
import Lightbox from "../lightbox/Lightbox";
import pressureBefore from "../../assets/work/pressure-before.jpg";
import pressureAfter from "../../assets/work/pressure-after.jpg";
import screenBefore from "../../assets/work/screen-before.jpg";
import screenAfter from "../../assets/work/screen-after.jpg";
import storefront from "../../assets/work/commercial-storefront.jpg";
import solar from "../../assets/work/solar-panels.jpg";
import glasswall from "../../assets/work/result-glasswall.jpg";
import squeegee from "../../assets/work/result-squeegee-reflection.jpg";
import reflection from "../../assets/work/result-reflection.jpg";
import pole from "../../assets/work/result-pole.jpg";

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

/* ---------------------------------------------------------------------------
 * WHAT MAKES A PAIR USABLE, because two of the four candidates failed it
 * ---------------------------------------------------------------------------
 *
 * A before and an after are only evidence if the ONLY thing that changed is
 * the cleaning. Same spot, same angle, same light. Everything else the
 * viewer notices is something they have to mentally subtract, and a
 * comparison the viewer has to correct for reads as a trick even when the
 * work is real.
 *
 * Four pairs were shot at a house on 13 October. Two were rejected — a
 * French door and a slider — and the reason is worth keeping, because the
 * photographs looked fine individually and the cleaning was obviously done
 * (cobwebs in the pane corners of the before, gone in the after).
 *
 * Every "before" was taken in low golden-hour sun and every "after" in flat
 * daylight. At the 273px these render, the cobwebs are invisible and what
 * survives is an orange photo beside a white one. Cropping tight to the
 * glass made it worse rather than better: in the before the sun is behind
 * the door so the glass reads dark, and in the after it is front-lit and you
 * see the garden through it. The single most striking difference between the
 * two pictures is see-through versus not, and that is the sun.
 *
 * Colour-correcting the before would have matched them. That option was
 * refused: the lead on this section says "No stock photos, no touch-ups",
 * and a graded before is exactly the thing that sentence promises not to do.
 *
 * The screen pair passes on every count — same leaning spot against the same
 * garage door, same overcast light, and the proof is unarguable: the mesh
 * goes from opaque to clear enough to read the door panels through.
 */
const PAIRS = [
  {
    key: "pressure",
    before: {
      src: pressureBefore,
      alt: "A concrete path thick with green moss and dirt before pressure washing",
      caption: "Before — a side path in Corvallis, moss and years of build-up.",
    },
    after: {
      src: pressureAfter,
      alt: "The same path after pressure washing, moss gone and the aggregate visible again",
      caption: "After — the same path, back to bare aggregate.",
    },
    caption:
      "Pressure washing a side path in Corvallis — moss and years of " +
      "build-up taken back to bare aggregate.",
  },
  {
    /* THE ONLY PHOTOGRAPH OF SCREEN CLEANING ON THE SITE. It is a service on
       the list above with nothing but an icon to its name, and it is the one
       job where the result is genuinely hard to picture until you see it:
       "we cleaned your screens" means very little, and a mesh you can
       suddenly see through means everything. */
    key: "screen",
    before: {
      src: screenBefore,
      alt: "A window screen leaning against a garage door before cleaning, the frame grimy and the mesh dark and clogged",
      caption: "Before — the mesh clogged solid and the frame black along the edges.",
    },
    after: {
      src: screenAfter,
      alt: "The same screen after cleaning, the frame white again and the mesh clear enough to see the garage door panels through it",
      caption: "After — the same screen, clear enough to read the garage door through.",
    },
    caption:
      "The same screen, washed through and the frame scrubbed. You can read " +
      "the garage door through the mesh again — that is what you are paying " +
      "for.",
  },
];

/* Two photographs per pair, and the results start after all of them. Derived
   rather than counted: an earlier version hard-coded "+2" for the results
   grid, which was correct for exactly as long as there was one pair. */
const PAIR_PHOTOS = PAIRS.length * 2;

const RESULTS = [
  /* THE GLASS WALL LEADS. It is the most aspirational photograph here —
     a deck, trees, a wall of glass with the pole still leaning against it
     — and the row's job is to make somebody want their own windows to
     look like that. The two squeegee shots that follow are the work
     itself; the two after them are finished houses.

     Action before results, deliberately: a finished window is a state
     anybody's window could already be in, while a hand on a squeegee is
     evidence somebody turned up.

     ------------------------------------------------------------------------
     TWO OF THESE WERE REPLACED ON 14 OCTOBER, and the reason generalises.
     ------------------------------------------------------------------------

     The two that went (a covered porch and a picture window on tan siding)
     were both photographs of clean glass that did not read as clean glass.
     The porch was shot into shade, so the doors came out dark and half the
     frame was patio furniture and a bike; the picture window was shot flat
     along the wall in overcast light, and dark glass photographs the same
     whether it was washed that morning or last year.

     A clean window is only visible in a photograph when something is
     reflected in it. That is the test the two replacements pass and the two
     they replaced failed: both new frames are a run of glass mirroring a
     blue sky and an autumn garden, which is a thing dirty glass cannot do.
     The crops are baked in at 4:3 rather than left to object-fit, because
     centre-cropping a phone portrait put the brush head outside the cell. */
  { src: glasswall, alt: "A wall of glass beside a deck, cleaned, with the water-fed pole still leaning against it" },
  { src: squeegee, alt: "A squeegee crossing a pane in full sun, the cleaner reflected in the glass behind it" },
  { src: reflection, alt: "A run of cleaned windows mirroring a blue sky and an autumn garden, Hayden working along them with the water-fed pole" },
  { src: pole, alt: "Hayden washing a window with the water-fed pole, brush head on the glass and a squeegee in his other hand" },
];

function Work() {
  /* ONE LIST FOR THE WHOLE SECTION, in the order they appear on the page.
     The arrows in the viewer then walk the section the way the eye does —
     before, after, the four results, then the two service shots — rather
     than jumping between three separate little galleries. */
  const PHOTOS = [
    /* EACH PHOTO CARRIES ITS OWN WORDS. An earlier version built these by
       prefixing the shared pair caption — which produced "Before — The same
       screen, washed through and the frame scrubbed" over the photo of the
       dirty screen. A caption describing the wrong photograph is worse than
       no caption at all. */
    ...PAIRS.flatMap((pair) => [pair.before, pair.after]),
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
        {PAIRS.map((pair, p) => (
          <Fragment key={pair.key}>
            <div className="work__ba">
              <figure className="work__shot">
                {zoom(p * 2,
                  <img
                    src={pair.before.src}
                    alt={pair.before.alt}
                    loading="lazy"
                    width="1050"
                    height="1400"
                  />
                )}
                <figcaption className="work__tag work__tag--before">Before</figcaption>
              </figure>
              <figure className="work__shot">
                {zoom(p * 2 + 1,
                  <img
                    src={pair.after.src}
                    alt={pair.after.alt}
                    loading="lazy"
                    width="1050"
                    height="1400"
                  />
                )}
                <figcaption className="work__tag work__tag--after">After</figcaption>
              </figure>
            </div>
            <p className="work__caption">{pair.caption}</p>
          </Fragment>
        ))}

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
              {/* After every pair's two photographs — see PAIR_PHOTOS. */}
              {zoom(PAIR_PHOTOS + i, <img src={r.src} alt={r.alt} loading="lazy" />)}
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
