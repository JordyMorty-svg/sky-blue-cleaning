import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./Lightbox.css";

/**
 * Tap a photo, see it big.
 *
 * ---------------------------------------------------------------------------
 * WHY A PORTAL
 * ---------------------------------------------------------------------------
 *
 * Rendered into document.body rather than where it is used. The work photos
 * live inside sections with border-radius, overflow:hidden and transformed
 * ancestors, any one of which would clip a fixed-position overlay or trap it
 * in a new containing block — a full-screen layer that is full-screen only
 * within a 300px card. A portal steps outside all of it.
 *
 * ---------------------------------------------------------------------------
 * THE PARTS PEOPLE SKIP, AND WHY EACH ONE IS HERE
 * ---------------------------------------------------------------------------
 *
 * ESCAPE AND THE BACKDROP both close it, because those are the two things
 * everybody tries first and one of them being dead reads as a stuck page.
 * The listener is on the window, not the overlay, so it works before
 * anything inside has been touched.
 *
 * THE BODY STOPS SCROLLING while it is open. Without that, a flick on a
 * phone scrolls the page behind the photo and closing it leaves you
 * somewhere else on the page entirely. The scrollbar's width is added back
 * as padding, or removing it shifts the whole layout left by 15px as the
 * overlay opens.
 *
 * FOCUS GOES TO THE CLOSE BUTTON and comes back to the thumbnail afterwards.
 * Somebody on a keyboard who opens a photo and then tabs should be inside
 * the dialog, and when they close it they should be where they left off —
 * not at the top of the document hunting for their place.
 *
 * ARROWS MOVE BETWEEN PHOTOS, which is the thing that makes a gallery feel
 * like a gallery rather than nine separate popups.
 */
export default function Lightbox({ items, index, onClose, onIndex }) {
  const closeRef = useRef(null);
  const restoreRef = useRef(null);

  const open = index !== null && index >= 0 && index < items.length;

  const go = useCallback(
    (delta) => {
      if (!open) return;
      // Wraps. At the last photo the next one is the first, because a right
      // arrow that silently does nothing reads as a broken key rather than
      // as the end of a list.
      onIndex((index + delta + items.length) % items.length);
    },
    [open, index, items.length, onIndex]
  );

  /* TWO EFFECTS, NOT ONE, and the split is a bug fix rather than tidiness.
   *
   * The first version did the body lock, the focus capture and the keydown
   * listener together, with `go` in the dependency array — and `go` changes
   * identity every time the index does. So every arrow press tore the whole
   * effect down and rebuilt it: the scroll lock came off and went back on,
   * and `restoreRef` was overwritten with whatever had focus at that moment,
   * which was the close button. Closing then returned focus to a button
   * that had just been unmounted, and it landed on <body> instead.
   *
   * The symptom was small — a keyboard user loses their place in the page
   * after browsing photos — and the cause was one value in a dependency
   * array. Splitting on what each effect actually depends on fixes it by
   * construction: the lock and the focus belong to "is it open", the key
   * handler belongs to "is it open, and what does an arrow do right now".
   */
  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    // Added back as padding, or removing the scrollbar shifts the whole
    // layout sideways as the overlay opens.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    // After paint, or the element is not focusable yet.
    const id = requestAnimationFrame(() => closeRef.current?.focus());

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
      cancelAnimationFrame(id);
      // Only if it is still in the document — the thumbnail can have been
      // unmounted by a route change while the photo was open.
      const back = restoreRef.current;
      if (back && document.contains(back)) back.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, go]);

  // Hooks run unconditionally above; the early return comes after them.
  if (!open) return null;

  const item = items[index];
  const many = items.length > 1;

  return createPortal(
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={item.alt || "Photo"}
      onClick={onClose}
    >
      <button
        className="lb__close"
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close photo"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {many && (
        <button
          className="lb__nav lb__nav--prev"
          type="button"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          aria-label="Previous photo"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* STOPS THE CLICK, so tapping the photo itself does not close it.
          The backdrop closing and the photo not closing is the convention
          everywhere, and getting it backwards means people cannot look at
          the thing they just opened without it vanishing. */}
      <figure className="lb__figure" onClick={(e) => e.stopPropagation()}>
        <img className="lb__img" src={item.src} alt={item.alt} />
        {(item.caption || many) && (
          <figcaption className="lb__caption">
            {item.caption}
            {many && (
              <span className="lb__count">
                {index + 1} / {items.length}
              </span>
            )}
          </figcaption>
        )}
      </figure>

      {many && (
        <button
          className="lb__nav lb__nav--next"
          type="button"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          aria-label="Next photo"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}
    </div>,
    document.body
  );
}
