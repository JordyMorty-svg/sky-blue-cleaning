/*
 * Loads the Google Maps JavaScript API, once, and only when something
 * actually needs it.
 *
 * Deliberately NOT loaded on page load. The only thing on this site that
 * needs Google is the address box inside a quote form, and most visitors
 * never open one — so the script is fetched on the first focus of that
 * field instead. A third-party script on every page view costs every
 * visitor load time and hands Google a record of them, for a feature they
 * did not use.
 *
 * Resolves with the `places` library. Rejects if there is no API key or the
 * script fails to load; every caller is expected to carry on without it
 * rather than show the customer an error, because the address field still
 * works perfectly well as a plain text box.
 */

const SCRIPT_ID = "sb-google-maps";
const CALLBACK = "__skyBlueMapsReady";

let pending = null;

export function loadPlaces() {
  if (pending) return pending;

  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key) {
    // Not an error worth shouting about: a local dev build without a key
    // should still run the site, just without suggestions.
    pending = Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not set"));
    return pending;
  }

  pending = new Promise((resolve, reject) => {
    // Already there — another field loaded it, or a test stubbed it.
    if (window.google?.maps?.importLibrary) {
      resolve(window.google.maps.importLibrary("places"));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
      return;
    }

    // `loading=async` is what Google asks for to avoid blocking rendering,
    // and it requires the callback form rather than awaiting the script tag.
    window[CALLBACK] = () => {
      resolve(window.google.maps.importLibrary("places"));
    };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(key)}` +
      "&libraries=places" +
      "&loading=async" +
      `&callback=${CALLBACK}`;
    script.onerror = () => reject(new Error("Google Maps failed to load"));

    document.head.appendChild(script);
  });

  return pending;
}
