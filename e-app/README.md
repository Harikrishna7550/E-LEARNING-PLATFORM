# E-Learning Platform — Frontend (e-app)

Single-page React application for the E-Learning Platform. Built with **React 19 + Vite + React Router + Bootstrap 5**.

---

## 1. Tech Stack

| Layer              | Tech                                       |
| ------------------ | ------------------------------------------ |
| Framework          | React 19                                   |
| Bundler / Dev srv  | Vite 8                                     |
| Routing            | react-router-dom 7                         |
| Styling / UI       | Bootstrap 5, Bootstrap Icons, Animate.css  |
| Charts             | Recharts                                   |
| Lint / Format      | ESLint 9                       |

---

## 2. Prerequisites

- **Node.js** 18 or higher — <https://nodejs.org/>
- **npm** (ships with Node)
- The **backend** running locally (see `../backend/README.md`). The frontend talks to it over HTTP.
- A modern browser (Chrome, Edge, Firefox).

---

## 3. Setup

From the `e-app/` folder:

```bash
# 1. Install dependencies
npm install

# 2. Create your env file from the template
#    Windows (PowerShell):
copy .env.example .env
#    macOS / Linux:
cp .env.example .env

# 3. Edit .env if your backend runs on a non-default URL (see section 4)
```

> `.env` is git-ignored — each developer keeps their own local copy.

---

## 4. Environment Variables (`.env`)

Vite only exposes variables prefixed with `VITE_` to the app code.

| Variable             | Required | Description                                                | Default / Example                  |
| -------------------- | :------: | ---------------------------------------------------------- | ---------------------------------- |
| `VITE_API_BASE_URL`  | No       | Base URL of the backend API (no trailing slash).           | `http://localhost:5000/api`        |
| `VITE_APP_NAME`      | No       | Display name shown in the UI.                              | `E-Learning Platform`              |

If you don't create a `.env`, the app will still run as long as the backend is on `http://localhost:5000` (the code falls back to this).

---

## 5. Running the App

```bash
# Start the dev server (HMR)
npm run dev
```

Vite will print a local URL — by default:

```
http://localhost:5173
```

> Make sure the **backend** is also running at `http://localhost:5000` (or whatever URL you put in `VITE_API_BASE_URL`), otherwise API calls (login, courses, etc.) will fail.

### Other scripts

| Script            | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start dev server with hot reload      |
| `npm run build`   | Production build to `dist/`           |
| `npm run preview` | Locally preview the production build  |
| `npm run lint`    | Run ESLint                            |

---

## 6. Project Structure

```
e-app/
├── index.html              # Vite HTML entry
├── vite.config.js          # Vite config (React plugin + aliases)
├── eslint.config.js        # ESLint flat config
├── package.json
├── public/                 # Static assets served as-is
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Root component, route definitions
    ├── App.css / index.css # Global styles
    ├── assets/             # Images, icons
    ├── components/         # Reusable UI
    │   ├── chat_bot/
    │   ├── courses/
    │   ├── forms/          # Login / Signup / Quiz creator
    │   ├── layout/         # Navbar, Footer
    │   ├── quizzes/        # Quiz taker, analytics, etc.
    │   ├── ErrorBoundary.jsx
    │   ├── InstructorAnalytics.jsx
    │   ├── StudentOwnPerformanceDashboard.jsx
    │   └── StudentPerformanceDashboard.jsx
    ├── context/            # React Context (Auth, Toast)
    ├── pages/              # Route-level pages
    │   ├── dashboards/     # Admin, Instructor, Student
    │   ├── Home.jsx
    │   ├── Login.jsx
    │   ├── Signup.jsx
    │   ├── Profile.jsx
    │   └── InstructorProfile.jsx
    ├── routes/             # ProtectedRoute (auth guard)
    └── styles/             # Page-specific CSS
```

---

## 7. How auth works (quick note)

- The backend issues an **HTTP-only JWT cookie** on login.
- All API calls from the frontend should be made with `credentials: "include"` (or the equivalent in `axios`/`fetch`) so the cookie is sent.
- `AuthContext` exposes the current user and login/logout helpers.

---

## 8. Common Issues

- **CORS / "blocked by CORS policy"** — the backend's `FRONTEND_URL` must match the URL the frontend is running on (default `http://localhost:5173`).
- **API calls return 401 / "Not authorized"** — login cookie isn't being sent. Make sure requests include credentials, and that you're logged in.
- **`npm install` fails on Windows with EPERM/EBUSY** — close any IDE that has the project open, delete `node_modules` and `package-lock.json`, then run `npm install` again.
- **Blank page after `npm run build`** — open the browser console; usually means the API base URL is wrong for your environment.

---

## 9. Production Build

```bash
npm run build       # outputs to dist/
npm run preview     # serves dist/ locally for a sanity check
```

Deploy the contents of `dist/` to any static host (Netlify, Vercel, S3, Nginx, etc.). Don't forget to set `VITE_API_BASE_URL` for the production backend before building.
