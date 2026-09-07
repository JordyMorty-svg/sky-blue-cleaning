import "./Reviews.css";

const GOOGLE_REVIEWS_URL = "https://g.page/r/CUApffEylLUgEBM/review";
const GOOGLE_REVIEWS_URL_ALL = "https://www.google.com/maps/place/Sky+Blue+Window+Cleaning/@44.5931089,-123.2442839,19z/data=!4m8!3m7!1s0x54c03ff33d83ee6d:0x20b59432f17d2940!8m2!3d44.5928853!4d-123.2438123!9m1!1b1!16s%2Fg%2F11zgvsyfqq?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D";

const reviews = [
  {
    name: "Carolyn",
    stars: 5,
    text: "Very efficient and professional - windows look amazing.",
  },
  {
    name: "Laura",
    stars: 5,
    text: "We are very happy with our experience with Sky Blue Window Cleaning.  Hayden is hard working, professional, easy to work with and the price was reasonable. Highly recommend!",
  },
  {
    name: "Gerald",
    stars: 5,
    text: "Hayden and Jordan of Sky Blue Cleaning Co. have the equipment and knowhow to give your windows a new lease on life, free of streaks, smudges and smears, both inside and out.  After 20 years without professional cleaning, and many without any cleaning, all of our windows are now crystal clear.  They also managed to make our filthy gutters look good as new.  We are very satisfied with the quality of work and modest pricing.  Moreover, Hayden and Jordan were highly professional, pleasant, and easy going. We are very pleased with their work, and they have our highest recommendation.",
  },
  {
    name: "Sarah",
    stars: 5,
    text: "My windows look great!  They were here right when they said and made sure everything they had to move was put back right where they found it. If you want a job done well, give them a call",
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
            <p className="reviews__name"> {review.name}</p>
            <span className="reviews__source">Posted on Google</span>
          </article>
        ))}
      </div>

      <div className="reviews__actions">
        <a
          href={GOOGLE_REVIEWS_URL_ALL}
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