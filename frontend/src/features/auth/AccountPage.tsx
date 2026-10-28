import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, logoutUser } from '../../api/client'
import { currentUserQueryKey, useCurrentUser } from './auth'

export function AccountPage() {
  const currentUser = useCurrentUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState(false)

  async function handleLogout() {
    setLogoutError(false)
    try {
      await logoutUser()
      queryClient.setQueryData(currentUserQueryKey, null)
      navigate('/', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        queryClient.setQueryData(currentUserQueryKey, null)
        navigate('/login', { replace: true })
        return
      }
      setLogoutError(true)
    }
  }

  if (!currentUser.data) {
    return null
  }

  return (
    <main className="auth-page">
      <section className="auth-card account-card" aria-labelledby="account-title">
        <span className="eyebrow">Your campus account</span>
        <h1 id="account-title">Hello, {currentUser.data.full_name}.</h1>
        <dl className="profile-details">
          <div>
            <dt>Name</dt>
            <dd>{currentUser.data.full_name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{currentUser.data.email}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>
              {new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeZone: 'UTC',
              }).format(new Date(currentUser.data.created_at))}
            </dd>
          </div>
        </dl>
        {logoutError && (
          <p className="form-error" role="alert">
            We couldn’t sign you out. Check your connection and try again.
          </p>
        )}
        <button
          className="button button--secondary auth-submit"
          onClick={() => void handleLogout()}
          type="button"
        >
          Sign out
        </button>
      </section>
    </main>
  )
}
