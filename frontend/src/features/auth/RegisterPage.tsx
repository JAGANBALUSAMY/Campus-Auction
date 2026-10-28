import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError, registerUser } from '../../api/client'
import type { RegisterRequest, UserProfile } from '../../api/client'

const registrationSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Enter your name.').max(120),
    email: z.string().trim().email('Enter a valid email address.').max(320),
    password: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .max(128, 'Use no more than 128 characters.')
      .refine((value) => value.trim().length > 0, 'Password cannot be blank.'),
    password_confirmation: z.string(),
  })
  .refine((value) => value.password === value.password_confirmation, {
    message: 'Passwords do not match.',
    path: ['password_confirmation'],
  })

type RegistrationValues = z.infer<typeof registrationSchema>

export function RegisterPage() {
  const navigate = useNavigate()
  const registration = useMutation<UserProfile, Error, RegisterRequest>({
    mutationFn: (payload: RegisterRequest) => registerUser(payload),
    onSuccess: () => navigate('/login', { state: { registrationSuccess: true } }),
  })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  })

  const errorMessage =
    registration.error instanceof ApiError &&
    registration.error.code === 'email_already_registered'
      ? 'An account with this email already exists. Sign in instead.'
      : registration.error
        ? 'We couldn’t create your account. Check your connection and try again.'
        : null

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <span className="eyebrow">A good place to start</span>
        <h1 id="register-title">Join your campus.</h1>
        <p className="auth-intro">
          Create an account to be part of a more thoughtful campus marketplace.
        </p>
        <form
          className="auth-form"
          noValidate
          onSubmit={handleSubmit(({ password_confirmation: _confirmation, ...payload }) =>
            registration.mutate(payload),
          )}
        >
          <label htmlFor="full_name">Full name</label>
          <input
            id="full_name"
            autoComplete="name"
            aria-invalid={Boolean(errors.full_name)}
            aria-describedby={errors.full_name ? 'full_name-error' : undefined}
            {...register('full_name')}
          />
          {errors.full_name && (
            <p className="field-error" id="full_name-error" role="alert">
              {errors.full_name.message}
            </p>
          )}

          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p className="field-error" id="register-email-error" role="alert">
              {errors.email.message}
            </p>
          )}

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'register-password-error' : 'password-hint'
            }
            {...register('password')}
          />
          <p className="field-hint" id="password-hint">
            Use 12–128 characters.
          </p>
          {errors.password && (
            <p className="field-error" id="register-password-error" role="alert">
              {errors.password.message}
            </p>
          )}

          <label htmlFor="password_confirmation">Confirm password</label>
          <input
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password_confirmation)}
            aria-describedby={
              errors.password_confirmation
                ? 'password-confirmation-error'
                : undefined
            }
            {...register('password_confirmation')}
          />
          {errors.password_confirmation && (
            <p
              className="field-error"
              id="password-confirmation-error"
              role="alert"
            >
              {errors.password_confirmation.message}
            </p>
          )}

          {errorMessage && (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            className="button button--primary auth-submit"
            disabled={registration.isPending}
            type="submit"
          >
            {registration.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}
