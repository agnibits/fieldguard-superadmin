# FieldGuard Admin

An internal **platform super-admin** dashboard for reviewing company registrations.
A super-admin signs in, browses every registered company, opens a company to inspect
its uploaded documents (citizenship image + registration document), and then
**approves**, **rejects** (with a reason), or **un-approves** (sends back to pending)
the company. Approval unlocks the company's access to the main product.

Built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS** in a clean
green-and-white theme.

---

## Features

- **Secure session** — the backend access token is stored in an **httpOnly, secure
  cookie** set server-side. It is never exposed to client JavaScript.
- **Server-side proxy** — all backend calls go through Next.js Route Handlers under
  `/api/*`, which attach the `Bearer` token and forward to the backend. This avoids
  browser CORS entirely; the browser only ever talks to its own origin.
- **Route protection** — `/` and `/companies/*` require a valid session. Middleware
  gates on cookie presence and the protected layout validates the token via the
  backend `/me` endpoint. Any `401` clears the cookie and redirects to `/login`.
- **Dashboard** — status filter tabs (All / Pending / Approved / Rejected) with a live
  **Pending** count badge, responsive card grid (mobile/tablet) and table (wide
  screens), plus loading skeletons, empty states, and an error state with retry.
- **Company detail** — full company info, a document-review section with image
  previews that open in a **zoomable lightbox**, and status-aware action buttons with
  **confirmation modals** for every state change (the reject flow requires a reason).
- **Toasts** for success/error feedback and **loading states** on every action button
  to prevent double-submits.

---

## Prerequisites

- **Node.js 18.18+** (Node 20+ recommended)
- The FieldGuard backend reachable over HTTPS

---

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure the environment**

   Copy the example file and set the backend base URL (no trailing slash):

   ```bash
   cp .env.example .env.local
   ```

   ```env
   # .env.local
   NEXT_PUBLIC_API_BASE_URL=https://fieldguard-be.onrender.com
   ```

   > Despite the `NEXT_PUBLIC_` prefix, the URL is only ever used **server-side** by the
   > proxy route handlers and the protected layout. The browser never calls the backend
   > directly.

3. **Run in development**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>. You'll be redirected to `/login`.

4. **Build for production**

   ```bash
   npm run build
   npm start
   ```

---

## Environment variables

| Variable                   | Required | Description                                                |
| -------------------------- | -------- | ---------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes      | Base URL of the FieldGuard backend, e.g. `https://fieldguard-be.onrender.com` (no trailing slash). |

---

## Project structure

```
src/
├─ app/
│  ├─ api/                         # Server-side proxy route handlers
│  │  ├─ auth/
│  │  │  ├─ login/route.ts         # POST → backend login; sets httpOnly cookie
│  │  │  ├─ logout/route.ts        # POST → clears the session cookie
│  │  │  └─ me/route.ts            # GET  → current admin (session check)
│  │  └─ companies/
│  │     ├─ route.ts               # GET  → list (optional ?status=)
│  │     └─ [id]/
│  │        ├─ route.ts            # GET  → single company
│  │        └─ approval/route.ts   # POST → approve / un-approve / reject
│  ├─ (protected)/                 # Route group requiring a valid session
│  │  ├─ layout.tsx                # Validates session via /me; renders TopBar
│  │  ├─ page.tsx                  # Dashboard
│  │  └─ companies/[id]/           # Company detail (server wrapper + client view)
│  ├─ login/page.tsx               # Login screen
│  ├─ layout.tsx                   # Root layout + ToastProvider
│  └─ globals.css                  # Tailwind + theme styles
├─ components/                     # StatusBadge, CompanyCard, ConfirmModal,
│  │                               # RejectModal, ImageLightbox, Toast, etc.
├─ lib/
│  ├─ api-client.ts                # Typed client → calls our own /api/* routes
│  ├─ backend.ts                   # Server-side backend fetcher + error normalizer
│  ├─ session.ts                   # httpOnly cookie helpers
│  ├─ types.ts                     # Shared domain types
│  └─ format.ts                    # Date / label formatting
└─ middleware.ts                   # First-pass auth gate on protected routes
```

---

## How auth works

1. The login form posts to `/api/auth/login`. That route handler calls the backend,
   and on success stores the returned `accessToken` in an **httpOnly** cookie
   (`fg_admin_token`). Only the admin profile is returned to the browser.
2. Client components call typed helpers in `lib/api-client.ts`, which hit our own
   `/api/*` routes. Those route handlers read the cookie server-side and forward the
   request to the backend with `Authorization: Bearer <token>`.
3. The token has **no refresh**. If the backend returns `401`, the proxy deletes the
   cookie and the client redirects to `/login`.

---

## Backend API consumed

| Method & path                                   | Purpose                              |
| ----------------------------------------------- | ------------------------------------ |
| `POST /api/v1/admin/login`                      | Authenticate, returns `accessToken`  |
| `GET  /api/v1/admin/me`                          | Current admin profile (session check)|
| `GET  /api/v1/admin/companies?status=`           | List companies (optional filter)     |
| `GET  /api/v1/admin/companies/:id`               | Company details                      |
| `POST /api/v1/admin/companies/:id/approval`      | Approve / un-approve / reject        |

Approval payloads:

```jsonc
{ "status": "APPROVED" }                                  // approve
{ "status": "PENDING_APPROVAL" }                          // un-approve / move to pending
{ "status": "REJECTED", "rejectionReason": "…required…" } // reject
```
