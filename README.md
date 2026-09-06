# Cherry Sky Living — Frontend

Public website, tenant portal, and admin suite for the Cherry Sky Living kost (boarding house) platform in Medan, Indonesia. Built with [Next.js](https://nextjs.org/) 16 and [React](https://react.dev/) 19.

The REST API is documented separately in [README-Backend.md](./README-Backend.md). End-user instructions are in [docs/user-guide.md](./docs/user-guide.md).

## Features

| Area | Description |
|---|---|
| **Public website** | Homepage, property listings, room search, property/room detail pages, WhatsApp inquiry, contact, about, terms, and privacy |
| **Tenant portal** | Sign in, view leases and attached documents, respond to renewal prompts, manage profile and password |
| **Admin suite** | Dashboard, properties, unit types, units, pricing, leases, lease renewals, tenants, staff (superadmin), and bookkeeping |

Supported languages: **English** and **Indonesian** (`/en/...`, `/id/...`).

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4, custom Material-inspired design tokens ([DESIGN.md](./DESIGN.md))
- **Data:** TanStack Query, TanStack Form, TanStack Table
- **Auth:** [Better Auth](https://www.better-auth.com/) via backend session cookies (proxied through `/api/backend`)
- **i18n:** next-intl
- **Validation:** Zod
- **Lint/format:** Biome

## Prerequisites

- Node.js 20+
- A running instance of the [Cherry Sky Kost backend API](./README-Backend.md) (local or remote)

## Development

```bash
npm install
cp .env.example .env.local   # set API_URL to your backend
npm run dev                    # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run start      # serve production build
npm run lint       # biome check
npm run typecheck  # tsc --noEmit
npm run format     # biome format --write
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `API_URL` | yes | Backend base URL (no trailing slash), e.g. `http://localhost:8000` |

Browser requests go through the frontend proxy at `/api/backend/*` so session cookies stay first-party. See [.env.example](./.env.example) for staging and production examples.

## Project structure

```
src/
├── app/[locale]/           # Public pages + localized routes
│   ├── (system)/admin/     # Admin login + dashboard
│   ├── (system)/tenant/    # Tenant login + portal
│   ├── search-kosts/       # Room search
│   └── kosts/[id]/         # Property detail
├── components/             # Shared UI, kost cards, layout, sections
├── features/
│   ├── admin/              # Admin CRUD views and forms
│   └── tenant/             # Tenant portal views
├── lib/
│   ├── api/                # API client modules (admin, tenant, public)
│   ├── auth/               # Session helpers and guards
│   └── constants/          # App constants (e.g. booking deposit)
└── locales/                # en.json, id.json
```

## Key routes

| Route | Audience |
|---|---|
| `/` | Public homepage |
| `/search-kosts` | Search vacant rooms |
| `/kosts/[id]` | Property detail |
| `/contact`, `/about`, `/terms`, `/privacy` | Public info |
| `/tenant/login` | Tenant sign-in |
| `/tenant/leases` | Tenant lease list |
| `/tenant/lease-renewals` | Tenant renewal tracking |
| `/tenant/profile` | Tenant profile |
| `/admin/login` | Staff sign-in |
| `/admin` | Admin dashboard |
| `/admin/properties`, `/admin/units`, `/admin/leases`, … | Admin CRUD |

## Backend integration

- **Public data:** `GET /public/properties`, `GET /public/search`
- **Tenant:** `GET /leases`, `PUT /leases/:id/renewal`, `GET /profile`, `PUT /profile`, `PUT /profile/password`
- **Admin:** all `/admin/*` routes (requires `admin` or `superadmin` role)

Full request/response reference: [README-Backend.md](./README-Backend.md).

## Documentation

- [docs/user-guide.md](./docs/user-guide.md) — complete guide for visitors, tenants, and staff
- [README-Backend.md](./README-Backend.md) — REST API reference
- [DESIGN.md](./DESIGN.md) — brand colors and typography

## License

Private — Cherry Sky Living / Cherry Sky Kost.
