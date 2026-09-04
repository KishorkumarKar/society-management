# Frontend → real backend API

Scope: **frontend only**, nothing in `backend/` or `mobile/` was touched.
Branch context: `KishorkumarKar/society-management` @ `new_frontend`.

## Setup

1. Copy `.env.example` to `.env.local` and set it to your backend's
   **host only** — no path, no `/api/v1`:
   ```
   NEXT_PUBLIC_API_URL=http://192.168.29.179:4000
   ```
   The `/api/<version>` prefix is added automatically for every request
   (see "One config file" below) — putting it in the env var yourself is
   no longer needed, and is defensively stripped if you do.
2. Run the backend (`cd backend && npm run seed` if you haven't, then
   start it).
3. `npm install && npm run dev` in `frontend/`.
4. Log in with a seeded user, e.g. `society=green-valley`, the seed's
   admin email, and the seed password — see `backend/seeders/seed.ts`'s
   printed credentials.

## One config file for the API base URL / version (this session's fix)

Two files are now the *only* place any URL or path is assembled — change
either one and it applies everywhere, nothing else needs touching:

- **`lib/api/config.ts`** — host + version:
  ```ts
  export const API_VERSION = "v1";           // bump to move to v2 everywhere
  export const API_BASE_URL = `${API_HOST}/api/${API_VERSION}`;
  ```
  `joinApiPath()` here is what actually fixes the `/api/v1//auth/login`
  double-slash bug — every request is built through it, so a base URL
  and a path can never collide into `//` regardless of trailing/leading
  slashes on either side.
- **`lib/api/endpoints.ts`** — every route path, one object:
  ```ts
  export const ENDPOINTS = {
    auth: { login: "/auth/login", refresh: "/auth/refresh", logout: "/auth/logout" },
    users: { list: "/users", byId: (id) => `/users/${id}`, ... },
    ...
  };
  ```
  Every file in `lib/api/*.ts` imports its paths from here — none of
  them hardcode a route string anymore. To change what `auth/login`
  points to, edit one line in this file; every caller picks it up.

`http.ts` (the fetch wrapper) and every resource file (`auth.ts`,
`users.ts`, `societies.ts`, etc.) were updated to use both.

## What's now live (calls the real backend)

- **Auth** — `/login` calls `POST /auth/login`, stores the JWT pair, and
  silently rotates it via `POST /auth/refresh` on page reload / on a 401
  from any API call. Sign-out calls `POST /auth/logout`.
  - The society picker is a **text field for the society's slug** (e.g.
    `green-valley`), not a dropdown — `GET /societies` is
    Super-Admin-only on the backend, so there's no way to list societies
    before you're authenticated.
  - The old "Platform — Super Admin (all societies)" bypass option is
    gone — the backend's Super Admin is still a normal user of one
    society, just with a global role.
- **Dashboard** (`/dashboard`) — noticeboard from `GET /announcements`,
  member directory from `GET /users`. Roles without `users.view` (e.g.
  Resident) see a "not visible to your role" message instead of an
  error.
- **Admin console → Users** (`/admin/dashboard/users`) — fully live:
  - **List** — `GET /users`, server-side search + pagination, flat
    labels resolved from `GET /flats`, active/inactive status.
  - **Create** — `POST /users`. Requires a password (backend minimum: 8
    chars) and one of email/phone; flat and roles are optional and set
    in the same call (`flatId`, `roleIds`).
  - **Edit** — `PATCH /users/:id` for name/email/phone/flat/active
    status. Roles are handled separately (see below) because
    `updateUserSchema` on the backend doesn't accept `roleIds`.
  - **Roles & access panel** (on the edit page) — the backend has no
    "list this user's current roles" endpoint, only
    `GET /users/:id/permissions` (their combined effective permission
    strings) and `POST`/`DELETE /users/:id/roles/:roleId` to
    assign/remove one at a time. The panel shows the effective
    permissions and lets you pick a role to assign or remove.
  - **Delete** — `DELETE /users/:id` (soft-delete on the backend).
  - Note: **every** role, including Super Admin, only ever sees/manages
    users in their own society — `GET /users` is tenant-isolated with no
    bypass (see `backend/src/middleware/tenant-isolation.middleware.ts`).
    The old mock UI's cross-society "Society" column for Super Admin has
    been dropped since there's no backend endpoint that supports it.

- **Admin console → Societies** (`/admin/dashboard/societies`, Super Admin
  only) — the one genuinely cross-society view in the app, since
  `/societies` isn't tenant-scoped:
  - **List** — `GET /societies`, search + pagination, maintenance rate,
    registration no., active/inactive status.
  - **Create** — `POST /societies`. `slug` (the login code every member
    types in) is auto-suggested from the name as you type, editable
    until saved, then **permanent** — there's no `slug` field in
    `updateSocietySchema`, so it can't change later.
  - **Edit** — `PATCH /societies/:id` — name, city, address, maintenance
    rate, registration no., user limit, status. Slug field is locked.
  - **Delete** — `DELETE /societies/:id` (soft-delete; cascades to the
    society's users/flats/notices per the backend).
- **Admin console → Flats** (`/admin/dashboard/flats`) — tenant-isolated
  like Users (no cross-society view, not even for Super Admin):
  - **List** — `GET /flats`, search + pagination, owner name resolved
    from `GET /users`, area and rate (fixed or per-sq.ft.) formatted.
  - **Create** — `POST /flats` — block/floor/unit no. (all required),
    optional owner picker, area, and pricing.
  - **Edit** — `PATCH /flats/:id`, same fields.
  - **Delete** — `DELETE /flats/:id`.
  - Added a **Flats** link to the admin sidebar (it existed as a route
    but wasn't reachable from the nav).
- **Admin console → Events** (`/admin/dashboard/events`) — top-level CRUD,
  live:
  - **List/Create/Edit/Delete** — `GET/POST/PATCH/DELETE /events`. Name,
    description, date, status (upcoming/ongoing/completed/cancelled),
    and a ₹ target amount.
  - Tenant-isolated like Users/Flats — no cross-society view.
  - The event detail page and its Collections/Expenses tabs are also
    live now — see the dedicated entry below.
- **Admin console → Roles** (`/admin/dashboard/roles`) — fully live,
  including permission management:
  - **List** — `GET /roles`. Shows the caller's society roles plus any
    **global** roles (society-less, like "Super Admin") which the
    backend makes visible everywhere.
  - **Create** — `POST /roles`: name, description, and an "assignable
    everywhere" (global) toggle — the backend only honors that flag if
    the caller already holds a global role themselves, so it 403s
    harmlessly otherwise.
  - **Edit** — `PATCH /roles/:id` for name/description. **Global roles
    are read-only** on the backend (`GLOBAL_ROLE_READONLY`) — the page
    says so and skips the delete button's usual assumption of success.
  - **Permissions panel** (on the edit page) — the real source of truth
    for what a role grants, unlike the flattened string list on the
    Users page: `GET /roles/:id/permissions` returns full permission
    objects, and checkboxes (grouped by resource) call
    `POST`/`DELETE /roles/:id/permissions/:permissionId` immediately on
    toggle, no separate save step.
  - **Delete** — `DELETE /roles/:id` (blocked for global roles, per
    above).
- **Admin console → Hall Bookings** (`/admin/dashboard/hall-bookings`) —
  fully live, including approve/reject/cancel:
  - **List** — `GET /hall-bookings`, status tabs (pending/approved/
    rejected/cancelled), flat labels resolved from `GET /flats`.
  - **Create** — `POST /hall-bookings`: flat, hall name, start/end
    datetime (end must be after start — checked client-side too),
    purpose, amount, deposit. New bookings always start `pending`.
  - **Edit** — `PATCH /hall-bookings/:id` for the same fields — does
    **not** change status; that's the action buttons below.
  - **Approve / Reject / Cancel** — `PATCH /hall-bookings/:id/approve`
    `/reject` `/cancel`, each its own permission
    (`hall_bookings.approve` / `.reject` / `.cancel`). Approve/Reject
    show for pending bookings when the signed-in role can moderate;
    Cancel shows for pending/approved bookings for residents too — this
    page has no top-level `RequireRole` gate (unlike Users/Flats/
    Roles/Events) because Residents genuinely have `hall_bookings.
    create`/`.cancel` on the backend — access to individual actions is
    controlled per-button instead.
  - **Delete** — `DELETE /hall-bookings/:id`.
  - Added **Hall Bookings** and **Roles** links to the admin sidebar
    (both existed as routes already but weren't reachable from the nav).
- **Admin console → Notices** (`/admin/dashboard/notices`) — fully live:
  - **List/Create/Edit/Delete** — `GET/POST/PATCH/DELETE /announcements`.
    Title, body, priority, and an audience picker (checkboxes of roles —
    leave all unchecked for society-wide).
  - **Send** — creating a notice does **not** notify anyone by itself;
    `POST /announcements/:id/send` is a separate action (a Send button
    on unsent notices) that creates one notification per targeted user
    and stamps `sent_at`. The dashboard's noticeboard (built earlier)
    already only shows what's actually reached the reader.
- **Admin console → Maintenance** (`/admin/dashboard/maintenance`) —
  fully live, including recording payments:
  - **List** — `GET /maintenance-bills`, status tabs (due/overdue/paid/
    approved), flat labels, and a computed **outstanding balance**
    (amount + penalty − successful payments — the backend computes this
    server-side, not the frontend).
  - **Create** — `POST /maintenance-bills`: flat, billing year/month,
    amount, due date, penalty. One bill per (flat, year, month) — the
    backend has a unique constraint on that triple.
  - **Edit** — `PATCH /maintenance-bills/:id` for amount/due date/
    penalty/status. Flat and billing period are **immutable** once a
    bill exists (delete and recreate instead) — the form shows them
    read-only rather than editable.
  - **Payments panel** (on the edit page) — lists recorded payments
    (`GET /maintenance-bills/:id/payments`) and records new ones
    (`POST .../payments`: amount, date, method, optional transaction
    ID). Recording a payment does **not** auto-flip the bill's status
    label — that's set independently, and the page says so; the real
    outstanding-balance number is always computed from actual payments.
- **Admin console → Expenses** (`/admin/dashboard/expenses`) — new
  section, fully live, including approve/reject:
  - **List** — `GET /expenses`, status tabs (pending/approved/rejected),
    a running total for the visible page.
  - **Create/Edit** — `POST`/`PATCH /expenses`: category, vendor, amount,
    date, optional receipt URL and description.
  - **Approve / Reject** — `PATCH /expenses/:id/approve` with
    `{decision}`; `approved_by`/`approved_at` are always server-derived.
  - **Delete** — `DELETE /expenses/:id`.
  - This is **general society expenditure** — distinct from per-event
    spend, which lives under Events (now also live — see below). Kept
    the existing per-event `ExpenseForm.tsx` and named this new one
    `SocietyExpenseForm` to avoid confusion between the two.
  - Added **Maintenance** and **Expenses** links to the admin sidebar.
- **Admin console → Notifications** (`/admin/dashboard/notifications`) —
  new section, fully live:
  - **List** — `GET /notifications`, All/Unread tabs. By default a
    caller only ever sees their own notifications
    (`notifications.view_all` is a separate, more administrative
    permission this UI doesn't try to use).
  - **Mark as read** (individual or all) — `PATCH /notifications/:id/
    read` and `PATCH /notifications/read-all`.
  - **Delete** — `DELETE /notifications/:id`.
  - Added a **bell icon with a live unread-count badge** to the admin
    topbar (links to the page above) and a sidebar entry — previously
    there was no notifications UI anywhere in the console at all.
- **Admin console → Events → Collections/Expenses** (the per-event
  sub-pages) — now fully live, closing the gap flagged when Events was
  first migrated:
  - The whole event workspace (`/events/[id]/layout.tsx`, the Details
    tab, and both Collections/Expenses tabs — list, add, view, edit) now
    fetches the real event via `GET /events/:id` and its rows via
    `GET /event-collections` / `GET /event-expenses` filtered by
    `eventId`, instead of looking up a mock event by string id (which
    would never match a live-created event's numeric id).
  - **Collections** — member name/unit are **free text** on the backend
    (not a foreign key to users/flats), so a collection entry can record
    a contribution from anyone, resident or not. Status can be set
    explicitly or left for the backend to derive from amount due vs.
    paid.
  - **Expenses** — request field is `date`, but the entity/response
    field is `expense_date` — the backend renames it on the way in;
    `lib/api/eventExpenses.ts` documents this.
  - The two **cross-event rollup pages**
    (`/admin/dashboard/events/collections` and `/events/expenses`) now
    call the same endpoints **without** an `eventId` filter, which the
    backend already supports — that alone gets a society-wide view with
    no extra backend work, with an event-name filter/column resolved
    from `GET /events` client-side.
  - `CollectionForm` and `ExpenseForm` (the per-event one — distinct
    from `SocietyExpenseForm` above) now call the live API directly
    instead of bubbling a plain object up to a mock `DataContext`
    mutator.
- **Admin console → ACL page removed (redirects to Roles)** — the old
  `/admin/dashboard/acl` page rendered a role×module permission grid
  seeded from mock `data/acl.json`: a fixed 5-role × 10-module matrix
  that has no backend equivalent (the real backend has dynamic
  per-society roles with granular `resource.action` permissions, no
  such shape or endpoint exists) and, per its own on-page disclaimer,
  never actually controlled access. Its real replacement is the Roles
  page's permissions panel built earlier — live roles, live
  permissions, actually persisted. Replaced the page with a client-side
  redirect to `/admin/dashboard/roles` (so old links/bookmarks don't
  dead-end) and removed the now-redundant sidebar entry.

## Security (guards/shifts/visitors) — not implemented, no backend to wire

There is **no security module on the backend at all** — no guards,
shifts, or visitor-log endpoints anywhere in `backend/src/modules/`
(confirmed by listing every module: acl, announcements, auth,
event-collections, event-expenses, events, expenses, flats,
hall-bookings, maintenance, notifications, permissions, roles,
societies, users). The existing `/admin/dashboard/security/**` pages are
UI-only mockups over `data/security-*.json` with nothing to connect to.
Wiring this up would mean adding new backend modules, which is out of
scope here (frontend-only, per the brief) — left entirely untouched
rather than faking an integration. If this is needed, it starts on the
backend side first.

## What's still on mock data (`data/*.json` via `DataContext`)

Everything else in `/admin/dashboard/**` — security (see note above),
plus the `/members` and `/security` sections and any other page not
listed above. Next up, module by module.

## The API layer (`frontend/lib/api/`)

- `config.ts` — host/version/base-URL, single source of truth (see above).
- `endpoints.ts` — every route path, single source of truth (see above).
- `http.ts` — the one fetch wrapper everything goes through: attaches
  the bearer token, unwraps the backend's `{success, data}` /
  `{success, error}` envelope, and transparently retries once after a
  silent refresh on a 401.
- `token-store.ts` — JWT pair in `sessionStorage`.
- `auth.ts`, `session.ts` — login/refresh/logout calls, and the adapter
  that turns a real login response into the app's `AuthenticatedUser`.
- `lib/auth/roleMapping.ts` — the backend has fully dynamic per-society
  roles/permissions, but the rest of this app was built around a fixed
  5-value `UserRole` union for route guards. This derives the closest
  match so those guards keep working. Real arrays are kept on
  `user.roles` / `user.permissions` for anything that wants to check
  them directly.
- One file per backend module (`users.ts`, `societies.ts`,
  `announcements.ts`, `flats.ts`, `roles.ts`, `maintenance.ts`,
  `permissions.ts`, `hallBookings.ts`, `expenses.ts`, `events.ts`,
  `eventCollections.ts`, `eventExpenses.ts`, `notifications.ts`).
  `users.ts` / `societies.ts` / `announcements.ts` / `flats.ts` /
  `roles.ts` are fully typed (wired into real UI); the rest are typed
  CRUD foundations for the next modules — each has a comment flagging
  anything worth double-checking (extra action routes, exact payload
  fields) before wiring it into a form.

## Known gaps / heads-up for what's next

- `AuthenticatedUser.unit` / `.designation` are always `""` — no backend
  equivalent (only `flatId`, now actually used by the Users module).
- `AuthenticatedUser.id` / `.societyId` / `.flatId` are strings
  (stringified from the backend's numeric ids), purely so this still
  type-checks against the untouched, still-mock-data admin console
  pages. `Number(...)` them back as each page gets migrated.
- There is a **pre-existing** TypeScript error in
  `components/ui/Button.tsx` (`ButtonAsButton` interface clash) — present
  on `new_frontend` before any of this work (confirmed against a clean
  checkout), unrelated to the API changes. Everything else here
  type-checks clean (`npx tsc --noEmit`).
- `RequireRole` page gates use the coarse 5-value role mapping (see
  `roleMapping.ts` above), so they're a UX convenience, not the real
  authorization boundary — the backend's actual permission check always
  applies underneath. This can occasionally under- or over-show a nav
  link relative to what a user's real permissions allow (e.g. a
  backend "Committee" role has `roles.view` but maps to the app's
  `committee` value, which isn't in the Roles page's `RequireRole`
  list) — a mismatch would show up as a page hidden behind a link they
  can't see, never as unauthorized data being exposed.
