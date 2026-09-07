import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/*
 * With client-side routing the browser no longer scrolls for us:
 *   - a new page should start at the top
 *   - a link to /#section should scroll to that section, even when it means
 *     first navigating home from a service page (the element isn't in the DOM
 *     on the first frame, so we retry for a few frames before giving up)
 */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }

    const id = hash.slice(1);
    let frames = 0;
    let raf = 0;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (frames < 20) {
        frames += 1;
        raf = requestAnimationFrame(tryScroll);
      }
    };

    raf = requestAnimationFrame(tryScroll);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  return null;
}

export default ScrollManager;
