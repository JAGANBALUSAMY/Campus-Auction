import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../../api/client'
import type { UserProfile } from '../../api/client'
import { LoginPage } from './LoginPage'
import { AccountPage } from './AccountPage'
import { ProtectedRoute } from './ProtectedRoute'
import { RegisterPage } from './RegisterPage'

vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/client')>()
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    registerUser: vi.fn(),
  }
})

const profile: UserProfile = {
  id: '90bde2fe-f86b-4eea-8bb4-f67f2e12f1ec',
  full_name: 'Campus Student',
  email: 'student@example.edu',
  created_at: '2026-10-28T10:00:00Z',
}

function renderRoutes(
  initialEntry: string,
  _accountData: UserProfile | null = null,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  function CurrentLocation() {
    return <p>Current route: {useLocation().pathname}</p>
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <CurrentLocation />
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route
              path="/account"
              element={<p>Protected area.</p>}
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('registration', () => {
  beforeEach(() => {
    vi.mocked(registerUser).mockReset()
    vi.mocked(loginUser).mockReset()
    vi.mocked(logoutUser).mockReset()
    vi.mocked(getCurrentUser).mockReset()
  })

  it('validates required fields and password confirmation before submitting', async () => {
    const user = userEvent.setup()
    renderRoutes('/register')

    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Enter your name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Use at least 12 characters.')).toBeInTheDocument()
    expect(registerUser).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('Full name'), 'Campus Student')
    await user.type(screen.getByLabelText('Email address'), 'student@example.edu')
    await user.type(screen.getByLabelText('Password'), 'secure-password-123')
    await user.type(screen.getByLabelText('Confirm password'), 'different-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Passwords do not match.')).toBeInTheDocument()
    expect(registerUser).not.toHaveBeenCalled()
  })

  it('registers successfully and directs the student to sign in', async () => {
    vi.mocked(registerUser).mockResolvedValue(profile)
    const user = userEvent.setup()
    renderRoutes('/register')

    await user.type(screen.getByLabelText('Full name'), 'Campus Student')
    await user.type(screen.getByLabelText('Email address'), 'student@example.edu')
    await user.type(screen.getByLabelText('Password'), 'secure-password-123')
    await user.type(
      screen.getByLabelText('Confirm password'),
      'secure-password-123',
    )
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Account created. Sign in to continue.'))
      .toBeInTheDocument()
    expect(registerUser).toHaveBeenCalledWith({
      full_name: 'Campus Student',
      email: 'student@example.edu',
      password: 'secure-password-123',
    })
  })

  it('shows a useful duplicate-email error', async () => {
    vi.mocked(registerUser).mockRejectedValue(
      new ApiError(
        'An account with this email already exists.',
        409,
        'email_already_registered',
      ),
    )
    const user = userEvent.setup()
    renderRoutes('/register')
    await user.type(screen.getByLabelText('Full name'), 'Campus Student')
    await user.type(screen.getByLabelText('Email address'), 'student@example.edu')
    await user.type(screen.getByLabelText('Password'), 'secure-password-123')
    await user.type(
      screen.getByLabelText('Confirm password'),
      'secure-password-123',
    )
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(
      await screen.findByText(
        'An account with this email already exists. Sign in instead.',
      ),
    ).toBeInTheDocument()
  })
})

describe('login and protected routes', () => {
  beforeEach(() => {
    vi.mocked(registerUser).mockReset()
    vi.mocked(loginUser).mockReset()
    vi.mocked(logoutUser).mockReset()
    vi.mocked(getCurrentUser).mockReset()
  })

  it('preserves a protected destination through successful login', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    vi.mocked(loginUser).mockResolvedValue({ user: profile })
    const user = userEvent.setup()
    renderRoutes('/account', profile)

    await user.type(await screen.findByLabelText('Email address'), profile.email)
    await user.type(screen.getByLabelText('Password'), 'secure-password-123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Protected area.')).toBeInTheDocument()
    expect(screen.getByText('Current route: /account')).toBeInTheDocument()
  })

  it('redirects an unauthenticated student to login with a session message', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    renderRoutes('/account')

    expect(
      await screen.findByText(
        'Your session may have expired. Sign in again to continue.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Current route: /login')).toBeInTheDocument()
  })

  it('shows a safe invalid-credentials message', async () => {
    vi.mocked(loginUser).mockRejectedValue(
      new ApiError('Email or password is incorrect.', 401, 'invalid_credentials'),
    )
    const user = userEvent.setup()
    renderRoutes('/login')
    await user.type(screen.getByLabelText('Email address'), profile.email)
    await user.type(screen.getByLabelText('Password'), 'incorrect-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('Email or password is incorrect.'),
    ).toBeInTheDocument()
  })

  it('shows a session loading state while the identity check is pending', async () => {
    let resolveUser: (value: UserProfile | null) => void = () => undefined
    vi.mocked(getCurrentUser).mockReturnValue(
      new Promise((resolve) => {
        resolveUser = resolve
      }),
    )
    renderRoutes('/account')

    expect(screen.getByRole('status')).toHaveTextContent('Checking your session')
    resolveUser(profile)
    await waitFor(() => {
      expect(screen.getByText('Protected area.')).toBeInTheDocument()
    })
  })

  it('clears the authenticated session and returns home on logout', async () => {
    vi.mocked(logoutUser).mockResolvedValue(undefined)
    vi.mocked(getCurrentUser).mockResolvedValue(profile)
    const user = userEvent.setup()

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    function CurrentLocation() {
      return <p>Current route: {useLocation().pathname}</p>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/account']}>
          <CurrentLocation />
          <Routes>
            <Route path="/" element={<p>Home</p>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/account" element={<AccountPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('Hello, Campus Student.')).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => {
      expect(screen.getByText('Current route: /')).toBeInTheDocument()
    })
    expect(logoutUser).toHaveBeenCalled()
  })
})
