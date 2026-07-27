# Lawsome — UI Prototype (mock data only)

This is a **standalone UI prototype** of the Lawsome web app. It runs with
**zero backend**: every API call is intercepted and answered from in-memory mock
data. Nothing leaves the browser and no server is required.

## Run it

```bash
npm install      # first time only
npm run dev      # http://localhost:3000
```

The app opens **already signed in** as the demo organisation admin
(*Ananya Sharma*, *Sharma & Associates*), so you land straight in the app.

## How the mock layer works

All prototype-only code lives in [`src/prototype/`](src/prototype/):

| File | Responsibility |
| --- | --- |
| `mockData.ts` | Seed datasets — organisation, sites, users, cases, hearings, tasks, documents, invoices, eCourts records, admin lists, search profiles. IDs cross-reference so the UI stays coherent. |
| `router.ts` | Pure `method + path → { data, errors, meta }` resolver mirroring the real API envelope (paged lists included). Unmatched routes fall back to sensible generic responses. |
| `install.ts` | Patches the axios adapter **and** `window.fetch`, builds a long-lived mock JWT, and seeds a logged-in session in `localStorage`. Imported first in `app/providers.tsx`. |

### External integrations
- **Google sign-in** — the buttons resolve locally with the mock JWT (no real OAuth). Silent-refresh is a no-op.
- **Google Maps** — loads lazily and is gated by `isLoaded`; the map simply doesn't render offline. The rest of the search page works.
- **Razorpay / EmailJS** — not exercised in normal navigation.

## Editing the mock data
Change the arrays in `src/prototype/mockData.ts` and refresh. To add a brand-new
endpoint, add a matcher in `src/prototype/router.ts`.

## What this is NOT
- No persistence — reloading resets everything (state lives in memory + Redux-persist).
- No real authentication, payments, court-record sync, or email.
- Not production code — it's a design/UX prototype.
