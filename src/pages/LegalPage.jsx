import { LEGAL_UPDATED } from "../data/legal";
import { usePageMeta } from "../lib/usePageMeta";
import { metaForPath } from "../lib/pageMeta";
import "./LegalPage.css";

/**
 * The privacy policy and the terms, rendered from src/data/legal.js.
 *
 * ONE COMPONENT FOR BOTH, because they are the same shape: a title, a
 * paragraph of introduction, and a list of headed sections. Two components
 * would be two places to fix a heading level.
 *
 * THE PAGE IS PASSED IN, not looked up from the URL. A lookup would need a
 * "what if it isn't found" branch that the routes in App.jsx make
 * unreachable, and an unreachable branch is a thing nobody can reason about
 * later.
 *
 * Reached by its own route rather than as a static file in public/ so that it
 * goes through prerendering like every other page. Google's OAuth reviewer
 * fetches the privacy policy URL and reads it, and a page that is an empty
 * <div id="root"> until JavaScript runs is a page that can be read as blank.
 */
export default function LegalPage({ page }) {
  usePageMeta(metaForPath(`/${page.slug}`));

  return (
    <main className="legal">
      <div className="legal__inner">
        <h1 className="legal__title">{page.title}</h1>
        <p className="legal__updated">Last updated {LEGAL_UPDATED}</p>
        <p className="legal__intro">{page.intro}</p>

        {page.sections.map((section) => (
          <section className="legal__section" key={section.heading}>
            <h2 className="legal__heading">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p className="legal__body" key={paragraph.slice(0, 40)}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
