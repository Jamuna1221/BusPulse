# BusPulse — Project Progress Report
### Mentor Sign-Off Document | March 2026

---

> **Project:** BusPulse — Bus Arrival Prediction System for Regions Without GPS Tracking  
> **Repository:** `Jamuna1221/BusPulse`  
> **Stack:** React (Vite) + Node.js (Express) + PostgreSQL  
> **Date:** March 26, 2026  

---

## 📋 Executive Summary

BusPulse is a full-stack bus arrival prediction platform designed for rural and semi-urban regions where GPS devices are unavailable. Instead of relying on live GPS data, the system uses **schedule-based logic combined with route geometry and realistic physics-based ETA calculations** (accounting for avg. bus speed, stop dwell time, and route distance) to estimate when a bus will arrive at a user's current location.

The system serves **three distinct user roles** — End Users, Bus Schedulers, and Administrators — each with a fully dedicated frontend portal and protected backend API.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                │
│  ┌───────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ User App  │  │ Scheduler    │  │  Admin Panel     │  │
│  │  /        │  │  Portal      │  │  /admin/*        │  │
│  │  /user/*  │  │  /scheduler/*│  │                  │  │
│  └───────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST (Bearer JWT)
┌────────────────────────▼────────────────────────────────┐
│             BACKEND (Node.js + Express, ESM)             │
│  Routes → Controllers → Services → Repositories → DB    │
│                                                          │
│  Auth │ ETA Engine │ Places │ Scheduler CRUD │ Dashboard │
└────────────────────────┬────────────────────────────────┘
                         │ pg Pool (raw SQL)
┌────────────────────────▼────────────────────────────────┐
│                   PostgreSQL Database                    │
│  users │ places │ routes │ services │ route_geometry     │
│  eta_cache │ activity_logs │ saved_places               │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend Framework | React 18 + Vite | SPA with React Router v7 |
| Styling | Tailwind CSS | Utility-first responsive design |
| State/Context | React Context API | `UserAuthContext`, Scheduler auth |
| Backend Framework | Node.js + Express | ESM modules (`"type": "module"`) |
| Database | PostgreSQL | Raw SQL via `pg` pool, NO ORM |
| Authentication | JWT (jsonwebtoken) | Role-based, 7-day / 30-day expiry |
| Password Hashing | bcryptjs | Salt rounds = 10 |
| Google OAuth | google-auth-library + @react-oauth/google | ID token verification |
| Email | nodemailer | OTP delivery for signup |
| Geo Distance | Custom Haversine | Inline SQL + JS implementation |
| Route Matching | Custom proximity filter | 2km threshold for route geometry |
| CI | GitHub Actions | Build check on push to `main` |

---

## 📊 Database Schema Summary

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | `id`, `name`, `email`, `password_hash`, `role` (ADMIN/BUS_SCHEDULER/USER), `google_id`, `otp_hash`, `is_first_login`, `last_seen` | All 3 user roles in one table — enforced by CHECK constraint |
| `places` | `id`, `name`, [lat](file:///d:/BusPulse/backend/src/services/etaService.js#61-163), `lng` | Named geographic stops/cities |
| `routes` | `id`, `route_no`, `from_place_id`, `to_place_id`, `distance_km`, `stop_names[]`, `is_active` | Bus routes between places |
| `services` | `id`, `route_id`, `departure_time`, `bus_number` | Scheduled departures (one service = one bus trip) |
| `route_geometry` | `route_id`, `geometry (JSONB [{lat,lng}])` | Ordered lat/lng polyline for the route |
| `eta_cache` | `service_id`, `user_lat`, `user_lng`, `eta_minutes`, `cached_at` | Optional ETA caching layer |
| `activity_logs` | `id`, `scheduler_id`, `action`, `entity_type`, `details`, `created_at` | Audit trail for scheduler actions |
| `saved_places` | `id`, `user_id`, `label`, `name`, [lat](file:///d:/BusPulse/backend/src/services/etaService.js#61-163), `lng`, `type` | User-saved home/work/favorite locations |

---

---

## 🚀 Phase 1 — Project Foundation & Core Infrastructure

**Status:** ✅ Complete  
**Duration:** Initial setup  

### What Was Built

| Item | Details |
|---|---|
| Monorepo structure | `frontend/`, `backend/`, `data-prep/` |
| Backend bootstrapping | Express app with ESM, CORS, JSON middleware, 404 & global error handlers |
| PostgreSQL connection | `pg` pool in `config/db.js`, env-driven config in `config/config.js` |
| Environment management | `dotenv` with full config object (DB, CORS, OSRM, ETA thresholds) |
| Data preparation pipeline | Python scripts in `data-prep/` geocode place names and produce CSVs |
| Data import script | [backend/src/scripts/import_data.js](file:///d:/BusPulse/backend/src/scripts/import_data.js) loads routes, services, places from CSVs |
| Admin bootstrap script | [backend/src/scripts/createAdmin.js](file:///d:/BusPulse/backend/src/scripts/createAdmin.js) — seeded initial ADMIN user |
| Health check | `node src/checkSetup.js` verifies DB, schema, env, seed data |
| GitHub Actions CI | [.github/workflows/ci.yml](file:///d:/BusPulse/.github/workflows/ci.yml) — installs deps and builds frontend on every push to `main` |

### Backend Entry Point ([app.js](file:///d:/BusPulse/backend/src/app.js)) — Route Mounting

```
/auth/admin/*          → Admin authentication
/auth/user/*           → User authentication (email/password + Google)
/auth/scheduler/*      → Scheduler authentication
/api/admin/users       → Admin user management
/api/admin/schedulers  → Scheduler management (Admin-only)
/api/buses/*           → Public bus lookup (ETA engine)
/api/scheduler/buses   → Scheduler bus CRUD
/api/scheduler/routes  → Route management
/api/scheduler/services → Service/schedule management
/api/scheduler/activity-logs → Audit logs
/api/places            → Place search
/api/user/*            → User dashboard (saved places, activity)
```

---

## 🚀 Phase 2 — ETA Engine & Bus Prediction Core

**Status:** ✅ Complete  
**This is the core domain innovation of BusPulse.**

### The Problem It Solves

Rural Tamil Nadu buses have no GPS. Passengers have no way to know if a bus has already passed or how long until it arrives.

### ETA Calculation Algorithm

The ETA engine is located in [backend/src/services/etaService.js](file:///d:/BusPulse/backend/src/services/etaService.js) and implements a **physics-based 5-step pipeline**:

#### Step 1 — Candidate Fetch ([upcomingBusesService.js](file:///d:/BusPulse/backend/src/services/upcomingBusesService.js))
Fetches services from DB that:
- Departed up to **3 hours ago** (may still be en-route)
- Will depart in the **next 60 minutes**

#### Step 2 — Route Proximity Filter ([routeMatcher.js](file:///d:/BusPulse/backend/src/services/routeMatcher.js))
For each candidate service, checks whether the user's GPS location is within **2km of any point** on the route geometry polyline.
- Uses **Haversine formula** for great-circle distance
- Rejects routes that don't pass near the user

#### Step 3 — ETA Calculation ([etaService.js](file:///d:/BusPulse/backend/src/services/etaService.js))

**Before departure:**
- Only shown if user is within 2km of the departure city
- ETA = minutes until scheduled departure

**After departure (en-route):**
```

Bus position = Elapsed minutes × 0.3 km/min − stop dwell time
                where: avg speed = 18 km/h (realistic, not 24 km/h)
                       stop every 5km = 2 min dwell per stop
```
- User's position mapped onto route polyline using closest-point projection
- ETA = realistic travel time from estimated bus position to user's position

#### Step 4 — Confidence & Status Classification

| Condition | Status |
|---|---|
| ETA ≤ 5 min | `NEARBY` |
| ETA ≤ 15 min | `APPROACHING` |
| ETA > 15 min | `EN_ROUTE` |
| Bus already passed | `PASSED` |
| Before departure near origin | `NOT_DEPARTED` |

| Distance from Route | Confidence |
|---|---|
| < 500m | `HIGH` |
| < 1000m | `MEDIUM` |
| ≥ 1000m | `LOW` |

#### Step 5 — Output (≤ 30 min ETA filter)
Only buses arriving within 30 minutes are shown. Results are sorted ascending by ETA.

### Frontend — User Flow Pages

| Page | Description |
|---|---|
| [LocationGate.jsx](file:///d:/BusPulse/frontend/src/pages/LocationGate.jsx) | Requests browser geolocation permission |
| [LocationPreview.jsx](file:///d:/BusPulse/frontend/src/pages/LocationPreview.jsx) | Shows user's detected GPS coordinates on a map |
| [ManualLocation.jsx](file:///d:/BusPulse/frontend/src/pages/ManualLocation.jsx) | Manual lat/lng entry fallback (18,833 bytes — fully featured) |
| [UpcomingBuses.jsx](file:///d:/BusPulse/frontend/src/pages/UpcomingBuses.jsx) | Main bus list with ETA, status badges, route display, and Track modal (route geometry map) |
| [UserFlow.jsx](file:///d:/BusPulse/frontend/src/pages/UserFlow.jsx) | State machine: `LocationGate → LocationPreview → UpcomingBuses → HomePage` |

### Key API Endpoint
```
POST /api/buses/upcoming
Body: { lat, lng, maxMinutes? }
Response: [{
  serviceId, routeNo, from, to, departureTime,
  eta, distance, status, confidence, routeGeometry
}]
```

---

## 🚀 Phase 3 — Admin Panel & Multi-Role Authentication

**Status:** ✅ Complete

### Authentication System ([auth.service.js](file:///d:/BusPulse/backend/src/services/auth.service.js))

Three completely separate auth flows share one `users` table with a `role` CHECK constraint:

#### Admin Login
- Email + password (bcryptjs)
- JWT with `id`, `email`, `role`, `name` — 7-day expiry
- Guards: `verifyAdminToken` middleware

#### Scheduler Login
- Email + bcrypt password
- Tracks `is_first_login` (must change password on first login)
- Returns `email_verified` status
- Guards: `verifySchedulerToken` middleware

#### User Signup (2-Step OTP)
1. **Step 1** — Creates account, hashes OTP (6-digit), sends via email (nodemailer), 10-min expiry
2. **Step 2** — Verifies OTP hash, clears OTP, marks `email_verified = true`, issues 30-day JWT

#### User Google OAuth
- Verifies Google ID token via `google-auth-library OAuth2Client`
- Upserts user on `email` conflict (existing accounts linked)
- Issues 30-day JWT

### Admin Frontend Portal (`/admin/*`)

| Page | Functionality |
|---|---|
| [AdminDashboard.jsx](file:///d:/BusPulse/frontend/src/pages/admin/AdminDashboard.jsx) | Stats overview (users, buses, schedulers, alerts) |
| [Users.jsx](file:///d:/BusPulse/frontend/src/pages/admin/Users.jsx) | Full CRUD: create, view, activate/deactivate users (25KB) |
| [busSchedulers.jsx](file:///d:/BusPulse/frontend/src/pages/admin/busSchedulers.jsx) | Full CRUD: create scheduler accounts, reset passwords (25KB) |
| [BusManagement.jsx](file:///d:/BusPulse/frontend/src/pages/admin/BusManagement.jsx) | Bus fleet management |
| [Analytics.jsx](file:///d:/BusPulse/frontend/src/pages/admin/Analytics.jsx) | Usage analytics and charts |
| [Alerts.jsx](file:///d:/BusPulse/frontend/src/pages/admin/Alerts.jsx) | System alert management |
| [IncidentManagement.jsx](file:///d:/BusPulse/frontend/src/pages/admin/IncidentManagement.jsx) | Incident tracking and resolution |
| [Feedback.jsx](file:///d:/BusPulse/frontend/src/pages/admin/Feedback.jsx) | User feedback review |
| [Reports.jsx](file:///d:/BusPulse/frontend/src/pages/admin/Reports.jsx) | Report generation |
| [Settings.jsx](file:///d:/BusPulse/frontend/src/pages/admin/Settings.jsx) | System configuration (14KB) |
| [Devices.jsx](file:///d:/BusPulse/frontend/src/pages/admin/Devices.jsx) | Device management |

### Admin Backend APIs

```
GET    /api/admin/users          → list all users
POST   /api/admin/users          → create user
PATCH  /api/admin/users/:id      → update user
DELETE /api/admin/users/:id      → deactivate user

GET    /api/admin/schedulers     → list schedulers
POST   /api/admin/schedulers     → create scheduler (auto-temp-password + email)
PATCH  /api/admin/schedulers/:id → update
DELETE /api/admin/schedulers/:id → deactivate
```

All protected by `verifyAdminToken` middleware.

---

## 🚀 Phase 4 — Scheduler Portal (Full CRUD)

**Status:** ✅ Complete

The Bus Scheduler portal (`/scheduler/*`) is the most feature-rich section, with full CRUD for routes, services, and buses.

### Scheduler Auth Flow
- First login → forced password change
- `is_first_login` flag tracked in DB
- Password change updates `last_password_change` timestamp
- Profile page shows scheduler's assigned routes

### Route Management ([schedulerRouteService.js](file:///d:/BusPulse/backend/src/services/schedulerRouteService.js) + [schedulerRouteRepository.js](file:///d:/BusPulse/backend/src/repositories/schedulerRouteRepository.js))

Full business logic with validation:
- Uniqueness check on `route_no`
- From/To place cannot be the same
- **Soft-delete** only (routes with active schedules cannot be deleted — protects ETA data integrity)
- Stop names parsed from comma-separated string or array
- `stop_names` stored as PostgreSQL `TEXT[]`

**Frontend:** [RouteManagement.jsx](file:///d:/BusPulse/frontend/src/pages/scheduler/RouteManagement.jsx) (16KB) — searchable table, add/edit modal, soft-delete with guard

### Schedule/Service Management ([schedulerServiceService.js](file:///d:/BusPulse/backend/src/services/schedulerServiceService.js))

- Links services to routes with departure times
- Validates route exists and is active before creating a service
- Bulk schedule operations supported

**Frontend:** [ScheduleManagement.jsx](file:///d:/BusPulse/frontend/src/pages/scheduler/ScheduleManagement.jsx) (26KB) — the largest component, full schedule calendar/list management

### Bus Management
- Bus fleet CRUD for schedulers
- [BusManagement.jsx](file:///d:/BusPulse/frontend/src/pages/admin/BusManagement.jsx) (16KB)

### Scheduler Dashboard
- Overview stats: total routes, active schedules, recent activity
- [SchedulerDashboard.jsx](file:///d:/BusPulse/frontend/src/pages/scheduler/SchedulerDashboard.jsx) (7.8KB)

### Activity Logs
- Every scheduler action (create/update/delete route, service, bus) is written to `activity_logs` table
- View in [ActivityLogs.jsx](file:///d:/BusPulse/frontend/src/pages/scheduler/ActivityLogs.jsx) with filters
- API: `GET /api/scheduler/activity-logs`

### Scheduler API Endpoints

```
# Routes
GET    /api/scheduler/routes         → list (searchable, filterable)
POST   /api/scheduler/routes         → create route
GET    /api/scheduler/routes/:id     → get single route
PUT    /api/scheduler/routes/:id     → update route
DELETE /api/scheduler/routes/:id     → soft-delete (guard check)

# Services/Schedules
GET    /api/scheduler/services       → list
POST   /api/scheduler/services       → create service
PUT    /api/scheduler/services/:id   → update
DELETE /api/scheduler/services/:id   → delete

# Buses
GET    /api/scheduler/buses          → list
POST   /api/scheduler/buses          → create
PUT    /api/scheduler/buses/:id      → update
DELETE /api/scheduler/buses/:id      → delete

# Activity Logs
GET    /api/scheduler/activity-logs  → paginated log view
```

---

## 🚀 Phase 5 — User Dashboard, Saved Places & Activity History

**Status:** ✅ Complete (as of March 23, 2026)

### User Dashboard (`/user/dashboard/*`)

A dedicated user-facing dashboard with 4 sections:

| Route | Page | Description |
|---|---|---|
| `/user/dashboard/overview` | [UserOverview.jsx](file:///d:/BusPulse/frontend/src/pages/dashboard/UserOverview.jsx) | Welcome summary, last search, quick stats |
| `/user/dashboard/places` | [UserSavedPlaces.jsx](file:///d:/BusPulse/frontend/src/pages/dashboard/UserSavedPlaces.jsx) | Save and manage Home/Work/Favorite locations (11KB) |
| `/user/dashboard/activity` | [UserActivity.jsx](file:///d:/BusPulse/frontend/src/pages/dashboard/UserActivity.jsx) | Scrollable history of all location searches |
| `/user/dashboard/profile` | [UserProfile.jsx](file:///d:/BusPulse/frontend/src/pages/dashboard/UserProfile.jsx) | Edit profile, change password, Google account link status |

### Saved Places Feature ([userDashboard.service.js](file:///d:/BusPulse/backend/src/services/userDashboard.service.js), [userDashboard.repository.js](file:///d:/BusPulse/backend/src/repositories/userDashboard.repository.js))

- Users can save up to unlimited named places (Home, Work, Favorite)
- **Upsert logic**: updating Home replaces the existing Home entry (no duplicates per label)
- Saved places are shown as quick-pick suggestions in the location picker (LocationGate/ManualLocation)
- Full CRUD: get, add, update, delete

```
GET    /api/user/saved-places        → list user's saved places
POST   /api/user/saved-places        → add or upsert a place
PUT    /api/user/saved-places/:id    → update label/name
DELETE /api/user/saved-places/:id    → delete
```

### Activity Logging
- Every location search is automatically logged to `saved_places_activity` / activity records
- Returns last 50 searches
- `GET /api/user/activity` — returns timestamped search history with place name, coordinates

### Auth Protection
- `UserAuthContext.jsx` — React context storing JWT token, user info, login/logout
- [UserProtectedRoute.jsx](file:///d:/BusPulse/frontend/src/components/UserProtectedRoute.jsx) — Redirects unauthenticated users to `/user/login`
- Token stored in `localStorage`, sent as `Authorization: Bearer <token>` on all API calls

---

## 📐 Middleware & Security

| Middleware | File | Purpose |
|---|---|---|
| `verifyAdminToken` | `auth.middleware.js` | Decodes JWT, checks `role === ADMIN` |
| `verifySchedulerToken` | `auth.middleware.js` | Decodes JWT, checks `role === BUS_SCHEDULER` |
| `verifyToken` | `auth.middleware.js` | Generic JWT decode (for user routes) |
| CORS | [app.js](file:///d:/BusPulse/backend/src/app.js) | Configured via `config.cors.origin` env var |
| Request logger | [app.js](file:///d:/BusPulse/backend/src/app.js) | Logs `METHOD /path body` in development mode only |
| Global error handler | [app.js](file:///d:/BusPulse/backend/src/app.js) | Catches and returns standardized error JSON |

---

## 🗂️ Complete File Inventory

### Backend (16 Services)
| Service | Responsibility |
|---|---|
| [auth.service.js](file:///d:/BusPulse/backend/src/services/auth.service.js) | Login, signup (OTP), Google OAuth for all 3 roles |
| [etaService.js](file:///d:/BusPulse/backend/src/services/etaService.js) | Core ETA calculation with physics model |
| [upcomingBusesService.js](file:///d:/BusPulse/backend/src/services/upcomingBusesService.js) | Bus search pipeline (fetch → filter → ETA → sort) |
| [routeMatcher.js](file:///d:/BusPulse/backend/src/services/routeMatcher.js) | Haversine proximity check against route geometry |
| [distanceService.js](file:///d:/BusPulse/backend/src/services/distanceService.js) | Haversine formula + closest-point-on-route algorithm |
| [schedulerRouteService.js](file:///d:/BusPulse/backend/src/services/schedulerRouteService.js) | Route CRUD business logic |
| [schedulerServiceService.js](file:///d:/BusPulse/backend/src/services/schedulerServiceService.js) | Service/schedule CRUD business logic |
| [busScheduler.service.js](file:///d:/BusPulse/backend/src/services/busScheduler.service.js) | Scheduler account management (from admin) |
| [user.service.js](file:///d:/BusPulse/backend/src/services/user.service.js) | User account management (from admin) |
| [busService.js](file:///d:/BusPulse/backend/src/services/busService.js) | Bus fleet CRUD for schedulers |
| [userDashboard.service.js](file:///d:/BusPulse/backend/src/services/userDashboard.service.js) | Saved places & activity history |
| [geocodeService.js](file:///d:/BusPulse/backend/src/services/geocodeService.js) | Nominatim geocoding integration |
| [osrmService.js](file:///d:/BusPulse/backend/src/services/osrmService.js) | OSRM routing integration (optional) |
| [segmentService.js](file:///d:/BusPulse/backend/src/services/segmentService.js) | Route segment splitting helper |
| [stopTimeEstimator.js](file:///d:/BusPulse/backend/src/services/stopTimeEstimator.js) | Per-stop time estimation |
| [csvLoader.js](file:///d:/BusPulse/backend/src/services/csvLoader.js) | CSV parsing for data import |

### Frontend Pages (34 Components)

**User Flow:**
`UserLogin`, `UserFlow`, `LocationGate`, `LocationPreview`, `ManualLocation`, [UpcomingBuses](file:///d:/BusPulse/backend/src/services/upcomingBusesService.js#14-65), `VerifyEmail`, `HomePage`

**User Dashboard:**
`UserDashboardLayout`, `UserOverview`, `UserSavedPlaces`, `UserActivity`, `UserProfile`

**Scheduler Portal:**
`SchedulerLogin`, `SchedulerLayout`, `SchedulerDashboard`, `BusManagement`, `RouteManagement`, `ScheduleManagement`, `DriverManagement`, `ReportsAnalytics`, `Notifications`, `ActivityLogs`, `SearchPage`, `ProfileSecurity`, `SchedulerNavbar`, `SchedulerSidebar`

**Admin Panel:**
`AdminLogin`, `AdminLayout`, `AdminDashboard`, `Users`, `busSchedulers`, `BusManagement`, `Analytics`, `Alerts`, `IncidentManagement`, `Feedback`, `Reports`, `Settings`, `Devices`, `Sidebar`, `Navbar`

---

## 📈 Summary of Phases

| Phase | Feature Area | Status | Key Deliverable |
|---|---|---|---|
| **1** | Foundation & Infrastructure | ✅ Done | Express app, PostgreSQL, CI pipeline, data import scripts |
| **2** | ETA Engine & Bus Prediction | ✅ Done | Schedule-based ETA with route geometry, 5-step pipeline |
| **3** | Admin Panel & Auth System | ✅ Done | 3-role JWT auth, Google OAuth, OTP signup, Admin CRUD portal |
| **4** | Scheduler Portal | ✅ Done | Full route/schedule/bus CRUD, soft-delete, audit logs |
| **5** | User Dashboard | ✅ Done | Saved places, activity history, profile management |

---

## 🔮 Known Gaps / Future Work

| Item | Status |
|---|---|
| [EtaResultPage.jsx](file:///d:/BusPulse/frontend/src/pages/EtaResultPage.jsx), [RouteSearchPage.jsx](file:///d:/BusPulse/frontend/src/pages/RouteSearchPage.jsx) | Empty placeholder files (0 bytes) |
| `BaseLayout.jsx`, `Header.jsx`, `Footer.jsx` | Empty placeholder files (0 bytes) |
| Unit / Integration tests | No test suite exists yet (`npm test` exits with error) |
| OSRM integration | Service exists ([osrmService.js](file:///d:/BusPulse/backend/src/services/osrmService.js)) but not wired into main pipeline |
| ETA Cache utilization | `eta_cache` table exists in schema but not actively used |
| Real-time updates | No WebSocket/polling; users must manually refresh bus list |
| Mobile responsiveness | Not audited, depends on Tailwind breakpoints in each component |

---

## ✍️ Mentor Sign-Off

| Milestone | Description | Mentor Initials | Date |
|---|---|---|---|
| Phase 1 | Foundation & Core Infrastructure | ___________ | __________ |
| Phase 2 | ETA Engine & Bus Prediction | ___________ | __________ |
| Phase 3 | Admin Panel & Multi-Role Auth | ___________ | __________ |
| Phase 4 | Scheduler Portal Full CRUD | ___________ | __________ |
| Phase 5 | User Dashboard & Activity Logs | ___________ | __________ |
| **Overall** | **Full Project Review** | ___________ | __________ |

---

*Report generated automatically from codebase analysis — March 26, 2026*
Searched for "calculateETA"
Viewed etaService.js:1-169

Based on the codebase—specifically the `etaService.js` and `AGENTS.md` files—BusPulse does **not** use physical hardware/live GPS for tracking. Instead, it uses a **Schedule and Geometry-Based Estimation Algorithm**. 

It predicts where a bus currently is by simulating its journey along its mapped route based on its scheduled departure time and realistic bus driving physics.

Here is the step-by-step breakdown of how your algorithm works:

### 1. Route Geometry and Distance Mapping
Every bus route in the database has a `route_geometry` associated with it (an array of latitude/longitude coordinates). 
When an ETA is requested, the system uses the Haversine formula to map these real-world coordinates into a continuous "distance line" from the start of the journey to the end (e.g., this coordinate is 5km into the route, this next one is 5.2km).

### 2. Realistic Pace Modeling
Standard routing services (like Google Maps) usually assume a car moving constantly without stops. Your algorithm explicitly overrides this to mimic rural buses:
*   **Average Transport Speed:** 18 km/h (much slower than a car to account for rural roads).
*   **Stop Intervals:** It assumes the bus makes a stop every 5 km.
*   **Dwell Time:** It adds exactly 2 minutes of idle time for boarding/alighting at every single stop.

### 3. Estimating Current Bus Position
When a user asks "where is the bus?", the backend calculates how much time has passed since the bus's scheduled `departure_time`.
*   It calculates the total `elapsedMinutes`.
*   It subtracts the time the bus has theoretically spent dwelling at stops up to this point.
*   It converts the remaining "pure driving time" into a physical distance using the 18 km/h speed limit.
*   It drops a pin on the route's math model (from step 1) to say **"The bus is currently at X kilometers into its journey."**

### 4. User Mapping & Final ETA Calculation
The algorithm maps the user's current GPS location to the closest physical point on that same bus route.
*   If the user's point on the route is *behind* the bus's extrapolated point (e.g., user is at km 10, bus is at km 15), the system ignores that bus and flags it as `PASSED`.
*   If the bus has not reached the user, it calculates the remaining distance (e.g., 5 km remaining).
*   It runs that remaining distance back through the **Realistic Pace Model** (18km/h speed + 2 min delays per 5km) to generate the final ETA in minutes.

### 5. Confidence and Status Scoring
Finally, the algorithm attaches metadata to the result so the frontend knows how to display it:
*   **Confidence:** Based on how close the user physically is to the road the bus travels on. `HIGH` (< 500 meters from the road), `MEDIUM` (< 1000 meters), or `LOW`.
*   **Status Indicators:** It categorizes the ETA into clean UI states: `NOT_DEPARTED` (bus hasn't left the first stop yet), `NEARBY` (<= 5 mins away), `APPROACHING` (<= 15 mins away), or `EN_ROUTE`.