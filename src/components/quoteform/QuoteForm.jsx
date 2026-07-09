import { useState } from "react";
import "./QuoteForm.css";

/* ---- Your pricing (edit these numbers any time) ---- */
const PRICING = {
  oneStory: 200,
  twoStory: 300,
  perWindow: 5,
  interiorAddOn: 100,
};

/* ---- Business contact info ---- */
const PHONE_DISPLAY = "(541) 730-3593";
const PHONE_DIGITS = "15417303593"; // used for call/text links, no spaces
const EMAIL = "skybluecleaninggco@gmail.com";

/* ---- Web3Forms ---- 

Allows form submissions to be sent to Web3Forms after the customer submits a quote request

*/

const WEB3FORMS_ACCESS_KEY = '4da845f5-1959-4972-8192-e060287fc8b2';

function QuoteForm() {
  const [stories, setStories] = useState("one");
  const [windows, setWindows] = useState(10);
  const [interior, setInterior] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const base = stories === "two" ? PRICING.twoStory : PRICING.oneStory;
  const windowsCost = windows * PRICING.perWindow;
  const interiorCost = interior ? PRICING.interiorAddOn : 0;
  const total = base + windowsCost + interiorCost;

  function adjustWindows(delta) {
    setWindows((w) => Math.min(100, Math.max(1, w + delta)));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setError("Please add your name and a phone number or email so we can reach you.");
      return;
    }
    setError("");
    setStatus("sending");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `Quote request — ${name} ($${total})`,
          from_name: "Sky Blue Cleaning Co. website",
          name,
          phone: phone || "—",
          email: email || "—",
          address: address || "—",
          stories: stories === "two" ? "Two story" : "One story",
          windows,
          interior_cleaning: interior ? `Yes (+$${PRICING.interiorAddOn})` : "No",
          estimated_total: `$${total}`,
          notes: notes || "—",
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus("sent");
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch {
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
            <span className="quote__label">How many stories?</span>
            <div className="quote__choices">
              <button
                type="button"
                className={`quote__choice ${stories === "one" ? "quote__choice--active" : ""}`}
                onClick={() => setStories("one")}
              >
                One story
              </button>
              <button
                type="button"
                className={`quote__choice ${stories === "two" ? "quote__choice--active" : ""}`}
                onClick={() => setStories("two")}
              >
                Two story
              </button>
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
                className="quote__stepper-input"
                value={windows}
                min="1"
                max="100"
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setWindows(Number.isNaN(v) ? 1 : Math.min(100, Math.max(1, v)));
                }}
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

          <label className="quote__addon">
            <input
              type="checkbox"
              checked={interior}
              onChange={(e) => setInterior(e.target.checked)}
            />
            <span>
              <strong>Add interior window cleaning</strong>
              <span className="quote__addon-price">+${PRICING.interiorAddOn}</span>
            </span>
          </label>

          <div className="quote__estimate">
            <div className="quote__estimate-row">
              <span>{stories === "two" ? "Two-story base" : "One-story base"}</span>
              <span>${base}</span>
            </div>
            <div className="quote__estimate-row">
              <span>{windows} windows × ${PRICING.perWindow}</span>
              <span>${windowsCost}</span>
            </div>
            {interior && (
              <div className="quote__estimate-row">
                <span>Interior cleaning</span>
                <span>${interiorCost}</span>
              </div>
            )}
            <div className="quote__estimate-total">
              <span>Estimated total</span>
              <span className="quote__estimate-number">${total}</span>
            </div>
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
                <label className="quote__label" htmlFor="q-address">Address <span className="quote__optional">(optional)</span></label>
                <input
                  id="q-address"
                  type="text"
                  className="quote__input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Corvallis"
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