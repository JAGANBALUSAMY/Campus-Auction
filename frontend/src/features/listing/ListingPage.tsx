import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export interface Listing {
  id: number
  title: string
  description: string | null
  condition: string | null
  starting_price: number
  minimum_increment: number
  seller_id: number
  closed: boolean
  closed_at: string | null
  created_at: string
}

export function ListingForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    condition: '',
    starting_price: 0,
    minimum_increment: 0.01,
    closing_time: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const closingTime = new Date(form.closing_time).toISOString()
    const response = await fetch('/api/v1/listings', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        closing_time: closingTime,
      }),
    })
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      alert(errorBody.detail || 'Failed to create listing')
      return
    }
    onSuccess()
    setForm({
      title: '',
      description: '',
      condition: '',
      starting_price: 0,
      minimum_increment: 0.01,
      closing_time: '',
    })
  }

  return (
    <section className="listing-form-page">
      <div className="page-width">
        <h1>Create a New Listing</h1>

        <form
          className="listing-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                defaultValue={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value.trim() })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                defaultValue={form.description || ''}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value.trim() || '' })
                }
                placeholder="What are you auctioning?"
                rows={4}
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <input
                id="condition"
                defaultValue={form.condition || ''}
                onChange={(e) =>
                  setForm({ ...form, condition: e.target.value.trim() })
                }
                placeholder="New, Like new, Used, etc."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="starting_price">Starting Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.starting_price}
                  onChange={(e) =>
                    setForm({ ...form, starting_price: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="minimum_increment">Minimum Increment</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.minimum_increment}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minimum_increment: parseFloat(e.target.value) || 0.01,
                    })
                  }
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="closing_time">Closing Time</label>
              <input
                id="closing_time"
                type="datetime-local"
                value={form.closing_time}
                onChange={(e) =>
                  setForm({ ...form, closing_time: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="button button--primary"
            >
              Create Listing
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export function ListingPage() {
  const navigate = useNavigate()
  const params = useParams()
  const listingIdParam = params.listingId
  const listingId = listingIdParam ? parseInt(listingIdParam, 10) : undefined

  // If listingId is provided, show the details; otherwise, show the creation form
  if (listingId && listingId > 0) {
    // Fetch the listing details
    const [listing, setListing] = useState<Listing | null>(null)
    const [isError, setIsError] = useState(false)
    const [isPending, setIsPending] = useState(false)

    useEffect(() => {
      setIsPending(true)
      fetch(`/api/v1/listings/${listingId}`, {
        credentials: 'include',
      })
        .then((res) => {
          if (!res.ok) {
            setIsError(true)
            throw new Error('Failed to load listing')
          }
          return res.json()
        })
        .then((data) => {
          setListing(data as Listing)
          setIsPending(false)
        })
        .catch((err) => {
          console.error(err)
          setIsError(true)
          setIsPending(false)
          navigate('/')
        })
    }, [listingId])

    if (isPending) {
      return <p>Loading listing…</p>
    }

    if (isError) {
      return (
        <p>
          Failed to load listing.{' '}
          <button onClick={() => window.location.reload()}>{'Retry'}</button>
        </p>
      )
    }

    if (!listing) {
      return <p>Listing not found.</p>
    }

    return (
      <main className="listing-page">
        <h1>{listing.title}</h1>

        <section className="listing-details">
          <p><strong>Description:</strong> {listing.description || 'N/A'}</p>
          <p>
            <strong>Condition:</strong> {listing.condition || 'N/A'}
          </p>
          <p>
            <strong>Starting Price:</strong> {listing.starting_price}
          </p>
          <p>
            <strong>Minimum Increment:</strong> {listing.minimum_increment}
          </p>
          <p>
            <strong>Closed:</strong> {listing.closed ? 'Yes' : 'No'}
          </p>
          {listing.closed_at !== null && listing.closed_at !== undefined && (
            <p><strong>Closed at:</strong> {listing.closed_at}</p>
          )}
          <p><strong>Created at:</strong> {listing.created_at}</p>
        </section>

        {/* Seller-only actions */}
        {listing.seller_id !== undefined && listing.closed === false && (
          <section className="listing-actions">
            <button
              onClick={() =>
                navigate(`/listings/${listingId}/edit`)
              }
            >
              Edit
            </button>
            <button
              onClick={() =>
                navigate(`/listings/${listingId}/cancel`)
              }
              style={{ marginLeft: '10px', backgroundColor: '#ff4d4d' }}
            >
              Cancel
            </button>
          </section>
        )}
      </main>
    )
  }

  // Show the creation form
  return (
    <section className="listing-form-page">
      <div className="page-width">
        <h1>Create a New Listing</h1>

        <ListingForm onSuccess={() => navigate('/')} />
      </div>
    </section>
  )
}