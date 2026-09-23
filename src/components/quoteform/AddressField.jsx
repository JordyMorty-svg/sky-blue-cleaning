import { useCallback, useEffect, useId, useRef, useState } from "react";
import { loadPlaces } from "../../lib/googleMaps";
import "./AddressField.css";

/*
 * The address box on both quote forms, with Google's suggestions under it.
 *
 * ---------------------------------------------------------------------------
 * Why this is a plain <input> and not Google's own element
 * ---------------------------------------------------------------------------
 *
 * Google now ships <gmp-place-autocomplete>, a web component, and the old
 * google.maps.places.Autocomplete has been closed to new projects since
 * March 2025 — so the legacy widget was never an option.
 *
 * The web component would have been less code, but it renders inside a
 * shadow DOM with its own styling, and the field beside it is ours. Matching
 * them means fighting a component that is not built to be restyled, and
 * losing that fight looks like a bug to a customer. So this uses the
 * Autocomplete Data API — the same new API underneath — and draws the input
 * and the list itself, which also makes the keyboard and screen-reader
 * behaviour ours to get right.
 *
 * ---------------------------------------------------------------------------
 * What happens when Google isn't there
 * ---------------------------------------------------------------------------
 *
 * Nothing visible. No key, blocked script, offline, quota exceeded — the
 * field stays a text box and the quote submits exactly as it did before.
 * Losing address suggestions must never cost a lead; the whole feature is an
 * improvement on typing, not a requirement for it.
 *
 * ---------------------------------------------------------------------------
 * Coordinates
 * ---------------------------------------------------------------------------
 *
 * Picking a suggestion also hands back a latitude and longitude, which go
 * into the lead. The CRM's map plots leads from those columns, so a website
 * lead now lands on the actual house instead of wherever the text happened
 * to geocode to.
 *
 * Typing after picking clears them again — the coordinates belong to the
 * address that was chosen, and the moment the text stops matching, they are
 * a confident answer to a question nobody asked. A lead with no coordinates
 * is the honest signal that nothing was verified.
 */

const MIN_CHARS = 3;
const DEBOUNCE_MS = 250;

function AddressField({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder = "123 Main St, Corvallis",
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const places = useRef(null); // the loaded library, or null
  const token = useRef(null); // Google's session token
  const timer = useRef(null);
  const seq = useRef(0); // guards against out-of-order responses
  const box = useRef(null);

  // Loaded on first focus rather than on mount — see lib/googleMaps.js.
  const ensureLoaded = useCallback(async () => {
    if (places.current) return places.current;
    try {
      await loadPlaces();
      places.current = window.google?.maps?.places ?? null;
    } catch {
      places.current = null; // stays a plain text box
    }
    return places.current;
  }, []);

  useEffect(() => {
    // A click anywhere else closes the list. pointerdown rather than click so
    // it closes on the press, before a focus change can reorder things.
    function onDown(e) {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  function fetchSuggestions(input) {
    clearTimeout(timer.current);

    if (input.trim().length < MIN_CHARS) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timer.current = setTimeout(async () => {
      const lib = await ensureLoaded();
      if (!lib?.AutocompleteSuggestion) return;

      // One session token spans the whole "typing then picking" interaction.
      // Google bills a session, not a keystroke, so reusing it across the
      // request for details is what keeps the typing free.
      if (!token.current) token.current = new lib.AutocompleteSessionToken();

      const mine = ++seq.current;
      try {
        const { suggestions: found } =
          await lib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input,
            sessionToken: token.current,
            includedRegionCodes: ["us"],
          });

        // A slower earlier request must not overwrite a newer answer.
        if (mine !== seq.current) return;

        const list = (found || [])
          .map((s) => s.placePrediction)
          .filter(Boolean)
          .slice(0, 5);

        setSuggestions(list);
        setActive(-1);
        setOpen(list.length > 0);
      } catch {
        // Quota, network, a malformed response — say nothing and let them
        // type. This field's job is to accept an address, not to explain
        // Google.
        setSuggestions([]);
        setOpen(false);
      }
    }, DEBOUNCE_MS);
  }

  function handleChange(e) {
    const next = e.target.value;
    onChange(next);
    // Whatever was picked no longer describes what is in the box.
    onSelect?.({ address: next, latitude: null, longitude: null });
    fetchSuggestions(next);
  }

  async function choose(prediction) {
    setOpen(false);
    setSuggestions([]);

    const label_ = prediction.text?.text ?? prediction.text ?? "";
    onChange(label_); // shown immediately; the details call may take a moment

    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location"] });

      const formatted = place.formattedAddress || label_;
      const loc = place.location;

      onChange(formatted);
      onSelect?.({
        address: formatted,
        // Numbers, not Google's LatLng object — this goes straight into the
        // lead row. `location` is occasionally absent on odd results.
        latitude: loc ? Number(loc.lat()) : null,
        longitude: loc ? Number(loc.lng()) : null,
      });
    } catch {
      // Keep the text they chose; just no coordinates.
      onSelect?.({ address: label_, latitude: null, longitude: null });
    } finally {
      // The session ends with the details request, whether or not it worked.
      // Reusing a token across sessions is what turns free typing into
      // billed typing.
      token.current = null;
    }
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      // Only swallow Enter when something is highlighted, so Enter on a
      // half-typed address still submits the form rather than doing nothing.
      if (active >= 0) {
        e.preventDefault();
        choose(suggestions[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="addr" ref={box}>
      <label className="quote__label" htmlFor={id}>
        {label} <span className="quote__optional">(optional)</span>
      </label>

      <input
        id={id}
        type="text"
        className="quote__input"
        value={value}
        onChange={handleChange}
        onFocus={ensureLoaded}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      />

      {open && suggestions.length > 0 && (
        <ul className="addr__list" id={listId} role="listbox">
          {suggestions.map((s, i) => (
            <li
              key={s.placeId ?? i}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`addr__item ${i === active ? "addr__item--active" : ""}`}
              // mousedown, not click: the input blurs on mousedown and a
              // blur handler would close the list before click ever fired.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(s);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {s.text?.text ?? ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddressField;
