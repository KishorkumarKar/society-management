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
| `/admin/dashboard/acl`               | super-admin only    | Static role × module permission matrix |

**Events** sits in the sidebar as an expandable parent with three children —
*All Events*, *Collections*, *Expenses* — matching a typical accounting
workflow: create an event (e.g. a Halloween party), then track who in the
society has paid what towards it (Collections) against what the event cost
(Expenses). Opening a single event lands on its **Details** tab by default,
with **Collections** and **Expenses** as two more tabs scoped to just that
event.

**ACL** is a static role × module × action matrix for now
(`data/acl.json`, shaped like a future `GET /api/acl` response) — it
documents intended permissions but doesn't yet gate individual actions;
the console still gates whole pages by role via `AdminGuard` /
`RequireRole`. Swap the import in `app/admin/dashboard/acl/page.tsx` for a
live fetch once a real ACL endpoint exists.

A **society admin** only ever sees and manages their own society's users and
notices. A **super-admin** manages every society, and is the only role that
can list/add/edit societies themselves. Residents get read-only access to
the same console shell — Overview, a filterable **Members** directory, and
view-only **Events** (open one to see its Details, Collections and
Expenses tabs, with no add/edit/delete controls). Committee members and
security accounts still land on the plain `/dashboard` (society info +
noticeboard + directory).

## Authentication (static, client-side only)

Login asks for **Society**, **Email or Phone**, and **Password**, checked
against `data/users.json` in the browser. A matched session is kept in
`sessionStorage`. After login, admins and the super-admin are routed
straight to `/admin/dashboard`; everyone else goes to `/dashboard`.

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
          collections/       This event's collections — list · new/ · [collectionId]/edit/
          expenses/          This event's expenses — list · new/ · [expenseId]/edit/
      acl/
        page.tsx          Static role × module permission matrix (super-admin only)
  layout.tsx             Root layout: fonts, DataProvider, AuthProvider
  globals.css
components/
  layout/                Header, Footer (hidden on /admin routes)
  ui/                     Button, Card, Input, Select, Textarea, Badge, ...
  home/                   Landing page sections + contact form
  login/                  LoginForm
  dashboard/              DashboardView (read-only, non-admin roles)
  admin/                  AdminGuard, AdminSidebar, AdminTopbar, PageHeader,
                           StatCard, ConfirmDeleteButton, RequireRole,
                           forms/ (UserForm, NoticeForm, SocietyForm)
context/
  AuthContext.tsx         Static-JSON auth (Context + sessionStorage)
  DataContext.tsx         In-memory "database" seeded from JSON, with
                           add/update/delete for societies, users, notices
lib/
  types.ts                Shared TypeScript types + UserRole
  data.ts                 Pure helper functions over the live data arrays
data/
  societies.json  users.json  plans.json  notices.json
  events.json  collections.json  expenses.json  acl.json
```

## Design

An ink-navy, brass-accented "society noticeboard / ID ledger" identity on
the public site (Fraunces + Inter + IBM Plex Mono), and a conventional
sidebar + topbar admin panel — dense tables, stat cards, inline
list/add/edit forms — for the console itself.
