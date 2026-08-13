# SocietyLedger — Multi-Society Management System (Frontend)

A frontend-only, multi-society housing management system with a full,
role-based admin console. Built with:

- **Next.js 16** (App Router, route groups)
- **TypeScript** — every file is `.ts` / `.tsx`
- **Tailwind CSS**
- **React Hooks + Context** for state (no external state library)
- **Static JSON** as the only data source (no backend, no database)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Routes

### Public site
| Route      | Purpose                                     |
|------------|----------------------------------------------|
| `/`        | Home                                          |
| `/about`   | About Us                                      |
| `/pricing` | Pricing (static plans from JSON)              |
| `/contact` | Contact Us                                    |
| `/login`   | Society + Email/Phone + Password sign in      |

### Admin console (role-gated, sidebar shell)
| Route                              | Who sees it        | Purpose                        |
|-------------------------------------|---------------------|---------------------------------|
| `/admin/dashboard`                  | admin, super-admin  | Overview / stats                |
| `/admin/dashboard/users`            | admin, super-admin  | List users                      |
| `/admin/dashboard/users/new`        | admin, super-admin  | Add user                        |
| `/admin/dashboard/users/[id]/edit`  | admin, super-admin  | Edit / delete user               |
| `/admin/dashboard/notices`          | admin, super-admin  | List notices                    |
| `/admin/dashboard/notices/new`      | admin, super-admin  | Add notice                      |
| `/admin/dashboard/notices/[id]/edit`| admin, super-admin  | Edit / delete notice             |
| `/admin/dashboard/societies`        | super-admin only    | List societies                  |
| `/admin/dashboard/societies/new`    | super-admin only    | Add society                     |
| `/admin/dashboard/societies/[id]/edit` | super-admin only | Edit / delete society            |
| `/admin/dashboard/events`            | admin, super-admin  | All Events — list                |
| `/admin/dashboard/events/new`        | admin, super-admin  | Add event                        |
| `/admin/dashboard/events/collections`| admin, super-admin  | Collections — every member payment, across all events |
| `/admin/dashboard/events/expenses`   | admin, super-admin  | Expenses — every line item, across all events |
| `/admin/dashboard/events/[id]`       | admin, super-admin  | One event — **Details** tab (default) |
| `/admin/dashboard/events/[id]/edit`  | admin, super-admin  | Edit / delete event               |
| `/admin/dashboard/events/[id]/collections` | admin, super-admin | **Collections** tab — this event's member payments (+ new/edit) |
| `/admin/dashboard/events/[id]/expenses`    | admin, super-admin | **Expenses** tab — this event's spend (+ new/edit) |
| `/admin/dashboard/acl`               | super-admin only    | Access control — tab-per-module permission grid |
| `/admin/dashboard/security`                | admin, super-admin, security | Security Dashboard — guard/shift/visitor summary |
| `/admin/dashboard/members`                 | resident             | Read-only, filterable member directory |
| `/admin/dashboard/security/guards`         | admin, super-admin  | List / search / filter guards |
| `/admin/dashboard/security/guards/new`     | admin, super-admin  | Add guard |
| `/admin/dashboard/security/guards/[id]`    | admin, super-admin  | View guard (+ their assigned shifts) |
| `/admin/dashboard/security/guards/[id]/edit` | admin, super-admin | Edit / delete guard |
| `/admin/dashboard/security/shifts`         | admin, super-admin  | List / filter shifts (by date, guard, status) |
| `/admin/dashboard/security/shifts/new`     | admin, super-admin  | Create shift (12H / 8H / Half Day presets, or custom) |
| `/admin/dashboard/security/shifts/[id]`    | admin, super-admin  | View shift, with the assigned guard shown clearly |
| `/admin/dashboard/security/shifts/[id]/edit` | admin, super-admin | Edit / delete shift |
| `/admin/dashboard/security/visitors`       | admin, super-admin, security | Visitor list — quick filters, filters, client-side pagination |
| `/admin/dashboard/security/visitors/new`   | admin, super-admin, security | Register a visitor (entry flow) |
| `/admin/dashboard/security/visitors/[id]`  | admin, super-admin, security | Visitor Details — full record + Mark Out |
| `/admin/dashboard/security/visitors/[id]/edit` | admin, super-admin, security | Edit visitor entry |

**Events** sits in the sidebar as an expandable parent with three children —
*All Events*, *Collections*, *Expenses* — matching a typical accounting
workflow: create an event (e.g. a Halloween party), then track who in the
society has paid what towards it (Collections) against what the event cost
(Expenses). Opening a single event lands on its **Details** tab by default,
with **Collections** and **Expenses** as two more tabs scoped to just that
event — each tab fetches only its own event's rows, never the full
cross-event list.

**Security** is the other expandable sidebar group — *Dashboard*, *Guards*,
*Shifts*, *Visitors* — for guard roster management, shift scheduling, and
the visitor in/out desk:
- **Guards**: add/edit/delete, search by name/code/phone, filter by
  Active/Inactive, and a View page listing that guard's assigned shifts.
- **Shifts**: `shift_type` is `12H` / `8H` / `HALF_DAY` / `CUSTOM` with
  preset start/end time options per type (see `SHIFT_TYPE_PRESETS` in
  `lib/data.ts`) — duration is computed automatically from the times,
  including overnight shifts that cross midnight. Filter by date, guard,
  and status; the assigned guard is always shown, in the list, the View
  page, and the form.
- **Visitors**: the entry flow is flat → name → phone → vehicle → type →
  purpose → persons → save, with in-date/time stamped automatically.
  **Mark Out** stamps `outDate`/`outTime` and is a no-op if the visitor is
  already out. The list has quick filters (Currently Inside / Today's
  Visitors / Completed Visits), full filters (date, flat, type, status,
  search), and is client-side paginated — the slice in
  `visitors/page.tsx` is exactly where a real `?page=&pageSize=&...`
  API call would plug in. Visitor Details is its own route so opening one
  visitor never pulls in the full list.
- Security desk (`security` role) users get Dashboard and Visitors
  (their operational job); Guards/Shifts scheduling stays admin/super-admin
  only.

**ACL** is a tab-per-module permission grid (`data/acl.json`, shaped like a
future `GET /api/acl` response) — one tab per module (Users, Notices,
Events, Collections, Expenses, Societies, Security Guards, Security
Shifts, Visitors, ACL), and only the active tab's table is mounted at a
time. Each module only renders the action columns it actually supports
(`MODULE_ACTIONS` in `lib/types.ts`) — ACL itself is view/edit only,
Visitors adds `mark_in`/`mark_out`. Clicking a cell toggles that
role/module/action; a role/module pair missing from the data starts fully
unchecked. It documents intended permissions but doesn't yet gate
individual actions — the console still gates whole pages by role via
`AdminGuard` / `RequireRole`. Swap the reads/writes in
`app/admin/dashboard/acl/page.tsx` for live `GET`/`PUT /api/acl` calls
once a real backend endpoint exists.

A **society admin** only ever sees and manages their own society's users,
notices, events, and security data. A **super-admin** manages every
society, and is the only role that can list/add/edit societies or edit
ACL. Residents get read-only console access — Overview, a filterable
**Members** directory, and view-only **Events** (open one to see its
Details, Collections and Expenses tabs, no add/edit/delete controls).
Security desk accounts get Overview, the Security Dashboard, and the
Visitors desk (create/edit/mark out, no guard/shift management, no
delete). Committee members are the only role still on the plain
`/dashboard` (society info + noticeboard + directory).

## Authentication (static, client-side only)

Login asks for **Society**, **Email or Phone**, and **Password**, checked
against `data/users.json` in the browser. A matched session is kept in
`sessionStorage`. After login, admin, super-admin, resident, and security
accounts are routed to `/admin/dashboard`; committee accounts go to
`/dashboard`.

### Demo logins

| Society (pick in dropdown)         | Email                              | Password       | Role         |
|-------------------------------------|-------------------------------------|----------------|--------------|
| Platform — Super Admin              | meera.iyer@societyledger.test       | superadmin123  | Super Admin  |
| Greenwood Residency                 | anjali.deshmukh@greenwood.test      | greenwood123   | Society Admin|
| Greenwood Residency                 | rohan.kulkarni@greenwood.test       | resident123    | Resident     |
| Palm Meadows CHS                    | priya.nair@palmmeadows.test         | committee123   | Committee    |
| Palm Meadows CHS                    | vikram.shetty@palmmeadows.test      | resident123    | Resident     |
| Silver Oak Enclave                  | karan.malhotra@silveroak.test       | admin123       | Society Admin|
| Silver Oak Enclave                  | simran.kaur@silveroak.test          | security123    | Security     |
| Silver Oak Enclave                  | neha.kapoor@silveroak.test          | resident123    | Resident     |

> All CRUD (add/edit/delete) happens in memory via React state, seeded from
> the JSON files. There's no backend, so changes last for the browser
> session and reset on a full reload — this is a frontend, data-source-only
> demo by design.

## Folder structure

```
app/
  (site)/              Public marketing site (route group, own Header/Footer)
    about/ contact/ dashboard/ login/ pricing/  page.tsx
  admin/
    layout.tsx          Wraps every /admin/* route in AdminGuard (auth + shell)
    dashboard/
      page.tsx           Overview
      users/             list · new/ · [id]/edit/
      notices/           list · new/ · [id]/edit/
      societies/         list · new/ · [id]/edit/   (super-admin only)
      events/
        page.tsx          All Events — list
        new/               Add event
        collections/       Collections — aggregate across all events
        expenses/          Expenses — aggregate across all events
        [id]/
          layout.tsx        Event header + Details/Collections/Expenses tabs
          page.tsx          Details (default)
          edit/              Edit / delete event
          collections/       This event's collections — list · new/ · [collectionId] view/edit
          expenses/          This event's expenses — list · new/ · [expenseId] view/edit
      security/
        page.tsx          Security Dashboard — summary cards only
        guards/           list · new/ · [id] view/edit  (admin/super-admin)
        shifts/           list · new/ · [id] view/edit  (admin/super-admin)
        visitors/         list (filters + quick filters + pagination) ·
                           new/ · [id] view (+ Mark Out) · [id]/edit
                           (admin/super-admin/security)
      members/
        page.tsx          Read-only, filterable member directory (resident)
      acl/
        page.tsx          Tab-per-module permission grid (super-admin only)
  layout.tsx             Root layout: fonts, DataProvider, AuthProvider
  globals.css
components/
  layout/                Header, Footer (hidden on /admin routes)
  ui/                     Button, Card, Input, Select, Textarea, Badge, ...
  home/                   Landing page sections + contact form
  login/                  LoginForm
  dashboard/              DashboardView (read-only, committee role only)
  admin/                  AdminGuard, AdminSidebar, AdminTopbar, PageHeader,
                           StatCard, ConfirmDeleteButton, RequireRole,
                           forms/ (UserForm, NoticeForm, SocietyForm,
                           EventForm, CollectionForm, ExpenseForm,
                           GuardForm, ShiftForm, VisitorForm)
context/
  AuthContext.tsx         Static-JSON auth (Context + sessionStorage)
  DataContext.tsx         In-memory "database" seeded from JSON, with
                           add/update/delete for every entity plus
                           markVisitorOut and toggleAclPermission
lib/
  types.ts                Shared TypeScript types + UserRole + MODULE_ACTIONS
  data.ts                 Pure helper functions over the live data arrays
data/
  societies.json  users.json  plans.json  notices.json
  events.json  collections.json  expenses.json
  security-guards.json  security-shifts.json  visitors.json
  acl.json
```

## Design

An ink-navy, brass-accented "society noticeboard / ID ledger" identity on
the public site (Fraunces + Inter + IBM Plex Mono), and a conventional
sidebar + topbar admin panel — dense tables, stat cards, inline
list/add/edit forms — for the console itself.
