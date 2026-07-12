# Task & Project Progress Tracker

A full-stack, containerized web application for assigning, tracking, and reporting on tasks across teams.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

App available at: http://localhost

## Project Structure

```
Progress_Tracker/
├── docs/                        # Requirements & design documents
│   └── PRD-TPT-2026-001.html    # Phase 1 Product Requirements Document
├── backend/                     # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/              # App config, env validation
│   │   ├── middleware/          # Auth, RBAC, error handler, logger
│   │   └── modules/             # Feature modules (auth, users, projects, tasks…)
│   ├── prisma/                  # Schema + migrations + seed
│   ├── openapi.yaml             # API spec, served at /api/docs
│   └── tests/                   # Unit + integration tests
├── frontend/                    # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/          # Shared UI components
│   │   ├── pages/               # Route-level page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client functions
│   │   ├── store/               # Zustand global state
│   │   └── types/               # Shared TypeScript types
│   └── tests/e2e/               # Playwright smoke tests
├── nginx/                       # Reverse proxy config
├── docker-compose.yml           # Full environment orchestration
├── docker-compose.dev.yml       # Dev overrides (hot reload, exposed ports)
└── .env.example                 # Required environment variables
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Query |
| Backend | Node.js 20, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Proxy | Nginx Alpine |
| Containers | Docker Compose v2 |

## Development

Backend commands that need devDependencies (tests, seeding, Prisma CLI) must
go through the **dev override** — the base `docker-compose.yml` builds the
lean production image, which has no devDependencies and can't run them.

```bash
# Start backend with hot reload (tsx watch, bind-mounted src/tests)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d backend

# Run backend tests (unit + integration)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test

# Run backend tests with coverage
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test -- --coverage

# Seed demo data (admin/pm/2 members/viewer — see backend/prisma/seed.ts)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed

# Run Prisma migrations manually
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma migrate dev

# Open Prisma Studio (DB browser)
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npx prisma studio
```

Frontend hot-reload isn't wired up yet (see the note in `docker-compose.dev.yml`)
— `docker compose up --build` rebuilds the frontend into the `nginx` image
after edits. E2E smoke tests run against the built app, not the dev server:

```bash
cd frontend
npm run test:e2e            # requires the stack running at localhost:8080
```

## API Documentation

Interactive API docs (Swagger UI) are served at `/api/docs` once the stack is
running — e.g. http://localhost:8080/api/docs. Source spec:
[`backend/openapi.yaml`](backend/openapi.yaml).

## Demo Accounts

Seeded via `backend/prisma/seed.ts` (see `db:seed` above):

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin1234 |
| PM | pm@example.com | Manager1234 |
| Member | dev1@example.com | Member1234 |
| Member | dev2@example.com | Member1234 |
| Viewer | viewer@example.com | Viewer1234 |

## Environment Variables

See `.env.example` for all required variables. Never commit `.env`.

## Phases

| Phase | Status | Description |
|---|---|---|
| P1 — Core | Complete | Auth, Clients, Users, Teams, Projects, Engagement, Tasks, Dashboards, hardening (tests/security/OpenAPI/CI) |
| P2 — Visibility | Planned | Workload view, engagement heat-map, Gantt |
| P3 — Reporting | Planned | PDF export, email digest, Slack integration |

## Documentation

- [Product Requirements Document](docs/PRD-TPT-2026-001.html) — Phase 1 full spec
- [OpenAPI spec](backend/openapi.yaml) — also browsable at `/api/docs`
