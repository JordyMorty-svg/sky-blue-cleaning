import "./About.css";
/* THE PHOTOGRAPH THAT MATCHES THE PARAGRAPH.
   The text beside this image says "we use water-fed poles to reach
   second-story windows safely from the ground" and the picture used to be
   a close crop that showed none of that.

   CROPPED FROM THE BOTTOM, keeping the hand. The frame also contained a
   nice gable peak, and a centred crop kept the peak and cut the hand —
   which is keeping the scenery and losing the subject. With the hand in
   shot the picture is somebody working; without it, it is a house. */
import haydenWashing from "../../assets/work/pole-second-storey.jpg";
import haydenPortrait from "../../assets/hayden-portrait.jpg";
import jordanPortrait from "../../assets/jordan-portrait.jpg";
import haydenOnSite from "../../assets/work/hayden-on-site.jpg";

const team = [
  {
    name: "Hayden",
    role: "Founder",
    photo: haydenPortrait,
    chips: ["2 yrs washing windows", "100+ homes cleaned", "Welding background"],
    bio: "Hayden started Sky Blue Cleaning Co. and has spent two years mastering the details of a streak-free finish, 100+ homes and counting. With a welding degree and years in hands-on service work like carpet cleaning, he brings real craftsmanship and a do-it-right-the-first-time work ethic to every job. In his spare time, he has a passion for Muay Thai.",
  },
  {
    name: "Jordan",
    role: "Co-owner",
    photo: jordanPortrait,
    chips: ["3 yrs carpet cleaning", "CS degree", "Built this site"],
    bio: "Jordan is Hayden's older brother and co-owner. He brings three years of carpet cleaning experience, sharp attention to detail, and the same work ethic that runs in the family. He holds a computer science degree, and built this very website, and runs the customer side so every job is smooth from first call to final pane. Off the clock, he trains jiu jitsu.",
  },
];

function About() {
  return (
    <section id="about" className="about">
      <div className="about__header">
        <p className="about__eyebrow">About us</p>
        <h2 className="about__title">Meet the brothers behind Sky Blue</h2>
        <p className="about__subtitle">
          Sky Blue Cleaning Co. is a family-run, local operation. When you book with us, you get the two
          people whose name is on the business.
        </p>
      </div>

      <div className="about__story">
        <div className="about__story-media">
          <img
            src={haydenWashing}
            alt="A hand gripping a water-fed pole extended from the ground to a second-storey window, the brush head washing the glass"
            loading="lazy"
          />
        </div>
        <div className="about__story-text">
          <h3 className="about__story-heading">Real work, done right</h3>
          <p>
            We use water-fed poles to reach second-story windows safely from the
            ground. Every window gets the same attention to detail, whether it&apos;s a storefront or the
            kitchen window over your sink.
          </p>
          <p>
            We&apos;re fully insured, we show up when we say we will, and if
            something isn&apos;t right, we make it right. That&apos;s the whole
            promise.
          </p>
        </div>
      </div>

      <div className="about__team">
        {team.map((member) => (
          <article className="about__card" key={member.name}>
            <div className="about__card-media">
              <img src={member.photo} alt={`${member.name}, ${member.role}`} loading="lazy" />
            </div>
            <div className="about__card-body">
              <div className="about__card-head">
                <h3 className="about__card-name">{member.name}</h3>
                <span className="about__card-role">{member.role}</span>
              </div>
              <ul className="about__chips">
                {member.chips.map((chip) => (
                  <li className="about__chip" key={chip}>{chip}</li>
                ))}
              </ul>
              <p className="about__card-bio">{member.bio}</p>
            </div>
          </article>
        ))}
      </div>

      {/* HAYDEN ON A JOB, under the two cards.

          The team cards are headshots — necessary, and the same two
          photographs every trade website has. This is the one that says
          the person in the circle above is the person who turns up: same
          face, outdoors, squeegee in the window behind him.

          One brother and not both because there is only one such photo.
          Jordan's belongs here the day somebody takes it. */}
      <figure className="about__onsite">
        <img
          src={haydenOnSite}
          alt="Hayden on a job in Corvallis, a squeegee resting against the window behind him"
          loading="lazy"
          width="1500"
          height="937"
        />
        <figcaption>Hayden, mid-job in Corvallis.</figcaption>
      </figure>
    </section>
  );
}

export default About;