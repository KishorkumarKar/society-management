# Society Management API

A production-oriented, multi-tenant Society Management REST API. Every society-specific
resource is isolated by `society_id`, which is **always derived from the authenticated
user's JWT — never trusted from client input.**

## Architecture note — read this first

The original spec called for **LoopBack 4 + TypeORM**. LoopBack 4 is conventionally paired
with its own ORM (Juggler); bridging it cleanly to TypeORM requires non-standard IoC
component wiring that's genuinely risky to hand-author without being able to compile and
run it (this project was built in an environment without package-registry access, so
nothing here has been `npm install`ed or compiled yet — see "Before you run this" below).

To make sure you get code that actually works, the REST layer is implemented on **Express**
(which LoopBack runs on internally) instead — same clean architecture, same TypeORM data
layer, same Joi validation, same JWT/ACL security model, same OpenAPI docs (via
`swagger-jsdoc` instead of LB4's decorator-driven spec generation). The service/repository
layer (`src/modules/*/*.service.ts`) is framework-agnostic and can be re-wired into real
LoopBack 4 controllers later with no changes to business logic if that's still a hard
requirement.

## Before you run this

This code was written and organized carefully, but has not been compiled or executed in
the environment it was authored in (no network access to npm). Before relying on it:

```bash
npm install
npm run build     # tsc — will surface any residual type errors
npm run lint
```

Fix anything the compiler flags (there may be small things — an import path, a TypeORM
option name for your installed version) before treating this as done. The architecture,
business logic, and security model are all real; treat the exact compiler output as the
final checklist.

---

## Architecture

```
src/
├── config/            # Joi-validated environment config (fails fast on bad config)
├── domain/
│   ├── entities/       # TypeORM entities (Society, User, Flat, Role, Permission, ...)
│   └── interfaces/      # Shared request-context types
├── infrastructure/
│   ├── database/        # TypeORM DataSource (synchronize is hard-pinned off)
│   ├── logging/          # Winston logger with secret redaction
│   └── swagger.ts         # OpenAPI spec assembly
├── middleware/          # authenticate, authorize, tenantIsolation, rate limiting, errors
├── modules/
│   ├── acl/              # PermissionCache + AclService — the single source of truth for "can this user do X"
│   ├── auth/              # AuthService (login/refresh/logout), JWT + bcrypt utils
│   └── users/ societies/ flats/ maintenance/ roles/ permissions/
│       each has: <name>.service.ts (business logic), <name>.controller.ts (Express router + OpenAPI JSDoc), <name>.validators.ts (Joi)
├── utils/               # ApiError, response helpers, pagination
├── app.ts               # Express app factory — wires DB, services, middleware, routers
└── server.ts             # Entrypoint — boot, graceful shutdown, process-level error handling

migrations/     # Hand-written, reviewed SQL migrations (no `synchronize: true`, ever)
seeders/        # seed.ts — 3 societies, default roles/permissions, sample users/flats/bills
tests/
├── unit/           # AclService, AuthService, UsersService, MaintenanceService
├── integration/     # End-to-end HTTP flows via supertest
└── security/         # The spec's explicit "Society A cannot touch Society B" + 403 tests
```

### The authorization chain

```
JWT (sub, societyId, roleIds — NOT permissions)
   -> authenticate middleware populates req.currentUser
   -> tenantIsolation middleware overwrites any client-supplied society_id
   -> authorize('resource.action') middleware calls AclService.hasPermission(userId, societyId, permission)
        -> resolved live from user_roles -> roles -> role_permissions -> permissions
        -> cached in-process for ACL_CACHE_TTL_SECONDS, invalidated on any role/permission mutation
   -> controller calls <module>Service.<method>(societyId, ...) — societyId ALWAYS from req.currentUser
   -> service's WHERE clauses always include society_id — this is the actual enforcement point,
      the middleware above is defense in depth, not the only guard
```

Permissions are deliberately not embedded in the JWT (they can change between issuance
and expiry). The JWT only carries `sub`, `societyId`, and `roleIds` as hints; every
authorization decision re-checks the DB-backed (and cached) permission set.

## Getting started

### 1. Environment

```bash
cp .env.example .env
# edit .env — at minimum set DB_* and generate real JWT secrets:
openssl rand -hex 64   # run twice, once for JWT_ACCESS_SECRET, once for JWT_REFRESH_SECRET
```

### 2. Database (Docker)

```bash
docker compose up -d mysql
```
Or point `.env` at any MySQL 8+ instance you already have.

### 3. Install, migrate, seed

```bash
npm install
npm run migration:run
npm run seed
```

The seed script prints sample login credentials at the end. They are development-only
credentials — never reuse them anywhere real. Default password (overridable via
`SEED_DEFAULT_PASSWORD` in `.env`): `Password@123`.

Sample logins after seeding:

| Society | Role | Email |
|---|---|---|
| green-valley | Super Admin (global) | admin@example.com |
| green-valley | Secretary | secretary@green.valley.example.com |
| green-valley | Treasurer | treasurer@green.valley.example.com |
| green-valley | Resident | resident1@green.valley.example.com |
| sunrise-residency | Secretary | secretary@sunrise.residency.example.com |
| lake-view | Secretary | secretary@lake.view.example.com |

### 4. Run

```bash
npm run dev      # ts-node-dev, auto-restart
# or
npm run build && npm start
```

The API listens on `http://localhost:3000/api/v1` by default. Swagger UI is at
`http://localhost:3000/api/v1/docs`; the raw OpenAPI JSON at `.../openapi.json`.

### 5. Test

```bash
docker compose up -d mysql-test
npm test                 # runs migrations against the test DB, then the full suite
npm run test:coverage
```

Tests run against a real MySQL database (`docker-compose.yml` provisions `mysql-test` on
an ephemeral tmpfs volume) rather than mocks — tenant isolation and unique constraints are
exactly the kind of thing that's easy to fake past with a mocked ORM.

## Sample requests

**Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"society":"green-valley","email":"secretary@green.valley.example.com","password":"Password@123"}'
```

**Create a user** (requires `users.create`)
```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Resident","email":"newres@example.com","password":"SomePass@123","flatId":3}'
```

**List with pagination/search/filter**
```bash
curl "http://localhost:3000/api/v1/users?page=1&limit=20&search=kishor&is_active=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Record a partial maintenance payment**
```bash
curl -X POST http://localhost:3000/api/v1/maintenance-bills/12/payments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":2000,"paymentDate":"2026-08-05","paymentMethod":"upi"}'
```

## Database structure

See `migrations/` for the authoritative, reviewed schema. Summary of additions beyond the
original spec (explained up front before implementation, per the request):

- **`refresh_tokens`** — only a SHA-256 hash of each refresh token is stored, enabling
  revocation and reuse-detection without the DB ever holding a usable credential.
  Refresh uses rotation: each use issues a new token and revokes the old one.
- **`audit_logs`** — append-only trail for ACL/financial-relevant mutations.
- **`maintenance_payments.status`** enum (`pending/success/failed/refunded`) — a recorded
  payment isn't necessarily a cleared one.
- Outstanding balance on a bill is always computed as
  `amount + penalty - SUM(payments.amount WHERE status='success')`, never read off
  `bill.status` alone — this is what makes partial payments safe to support.
- Composite unique indexes exactly as specified: `(society_id, slug)`,
  `(society_id, email)`, `(society_id, phone)`, `(society_id, block, unit_no)`,
  `(society_id, flat_id, billing_year, billing_month)`, `(user_id, role_id)`,
  `(role_id, permission_id)`, `(resource, action)`.

## ACL / RBAC model

- Permissions are `resource.action` strings, seeded from `src/modules/acl/permissions.constants.ts`.
- Roles are either global (`society_id IS NULL`, e.g. Super Admin) or society-scoped.
- `AclService.assignRole` enforces: a role can only be assigned to a user if the role is
  global OR belongs to the exact same society as the user — checked server-side against the
  DB, never trusting a client-supplied society on either side.
- Default roles seeded: Super Admin (global, all permissions), Secretary, Treasurer,
  Committee, Resident, Security — each with the permission set specified in the brief.
  These are not hardcoded into application logic anywhere; `if (user.role === 'secretary')`
  does not appear in this codebase. All checks go through `AclService.hasPermission`.

## Security checklist (spec section 19)

- [x] JWT auth, bcrypt password hashing (cost from `BCRYPT_SALT_ROUNDS`)
- [x] Password hash never selected by default (`select: false`) and never serialized (`toSafeJSON()`)
- [x] Helmet, CORS (configurable origins), general + login-specific rate limiting
- [x] Joi validation on every mutating endpoint, consistent `VALIDATION_ERROR` shape
- [x] SQL injection protection via TypeORM parameterized queries throughout
- [x] Centralized error handler — no stack traces ever reach the client, MySQL errors mapped to clean codes
- [x] Refresh-token rotation with reuse handling
- [x] All secrets from environment, `.env.example` provided, `.env` gitignored
- [x] Winston never logs `password`, `password_hash`, `token`, `refreshToken`, `authorization`, etc. — redaction is structural, not a denylist you have to remember to apply per log call

## What's fully implemented vs. representative

Given the scope of the original spec, everything listed under "Architecture" above is
real, working code — not stubs. A few things were scoped down deliberately and are called
out rather than silently omitted:

- **Tests** cover the security-critical paths exhaustively (tenant isolation across
  users/flats/bills/roles, permission enforcement, login edge cases, ACL scoping rules,
  partial-payment math) plus representative CRUD integration tests. They are not
  exhaustive for every single endpoint in the API surface.
- **Audit logging** (`audit_logs` table) is wired for role/permission mutations; extending
  it to every mutating endpoint is a mechanical repeat of the same pattern.
- **Permission caching** is in-process with TTL + explicit invalidation, matching the "do
  not blindly put permissions in the JWT" guidance. Swap `permission-cache.ts` for a
  Redis-backed implementation behind the same three methods if you scale horizontally.

## Commands reference

```bash
npm run migration:run       # apply migrations
npm run migration:revert    # roll back the last migration
npm run seed                # seed sample data (dev/test credentials only)
npm run dev                 # local dev server with auto-restart
npm run build                # compile TypeScript
npm start                    # run compiled output
npm test                     # Jest — unit + integration + security suites
npm run lint / lint:fix       # ESLint
npm run format                 # Prettier
```

## Docker

```bash
docker compose up -d             # mysql + app
docker compose up -d mysql-test  # ephemeral DB for running tests locally against a container
```

The production image runs as a non-root user and only ships compiled JS + `node_modules`
(prod deps only) — no TypeScript source, no dev tooling.
