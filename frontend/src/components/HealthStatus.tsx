import { useQuery } from '@tanstack/react-query'
import { getHealth } from '../api/client'

export function HealthStatus() {
  const health = useQuery({
    queryKey: ['api-health'],
    queryFn: getHealth,
    retry: 1,
    staleTime: 30_000,
  })

  const label = health.isPending
    ? 'Checking connection'
    : health.isError
      ? 'API unavailable'
      : 'API connected'

  return (
    <span
      className="connection-status"
      role="status"
      aria-live="polite"
      title={health.isError ? health.error.message : undefined}
    >
      <span
        className={`connection-dot ${health.isError ? 'connection-dot--offline' : health.isPending ? 'connection-dot--checking' : ''}`}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}
