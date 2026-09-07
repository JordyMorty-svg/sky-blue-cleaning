import { useState } from "react";
import "./QuoteForm.css";
import { CONTACT, submitLead, trackQuoteConversion } from "../../lib/leadSubmit";

const { phoneDisplay: PHONE_DISPLAY, phoneDigits: PHONE_DIGITS, email: EMAIL } = CONTACT;

/*
 * A lightweight "request a quote" form used on service pages that don't have
 * a live price estimator (gutters, screens, pressure washing, solar) and, in
 * `businessInquiry` mode, the commercial window-washing page.
 *
 * It writes the same kind of lead the estimator does, tagged with the
 * service, but leaves the window-only fields (stories/windows/etc.) null.
 */
function QuoteRequestForm({ service, businessInquiry = false }) {
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  async function handleSubmit(e) {
    e.preventDefault();

    if (!name.trim() || (!phone.trim() && !email.trim())) {
      setError("Please add your name and a phone number or email so we can reach you.");
      return;
    }
    setError("");
    setStatus("sending");

    // No dedicated business-name column on the leads table, so fold it into notes.
    const composedNotes = [
      businessInquiry && business.trim() ? `Business: ${business.trim()}` : "",
      notes.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    const { ok } = await submitLead({
      emailFields: {
        subject: `${businessInquiry ? "Business quote" : "Quote request"} — ${name}${
          business.trim() ? ` (${business.trim()})` : ""
        } · ${service.title}`,
        name,
        ...(businessInquiry ? { business_name: business.trim() || "—" } : {}),
        phone: phone || "—",
        email: email || "—",
        address: address || "—",
        service: service.title,
        notes: notes || "—",
      },
      lead: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        service: service.slug,
        source: "website",
        // Window-only fields don't apply to this service.
        stories: null,
        windows: null,
        skylights: null,
        interior: null,
        estimate: null,
        notes: composedNotes || null,
      },
    });

    if (ok) {
      setStatus("sent");
      trackQuoteConversion();
    } else {
      setStatus("idle");
      setError(
        `Something went wrong sending your request. Please try again, or call/text us at ${PHONE_DISPLAY}.`
      );
    }
  }

  return (
    <section id="quote" className="quote quote--request">
      <div className="quote__header">
        <p className="quote__eyebrow">
          {businessInquiry ? "Business inquiry" : "Free quote"}
        </p>
        <h2 className="quote__title">{service.quoteHeading}</h2>
        <p className="quote__subtitle">{service.quoteBlurb}</p>
      </div>

      <form className="quote__grid quote__grid--single" onSubmit={handleSubmit} noValidate>
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
                Thanks, {name.trim().split(" ")[0]}, we got your request about{" "}
                {service.title.toLowerCase()} and we&apos;ll reach out shortly.
                Need us sooner? Call or text{" "}
                <a href={`tel:+${PHONE_DIGITS}`}>{PHONE_DISPLAY}</a>.
              </p>
            </div>
          ) : (
            <>
              <div className="quote__field">
                <label className="quote__label" htmlFor="rq-name">Your name</label>
                <input
                  id="rq-name"
                  type="text"
                  className="quote__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>

              {businessInquiry && (
                <div className="quote__field">
                  <label className="quote__label" htmlFor="rq-business">
                    Business name <span className="quote__optional">(optional)</span>
                  </label>
                  <input
                    id="rq-business"
                    type="text"
                    className="quote__input"
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                    placeholder="Acme Storefront LLC"
                  />
                </div>
              )}

              <div className="quote__field">
                <label className="quote__label" htmlFor="rq-phone">Phone</label>
                <input
                  id="rq-phone"
                  type="tel"
                  className="quote__input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(541) 555-0123"
                />
              </div>

              <div className="quote__field">
                <label className="quote__label" htmlFor="rq-email">Email</label>
                <input
                  id="rq-email"
                  type="email"
                  className="quote__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@email.com"
                />
              </div>

              <div className="quote__field">
                <label className="quote__label" htmlFor="rq-address">
                  {businessInquiry ? "Property address" : "Address"}{" "}
                  <span className="quote__optional">(optional)</span>
                </label>
                <input
                  id="rq-address"
                  type="text"
                  className="quote__input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, Corvallis"
                />
              </div>

              <div className="quote__field">
                <label className="quote__label" htmlFor="rq-notes">
                  {businessInquiry ? "Tell us about the job" : "Anything else?"}{" "}
                  <span className="quote__optional">(optional)</span>
                </label>
                <textarea
                  id="rq-notes"
                  className="quote__input quote__textarea"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    businessInquiry
                      ? "Roughly how many panes, how many floors, and how often you'd like service."
                      : "Roughly what you need, access notes, big dog in the yard, etc."
                  }
                  rows="3"
                />
              </div>

              {error && <p className="quote__error">{error}</p>}

              <button
                type="submit"
                className="quote__submit"
                disabled={status === "sending"}
              >
                {status === "sending"
                  ? "Sending..."
                  : businessInquiry
                  ? "Request my business quote"
                  : "Send my quote request"}
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

export default QuoteRequestForm;
