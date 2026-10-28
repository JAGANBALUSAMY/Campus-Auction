
import { useDashboardSummary } from './useDashboardSummary'

export function DashboardPage() {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboardSummary()

  if (isPending) {
    return (
      <main className="dashboard-page" aria-live="polite">
        <p role="status">Loading dashboard...</p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="dashboard-page">
        <h1>Dashboard</h1>
        <p role="alert">{error.message}</p>

        {error.status === 401 && (
          <p><a href="/login">Go to sign in</a></p>
        )}

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing...' : 'Retry'}
        </button>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard">
        <h1>Dashboard</h1>

        <div className="dashboard-summary">
          <article className="summary-card">
            <h3>Total Listings</h3>
            <p>{data.total_listings}</p>
          </article>

          <article className="summary-card">
            <h3>Active Listings</h3>
            <p>{data.active_listings}</p>
          </article>

          <article className="summary-card">
            <h3>Draft Listings</h3>
            <p>{data.draft_listings}</p>
          </article>

          <article className="summary-card">
            <h3>Active Auctions</h3>
            <p>{data.active_auctions}</p>
          </article>

          <article className="summary-card">
            <h3>My Leading Auctions</h3>
            <p>{data.leading_auctions}</p>
          </article>

          <article className="summary-card">
            <h3>My Bids</h3>
            <p>{data.user_bids_count}</p>
          </article>

          <article className="summary-card">
            <h3>Selling Activity</h3>
            <p>{data.selling_activity}</p>
          </article>

          <article className="summary-card">
            <h3>Top Price Achieved</h3>
            <p>
              {data.top_price_achieved.toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
              })}
            </p>
          </article>
        </div>

        <section className="dashboard-section">
          <h2>My Listings</h2>
          <p className="section-subtitle">
            Overview of your listed items.
          </p>

          {data.total_listings === 0 ? (
            <p className="empty-state">
              You have not created any listings yet.
            </p>
          ) : (
            <p>
              You have {data.total_listings}{' '}
              {data.total_listings === 1 ? 'listing' : 'listings'}:
              {' '}{data.active_listings} active and
              {' '}{data.draft_listings} draft.
            </p>
          )}

          <a href="/my-listings">View My Listings</a>
        </section>

        <section className="dashboard-section">
          <h2>Recent Auctions</h2>
          <p className="section-subtitle">Recently active items</p>
          <p className="empty-state">
            Recent auction items are not yet provided by the dashboard API.
          </p>
        </section>

        <section className="dashboard-section">
          <h2>Auctions Closing Soon</h2>
          <p className="section-subtitle">Upcoming closing times</p>
          <p className="empty-state">
            Closing-soon items are not yet provided by the dashboard API.
          </p>
        </section>
      </section>
    </main>
  )
}

export default DashboardPage
