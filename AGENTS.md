# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

BusPulse is a bus arrival prediction system for regions without GPS tracking. It uses schedule-based logic with route geometry and ETA calculations. The system has three user roles: ADMIN, BUS_SCHEDULER, and USER (enforced via PostgreSQL CHECK constraint on `users.role`).

## Monorepo Structure

- `frontend/` — React (Vite) SPA with Tailwind CSS
- `backend/` — Node.js + Express API (ESM modules throughout, `"type": "module"`)
- `data-prep/` — Python scripts for geocoding and preparing place/route CSV data
- `backend/src/config/buspulse-schema.sql` — PostgreSQL schema (UTF-16LE encoded)

## Development Commands

### Backend (from `backend/`)
- `npm run dev` — Start with nodemon (hot reload)
- `npm start` — Production start (`node src/app.js`)
- `node src/checkSetup.js` — Verify env vars, DB connection, schema, and seed data
- `node src/scripts/createAdmin.js` — Create initial admin user
- `node src/scripts/import_data.js` — Import route/service data from CSVs

### Frontend (from `frontend/`)
- `npm run dev` — Vite dev server (default port 5173)
- `npm run build` — Production build
- `npm run lint` — ESLint (flat config, JS/JSX only)
- `npm run preview` — Preview production build

### No test suites exist yet. The backend `npm test` is a placeholder that exits with error.

## Backend Architecture

The backend follows a layered pattern: **routes → controllers → services → repositories → db**.

- **`src/app.js`** — Express app setup, middleware, route mounting, and server start (single entry point)
- **`src/config/config.js`** — Centralized config from env vars with defaults (DB, OSRM, Nominatim, ETA thresholds, CORS)
- **`src/config/db.js`** — PostgreSQL connection pool (`pg` library, NOT Mongoose despite README mentioning MongoDB)
- **`src/middleware/auth.middleware.js`** — JWT auth with three middleware exports: `verifyAdminToken`, `verifySchedulerToken`, `verifyToken`
- **`src/repositories/`** — Raw SQL queries against PostgreSQL (Haversine for geo-queries)
- **`src/services/`** — Business logic including ETA calculation, route matching, distance (Haversine), and OSRM/Nominatim integration
- **`src/utils/`** — JWT helpers and email service (nodemailer)

### Database (PostgreSQL, not MongoDB)
Tables: `places`, `routes`, `services`, `route_geometry`, `eta_cache`, `users`
- `route_geometry.geometry` stores JSONB arrays of `{lat, lng}` points
- `routes` references `places` via `from_place_id` / `to_place_id`
- `services` references `routes` and stores `departure_time` (time type)

### Key API Routes
- `POST /api/buses/upcoming` — Core endpoint: finds buses near user location with ETAs
- `/auth/admin/*` and `/auth/user/*` — Authentication (JWT-based)
- `/api/admin/users` and `/api/admin/schedulers` — Admin CRUD (protected by `verifyAdminToken`)
- `/api/places/search` — Place search

### ETA Pipeline (core domain logic)
1. `upcomingBusesService` fetches services departing within a time window
2. `routeMatcher` filters to routes passing near the user (configurable `proximityThresholdMeters`, default 500m)
3. `etaService.calculateETA` estimates arrival using route geometry position ratio and assumed 24 km/h average speed
4. Results are sorted by ETA and return confidence levels (HIGH/MEDIUM/LOW) and statuses (NEARBY/APPROACHING/EN_ROUTE/PASSED/NOT_DEPARTED)

## Frontend Architecture

- **`src/App.jsx`** — React Router v7 with two route trees: public user routes (`/`) and protected admin routes (`/admin/*`)
- **`src/config/api.js`** — Centralized API client using `fetch` with Bearer token from `localStorage`. All API modules exported from here.
- **`src/pages/UserFlow.jsx`** — Multi-step user flow: LocationGate → LocationPreview → UpcomingBuses → HomePage (state machine via `step` state)
- **`src/pages/admin/AdminLayout.jsx`** — Admin shell with Sidebar + Navbar; child routes rendered via `<Outlet />`
- **`src/components/ProtectedRoute.jsx`** — Guards admin routes by checking auth state

### Frontend talks to backend via `VITE_API_BASE_URL` env var (defaults to `http://localhost:5000`).

## Environment Variables

### Backend (`backend/.env`)
Required: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `JWT_SECRET`
Optional: `CORS_ORIGIN`, `OSRM_BASE_URL`, `NOMINATIM_BASE_URL`, `MAX_ETA_MINUTES`, `DEFAULT_PROXIMITY_THRESHOLD_METERS`, `CACHE_TTL_SECONDS`

### Frontend (`frontend/.env`)
`VITE_API_BASE_URL` — Backend API URL

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on push/PR to `main`: installs deps and builds frontend. Uses Node.js 22. No backend tests or lint steps in CI.

## Important Notes

- The README says MongoDB but the actual database is **PostgreSQL** — all queries use `pg` Pool with raw SQL.
- Both `bcrypt` and `bcryptjs` are installed as dependencies; check which is actually used before adding auth code.
- The backend uses ES modules (`import`/`export`) — all file imports must include the `.js` extension.
- `data-prep/` scripts are standalone Python (not part of the Node.js build) and produce CSVs consumed by `backend/src/scripts/import_data.js`.
- Several frontend pages (`EtaResultPage.jsx`, `RouteSearchPage.jsx`) and layouts (`BaseLayout.jsx`, `Header.jsx`, `Footer.jsx`) are empty placeholder files (0 bytes).
