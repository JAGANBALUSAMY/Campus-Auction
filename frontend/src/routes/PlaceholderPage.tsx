import { Link } from 'react-router-dom'

interface PlaceholderPageProps {
  feature: string
  description: string
}

export function PlaceholderPage({
  feature,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="placeholder-page">
      <span className="eyebrow">Coming in a later phase</span>
      <h1>{feature} aren’t available yet.</h1>
      <p>{description}</p>
      <Link className="button button--primary" to="/">
        Back to home
      </Link>
    </main>
  )
}
