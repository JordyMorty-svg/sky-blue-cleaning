import "./Reviews.css";

const GOOGLE_REVIEWS_URL = "https://share.google/RzkJ3rvVbLQq0NsNT";

const reviews = [
  {
    name: "Jennette",
    stars: 5,
    text: "Prompt, efficient, professional job. Very happy with window cleaning. Will definitely use again.",
  },
  {
    name: "Sofia",
    stars: 5,
    text: "Very efficient, professional and detailed cleaning, these guys know their stuff",
  },
];

function Stars({ count }) {
  return (
    <div className="reviews__stars" aria-label={`${count} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`reviews__star ${i <= count ? "reviews__star--filled" : ""}`}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function Reviews() {
  return (
    <section id="reviews" className="reviews">
      <div className="reviews__header">
        <p className="reviews__eyebrow">Reviews</p>
        <h2 className="reviews__title">What our customers say</h2>
        <p className="reviews__subtitle">
          Reviews from real customers on Google, click through and read
          them for yourself.
        </p>
      </div>

      <div className="reviews__grid">
        {reviews.map((review) => (
          <article className="reviews__card" key={review.name}>
            <Stars count={review.stars} />
            <p className="reviews__text">&ldquo;{review.text}&rdquo;</p>
            <p className="reviews__name">— {review.name}</p>
            <span className="reviews__source">Posted on Google</span>
          </article>
        ))}
      </div>

      <div className="reviews__actions">
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="reviews__button reviews__button--ghost"
        >
          Read all reviews on Google
        </a>
        <a
          href={GOOGLE_REVIEWS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="reviews__button reviews__button--primary"
        >
          Leave us a review
        </a>
      </div>
    </section>
  );
}

export default Reviews;