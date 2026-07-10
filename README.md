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
│   ├── prisma/                  # Schema + migrations
│   └── tests/                   # Unit + integration tests
├── frontend/                    # React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── components/          # Shared UI components
│       ├── pages/               # Route-level page components
│       ├── hooks/               # Custom React hooks
│       ├── services/            # API client functions
│       ├── store/               # Zustand global state
│       └── types/               # Shared TypeScript types
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

```bash
# Start all services with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run backend tests
docker compose exec backend npm test

# Run Prisma migrations manually
docker compose exec backend npx prisma migrate dev

# Open Prisma Studio (DB browser)
docker compose exec backend npx prisma studio
```

## Environment Variables

See `.env.example` for all required variables. Never commit `.env`.

## Phases

| Phase | Status | Description |
|---|---|---|
| P1 — Core | In Progress | Auth, Users, Teams, Projects, Tasks, Dashboard |
| P2 — Visibility | Planned | Workload view, engagement heat-map, Gantt |
| P3 — Reporting | Planned | PDF export, email digest, Slack integration |

## Documentation

- [Product Requirements Document](docs/PRD-TPT-2026-001.html) — Phase 1 full spec
