# Campus Auction

Phase 0 establishes the web application and API foundation; Phase 1 adds
student registration, login, short-lived JWT sessions, and a protected account
profile. Auctions, listings, bidding, and other marketplace workflows are
intentionally not implemented yet.

## Prerequisites

- Node.js 22.12 or newer and npm.
- Python 3.11 or newer.
- PostgreSQL 16 or newer. Docker Desktop is optional if you already have a
  local PostgreSQL server.

## Environment configuration

The project-root `.env` is local and ignored by Git. Keep database credentials
and `DATABASE_URL` in sync. For a fresh checkout, create it from
`.env.example`, then replace all placeholder passwords and generate a random
`JWT_SECRET_KEY`:

```powershell
Copy-Item .env.example .env
```

`CORS_ALLOWED_ORIGINS` is a comma-separated list of browser origins. The
default allows the Vite development server at `http://localhost:5173`.
`VITE_API_BASE_URL` configures the frontend API origin and defaults to
`http://localhost:8000`. Configure `JWT_SECRET_KEY` as a random secret of at
least 32 characters. `AUTH_COOKIE_SECURE=false` is for local HTTP only; use
HTTPS and `AUTH_COOKIE_SECURE=true` for a deployment. See
[docs/SESSION_SECURITY.md](./docs/SESSION_SECURITY.md) for the JWT, cookie, and
CSRF design.

## Start PostgreSQL

With Docker Desktop running, start the persistent local database from the
project root:

```powershell
docker compose up -d db
docker compose ps
```

The database health check uses `pg_isready`; its data is stored in the named
`campus_auction_postgres_data` volume. To stop the service without deleting
data, run `docker compose down`. Do not use `docker compose down -v` unless you
intend to remove the local database volume.

Alternatively, start a local PostgreSQL 16+ service and set `DATABASE_URL` to
its connection URL.

## Install and start the backend

From the project root, create a virtual environment and install the backend
dependencies:

```powershell
Set-Location backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

If PowerShell blocks activation for this terminal, run
`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` and activate
the environment again. Start the development API from `backend/`:

```powershell
python -m uvicorn app.main:app --reload
```

The service listens at `http://localhost:8000`. Interactive development API
documentation is available at `http://localhost:8000/docs`.

## Install and start the frontend

In a second terminal, from the project root:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The header's status
indicator checks the API health endpoint; it does not imply database readiness.
The browse and listing routes clearly identify themselves as unavailable until
their later implementation phases.

## Database migrations

With PostgreSQL running, the backend virtual environment active, and `.env`
configured, run from `backend/`:

```powershell
alembic upgrade head
```

The initial revisions create the migration version table and student `users`
table. SQLAlchemy's metadata and Alembic autogeneration wiring are in place for
later domain models. To render migrations as SQL without connecting to a
database, run:

```powershell
alembic upgrade --sql head
```

## Tests and checks

From `backend/`, with the virtual environment active:

```powershell
python -m pytest
```

Authentication integration tests use a separate PostgreSQL database whose
name ends in `_test`. Create it once and apply the migrations before testing:

```powershell
Set-Location backend
createdb -h localhost -U postgres campus_auction_test
$env:TEST_DATABASE_URL = (Get-Content ..\.env | Where-Object { $_ -match '^TEST_DATABASE_URL=' }) -replace '^TEST_DATABASE_URL=', ''
$env:DATABASE_URL = $env:TEST_DATABASE_URL
alembic upgrade head
python -m pytest
```

In the test terminal, ensure the backend `.venv` is active. The root `.env`
stores the test connection URL so tests can also read it directly; the
environment variable shown above is an alternative. Authentication tests
delete their test users after each test and refuse to run against a database
whose name does not end in `_test`.

From `frontend/`:

```powershell
npm test
npm run typecheck
npm run build
```

The readiness endpoint returns HTTP 503 when `DATABASE_URL` is unset or the
database cannot be reached. Verify it returns HTTP 200 after PostgreSQL is
running and the configured credentials are valid:

```powershell
Invoke-RestMethod http://localhost:8000/api/v1/health
Invoke-RestMethod http://localhost:8000/api/v1/health/ready
```

Authentication endpoints are `POST /api/v1/auth/register`,
`POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and
`POST /api/v1/auth/logout`. Registration requires a valid email and a
12–128-character password and navigates to sign-in. Login sets an HttpOnly,
short-lived session cookie. The account route is frontend-protected, and the
API independently enforces authentication on `/me`. Logout requires the CSRF
header associated with the readable CSRF cookie.

## Troubleshooting

- **Port 5432 is already in use:** stop the other PostgreSQL service, or change
  the host-side port in `docker-compose.yml` and update `DATABASE_URL` to match.
- **Database readiness returns 503:** confirm PostgreSQL is accepting
  connections, `.env` is in the project root, and `DATABASE_URL` matches the
  database name, user, password, host, and port. The response intentionally
  does not expose connection details.
- **CORS blocks the frontend:** add the exact frontend origin (including scheme
  and port) to `CORS_ALLOWED_ORIGINS`, restart the backend, and reload the page.
- **The API indicator says unavailable:** make sure the backend is listening
  at `VITE_API_BASE_URL` and that the browser's origin is permitted by CORS.
- **Docker commands cannot connect:** start Docker Desktop and wait for its
  engine before running `docker compose`.
- **PowerShell cannot activate the virtual environment:** set the execution
  policy for the current process as described above, or invoke
  `.\.venv\Scripts\python.exe` directly instead of activating it.

## GitHub remote

This workspace had no existing Git repository or configured GitHub remote; a
local repository on the `main` branch is now initialized. After creating a
public GitHub repository, connect it from the project root with:

```powershell
git remote add origin https://github.com/<OWNER>/<REPOSITORY>.git
```

Replace both placeholders with the owner and repository name. No remote or
push is claimed until GitHub repository details and credentials are available.
