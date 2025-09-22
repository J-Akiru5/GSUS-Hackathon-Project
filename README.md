
# GSUS (General Services Unified System)

This repository contains the GSUS web application — a lightweight single-page app built with Vite + React and Firebase (Firestore + Auth). It provides booking and request management, a calendar, analytics, and administrative tools used during the GSUS hackathon project.

This README is tailored for developers working on the project locally and maintainers who want to extend features or prepare the app for deployment.

## Project overview

- Framework: Vite + React (JSX)
- Styling: Plain CSS files colocated alongside components/pages
- State & data: Firebase Firestore (real-time listeners) and Firebase Auth
- Hosting / Deployment: Vercel config included (see `vercel.json`) and Firebase config (`firebase.json`) for functions/emulators

Key features:
- Real-time lists of bookings and requests with stat tiles
- Divisions management with CRUD operations and modal-based forms
- Calendar view combining bookings and requests
- Analytics page with recent activity (audit trail)
- Admin scripts in `scripts/admin/` for user migrations and data fixes

## Repository layout (important files)

- `src/` — application source
  - `main.jsx` — app entry + router
  - `App.jsx`, `Layout.jsx` — top-level layout and routing
  - `pages/` — route pages (Dashboard, Analytics, MasterCalendar, AllRequests, Divisions, etc.)
  - `components/` — reusable UI components (headers, modals, cards)
  - `services/` — Firestore helpers and API-like wrappers (e.g., `firestoreService.js`)
  - `hooks/` — small React hooks (e.g., `useAuth.js`)
  - `utils/` — helper functions (date helpers, normalizers)
- `public/` — static assets
- `scripts/` — small utilities & dev scripts. See `scripts/admin/` for migration helpers.
- `firebaseConfig.js` — project Firebase configuration wrapper used by the client
- `firebase.json`, `firestore.rules` — Firebase hosting/emulator and security rules

## Development setup

Prerequisites:
- Node.js 18+ (recommended)
- Yarn or npm (Yarn used in scripts but npm works)

Local dev steps:

1. Install dependencies

	Using yarn:

	yarn

	Or npm:

	npm install

2. Add Firebase credentials

	- The repo includes `firebaseConfig.js` which reads your Firebase config. For local development, set environment variables or replace the config with your test project values.

3. Start the dev server

	yarn dev

	or

	npm run dev

4. (Optional) Use Firebase emulator for Firestore/Auth when testing admin scripts or to avoid touching production data.

## How the code is organized and key patterns

- Pages are self-contained in `src/pages/` with a matching CSS file when specific styles are required.
- Components are intentionally small and focused; modal flow uses a SectionHeader portal and a custom event system to open forms from different places.
- Firestore access is centralized in `src/services/firestoreService.js`. It exposes real-time listeners (onSnapshot) and CRUD helpers used by pages.
- The app prefers real-time Firestore listeners for lists and derives stat tiles from those lists.

## Typical dev tasks and where to start

- Add a new page: Create a file in `src/pages/` and register a route in `App.jsx`/router.
- Add a new component: Create in `src/components/` and import into pages.
- Add Firestore collection support: Update `firestoreService.js` with a helper and use `useEffect` with a listener on the page.
- Styling: Add a CSS file next to the component/page and import it into the component.

## Testing and linting

- ESLint config exists at the repo root. Run the linter locally via your editor or add npm scripts if desired.
- There are a few ad-hoc test scripts in `scripts/` used for sanity checks on data transformations (e.g., `test-datehelpers.js`). They can be executed via node for manual checks.

## Admin & migration scripts

- `scripts/admin/` contains utilities used during migration or analytics capture. These are run manually with node and expect environment variables for Firebase admin credentials.

## Recommended next improvements (roadmap)

1. TypeScript migration (optional): Converting key modules to TypeScript will improve maintainability (start with `src/services/firestoreService.js` and `src/pages/DivisionsPage.jsx`).
2. Centralized UI library: Extract shared UI primitives (Card, Modal, StatTile) into `src/components/ui/` to reduce duplication and enforce consistency.
3. Automated tests: Add unit tests for data normalization utilities and small integration tests for page rendering (Jest + React Testing Library).
4. CI: Add GitHub Actions to run lint and tests on PRs.
5. Auth & roles: Integrate role-based UI (admin vs user) and enforce security rules in `firestore.rules` to limit sensitive operations.
6. Pagination & query costs: Add pagination or limit+cursor patterns to large collection listeners to reduce Firestore read costs.

## Committing and pushing safely

- Use conventional commits and avoid shell-special characters in commit messages when scripting commits on Windows PowerShell. Example:

  git add -A; git commit -m "docs: update README with project overview"; git push

If you want me to commit this change for you, tell me to proceed with the commit and push; I can create a safe commit message and avoid characters that break shells.

## Where to get help

- If you run into runtime issues, first check the browser console for exceptions and the terminal running `yarn dev` for compile-time errors.
- For Firestore rules or security issues, use the Firebase emulator locally to debug rules before deploying.

---

If you'd like, I can also:
- Add a short CONTRIBUTING.md with local dev setup and PR guidelines.
- Create a minimal GitHub Actions workflow for linting on PRs.
- Migrate a specific file (e.g., `DivisionsPage.jsx`) to TypeScript as a sample.

Tell me which of those you'd like next.
