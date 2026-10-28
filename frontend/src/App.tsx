import { Link, Route, Routes } from 'react-router-dom'
import { HealthStatus } from './components/HealthStatus'
import { AccountPage } from './features/auth/AccountPage'
import { AuthenticationLinks, ProtectedRoute } from './features/auth/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { LandingPage } from './features/landing/LandingPage'
import { PlaceholderPage } from './routes/PlaceholderPage'

function SiteLayout() {
  return (
    <div className="site-shell">
      <header className="site-header page-width">
        <Link className="brand" to="/" aria-label="Campus Auction home">
          <span className="brand-mark" aria-hidden="true">ca</span>
          <span>
            campus<span className="brand-name-light">auction</span>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link to="/auctions">Explore</Link>
          <a href="/#how-title">How it works</a>
        </nav>
        <div className="header-actions">
          <HealthStatus />
          <AuthenticationLinks />
        </div>
      </header>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route
          path="/auctions"
          element={
            <PlaceholderPage
              feature="Auctions"
              description="There are no live auctions in this Phase 0 foundation. Browse, search and bid will arrive in a later phase."
            />
          }
        />
        <Route
          path="/sell"
          element={
            <PlaceholderPage
              feature="Item listings"
              description="Creating listings is not available yet. Seller tools will be added in a later phase."
            />
          }
        />
        <Route
          path="*"
          element={
            <PlaceholderPage
              feature="This page"
              description="The page you’re looking for isn’t part of this first release."
            />
          }
        />
      </Routes>

      <footer className="site-footer page-width">
        <Link className="brand brand--footer" to="/">
          <span className="brand-mark" aria-hidden="true">ca</span>
          <span>
            campus<span className="brand-name-light">auction</span>
          </span>
        </Link>
        <p>A campus-first idea, built one good exchange at a time.</p>
        <span>Phase 0 · Foundation</span>
      </footer>
    </div>
  )
}

export default function App() {
  return <SiteLayout />
}
