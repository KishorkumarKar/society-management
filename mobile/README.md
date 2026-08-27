# SocietyLedger — Mobile

A React Native (Expo) + TypeScript mobile client for the existing
[`society-management`](https://github.com/KishorkumarKar/society-management)
backend. Built by analyzing the real `backend/` and `frontend/` source, not
by guessing endpoint names or a color palette.

## What was actually analyzed, and where it shows up

| Source of truth | What was pulled from it | Where it landed in this app |
|---|---|---|
| `backend/src/app.ts` | Route mounting, `API_PREFIX=/api/v1` | `src/api/client.ts` base URL |
| `backend/src/modules/auth/*` | Login is `{society (slug), email\|phone, password}`; response already includes `user`, `society`, `roles`, and the **full permission list** — no separate `/me` call exists | `src/api/endpoints/auth.ts`, `src/store/authStore.ts` |
| `backend/src/middleware/authenticate.middleware.ts` | `Authorization: Bearer <token>` only | `src/api/client.ts` request interceptor |
| `backend/src/modules/acl/permissions.constants.ts` | Exact permission strings (`users.view`, `maintenance.collect`, `hall_bookings.approve`, …) | `src/acl/permissions.ts` (copied 1:1) |
| `backend/src/utils/api-response.ts` | `{success, data}` / `{success, data, pagination}` / `{success:false, error:{code,message}}` envelope | `src/api/types.ts`, every endpoint module |
| Each module's `*.controller.ts` | Real route paths, incl. nested ones (`/users/:id/roles`, `/maintenance-bills/:id/payments`, `/announcements/:id/send`, `/hall-bookings/:id/approve\|reject\|cancel`) | `src/api/endpoints/*.ts` (path + comment citing the controller file/line) |
| `frontend/app/layout.tsx`, `tailwind.config.ts` | App name **SocietyLedger**; ink/paper/brass/sage/rust palette; Fraunces + Inter + IBM Plex Mono | `src/theme/palette.ts`, `src/theme/typography.ts` |
| `frontend/components/home/*` | Hero copy, "What's pinned to the board" features, Stats, CTA | `src/features/landing/LandingScreen.tsx` (adapted for a phone, not a scaled-down desktop layout) |

No endpoint, permission name, or response field in this app was invented —
if something wasn't visible in the repo (e.g. exact validator regexes,
optional fields), the client stays permissive rather than guessing a
stricter shape.

## Architecture

```
src/
  api/            axios client (refresh-token rotation), typed endpoint
                  modules per backend module, shared response types
  acl/            permission constants + hasPermission() + <PermissionGate>
  store/          zustand auth store (login, logout, session restore)
  theme/          palette/typography pulled from the web app + light/dark
  navigation/     PublicStack (Landing→Login) → AppStack (tabs + detail
                  screens), swapped based on auth status
  components/ui/  Button, Card, StatusPill, loading/empty/error states,
                  EntityListScreen (shared paginated-list-with-pull-to-
                  refresh, since every list endpoint shares one envelope)
  features/       one folder per screen/module
```

**Auth & session**: tokens live in `expo-secure-store` (iOS Keychain /
Android Keystore), never in AsyncStorage or Zustand's own state. A 401
triggers one refresh attempt (`POST /auth/refresh`, matching the backend's
rotate-and-revoke behavior) before the original request is replayed; if
refresh itself fails, the store is forced back to `signedOut` and the
navigator drops the user on the Landing screen. Logout calls `POST
/auth/logout` best-effort and always clears local state regardless of
whether that call succeeds.

**Permissions**: `hasPermission()` / `<PermissionGate>` read the
`permissions: string[]` array that login returned — never role names. Tabs,
Dashboard quick-links, and screen actions (delete, approve, send, collect
payment, assign role) are each wrapped individually. This is a UX
convenience only: the backend's `authorize()` middleware is the real
authority, and a 403 from the server is surfaced as-is, never bypassed or
retried.

**Multi-tenancy**: `society_id` is never sent by the client for anything —
it's established server-side from the JWT on every request
(`authenticate.middleware.ts`), matching the backend's own comment that
`req.currentUser` is the only source of truth for it.

## Screens delivered fully wired

- Landing (public) → Login → session-aware redirect into the app shell
- **About us** and **Contact us** — adapted from the real
  `frontend/app/about/page.tsx` and `frontend/app/contact/page.tsx`. The
  Contact form intentionally does **not** call any API: the source
  `ContactForm.tsx` is a static demo (its own code comment says so), and
  there is no `contact`/`message`/`inquiry` module anywhere in
  `backend/src/modules` — so this screen validates locally and shows the
  same "message received, nothing was actually sent" confirmation the web
  app shows. Wire it to a real endpoint if/when one exists.
- **Terms & Conditions** — unlike About/Contact, this page **does not
  exist anywhere in the source repo** (no `terms/` or `legal/` route). Real
  legal copy wasn't invented for it; `TermsScreen.tsx` is a clearly-labeled
  placeholder shell with section headings only, meant to be replaced with
  your organization's actual reviewed Terms before shipping — see the
  comment at the top of that file.
- Dashboard (permission-gated quick links)
- **Users** — list (search), detail (permissions, activate/deactivate,
  delete), **create**, **edit**
- **Roles** — list, detail (toggle permission grants live via switches,
  delete), **create**, **edit**
- **Flats** — list, **detail (new)**, **create**, **edit**, delete
- **Expenses** — list, **detail (new)**, **create**, **edit**, approve/reject, delete
- **Announcements** — list, detail (send, delete), **create**, **edit**
  (with priority and optional role targeting)
- **Maintenance** — list, detail (record/list payments), **create**, **edit**, delete
- Hall Bookings: list, detail (approve/reject/cancel) — **not** given the
  same create/edit/delete treatment as the six modules above; see the
  field-accuracy note below before building on it
- Permissions, Societies, Notifications (mark read/all-read)
- Profile (identity + roles + full permission list) and a More screen that
  gathers everything that doesn't fit the tab bar (module links are
  permission-gated; About/Contact/Terms are not, since they're public info)

## A field-accuracy correction (read this before extending anything below)

An earlier pass of this app assumed the backend was uniformly snake_case,
request and response alike. That assumption was wrong, and Flats,
Expenses, Maintenance, Announcements, and Users' active-toggle field were
all built against invented field names as a result. This was caught and
fixed by re-reading the actual validators, service `Input` interfaces, and
entity files — not by inference. What's actually true, verified against
the source:

- **Request bodies are camelCase everywhere** (Joi validators + each
  service's `Create*Input`/`Update*Input`: `unitNo`, `billingYear`,
  `isActive`, `expenseDate`, `vendorName`, `targetRoleIds`, ...).
- **Response bodies are the raw TypeORM entity — snake_case — unless the
  entity defines an explicit safe-serializer.** Only `User` has one
  (`toSafeJSON()`, in `domain/entities/user.entity.ts`), so User responses
  really are camelCase (`isActive`, `flatId`, `createdAt`). Every other
  entity used here (`Flat`, `Expense`, `MaintenanceBill`,
  `MaintenancePayment`, `Announcement`, `Role`, `Permission`) has no such
  method, so its response is genuinely snake_case.
- Concretely: `Flat` has no `unit_number`/`status` — it's `unit_no`,
  `block`, `floor` (both required strings), `owner_id`, `sqft`,
  `price_per_sqft`, `fix_price`. `Expense` has no `incurred_on` — it's
  `expense_date`, `vendor_name`, `receipt_url`, and approving takes a body
  (`{decision: 'approved'|'rejected'}`), not a bare PATCH. `MaintenanceBill`
  has no `period`/`amount_paid` — it's `billing_year` + `billing_month`,
  `penalty`, `paid_at`, and list/detail responses are the bill merged with
  server-computed `totalPaid`/`outstanding` (real backend behavior,
  confirmed in `maintenance.controller.ts`'s `serializeBillWithOutstanding`
  — not a client invention). `Announcement` has no `is_sent` boolean — it's
  a nullable `sent_at`, plus a `priority` enum and role-based targeting via
  `targetRoleIds` that didn't exist in the earlier build at all.
- Every type in `src/api/types.ts` now has a comment stating which side
  (request/response) it describes and where it was verified — extend that
  pattern rather than assuming casing when adding new fields.
- **`HallBooking`, `Society`, and `AppNotification` were NOT re-verified
  this same way.** A spot-check of `hall-bookings.service.ts`'s
  `CreateHallBookingInput` (`hallName`/`bookingDate`/`timeSlot`/`deposit`/
  `amount`) suggests `src/api/types.ts`'s `HallBooking` and
  `hall-bookings.ts` are likely wrong in the same way Flats/Expenses were —
  treat Hall Bookings' existing list/detail screens as unverified, and run
  them through the same read-the-actual-source process before adding
  create/edit/delete there.

## Logging & debugging

Built to make "it's broken on my phone" actually diagnosable without a
Metro terminal attached:

- **`src/lib/logger.ts`** — an in-memory ring buffer (last 300 entries,
  debug/info/warn/error levels) that every subsystem writes to: API
  requests/responses/errors (`src/api/client.ts`), auth lifecycle
  (`src/store/authStore.ts`: login attempts, session restore, forced
  sign-outs), and screen navigation (`RootNavigator.tsx`). It redacts the
  exact same key list as the backend's own winston logger
  (`backend/src/infrastructure/logging/logger.ts`'s `SENSITIVE_KEYS`) — so
  passwords/tokens can never end up in a shared log even by accident.
- **Request-ID correlation** — every API call gets a client-generated
  `x-request-id` header. The backend's `requestIdMiddleware` accepts and
  echoes back a client-supplied ID rather than minting its own, so that
  exact string shows up in the server's structured logs too — pairing a
  mobile log entry with the matching backend log entry is just "search
  both logs for this string." `ApiRequestError` carries it as `.requestId`,
  and it's surfaced in the UI (Login screen's error box, every list/detail
  screen's `ErrorState`) as a "Reference: …" line.
- **Global error handling** — `src/components/ErrorBoundary.tsx` catches
  React render crashes with a recoverable fallback screen instead of a raw
  red screen; `src/lib/globalErrorLogging.ts` (installed once in `App.tsx`)
  catches everything else — synchronous JS errors via RN's `ErrorUtils` and
  unhandled promise rejections. Both log to the same ring buffer.
- **Log Viewer screen** (`src/features/debug/LogViewerScreen.tsx`) — live,
  filterable by level and free text, with Share (dumps as plain text via
  the native share sheet) and Clear. Reachable two places on purpose: the
  Login screen ("Trouble signing in? View diagnostic log" — since
  auth/network issues are exactly what needs this most, and it has to work
  *before* the user is signed in) and the signed-in More screen's
  "Developer" section.

This is intentionally the *local* half of the story — there's no remote
crash-reporting SDK (Sentry, Bugsnag, etc.) wired in, since that's a new
account/DSN/privacy decision that wasn't this pass's call to make. Swap
`logger`'s `push()` method to also forward to one later without touching
any of the ~15 call sites that log through it.

## What's intentionally left as a next step

- **Real Terms & Conditions copy** — see above; this is the one screen in
  the app that's a placeholder rather than sourced from the repo.
- **Hall Bookings create/edit/delete** — not built this pass; its
  underlying types are flagged as unverified above and should be corrected
  first (same process used for Flats/Expenses/Maintenance/Announcements).
- **Push notifications** (device token registration) aren't wired — the
  backend's `notifications/channels/push.channel.ts` exists but registering
  an Expo push token against it wasn't in scope for this pass.
- **Offline caching** beyond TanStack Query's in-memory cache (e.g.
  persisting the query cache) isn't set up.
- **Remote log/crash reporting** isn't wired in — see "Logging &
  debugging" above; the local ring buffer + Share action is the current
  mechanism for getting diagnostics off a device.
- Verified with `npm install && npx tsc --noEmit` (zero errors, Expo ~54 /
  React 19 / RN 0.81) but not run through `expo start` or against a live
  backend in this environment — set `expo.extra.apiBaseUrl` in `app.json`
  (or `EXPO_PUBLIC_API_BASE_URL`) to your real backend host first. Type
  correctness against the real backend contract is not the same as runtime
  correctness — test each new form against a real running backend before
  trusting it further than "it compiles."

## Setup

```bash
npm install
# point at your backend:
#   edit app.json -> expo.extra.apiBaseUrl, or export EXPO_PUBLIC_API_BASE_URL
npm run start
```
