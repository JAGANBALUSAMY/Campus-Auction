import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useCurrentUser } from './auth'

export function ProtectedRoute() {
  const currentUser = useCurrentUser()
  const location = useLocation()

  if (currentUser.isPending) {
    return (
      <main className="auth-page" aria-live="polite">
        <p role="status">Checking your session…</p>
      </main>
    )
  }

  if (currentUser.isError) {
    return (
      <main className="auth-page">
        <div className="auth-card" role="alert">
          <h1>We couldn't check your session.</h1>
          <p>Check your connection and try again.</p>
          <button
            className="button button--primary"
            onClick={() => void currentUser.refetch()}
            type="button"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  if (!currentUser.data) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location, sessionExpired: true }}
      />
    )
  }

  return <Outlet />
}

export function AuthenticationLinks() {
  const currentUser = useCurrentUser()

  if (currentUser.isPending) {
    return <span className="auth-nav-status">Checking session…</span>
  }

  if (currentUser.isError) {
    return <Link to="/login">Sign in</Link>
  }

  if (!currentUser.data) {
    return (
      <>
        <Link to="/login">Sign in</Link>
        <Link className="button button--small" to="/register">
          Join campus <span aria-hidden="true">↗</span>
        </Link>
      </>
    )
  }

  return (
    <>
      <Link className="button button--small" to="/account">
        My account
      </Link>
      <Link className="button button--small" to="/listings/create">
        My Listings
      </Link>
    </>
  )
}