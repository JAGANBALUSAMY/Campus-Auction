import { Link } from 'react-router-dom'

const steps = [
  {
    number: '01',
    title: 'Find something useful',
    description:
      'Discover the kinds of things students pass on: books, bikes, tech and more.',
  },
  {
    number: '02',
    title: 'Take part transparently',
    description:
      'Auctions are designed around clear bids and a visible closing time.',
  },
  {
    number: '03',
    title: 'Agree before it’s yours',
    description:
      'The seller approves the winning price before the item is reserved for handover.',
  },
]

export function LandingPage() {
  return (
    <main>
      <section className="hero page-width" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="eyebrow-mark" aria-hidden="true">
              ✳
            </span>
            Good finds, close by
          </span>
          <h1 id="hero-title">
            Your next great
            <br />
            find is <span>on campus.</span>
          </h1>
          <p className="hero-description">
            A more thoughtful way for students to buy and sell pre-loved
            essentials. Fair auctions, familiar faces, and fewer things left
            behind.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary" to="/auctions">
              Explore auctions <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button--secondary" to="/sell">
              List an item
            </Link>
          </div>
          <p className="hero-note">
            No live auctions yet — the marketplace is getting ready.
          </p>
        </div>
        <div
          className="hero-art"
          role="img"
          aria-label="Illustration of pre-loved campus essentials"
        >
          <div className="art-sun" aria-hidden="true" />
          <div className="art-note art-note--top" aria-hidden="true">
            good as new
          </div>
          <div className="art-book art-book--back" aria-hidden="true">
            <span>FIELD NOTES</span>
          </div>
          <div className="art-book art-book--front" aria-hidden="true">
            <span>
              Ideas for
              <br />
              the next chapter
            </span>
            <i />
          </div>
          <div className="art-cup" aria-hidden="true">
            <div className="cup-handle" />
          </div>
          <div className="art-tag" aria-hidden="true">
            <span>PASS IT ON</span>
            <b>♥</b>
          </div>
          <div className="art-caption" aria-hidden="true">
            <span>ONE CAMPUS,</span>
            <strong>MORE POSSIBILITY.</strong>
          </div>
          <span className="art-spark art-spark--one" aria-hidden="true">
            ✳
          </span>
          <span className="art-spark art-spark--two" aria-hidden="true">
            ✳
          </span>
        </div>
      </section>

      <section className="intro-band" aria-label="Marketplace principles">
        <div className="page-width intro-band-inner">
          <p>
            <span aria-hidden="true">↗</span> Made for student life
          </p>
          <p>
            <span aria-hidden="true">◉</span> Clear, competitive auctions
          </p>
          <p>
            <span aria-hidden="true">⌂</span> Handover on your campus
          </p>
        </div>
      </section>

      <section className="how-it-works page-width" id="how-title" aria-labelledby="how-heading">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A better way to pass it on</span>
            <h2 id="how-heading">Simple by design.</h2>
          </div>
          <p>
            A good exchange should feel clear from the first look to the final
            handover.
          </p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="empty-auctions page-width" aria-labelledby="empty-title">
        <div className="empty-auctions-copy">
          <span className="eyebrow">The marketplace is warming up</span>
          <h2 id="empty-title">Good things take a little setup.</h2>
          <p>
            Browsing and listing aren’t live in this first release. We’re
            building the foundation for a marketplace that works for campus.
          </p>
        </div>
        <Link className="button button--dark" to="/auctions">
          See what’s available <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  )
}
