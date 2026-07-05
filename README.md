# TravelPilot — Smart Travel Companion
### SIH 2025 Problem Statement · Full-Stack Web Companion

TravelPilot is a full-stack web companion for a smart travel app: automatic trip
tracking, an AI travel assistant, expense OCR, group travel, one-tap SOS, and a
role-based admin panel — all backed by a real MySQL database and JWT authentication.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + React Router v6 + Framer Motion + React Icons |
| Backend | Node.js + Express.js |
| Database | MySQL 8 (raw SQL via `mysql2`, connection pooling) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| HTTP client | Axios (with interceptors for auth token + 401 handling) |

---

## 2. Project Structure

```
travelpilot/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── api/axios.js       # Axios instance with JWT interceptor
│   │   ├── components/        # Navbar, Footer, ProtectedRoute, PageWrapper
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── pages/             # Home, Contact, Login, Register, AdminLogin,
│   │   │                      # UserDashboard, MyTrips, Itinerary, Safety,
│   │   │                      # GroupTrip, LiveTracking, AIAssistant,
│   │   │                      # AdminPanel, NotFound
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/                   # Node + Express API
│   ├── src/
│   │   ├── config/db.js               # MySQL connection pool
│   │   ├── middleware/auth.js         # JWT verify + role guard
│   │   ├── models/                    # userModel, tripModel, expenseModel
│   │   ├── controllers/               # auth, trip, expense, admin, feedback
│   │   ├── routes/                    # authRoutes, tripRoutes, expenseRoutes,
│   │   │                              # adminRoutes, feedbackRoutes
│   │   └── server.js                  # Express app entry point
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── schema.sql              # Full MySQL schema (7 tables)
│   └── sample_data.sql         # Seed/test data (admin + tourist accounts)
│
└── README.md                   # You are here
```

---

## 3. Database Schema Overview

`database/schema.sql` creates the `travelpilot` database with these tables:

- **users** — tourist/admin accounts, bcrypt password hash, role enum
- **trips** — trip metadata, budget, status, auto-tracking flag
- **itineraries** — day-by-day activity plan per trip
- **expenses** — trip expenses, category enum, OCR flag, receipt image path
- **trip_members** — join table for group travel
- **sos_alerts** — emergency alerts with GPS coordinates and status
- **feedback** — contact form submissions

`database/sample_data.sql` seeds:
- 1 admin account — `admin@travelpilot.com` / `Admin@123`
- 3 tourist accounts — e.g. `rahul@travelpilot.com` / `Tourist@123`
- Sample trips, itineraries, expenses, an SOS record, and feedback entries

---

## 4. Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [MySQL](https://dev.mysql.com/downloads/) v8 (server running locally, or use MySQL Workbench / XAMPP / Docker)
- [VS Code](https://code.visualstudio.com/) (recommended, with the *ES7+ React* and *MySQL* extensions)

---

## 5. Setup Instructions (VS Code)

### Step 1 — Open the project
Open the `travelpilot/` folder in VS Code (`File → Open Folder`). You'll run the
database, backend, and frontend in **three separate terminals** (`Terminal → New Terminal`,
or split the terminal panel).

### Step 2 — Set up MySQL

1. Start your local MySQL server.
2. Run the schema and seed data. From VS Code's terminal (adjust the path if the
   `mysql` CLI isn't on your PATH):

   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/sample_data.sql
   ```

   Or open both files in MySQL Workbench and execute them in order (`schema.sql` first,
   then `sample_data.sql`).

3. Confirm the database exists:
   ```sql
   USE travelpilot;
   SHOW TABLES;
   ```

### Step 3 — Run the backend API

In **Terminal 1**:
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and set `DB_PASSWORD` (and `DB_USER`/`DB_HOST` if different from
defaults) to match your local MySQL setup. Also set `JWT_SECRET` to any long
random string.

```bash
npm run dev
```
The API starts on **http://localhost:5000**. You should see:
```
🚀 TravelPilot API running on http://localhost:5000
✅ MySQL connected successfully
```
Test it: open `http://localhost:5000/api/health` in a browser — you should get a JSON success response.

### Step 4 — Run the frontend

In **Terminal 2**:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
The site starts on **http://localhost:5173** (Vite will print the exact URL).
`VITE_API_URL` in `.env` should point to `http://localhost:5000/api` (already the default).

### Step 5 — Log in

- Register a new tourist account at `/register`, or create an admin user
  directly in the database (see `database/sample_data.sql` for the schema
  of an admin row) and log in at `/admin/login`.
- Update or remove the seed rows in `database/sample_data.sql` before any
  real deployment — they're for local development only.

---

## 6. Available Scripts

**Backend** (`/backend`):
- `npm run dev` — start with nodemon (auto-restart on file changes)
- `npm start` — start with plain node

**Frontend** (`/frontend`):
- `npm run dev` — start the Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build locally

---

## 7. REST API Reference

Base URL: `http://localhost:5000/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a new tourist account |
| POST | `/auth/login` | Public | Log in, returns JWT + user |
| GET | `/auth/me` | JWT | Get current user profile |
| GET | `/trips` | JWT | List the logged-in user's trips |
| POST | `/trips` | JWT | Create a trip |
| GET | `/trips/:id` | JWT | Get a single trip |
| PUT | `/trips/:id` | JWT | Update a trip |
| DELETE | `/trips/:id` | JWT | Delete a trip |
| GET | `/expenses/trip/:tripId` | JWT | List expenses for a trip (+ totals & category breakdown) |
| POST | `/expenses` | JWT | Add an expense |
| PUT | `/expenses/:id` | JWT | Update an expense |
| DELETE | `/expenses/:id` | JWT | Delete an expense |
| POST | `/feedback` | Public | Submit the contact form |
| GET | `/admin/stats` | JWT + admin | Platform-wide dashboard stats |
| GET | `/admin/users` | JWT + admin | List all users |
| PATCH | `/admin/users/:id/status` | JWT + admin | Activate/deactivate a user |
| DELETE | `/admin/users/:id` | JWT + admin | Delete a user |
| GET | `/admin/trips` | JWT + admin | List all trips platform-wide |
| GET | `/admin/feedback` | JWT + admin | List all feedback submissions |
| GET | `/admin/sos` | JWT + admin | List all SOS alerts |

All protected routes expect `Authorization: Bearer <token>`.

New in this update:

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/journals` | JWT | User's journal entries |
| GET | `/journals/highlights` | JWT | AI-flagged memory highlights |
| GET | `/journals/trip/:tripId` | JWT | Journal entries for a trip |
| POST | `/journals` | JWT | Create a journal entry |
| DELETE | `/journals/:id` | JWT | Delete a journal entry |
| GET | `/chat/history` | JWT | AI Assistant chat history |
| POST | `/chat/message` | JWT | Send a message, get an AI reply |
| GET | `/activity` | JWT | Unified recent activity feed |
| GET | `/routes/:tripId` | JWT | Ordered route points for the live map |
| GET | `/admin/reports` | JWT + admin | Analytics: spend by category, trips by status, eco score, top destinations |
| GET/PUT | `/admin/settings` | JWT + admin | Read/update platform settings |

---

## 8. Website Pages

| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero, features overview, testimonials, download-app section |
| `/itinerary` | Itinerary Planner | Add places, timings and activities per day; budget vs luxury filter |
| `/tracking` | Live Tracking | Animated route map, live timeline |
| `/group` | Group Trip | Shared members, live-location sharing consent, split expenses, badges |
| `/safety` | Safety Hub | SOS button, emergency contacts, nearest hospital/police, digital travel pass |
| `/assistant` | AI Assistant | Full chat interface with suggested prompts |
| `/contact` | Contact / Feedback | Public form → `POST /api/feedback` |
| `/login` | Tourist Login | |
| `/register` | Tourist Registration | |
| `/admin/login` | Admin Login | Role-checked; rejects non-admin accounts |
| `/dashboard` | User Dashboard | Stats, quick actions, recent activity, trip map previews |
| `/my-trips` | My Trips | Filterable, searchable trip list |
| `/admin` | Admin Panel | **Protected** — Overview / Users / Trips / Reports / Settings / Feedback |

A floating **AI Assistant** widget is available from any page once a session is active.

---

## 9. Notes

- If the backend or MySQL isn't running, the dashboard and trip pages fall back
  to local sample data so the UI still works end-to-end for local development.
- Dark/light mode is toggled from the navbar and persisted in `localStorage`.
- All forms include client- and server-side validation with clear error states.

---

## 10. Maps & AI Chatbot Setup

### Leaflet + OpenStreetMap (no API key needed)
Live Tracking, the Dashboard, and trip cards all render real interactive maps
via `frontend/src/components/LeafletMap.jsx`, using free OSM tiles — nothing
to configure. Route coordinates live in `frontend/src/lib/tripRoutes.js`; swap
in real `trip_route_points` rows (already in `database/schema.sql`) once trips
are backend-driven.

### Gemini AI Chatbot
1. Get a free key at https://aistudio.google.com/app/apikey
2. **Frontend** (`frontend/.env`, copy from `.env.example`):
   ```
   VITE_GEMINI_API_KEY=your_key_here
   ```
   Used only for guest chat sessions, called directly from the browser.
3. **Backend** (`backend/.env`, copy from `.env.example`):
   ```
   GEMINI_API_KEY=your_key_here
   ```
   Used by `POST /api/chat/message` for logged-in users — keeps the key
   server-side. If unset, the backend automatically falls back to a built-in
   rule-based assistant, so the chatbot still works without any key.
4. Restart `npm run dev` in both folders after editing `.env` files (Vite only
   reads `VITE_*` vars at startup).

The floating chat button (`AIChatWidget.jsx`) appears on every page, including
the Dashboard, once a session is active.

