import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError, loginUser } from '../../api/client'
import type { LoginRequest, UserProfile } from '../../api/client'
import { currentUserQueryKey } from './auth'

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

type LoginValues = z.infer<typeof loginSchema>

interface LoginLocationState {
  from?: { pathname?: string }
  registrationSuccess?: boolean
  sessionExpired?: boolean
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const state = location.state as LoginLocationState | null
  const destination =
    state?.from?.pathname?.startsWith('/') &&
    !state.from.pathname.startsWith('//')
      ? state.from.pathname
      : '/account'
  const login = useMutation<{ user: UserProfile }, Error, LoginRequest>({
    mutationFn: (payload: LoginRequest) => loginUser(payload),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(currentUserQueryKey, user)
      navigate(destination, { replace: true })
    },
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const invalidCredentials =
    login.error instanceof ApiError &&
    login.error.code === 'invalid_credentials'

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <span className="eyebrow">Welcome back</span>
        <h1 id="login-title">Good to see you.</h1>
        <p className="auth-intro">
          Sign in to pick up where you left off.
        </p>
        {state?.registrationSuccess && (
          <p className="success-message" role="status">
            Account created. Sign in to continue.
          </p>
        )}
        {state?.sessionExpired && (
          <p className="success-message" role="status">
            Your session may have expired. Sign in again to continue.
          </p>
        )}
        <form
          className="auth-form"
          noValidate
          onSubmit={handleSubmit((payload) => login.mutate(payload))}
        >
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p className="field-error" id="login-email-error" role="alert">
              {errors.email.message}
            </p>
          )}

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'login-password-error' : undefined
            }
            {...register('password')}
          />
          {errors.password && (
            <p className="field-error" id="login-password-error" role="alert">
              {errors.password.message}
            </p>
          )}

          {invalidCredentials && (
            <p className="form-error" role="alert">
              Email or password is incorrect.
            </p>
          )}
          {login.error && !invalidCredentials && (
            <p className="form-error" role="alert">
              We couldn’t sign you in. Check your connection and try again.
            </p>
          )}
          <button
            className="button button--primary auth-submit"
            disabled={login.isPending}
            type="submit"
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch">
          New to campus auction? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  )
}
