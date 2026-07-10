# Implementation Plan — Phase 1

## Milestone Breakdown

### M1 — Foundation (Weeks 1–2)
- [ ] Backend: package.json, tsconfig, Express app skeleton
- [ ] Backend: Prisma schema — all 9 entities (User, Client, Team, TeamMember, Project, ProjectEngagement, Task, TaskAssignment, AuditLog, Notification)
- [ ] Backend: Auth module (register, login, refresh, logout)
- [ ] Backend: JWT middleware + RBAC guard
- [ ] Backend: Client CRUD API
- [ ] Frontend: Vite + React + Tailwind scaffold
- [ ] Frontend: Login + Register pages
- [ ] Docker: All 5 services running via `docker compose up`

### M2 — Core CRUD (Weeks 3–4)
- [ ] Backend + Frontend: User management (CRUD, roles, profile)
- [ ] Backend + Frontend: Team management
- [ ] Backend + Frontend: Project CRUD with CLIENT/INTERNAL category + client_id linking
- [ ] Backend + Frontend: ProjectEngagement — assign employees with %, compute total engagement per user
- [ ] Backend + Frontend: Task CRUD + subtasks (INTERNAL projects only)
- [ ] Backend + Frontend: TaskAssignment + engagement % at task level
- [ ] Backend: Status workflow state machine (INTERNAL only)

### M3 — Dashboards & Visibility (Weeks 5–6)
- [ ] Frontend: Admin dashboard — company capacity, per-employee engagement bars (client teal / internal purple), over/under badges
- [ ] Frontend: PM dashboard — CLIENT engagement roster + INTERNAL task progress
- [ ] Frontend: Member dashboard — my engagements (client + internal) + my tasks unified
- [ ] Frontend: Viewer dashboard — read-only project health
- [ ] Frontend: Progress tracking UI (slider, status transitions)
- [ ] Backend + Frontend: Audit log + activity feed
- [ ] Backend + Frontend: In-app notifications
- [ ] Frontend: Search + filter (tasks, projects, by category)

### M4 — Hardening (Weeks 7–8)
- [ ] Tests: Unit tests ≥ 70% service coverage
- [ ] Tests: E2E smoke tests (Playwright)
- [ ] Security: Rate limiting, input sanitization, CORS
- [ ] Docs: OpenAPI/Swagger spec
- [ ] CI: GitHub Actions (lint → test → build → docker push)
- [ ] Repo: README, .env.example, contribution guide

## File Creation Order (M1)

1. `backend/package.json`
2. `backend/tsconfig.json`
3. `backend/prisma/schema.prisma`
4. `backend/src/config/env.ts`
5. `backend/src/app.ts`
6. `backend/src/server.ts`
7. `backend/src/middleware/auth.ts`
8. `backend/src/middleware/rbac.ts`
9. `backend/src/middleware/errorHandler.ts`
10. `backend/src/modules/auth/auth.routes.ts`
11. `backend/src/modules/auth/auth.service.ts`
12. `backend/src/modules/auth/auth.controller.ts`
13. `backend/Dockerfile`
14. `frontend/package.json`
15. `frontend/vite.config.ts`
16. `frontend/src/main.tsx`
17. `frontend/src/App.tsx`
18. `frontend/Dockerfile`
