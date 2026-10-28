
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export interface Listing {
  id: string
  seller_id: string
  title: string
  category: string
  description: string | null
  condition: 'new' | 'used' | 'refurbished' | string
  starting_price: number
  minimum_increment: number
  closing_at: string
  status: 'draft' | 'active' | 'cancelled' | string
  created_at: string
  updated_at: string
  photos: string[]
}

interface ListingFormValues {
  title: string
  description: string
  condition: string
  category: string
  starting_price: string
  minimum_increment: string
  closing_at: string
}

const initialForm: ListingFormValues = {
  title: '',
  description: '',
  condition: 'used',
  category: '',
  starting_price: '0.00',
  minimum_increment: '1.00',
  closing_at: '',
}

function formatPrice(value: number | string): string {
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return 'N/A'
  }

  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
  })
}

export function ListingForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const [form, setForm] = useState<ListingFormValues>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!form.title.trim()) {
      setError('Please enter a listing title.')
      return
    }

    if (!form.category.trim()) {
      setError('Please enter a category.')
      return
    }

    if (!form.condition) {
      setError('Please select the items condition.')
      return
    }

    if (!form.closing_at) {
      setError('Please select a closing time.')
      return
    }

    const closingAt = new Date(form.closing_at)
    const startingPrice = Number(form.starting_price)
    const minimumIncrement = Number(form.minimum_increment)

    if (
      Number.isNaN(closingAt.getTime()) ||
      closingAt.getTime() <= Date.now()
    ) {
      setError('Closing time must be in the future.')
      return
    }

    if (!Number.isFinite(startingPrice) || startingPrice < 0) {
      setError('Starting price must be zero or greater.')
      return
    }

    if (!Number.isFinite(minimumIncrement) || minimumIncrement < 0) {
      setError('Minimum increment must be zero or greater.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/v1/listings', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          condition: form.condition,
          category: form.category.trim(),
          starting_price: startingPrice,
          minimum_increment: minimumIncrement,
          closing_at: closingAt.toISOString(),
        }),
      })

      const result: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        let message = `Failed to create listing (${response.status}).`

        if (typeof result === 'object' && result !== null && 'detail' in result) {
          const detail = result.detail

          if (typeof detail === 'string') {
            message = detail
          } else if (Array.isArray(detail)) {
            message = detail
              .map((item) => {
                if (
                  typeof item === 'object' &&
                  item !== null &&
                  'msg' in item &&
                  typeof item.msg === 'string'
                ) {
                  return item.msg
                }

                return 'Invalid input.'
              })
              .join(' ')
          }
        }

        throw new Error(message)
      }

      setForm(initialForm)
      onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create listing. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="listing-form-page">
      <div className="page-width">
        <form className="listing-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                maxLength={200}
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="e.g. Engineering textbook"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe the item you are auctioning"
                maxLength={1000}
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value })
                }
                required
              >
                <option value="new">New</option>
                <option value="used">Used</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input
                id="category"
                type="text"
                maxLength={50}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                placeholder="Electronics, Books, Clothing..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="starting_price">Starting Price (₹)</label>
              <input
                id="starting_price"
                type="number"
                min="0"
                step="0.01"
                value={form.starting_price}
                onChange={(e) =>
                  setForm({ ...form, starting_price: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="minimum_increment">
                Minimum Bid Increment (₹)
              </label>
              <input
                id="minimum_increment"
                type="number"
                min="0"
                step="0.01"
                value={form.minimum_increment}
                onChange={(e) =>
                  setForm({ ...form, minimum_increment: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="closing_at">Closing Time</label>
              <input
                id="closing_at"
                type="datetime-local"
                value={form.closing_at}
                onChange={(e) =>
                  setForm({ ...form, closing_at: e.target.value })
                }
                required
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="button button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating listing...' : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export function ListingDetailsPage() {
  const { listingId } = useParams<{ listingId: string }>()

  const [listing, setListing] = useState<Listing | null>(null)
  const [isPending, setIsPending] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!listingId) {
      setError('Listing ID is missing.')
      setIsPending(false)
      return
    }

    const controller = new AbortController()

    async function loadListing() {
      setIsPending(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/v1/listings/${encodeURIComponent(listingId!)}`,
          {
            credentials: 'include',
            signal: controller.signal,
          },
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Listing not found.')
          }

          throw new Error(`Unable to load listing (${response.status}).`)
        }

        const data = (await response.json()) as Listing
        setListing(data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load this listing.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsPending(false)
        }
      }
    }

    void loadListing()

    return () => controller.abort()
  }, [listingId])

  if (isPending) {
    return <p role="status">Loading listing...</p>
  }

  if (error) {
    return (
      <main className="listing-page">
        <h1>Listing Details</h1>
        <p role="alert">{error}</p>
      </main>
    )
  }

  if (!listing) {
    return <p>Listing not found.</p>
  }

  return (
    <main className="listing-page">
      <h1>{listing.title}</h1>

      <section className="listing-details">
        <p>
          <strong>Description:</strong> {listing.description || 'N/A'}
        </p>

        <p>
          <strong>Category:</strong> {listing.category}
        </p>

        <p>
          <strong>Condition:</strong> {listing.condition}
        </p>

        <p>
          <strong>Starting Price:</strong>{' '}
          {formatPrice(listing.starting_price)}
        </p>

        <p>
          <strong>Minimum Bid Increment:</strong>{' '}
          {formatPrice(listing.minimum_increment)}
        </p>

        <p>
          <strong>Status:</strong> {listing.status}
        </p>

        <p>
          <strong>Closing Time:</strong>{' '}
          {new Date(listing.closing_at).toLocaleString()}
        </p>

        <p>
          <strong>Created At:</strong>{' '}
          {new Date(listing.created_at).toLocaleString()}
        </p>
      </section>
    </main>
  )
}

export function ListingPage() {
  const navigate = useNavigate()
  const { listingId } = useParams<{ listingId: string }>()

  // Keep hooks out of conditional branches.
  if (listingId) {
    return <ListingDetailsPage />
  }

  return (
    <section className="listing-form-page">
      <div className="page-width">
        <h1>Create a New Listing</h1>
        <ListingForm onSuccess={() => navigate('/my-listings')} />
      </div>
    </section>
  )
}

export default ListingPage
