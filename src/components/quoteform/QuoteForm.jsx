import { useState } from "react";
import "./QuoteForm.css";
import { CONTACT, submitLead, trackQuoteConversion } from "../../lib/leadSubmit";
import AddressField from "./AddressField";

/*
 * The other services, offered as ticks — with NO PRICE, deliberately.
 *
 * ---------------------------------------------------------------------------
 * WHY NO NUMBERS HERE
 * ---------------------------------------------------------------------------
 *
 * Windows price per unit: a window is a window, so a count and a storey
 * give a number that is nearly always right. None of these do. From
 * claude/pricing-reference.md, the real spans are:
 *
 *     house wash    $250-800      $0.29-0.35/sq ft of wall
 *     driveway      $100-300      $0.15-0.75/sq ft, Oregon moss at the top
 *     deck          $150-500      $0.35/sq ft baseline, more with growth
 *     gutters       $325 + $150 to scrub, on one large two-storey
 *
 * A calculator that turned "pressure washing ✓" into a figure would be
 * guessing across a 3-5x range, and the guess would be anchored in the
 * customer's head before anybody had seen the house. The doc is explicit
 * about this: "Estimate areas off photos only to stop yourself anchoring
 * low — never as the quote."
 *
 * The anchor also runs the wrong way. Quote $150 for a driveway that is
 * really $300 and the conversation starts from a number Sky Blue has to
 * argue up; the pricing doc's whole method is the opposite — show the
 * arithmetic, itemise, and let the customer drop a line rather than
 * negotiate the total.
 *
 * So a tick means "I want this quoted", the window estimate stays exactly
 * as precise as it was, and the visit prices the rest. That is also what
 * the page already promises two lines below: a free on-site look.
 *
 * WHAT IT IS REALLY FOR. Every one of these is a service the customer
 * would otherwise have had to telephone about, and most never would. It
 * reaches Jordan and Hayden in the lead itself — the CRM's new-lead email
 * prints the notes field — so the on-site visit is booked already knowing
 * there is a deck and a driveway to look at.
 */
const EXTRAS = [
  { key: "gutters", label: "Gutters", lead: "Gutter cleaning" },
  { key: "pressure", label: "Pressure washing" },
  { key: "solar", label: "Solar panels", lead: "Solar panel cleaning" },
  { key: "screens", label: "Screens", lead: "Screen cleaning & repair" },
];

/* ---- Your pricing (edit these numbers any time) ---- */
/*
 * Storeys: the base price, the button, and the words for everywhere else.
 *
 * ---------------------------------------------------------------------------
 * THE BASE IS A TABLE AGAIN, AND THAT IS THE CORRECTION
 * ---------------------------------------------------------------------------
 *
 * This started as `oneStory: 200, twoStory: 300` — two numbers with the
 * relationship between them unstated. Adding a third storey, it was rewritten
 * as `firstStorey + (floors - 1) * storeyStep`, which reproduced $200 and
 * $300 exactly and handed three an answer of $400 without anybody choosing
 * it. That was flagged at the time as an extrapolation to be checked.
 *
 * It was checked, and it was wrong — not in the arithmetic but in the
 * premise. A formula with one step says every floor costs the same to add.
 * It does not. Going from one storey to two is a longer pole. Going from
 * two to three is a ladder, a spotter, and a conversation about access.
 * Industry per-pane pricing says the same thing in its own units: roughly
 * +$2-4 a pane for a second storey and +$4-8 for a third, a step that
 * doubles rather than repeats.
 *
 * So the prices are stated, one per storey, and the shape of the increase
 * is visible: +$100, then +$200. A false linearity encoded in a formula is
 * worse than a table, because the table is at least honest that somebody
 * decided each number.
 *
 * The sense check is Krueger (claude/pricing-reference.md): a large two-
 * storey, windows in and out with frames, sills, screens and tracks, $705.
 * A 32-window three-storey here comes out at $660 exterior and $960 with
 * the interior — above the large two-storey, which is the right way round.
 * At $400 it came out at $560, which was below it, and that was the tell.
 *
 * ---------------------------------------------------------------------------
 * TWO LABELS, NOT ONE
 * ---------------------------------------------------------------------------
 *
 * `label` is the button and it is one word, because three buttons have to
 * sit on one row on a phone and "One story / Two story / Three story"
 * repeats a word the question above them has already said. `noun` is for
 * everywhere the words have to stand alone with no question above them —
 * the estimate line, and the storey count written into the lead's notes,
 * where "Three house" would be nonsense.
 *
 * Three is the ceiling on purpose. Residential Corvallis is one and two
 * storeys with the occasional three; a four-storey building is commercial,
 * and commercial is a phone call rather than a calculator.
 */
const STOREYS = [
  { key: "one", label: "One", noun: "One story", floors: 1, base: 200 },
  { key: "two", label: "Two", noun: "Two story", floors: 2, base: 300 },
  { key: "three", label: "Three", noun: "Three story", floors: 3, base: 500 },
];

const PRICING = {
  perWindow: 5,
  interiorPerFloor: 100, // interior cleaning is charged per floor, and this
                         // one IS linear — an interior floor is an interior
                         // floor, however high off the ground it is
  perSkylight: 15,       // each skylight adds this much
};

const { phoneDisplay: PHONE_DISPLAY, phoneDigits: PHONE_DIGITS, email: EMAIL } = CONTACT;

function QuoteForm() {
  const [stories, setStories] = useState("one");
  const [windows, setWindows] = useState(10);
  const [skylights, setSkylights] = useState(0);
  /* HIDDEN UNTIL ASKED FOR. Most houses have no skylights, so a stepper
     reading 0 was a permanent row of furniture on the one panel where
     height costs the most. Opened automatically if the count is ever
     non-zero, so it cannot be left showing a number nobody can see. */
  const [showSkylights, setShowSkylights] = useState(false);
  const [interior, setInterior] = useState(false);
  // A Set rather than four booleans: the list above is the single source of
  // truth, so adding a fifth service is one line there and nothing here.
  const [extras, setExtras] = useState(() => new Set());

  function toggleExtra(key) {
    setExtras((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  // See QuoteRequestForm: null unless picked from Google's list.
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  // Inputs can be empty ("") mid-typing; treat that as 0 for the math.
  const windowsNum = windows === "" ? 0 : windows;
  const skylightsNum = skylights === "" ? 0 : skylights;
  // Falls back to the first entry rather than to 1, so the list above stays
  // the only place a storey is defined.
  const storey = STOREYS.find((x) => x.key === stories) || STOREYS[0];
  const floors = storey.floors;

  const base = storey.base;
  const windowsCost = windowsNum * PRICING.perWindow;
  const skylightsCost = skylightsNum * PRICING.perSkylight;
  const interiorCost = interior ? floors * PRICING.interiorPerFloor : 0;
  const total = base + windowsCost + skylightsCost + interiorCost;

  // Built here rather than inline in the payload: it is read once by the
  // submit handler and it is easier to see that it is empty when nothing
  // is ticked, which is what keeps the notes field clean for most leads.
  const chosenExtras = EXTRAS.filter((x) => extras.has(x.key));
  const extrasLine = chosenExtras.length
    ? `Also interested in: ${chosenExtras.map((x) => x.lead || x.label).join(", ")}`
    : "";

  /* THE STOREY COUNT, IN WORDS, FOR ANYTHING ABOVE TWO.
     leads.stories has a CHECK constraint written in the Supabase dashboard
     before db/ existed, so nobody can read which values it allows without
     querying the live database. If it refuses "three", insertLead drops the
     column and the lead still lands — but it would land looking like a
     one-storey house, which is the kind of wrong that sends somebody out
     with the wrong pole. Writing it here too means the fact survives the
     column being dropped. Only above two, so an ordinary lead's notes stay
     clean. */
  const storeyLine = floors > 2 ? `${storey.noun} house` : "";

  function adjustWindows(delta) {
    setWindows((w) => {
      const n = w === "" ? 0 : w;
      return Math.min(100, Math.max(1, n + delta));
    });
  }

  function adjustSkylights(delta) {
    setSkylights((s) => {
      const n = s === "" ? 0 : s;
      return Math.min(50, Math.max(0, n + delta));
    });
  }

  // Shared typing handler for the number steppers: allow an empty field and
  // partial entry while typing, so backspacing/retyping doesn't snap to 1.
  function handleCountChange(setter, max) {
    return (e) => {
      const raw = e.target.value;
      if (raw === "") {
        setter("");
        return;
      }
      const v = parseInt(raw, 10);
      if (Number.isNaN(v)) return; // ignore stray non-numeric input
      setter(Math.min(max, Math.max(0, v)));
    };
  }

  // Clamp to the real minimum only once the field loses focus.
  function handleCountBlur(setter, min, max) {
    return () => {
      setter((val) => {
        const v = parseInt(val, 10);
        return Number.isNaN(v) ? min : Math.min(max, Math.max(min, v));
      });
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setError("Please add your name and a phone number or email so we can reach you.");
      return;
    }
    setError("");
    setStatus("sending");

    const { ok } = await submitLead({
      lead: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        latitude: coords.latitude,
        longitude: coords.longitude,
        service: "residential-window-washing",
        source: "website",
        property_type: "residential",
        stories,              // 'one' | 'two' — matches the CHECK constraint
        windows: windowsNum,
        skylights: skylightsNum,
        interior,
        estimate: total,
        /* THE TICKS RIDE ALONG IN notes, which is not laziness.
           `leads` has one `service` column and these are not a service —
           they are four things to look at on the visit. A migration plus
           CRM display work to store them structurally would be the right
           answer the day somebody reports on them; today nobody does, and
           notes is read by a human in the two places that matter: the lead
           page, and the new-lead email, which prints this field verbatim.

           Labelled "Also interested in:" so it is obviously the form
           talking and not the customer. */
        notes: [notes.trim(), storeyLine, extrasLine].filter(Boolean).join("\n\n") || null,
      },
    });

    if (ok) {
      // The lead is in the CRM. The sweep there texts Jordan and Hayden
      // within the minute — see submitLead's header for why that stopped
      // being this page's job.
      setStatus("sent");
      trackQuoteConversion();
    } else {
      // The insert failed, which is now the only way to get here. Route them
      // to call or text: better a customer who rings than a customer who
      // believes a form went through when it did not.
      setStatus("idle");
      setError(
        `Something went wrong sending your request. Please try again, or call/text us at ${PHONE_DISPLAY}.`
      );
    }
  }

  return (
    <section id="quote" className="quote">
      <div className="quote__header">
        <p className="quote__eyebrow">Free quote</p>
        <h2 className="quote__title">See your price in seconds</h2>
        <p className="quote__subtitle">
          Build a quick estimate below, then send it over. We&apos;ll confirm the
          final number with a free on-site look, no obligations.
        </p>
      </div>

      <form className="quote__grid" onSubmit={handleSubmit} noValidate>
        {/* ---- Estimator ---- */}
        <div className="quote__panel">
          <div className="quote__field">
            {/* LABELLED AS A GROUP, and this became necessary with the
                one-word buttons rather than being an oversight before.
                "One story" announced itself; "One" does not — a screen
                reader read the three buttons as One, Two, Three with no
                indication of what was being counted. role="group" plus
                aria-labelledby ties the question to them, so it is
                announced as "How many stories? group, One, pressed". */}
            <span className="quote__label" id="q-stories-label">How many stories?</span>
            <div className="quote__choices" role="group" aria-labelledby="q-stories-label">
              {STOREYS.map((x) => (
                <button
                  key={x.key}
                  type="button"
                  className={`quote__choice ${stories === x.key ? "quote__choice--active" : ""}`}
                  onClick={() => setStories(x.key)}
                  aria-pressed={stories === x.key}
                >
                  {x.label}
                </button>
              ))}
            </div>
          </div>

          <div className="quote__field">
            <span className="quote__label">Number of windows</span>
            <div className="quote__stepper">
              <button
                type="button"
                className="quote__stepper-btn"
                onClick={() => adjustWindows(-1)}
                aria-label="Fewer windows"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                className="quote__stepper-input"
                value={windows}
                min="1"
                max="100"
                onChange={handleCountChange(setWindows, 100)}
                onBlur={handleCountBlur(setWindows, 1, 100)}
              />
              <button
                type="button"
                className="quote__stepper-btn"
                onClick={() => adjustWindows(1)}
                aria-label="More windows"
              >
                +
              </button>
            </div>
          </div>

          {showSkylights || skylightsNum > 0 ? (
            <div className="quote__field">
              <span className="quote__label">
                Skylights <span className="quote__optional">(optional)</span>
              </span>
              <div className="quote__stepper">
                <button
                  type="button"
                  className="quote__stepper-btn"
                  onClick={() => adjustSkylights(-1)}
                  aria-label="Fewer skylights"
                >
                  −
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  className="quote__stepper-input"
                  value={skylights}
                  min="0"
                  max="50"
                  onChange={handleCountChange(setSkylights, 50)}
                  onBlur={handleCountBlur(setSkylights, 0, 50)}
                />
                <button
                  type="button"
                  className="quote__stepper-btn"
                  onClick={() => adjustSkylights(1)}
                  aria-label="More skylights"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="quote__reveal"
              onClick={() => { setShowSkylights(true); setSkylights(1); }}
            >
              + Add skylights
            </button>
          )}

          <label className="quote__addon">
            <input
              type="checkbox"
              checked={interior}
              onChange={(e) => setInterior(e.target.checked)}
            />
            <span>
              <strong>Add interior window cleaning</strong>
              <span className="quote__addon-price">
                +${PRICING.interiorPerFloor}/floor
              </span>
            </span>
          </label>

          {/* ANYTHING ELSE — ticks, no prices. See the note on EXTRAS.

              Placed AFTER the interior add-on and BEFORE the estimate so
              the running total is still the last thing read before the
              Send button. Putting unpriced options below the number would
              make the number look incomplete; above it, they read as
              "and also these", which is what they are. */}
          {/* PILLS, NOT CARDS. The first version gave each service a
              bordered card with a line of explanation under it — 241px on
              a laptop and 335px on a phone, for four things whose names
              already say what they are. "Downspouts cleared and flushed"
              under the word "Gutters" is text nobody needed to read.

              A wrapping row of toggles is a third of the height and reads
              faster, which matters here more than anywhere else on the
              page: this block sits between the customer deciding and the
              Send button. */}
          <fieldset className="quote__extras">
            <legend className="quote__extras-legend">
              Anything else?
              <span className="quote__optional">priced on the visit</span>
            </legend>
            <div className="quote__pills">
              {EXTRAS.map((x) => (
                <label
                  className={`quote__pill${extras.has(x.key) ? " quote__pill--on" : ""}`}
                  key={x.key}
                >
                  <input
                    type="checkbox"
                    checked={extras.has(x.key)}
                    onChange={() => toggleExtra(x.key)}
                  />
                  {x.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="quote__estimate">
            <div className="quote__estimate-row">
              <span>{storey.noun} base</span>
              <span>${base}</span>
            </div>
            <div className="quote__estimate-row">
              <span>{windowsNum} window{windowsNum === 1 ? "" : "s"} × ${PRICING.perWindow}</span>
              <span>${windowsCost}</span>
            </div>
            {skylightsNum > 0 && (
              <div className="quote__estimate-row">
                <span>{skylightsNum} skylight{skylightsNum === 1 ? "" : "s"} × ${PRICING.perSkylight}</span>
                <span>${skylightsCost}</span>
              </div>
            )}
            {interior && (
              <div className="quote__estimate-row">
                <span>Interior cleaning ({floors} floor{floors > 1 ? "s" : ""} × ${PRICING.interiorPerFloor})</span>
                <span>${interiorCost}</span>
              </div>
            )}
            <div className="quote__estimate-total">
              {/* NAMES THE SERVICE once anything else is ticked. "Estimated
                  total" beside a list that also mentions a driveway reads
                  as the total for all of it, and a customer who thinks
                  $250 covers the pressure washing has been misled by a
                  label rather than by a price. */}
              <span>{extras.size > 0 ? "Window cleaning estimate" : "Estimated total"}</span>
              <span className="quote__estimate-number">${total}</span>
            </div>
            {extras.size > 0 && (
              <div className="quote__estimate-plus">
                plus {chosenExtras.map((x) => (x.lead || x.label).toLowerCase()).join(", ")}
                {" "}— priced when we see it
              </div>
            )}
          </div>
          <p className="quote__estimate-note">
            An estimate, not a bill, unusual access or heavy buildup may change it.
            We will confirm before any work starts.
          </p>
        </div>

        {/* ---- Contact ---- */}
        <div className="quote__panel">
          {status === "sent" ? (
            <div className="quote__success">
              <svg
                className="quote__success-icon"
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
              <h3 className="quote__success-title">Request sent!</h3>
              <p className="quote__success-text">
                Thanks, {name.trim().split(" ")[0]}, we got your request and
                we&apos;ll reach out shortly to confirm your quote. Need us
                sooner? Call or text{" "}
                <a href={`tel:+${PHONE_DIGITS}`}>{PHONE_DISPLAY}</a>.
              </p>
            </div>
          ) : (
            <>
              <div className="quote__field">
                <label className="quote__label" htmlFor="q-name">Your name</label>
                <input
                  id="q-name"
                  type="text"
                  className="quote__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              <div className="quote__field">
                <label className="quote__label" htmlFor="q-phone">Phone</label>
                <input
                  id="q-phone"
                  type="tel"
                  className="quote__input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(541) 555-0123"
                />
              </div>

              <div className="quote__field">
                <label className="quote__label" htmlFor="q-email">Email</label>
                <input
                  id="q-email"
                  type="email"
                  className="quote__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@email.com"
                />
              </div>

              <div className="quote__field">
                <AddressField
                  id="q-address"
                  label="Address"
                  value={address}
                  onChange={setAddress}
                  onSelect={({ latitude, longitude }) =>
                    setCoords({ latitude, longitude })
                  }
                />
              </div>

              <div className="quote__field">
                <label className="quote__label" htmlFor="q-notes">Anything else? <span className="quote__optional">(optional)</span></label>
                <textarea
                  id="q-notes"
                  className="quote__input quote__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gutters look rough too, big dog in the yard, etc."
                  rows="3"
                />
              </div>

              {error && <p className="quote__error">{error}</p>}

              <button
                type="submit"
                className="quote__submit"
                disabled={status === "sending"}
              >
                {status === "sending" ? "Sending..." : "Send my quote request"}
              </button>

              <p className="quote__contact-line">
                Prefer to talk?{" "}
                <a href={`tel:+${PHONE_DIGITS}`}>Call</a> or{" "}
                <a href={`sms:+${PHONE_DIGITS}`}>text {PHONE_DISPLAY}</a>, or email{" "}
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
              </p>
            </>
          )}
        </div>
      </form>
    </section>
  );
}

export default QuoteForm;
