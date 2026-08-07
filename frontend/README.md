# SocietyLedger — Multi-Society Management System (Frontend)

A frontend-only, multi-society housing management system built with:

- **Next.js 16** (App Router)
- **TypeScript** — every file is `.ts` / `.tsx`, no plain JavaScript
- **Tailwind CSS** for styling
- **React Hooks** + Context for state (no external state library)
- **Static JSON** as the only data source (no backend/API, no database)

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Pages

| Route         | Purpose                                              |
|---------------|-------------------------------------------------------|
| `/`           | Home — hero, stats, features, society showcase, CTA   |
| `/about`      | About Us — mission, values, timeline                  |
| `/pricing`    | Pricing — three static plans loaded from JSON          |
| `/contact`    | Contact Us — info cards + a static (non-submitting) form |
| `/login`      | Society + email/phone + password login                |
| `/dashboard`  | Protected view: society info, noticeboard, member directory |

## Authentication (static, client-side only)

Login requires **Society**, **Email or Phone**, and **Password**. Credentials are
checked against `data/users.json` in the browser — there is no server. A
matched session is kept in `sessionStorage` via `context/AuthContext.tsx`.

### Demo logins

| Society             | Email                              | Phone       | Password       | Role      |
|---------------------|-------------------------------------|-------------|----------------|-----------|
| Greenwood Residency | anjali.deshmukh@greenwood.test      | 9820011223  | greenwood123   | Admin     |
| Greenwood Residency | rohan.kulkarni@greenwood.test       | 9820033445  | resident123    | Resident  |
| Palm Meadows CHS     | priya.nair@palmmeadows.test         | 9945566778  | committee123   | Committee |
| Palm Meadows CHS     | vikram.shetty@palmmeadows.test      | 9945112233  | resident123    | Resident  |
| Silver Oak Enclave   | karan.malhotra@silveroak.test       | 9911223344  | admin123       | Admin     |
| Silver Oak Enclave   | simran.kaur@silveroak.test          | 9911556677  | security123    | Security  |

## Folder structure

```
app/                  Route segments (App Router)
  about/  contact/  dashboard/  login/  pricing/
  layout.tsx  page.tsx  globals.css
components/
  layout/             Header, Footer
  ui/                 Reusable primitives (Button, Card, Input, Select, Badge, ...)
  home/                Landing page sections + contact form
  login/               LoginForm
  dashboard/           DashboardView
context/
  AuthContext.tsx      Static-JSON auth (React Context + sessionStorage)
lib/
  types.ts             Shared TypeScript types
  data.ts              Typed accessors over the JSON files
data/
  societies.json  users.json  plans.json  notices.json
```

## Design

A "society noticeboard / ID ledger" visual language: deep ink-navy surfaces,
brass accents (pinned notice dots, badges), warm paper cards, and a
serif/grotesque/mono type system (Fraunces, Inter, IBM Plex Mono) to evoke a
municipal register rather than a generic SaaS dashboard.
