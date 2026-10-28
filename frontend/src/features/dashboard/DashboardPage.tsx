
import { useQuery } from '@tanstack/react-query'

export interface DashboardSummary {
  active_auctions: number
  leading_auctions: number
  user_bids_count: number
  selling_activity: number
  top_price_achieved: number
  last_updated: string
}

interface DashboardSchemaMissing {
  _schema_missing: true
}

type DashboardResponse = DashboardSummary | DashboardSchemaMissing

class DashboardApiError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'DashboardApiError'
    this.status = status
    this.code = code
  }
}

function isSchemaMissing(
  data: DashboardResponse
): data is DashboardSchemaMissing {
  return '_schema_missing' in data && data._schema_missing === true
}

export function useDashboardSummary() {
  return useQuery<DashboardResponse, DashboardApiError>({
    queryKey: ['dashboard-summary'],

    queryFn: async (): Promise<DashboardResponse> => {
      let response: Response

      try {
        response = await fetch('/api/v1/dashboard', {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        })
      } catch {
        throw new DashboardApiError(
          'Cannot connect to the backend. Check that the server is running.'
        )
      }

      const body: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const payload = body as {
          error?: { message?: string; code?: string }
          detail?: string
        } | null

        const code = payload?.error?.code

        let message =
          payload?.error?.message ||
          payload?.detail ||
          `Dashboard request failed (HTTP ${response.status}).`

        if (response.status === 401) {
          message = 'Your session is missing or expired. Please sign in again.'
        } else if (response.status === 403) {
          message = 'You do not have permission to access this dashboard.'
        } else if (response.status === 404) {
          message = 'The dashboard API endpoint was not found.'
        } else if (response.status >= 500) {
          message = 'The server failed to load dashboard data. Check the backend logs.'
        }

        throw new DashboardApiError(message, response.status, code)
      }

      if (!body || typeof body !== 'object') {
        throw new DashboardApiError(
          'The dashboard API returned an invalid response.'
        )
      }

      const result = body as Record<string, unknown>

      if (result._schema_missing === true) {
        return { _schema_missing: true }
      }

      const numericFields = [
        'active_auctions',
        'leading_auctions',
        'user_bids_count',
        'selling_activity',
        'top_price_achieved',
      ] as const

      for (const field of numericFields) {
        if (
          typeof result[field] !== 'number' ||
          !Number.isFinite(result[field])
        ) {
          throw new DashboardApiError(
            `Dashboard API response is missing a valid "${field}" value.`
          )
        }
      }

      if (typeof result.last_updated !== 'string') {
        throw new DashboardApiError(
          'Dashboard API response is missing "last_updated".'
        )
      }

      return result as unknown as DashboardSummary
    },

    retry: false,
    staleTime: 30_000,
  })
}

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
        <p role="status">Loading dashboard…</p>
      </main>
    )
  }

  if (isError) {
    return (
      <main className="dashboard-page">
        <h1>Dashboard</h1>
        <p role="alert">{error.message}</p>

        {error.status === 401 && (
          <p>
            <a href="/login">Go to sign in</a>
          </p>
        )}

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          {isFetching ? 'Retrying…' : 'Retry'}
        </button>

        {import.meta.env.DEV && (
          <p>
            Diagnostic: HTTP {error.status ?? 'unavailable'}
            {error.code ? ` — ${error.code}` : ''}
          </p>
        )}
      </main>
    )
  }

  if (!data || isSchemaMissing(data)) {
    return (
      <main className="dashboard-page">
        <section className="dashboard">
          <h1>Dashboard</h1>
          <p>
            Auction data is not available yet. It will appear when the
            required auction features and database schema are implemented.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard">
        <h1>Dashboard</h1>

        <div className="dashboard-summary">
          <div className="summary-card">
            <h3>Active Auctions</h3>
            <p>{data.active_auctions}</p>
          </div>

          <div className="summary-card">
            <h3>My Leading Auctions</h3>
            <p>{data.leading_auctions}</p>
          </div>

          <div className="summary-card">
            <h3>My Bids</h3>
            <p>{data.user_bids_count}</p>
          </div>

          <div className="summary-card">
            <h3>Selling Activity</h3>
            <p>{data.selling_activity}</p>
          </div>

          <div className="summary-card">
            <h3>Top Price Achieved</h3>
            <p>{data.top_price_achieved}</p>
          </div>
        </div>

        <section className="dashboard-section">
          <h2>Recent Auctions</h2>
          <p className="section-subtitle">Recently active listings</p>
          <p className="empty-state">
            Auction browsing will be available in a later phase.
          </p>
        </section>

        <section className="dashboard-section">
          <h2>Auctions Closing Soon</h2>
          <p className="section-subtitle">Auctions ending soon</p>
          <p className="empty-state">
            Auction closing information will appear when auction data is available.
          </p>
        </section>
      </section>
    </main>
  )
}
