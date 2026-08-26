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
- Users: list, detail (view permissions, activate/deactivate, delete)
- Maintenance: list, detail (record/list payments)
- Announcements: list, detail (edit, send)
- Hall Bookings: list, detail (approve/reject/cancel)
- Flats, Expenses, Roles, Role detail, Permissions, Societies,
  Notifications (mark read/all-read)
- Profile (identity + roles + full permission list) and a More screen that
  gathers everything that doesn't fit the tab bar (module links are
  permission-gated; About/Contact/Terms are not, since they're public info)

## What's intentionally left as a next step

- **Real Terms & Conditions copy** — see above; this is the one screen in
  the app that's a placeholder rather than sourced from the repo.
- **Create/edit forms** for Flats, Expenses, Roles-permission-assignment,
  and Maintenance-bill creation are stubbed at the API layer
  (`src/api/endpoints/*`) but don't yet have a form screen — the pattern to
  follow is `LoginScreen.tsx` (react-hook-form + zod) plus the mutation
  pattern in `UserDetailScreen.tsx`.
- **Push notifications** (device token registration) aren't wired — the
  backend's `notifications/channels/push.channel.ts` exists but registering
  an Expo push token against it wasn't in scope for this pass.
- **Offline caching** beyond TanStack Query's in-memory cache (e.g.
  persisting the query cache) isn't set up.
- Verified with `npm install && npx tsc --noEmit` (zero errors, Expo ~54 /
  React 19 / RN 0.81) but not run through `expo start` or against a live
  backend in this environment — set `expo.extra.apiBaseUrl` in `app.json`
  (or `EXPO_PUBLIC_API_BASE_URL`) to your real backend host first.

## Setup

```bash
npm install
# point at your backend:
#   edit app.json -> expo.extra.apiBaseUrl, or export EXPO_PUBLIC_API_BASE_URL
npm run start
```
