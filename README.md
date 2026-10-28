# Campus Auction

Phase 0 establishes the web application and API foundation for a student-first
campus marketplace. The landing page, API health check, PostgreSQL connection
readiness check, and migration scaffolding are available. Auctions, accounts,
listings, bidding, and other marketplace workflows are intentionally not
implemented in this phase.

## Prerequisites

- Node.js 22.12 or newer and npm.
- Python 3.11 or newer.
- PostgreSQL 16 or newer. Docker Desktop is optional if you already have a
  local PostgreSQL server.

## Environment configuration

The project-root `.env` is present locally but ignored by Git. It contains
placeholders, not usable credentials: replace its database password with your
local PostgreSQL password before starting the API, and keep the connection
URL's username, password, host, port, and database name in sync with the
PostgreSQL settings. For a fresh checkout, create it from `.env.example`:

```powershell
Copy-Item .env.example .env
```

`CORS_ALLOWED_ORIGINS` is a comma-separated list of browser origins. The
default allows the Vite development server at `http://localhost:5173`.
`VITE_API_BASE_URL` configures the frontend API origin and defaults to
`http://localhost:8000`.

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

The initial revision intentionally creates no domain tables. SQLAlchemy's
`Base.metadata` and Alembic's autogeneration wiring are in place for domain
models added in their relevant phases. To render the empty initial migration
as SQL without connecting to a database, run:

```powershell
alembic upgrade --sql head
```

## Tests and checks

From `backend/`, with the virtual environment active:

```powershell
python -m pytest
```

From `frontend/`:

```powershell
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
