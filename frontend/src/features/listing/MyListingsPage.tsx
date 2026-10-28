import { useEffect, useState } from 'react'
import { useCurrentUser } from '../auth/auth'

const MyListingsPage: React.FC = () => {
  const { data: currentUser, isPending, isError } = useCurrentUser()
  const [listings, setListings] = useState<Array<{
    id: number
    title: string
    category: string | null
    description: string | null
    condition: string | null
    price_cents: number
    starting_price: number
    minimum_increment: number
    closed: boolean
    closed_at: string | null
    created_at: string
    photos: string[]
  }>>([])

  useEffect(() => {
    if (isPending) return
    if (isError || !currentUser?.id) {
      setListings([])
      return
    }

    const userId = currentUser.id
    fetch(`/api/v1/listings/mine?userId=${userId}`, {
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch listings')
        return res.json()
      })
      .then((data: any) => setListings(data))
      .catch(() => setListings([]))
  }, [currentUser])

  if (isPending) return <p>Loading listings…</p>
  if (isError || !currentUser?.id) return <p>Log in to view your listings.</p>

  return (
    <section className="my-listings-page">
      <h2>My Listings</h2>
      {listings.length === 0 ? (
        <p>You have no listings yet. <a href="/listings/create">Create one</a>.</p>
      ) : (
        <div className="listings-grid">
          {listings.map((l) => {
            const editUrl = '/listings/' + l.id + '/edit'
            const cancelUrl = '/listings/' + l.id + '/cancel'
            return (
              <div key={l.id} className="listing-card">
                <h3>{l.title}</h3>
                <p><strong>Category:</strong> {l.category || 'N/A'}</p>
                <p><strong>Price (cents):</strong> {l.price_cents}</p>
                <p><strong>Condition:</strong> {l.condition || 'N/A'}</p>
                {l.photos.length > 0 && (
                  <div className="photo-grid">
                    {l.photos.map((p, i) => (
                      <img
                        key={i}
                        src={('/uploads/' + p)}
                        alt={l.title}
                        className="listing-thumb"
                      />
                    ))}
                  </div>
                )}
                <p><strong>Status:</strong> {l.closed ? 'Closed' : 'Active'}</p>
                {l.closed === false && (
                  <>
                    <a href={editUrl}>Edit</a>
                    <a
                      href={cancelUrl}
                      style={{ color: '#ff4d4d' }}
                    >
                      Cancel
                    </a>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default MyListingsPage