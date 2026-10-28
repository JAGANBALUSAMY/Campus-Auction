
import { useQuery } from '@tanstack/react-query'

export interface DashboardSummary {
  active_auctions: number
  leading_auctions: number
  user_bids_count: number
  selling_activity: number
  top_price_achieved: number
  total_listings: number
  active_listings: number
  draft_listings: number
  last_updated: string
}

export class DashboardApiError extends Error {
  status?: number
  code?: string

  constructor(message: string, status?: number, code?: string) {
    super(message)
    this.name = 'DashboardApiError'
    this.status = status
    this.code = code
  }
}

export function useDashboardSummary() {
  return useQuery<DashboardSummary, DashboardApiError>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      let response: Response

      try {
        response = await fetch('/api/v1/dashboard', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
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
          message = 'The server failed to load dashboard data.'
        }

        throw new DashboardApiError(
          message,
          response.status,
          payload?.error?.code
        )
      }

      if (!body || typeof body !== 'object') {
        throw new DashboardApiError('The dashboard API returned invalid data.')
      }

      const result = body as Record<string, unknown>

      if (result._schema_missing === true) {
        throw new DashboardApiError(
          'Dashboard schema is unavailable. Check the backend service.'
        )
      }

      const fields = [
        'active_auctions',
        'leading_auctions',
        'user_bids_count',
        'selling_activity',
        'top_price_achieved',
        'total_listings',
        'active_listings',
        'draft_listings',
      ] as const

      for (const field of fields) {
        if (
          typeof result[field] !== 'number' ||
          !Number.isFinite(result[field])
        ) {
          throw new DashboardApiError(
            `Dashboard response has an invalid "${field}" value.`
          )
        }
      }

      if (typeof result.last_updated !== 'string') {
        throw new DashboardApiError(
          'Dashboard response is missing last_updated.'
        )
      }

      return result as unknown as DashboardSummary
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
