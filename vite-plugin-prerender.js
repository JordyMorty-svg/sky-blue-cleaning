/*
 * Build-time prerendering: real HTML for every route.
 *
 * WHAT THIS FIXES, AND WHY IT IS ONE PROBLEM AND NOT FOUR
 * ------------------------------------------------------
 * The SEO checker failed H1, Content Depth, Internal Links and Canonical Tag,
 * and reported "about 9 visible words". All four have one cause: the site is
 * a client-rendered React app, so index.html is a shell — a title, some meta
 * tags, and an empty <div id="root">. The heading, the words, the links and
 * the per-route canonical are all written by JavaScript after the page loads,
 * and the checker does not run any.
 *
 * Googlebot DOES run JavaScript, so the ranking cost is smaller than that
 * wall of red suggests. What does not run it: iMessage, Facebook, Slack and
 * every other link-preview scraper; most non-Google crawlers; and the growing
 * number of AI assistants that read a page as raw HTML. For a local business
 * whose customers share the site by text message, that second list is the one
 * that matters.
 *
 * WHY renderToString AND NOT A HEADLESS BROWSER
 * --------------------------------------------
 * Puppeteer prerendering needs no server-safety work at all, which is
 * genuinely easier — but it downloads a Chromium into every Netlify build.
 * Rendering React under Node takes seconds, installs nothing, and fails
 * loudly at build time instead of quietly shipping a blank page.
 *
 * WHY A SECOND VITE BUILD
 * -----------------------
 * App.jsx cannot simply be imported by Node: it is JSX, it imports .css
 * files, and the modules under it read import.meta.env. All three are things
 * Vite provides and Node does not. So the plugin runs a small second build
 * whose only entry is src/entry-server.jsx, imports the one file that comes
 * out, and deletes it. That bundle is never served.
 *
 * WHAT IS DELIBERATELY NOT HYDRATED
 * ---------------------------------
 * createRoot().render() replaces the contents of #root wholesale, so the
 * prerendered markup is discarded the moment React mounts. This is NOT
 * hydration and does not try to be. It is purely what a reader without
 * JavaScript gets; the interactive site is byte-for-byte unchanged. The
 * trade is deliberate — hydration would be faster for people on slow phones
 * but would make every component in the tree SSR-correctness-critical
 * forever, and this is a six-page marketing site.
 */

import { rm } from "node:fs/promises";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Where a route's static file goes. `/` is index.html; the rest get a folder. */
export function fileForRoute(route) {
  return route === "/" ? "index.html" : `${route.replace(/^\//, "")}/index.html`;
}

const escapeHtml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (s) => escapeHtml(s).replace(/"/g, "&quot;");

/**
 * Put the rendered markup and this route's head tags into the shell.
 *
 * Exported so verify/seo.mjs can check the rewriting directly.
 *
 * `null` for a tag means "leave index.html's own value alone" — which is how
 * the homepage keeps the title and description that are written there, and
 * only there.
 */
export function injectInto(html, { markup, title, description, canonical, ogUrl, noindex }) {
  let out = html;

  if (title) {
    out = sub(out, /<title>[\s\S]*?<\/title>/i, () => `<title>${escapeHtml(title)}</title>`);
    out = setContent(out, "og:title", title);
  }

  if (description) {
    out = setContent(out, "description", description);
    out = setContent(out, "og:description", description);
  }

  // og:url is REMOVED, not left behind, when a page has no canonical URL of
  // its own. index.html's copy says the homepage, and a link preview for the
  // not-found page claiming to be the homepage would be a small lie that
  // iMessage would repeat to everyone it was forwarded to.
  out = ogUrl
    ? setContent(out, "og:url", ogUrl)
    : sub(out, /\s*<meta\s[^>]*property="og:url"[^>]*>/i, () => "");

  // THE CANONICAL — the one tag index.html still refuses to carry.
  //
  // The comment in that file asking nobody to add one is still right, and for
  // a sharper reason than before: index.html is now the template every page is
  // cut from, so a canonical written there would be stamped onto all six
  // service pages claiming each one is the homepage. Written here, per file,
  // after the copy, each page claims only itself. Prerendering is what made a
  // real canonical possible at all.
  const extra = [];
  if (canonical) extra.push(`<link rel="canonical" href="${escapeAttr(canonical)}" />`);
  if (noindex) extra.push(`<meta name="robots" content="noindex" />`);
  if (extra.length) {
    out = sub(out, /<\/head>/i, () => `  ${extra.join("\n    ")}\n  </head>`);
  }

  const withRoot = subOrNull(out, /<div id="root"><\/div>/, () => `<div id="root">${markup}</div>`);
  if (!withRoot) {
    throw new Error(
      'vite-plugin-prerender: could not find <div id="root"></div> in the built ' +
        "index.html, so there is nowhere to put the rendered page. Has index.html changed?"
    );
  }
  return withRoot;
}

/**
 * Refuse to write a page that would be as empty as the ones we're replacing.
 *
 * Exported so verify/seo.mjs can prove it actually fires. A guard nobody has
 * ever seen trip is a guard nobody knows is wired up.
 */
export function checkMarkup(route, markup) {
  // An empty page is the exact failure this plugin exists to remove, so a
  // render that produces one must stop the build rather than write it out.
  // Emitting a shell and carrying on would leave the site as broken as it
  // was, with a plugin in the repo claiming otherwise — and nobody opens the
  // HTML of a site that builds green.
  const words = markup.replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean);
  if (words.length < 50) {
    throw new Error(
      `vite-plugin-prerender: ${route} rendered only ${words.length} words, ` +
        `which is the problem this plugin exists to fix. Stopping the build.`
    );
  }

  const h1s = markup.match(/<h1[\s>]/gi)?.length ?? 0;
  if (h1s !== 1) {
    throw new Error(
      `vite-plugin-prerender: ${route} rendered ${h1s} <h1> elements. ` +
        `Each page needs exactly one heading saying what it is.`
    );
  }
}

/*
 * Replace the first match that is NOT inside an HTML comment.
 *
 * Comment-blind is not good enough, and this is not hypothetical. The first
 * version of this file replaced /<title>[\s\S]*?<\/title>/ across the whole
 * document. index.html carries a comment explaining that the title is inserted
 * at build time — and that comment contains the characters "<title>". So the
 * match began inside the comment, ran to the real closing tag down by </head>,
 * and deleted everything in between: the Open Graph tags, the structured data,
 * the favicons. The build was green. Six pages shipped with no link preview.
 *
 * Cheap to get right, expensive to notice. So: cut the document at comment
 * boundaries, and only ever substitute in the parts that are not comments.
 */
function sub(html, re, replacer) {
  return subOrNull(html, re, replacer) ?? html;
}

function subOrNull(html, re, replacer) {
  const COMMENT = /<!--[\s\S]*?-->/;
  let out = "";
  let rest = html;
  let done = false;

  while (rest.length) {
    const comment = COMMENT.exec(rest);
    const before = comment ? rest.slice(0, comment.index) : rest;

    if (!done) {
      const hit = re.exec(before);
      if (hit) {
        out += before.slice(0, hit.index) + replacer(hit) + before.slice(hit.index + hit[0].length);
        done = true;
      } else {
        out += before;
      }
    } else {
      out += before;
    }

    if (!comment) break;
    out += comment[0];
    rest = rest.slice(comment.index + comment[0].length);
  }

  return done ? out : null;
}

/* Rewrite the content="..." of the <meta> carrying this name or property. */
function setContent(html, key, value) {
  const attr = key.startsWith("og:") ? `property="${key}"` : `name="${key}"`;
  const tag = new RegExp(`<meta\\s[^>]*${attr}[^>]*>`, "i");
  return sub(html, tag, (hit) =>
    hit[0].replace(/content="[\s\S]*?"/, `content="${escapeAttr(value)}"`)
  );
}

/*
 * Supabase, stubbed for the duration of the render.
 *
 * src/supabaseClient.js calls createClient() at import time, which throws
 * "supabaseUrl is required" when the environment has no keys. That would make
 * prerendering depend on production credentials being present — so a build
 * run without them would not fail, it would just quietly produce the empty
 * pages this plugin exists to prevent.
 *
 * Nothing on a prerendered page can submit a form: there is no browser, no
 * click and no effect. So the honest stand-in is an object that throws if
 * anything ever does touch it, which also guarantees a build can never write
 * to the real database.
 */
const SUPABASE_STUB = `
export const supabase = new Proxy({}, {
  get() {
    throw new Error(
      "The Supabase client was used while prerendering. Nothing rendered at " +
      "build time should talk to the database — move it into an effect or an " +
      "event handler."
    );
  },
});
`;

function stubSupabase() {
  return {
    name: "prerender-stub-supabase",
    enforce: "pre",
    load(id) {
      if (id.replace(/\\/g, "/").endsWith("/src/supabaseClient.js")) return SUPABASE_STUB;
      return null;
    },
  };
}

export default function prerender() {
  // Both are replaced in configResolved, before any hook that uses them. The
  // repo root is the fallback because this file lives in it.
  let root = fileURLToPath(new URL(".", import.meta.url));
  let outDir = "dist";

  return {
    name: "sky-blue-prerender",
    apply: "build",
    // Last, so it reads the finished index.html — with the structured data
    // vite-plugin-seo.js injects and the hashed script tags Vite writes — and
    // copies all of it into every page.
    enforce: "post",

    configResolved(config) {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },

    async closeBundle() {
      const { build } = await import("vite");
      const { default: react } = await import("@vitejs/plugin-react");

      const work = join(root, "node_modules/.prerender");

      // A second, tiny build: entry-server.jsx and the app under it, compiled
      // for Node. configFile:false so this plugin cannot recurse into itself.
      await build({
        configFile: false,
        root,
        logLevel: "warn",
        plugins: [react(), stubSupabase()],
        build: {
          ssr: resolve(root, "src/entry-server.jsx"),
          outDir: work,
          emptyOutDir: true,
          copyPublicDir: false,
          ssrEmitAssets: false,
          rollupOptions: { output: { entryFileNames: "entry-server.mjs" } },
        },
      });

      try {
        const app = await import(
          `${pathToFileURL(join(work, "entry-server.mjs")).href}?t=${Date.now()}`
        );

        const built = join(outDir, "index.html");
        let shell;
        try {
          shell = readFileSync(built, "utf8");
        } catch {
          throw new Error(
            `vite-plugin-prerender: ${built} wasn't built, so there is no shell ` +
              `to cut the pages from. Usually that means an earlier plugin threw ` +
              `while transforming index.html — scroll up for its error.`
          );
        }
        const pages = [
          ...app.routes().map((route) => ({ route, file: fileForRoute(route) })),
          { route: app.NOT_FOUND_ROUTE, file: "not-found.html" },
        ];

        for (const { route, file } of pages) {
          let markup;
          try {
            markup = app.render(route);
          } catch (e) {
            throw new Error(
              `vite-plugin-prerender: rendering ${route} threw.\n\n  ${e.message}\n\n` +
                `Something in the page runs at render time that needs a browser. ` +
                `Move it into a useEffect, or guard it with ` +
                `\`typeof window !== "undefined"\`.`,
              { cause: e }
            );
          }

          checkMarkup(route, markup);

          const target = join(outDir, file);
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, injectInto(shell, { markup, ...app.headFor(route) }));
        }

        this.info?.(`prerendered ${pages.length} pages`);
      } finally {
        await rm(work, { recursive: true, force: true });
      }
    },
  };
}
