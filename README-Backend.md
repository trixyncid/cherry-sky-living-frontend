# Cherry Sky Kost — Backend API

REST API for the Cherry Sky Kost property management system, built with [Elysia](https://elysiajs.com/) on the Bun runtime.

## Development

```bash
bun run dev              # start with hot-reload on port 8000
bunx prisma generate     # regenerate client after schema changes
bunx prisma db push      # apply schema to the database
bun run db:seed          # seed SKYKOST, CHERRY KOST, tenants, and sample units
```

Base URL (local): `http://localhost:8000`

### Background jobs

Scheduled tasks run inside the same Elysia process via `@elysia/cron` (daily at **00:00:00**).

| Job | Schedule | What it does |
|---|---|---|
| `expire-leases` | `0 0 0 * * *` | Sets `occupied` units to `vacant` when their paid lease has ended and no other active paid lease covers the unit |
| `decline-lease-renewals` | `0 0 0 * * *` | Auto-declines renewals past the H-N confirmation deadline when the tenant took **no action** (`isRenewLease=false`). Does not auto-confirm tenants who already requested renewal |

### Billing model (calendar months)

- Unit pricing supports **monthly (30)** and **daily (1)** packages. Mid-month stub days use the admin-set **1-day** price (not monthly ÷ days). Full months use the 30-day price.
- Per-property settings (editable in admin property form): `paymentDueDay` (default 5), `lateFeePerDay` (default Rp 100.000), `renewalConfirmDaysBeforeEnd` (default 5). Snapshotted onto each lease at create.
- Unpaid leases expose computed `paymentDueDate`, `daysLate`, and `lateFeeAmount` on GET.
- Lease attachments are typed: `agreement` | `downpayment` | `payment` (multiple allowed).

Jobs only run while the server process is running.

All successful API responses use `{ "data": ... }` unless noted otherwise. List endpoints may also include `summary` or `meta` (see each route).

Rate limiting is enabled by default (`RATE_LIMIT_ENABLED=true`). Upload routes under `/admin/attachments` use a stricter tier (default 20 requests/minute).

### DigitalOcean Spaces (S3)

Set these in `.env` to use `lib/storage.ts`:

| Variable | Example |
|---|---|
| `DO_SPACES_KEY` | Spaces access key |
| `DO_SPACES_SECRET` | Spaces secret key |
| `DO_SPACES_BUCKET` | `my-bucket` |
| `DO_SPACES_REGION` | `sgp1` |
| `DO_SPACES_ENDPOINT` | `https://sgp1.digitaloceanspaces.com` |
| `DO_SPACES_CDN_URL` | Optional CDN base URL for public links |
| `UPLOAD_MAX_BYTES` | Max upload size in bytes (default `5242880` / 5 MB) |
| `UPLOAD_MAX_DIMENSION` | Max width/height before resize (default `1920`) |
| `UPLOAD_WEBP_QUALITY` | WebP quality 1–100 (default `82`) |

```ts
import { storage } from "../lib/storage";

const { key, url } = await storage.upload({
  key: "leases/abc/receipt.jpg",
  body: fileBuffer,
  contentType: "image/jpeg",
});

await storage.delete(key);
```

---

## Authentication

Authentication is powered by [Better Auth](https://www.better-auth.com/) and is mounted at `/auth`.

All routes marked **Auth required** need a valid session cookie. The cookie is set automatically by the browser after a successful sign-in. For non-browser clients, pass the `cookie` header manually.

### Sign Up

```
POST /auth/sign-up/email
```

**Request body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "supersecret"
}
```

**Response `200`**

```json
{
  "user": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "tenant",
    "emailVerified": false,
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  },
  "session": { ... }
}
```

---

### Sign In

```
POST /auth/sign-in/email
```

**Request body**

```json
{
  "email": "john@example.com",
  "password": "supersecret"
}
```

**Response `200`** — same shape as sign-up. Sets a `better-auth.session_token` cookie.

---

### Sign Out

```
POST /auth/sign-out
```

No body required. Clears the session cookie.

---

### Get Current Session

```
GET /auth/get-session
```

Returns the currently authenticated user and session. Returns `null` when not authenticated.

---

## Error Format

All errors return a consistent JSON body:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Property not found"
  }
}
```

| Code | HTTP Status | Meaning |
|---|---|---|
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate or constraint violation |
| `UNPROCESSABLE` | 422 | Validation failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Admin Routes

> All routes below require a valid session (`Auth required`) **and** user role `admin` or `superadmin`.
> Tenants and other roles receive `403` with `"Admin access required"`.
> All admin routes are prefixed with `/admin`.

| Resource | Prefix |
|---|---|
| Properties | `/admin/properties` |
| Unit types | `/admin/unit-types` |
| Unit pricings | `/admin/unit-pricings` |
| Units | `/admin/units` |
| Leases | `/admin/leases` |
| Tenants (users) | `/admin/users` |
| Staff | `/admin/staff` |
| Ledger entries | `/admin/ledger-entries` |
| Attachments | `/admin/attachments` |
| Meta (relationship map) | `/admin/meta` |

#### `GET /admin/meta/relationships`

Returns the admin entity relationship map: which models link to each other, nested fields returned by each list/detail endpoint, and the property hierarchy tree. Use this to wire the admin frontend without guessing includes.

**Auth required:** yes

**Response `200`** — `{ data: { entities, endpoints, hierarchy } }`

Admin list/detail responses also embed related data directly (see each resource below). Key nesting:

| Resource | Nested on GET |
|---|---|
| Property (list) | `propertyAttachments`, `unitTypes` (+ pricings, attachments, counts), `_count` |
| Property (detail) | above + `unitTypes.units`, flat `units.unitType.pricings`, `unitPricings` |
| Unit type | `property`, `pricings`, `units`, `unitTypeAttachments`, `_count` |
| Unit pricing | `property`, `unitType` (+ property, attachments); detail adds `leases` |
| Unit | `property`, `unitType` (+ pricings, attachments), `activeLease` or `leases` |
| Lease | `property`, `unit`, `user`, `unitPricing`, `leaseRenewal` (+ `updatedBy`), `downpaymentAttachments`, `createdBy`, `updatedBy` |
| Tenant (detail) | profile fields + `leases` (full lease graph) |
| Ledger entry | `property`, `attachments`, `createdBy`, `updatedBy` |

---

### Properties

Manage physical kost buildings.

#### `GET /admin/properties`

Returns a list of all properties.

**Auth required:** yes

**Response `200`**

```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Cherry Sky Kost A",
      "address": "Jl. Sudirman No. 12",
      "city": "Jakarta",
      "createdById": "usr...",
      "updatedById": "usr...",
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `GET /admin/properties/:id`

Returns a single property by ID.

**Auth required:** yes

**Path params**

| Param | Type | Description |
|---|---|---|
| `id` | string | Property ID |

**Response `200`**

```json
{
  "data": {
    "id": "clx...",
    "name": "Cherry Sky Kost A",
    "address": "Jl. Sudirman No. 12",
    "city": "Jakarta",
    "createdById": "usr...",
    "updatedById": "usr...",
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  }
}
```

**Error `404`** — property not found.

---

#### `POST /admin/properties`

Creates a new property.

**Auth required:** yes

**Request body**

```json
{
  "name": "Cherry Sky Kost A",
  "address": "Jl. Sudirman No. 12",
  "city": "Jakarta"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | min 1 char |
| `address` | string | yes | min 1 char |
| `city` | string | yes | min 1 char |

**Response `200`** — returns the created property object.

**Error `422`** — validation failed.

---

#### `PUT /admin/properties/:id`

Updates a property. All fields are optional — send only what you want to change.

**Auth required:** yes

**Request body**

```json
{
  "name": "Cherry Sky Kost B",
  "city": "Bandung"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | no | min 1 char |
| `address` | string | no | min 1 char |
| `city` | string | no | min 1 char |

**Response `200`** — returns the updated property object.

**Error `404`** — property not found.

---

#### `DELETE /admin/properties/:id`

Deletes a property and all its associated units (cascade).

**Auth required:** yes

**Response `200`** — returns the deleted property object.

**Error `404`** — property not found.

---

### Unit Types

Categories of units within a property (e.g. Studio, 1 Bedroom). Pricing packages are defined per unit type.

#### `GET /admin/unit-types`

**Query params**

| Param | Type | Required | Description |
|---|---|---|---|
| `propertyId` | string | no | Filter by property |

**Response `200`** — list with `property` and `_count` (`units`, `pricings`).

---

#### `GET /admin/unit-types/:id`

**Response `200`** — unit type with `property`, `pricings`, and unit count.

**Error `404`** — not found.

---

#### `POST /admin/unit-types`

```json
{
  "name": "Studio",
  "propertyId": "clx...",
  "description": "Compact single room",
  "size": 18
}
```

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `propertyId` | string | yes |
| `description` | string | yes |
| `size` | integer (m²) \| null | no |

**Errors:** `404` property not found · `409` duplicate name in property · `422` validation failed

---

#### `PUT /admin/unit-types/:id`

All fields optional. Same fields as create (except `propertyId` cannot be changed via this endpoint). Send `null` for `size` to clear.

**Errors:** `404` · `409` · `422`

---

#### `DELETE /admin/unit-types/:id`

**Error `409`** — type still has units assigned.

---

### Unit Pricings

Price packages per unit type and rental duration (e.g. 30 days at Rp 1.500.000).

#### `GET /admin/unit-pricings`

**Query params**

| Param | Type | Required | Description |
|---|---|---|---|
| `unitTypeId` | string | no | Filter by unit type |
| `propertyId` | string | no | Filter by property |

**Response `200`** — ordered by `durationDays`, includes `unitType` and `property`.

---

#### `GET /admin/unit-pricings/:id`

Includes linked `leases` (id and status only).

---

#### `POST /admin/unit-pricings`

```json
{
  "unitTypeId": "clx...",
  "durationDays": 30,
  "price": 1500000
}
```

`propertyId` is set automatically from the unit type.

**Errors:** `404` unit type not found · `409` duplicate duration for same type · `422` validation failed

---

#### `PUT /admin/unit-pricings/:id`

Optional: `durationDays`, `price`.

**Errors:** `404` · `409` · `422`

---

#### `DELETE /admin/unit-pricings/:id`

**Error `409`** — one or more leases reference this pricing.

---

### Units

Physical rentable rooms. Each unit belongs to a **unit type**; `propertyId` is derived from that type.

#### `GET /admin/units`

**Query params:** `propertyId` (optional)

Each item includes `property`, `unitType`, and `activeLease` (lease overlapping today, or `null`).

---

#### `GET /admin/units/vacant`

Units with **no** lease overlapping the requested date range.

**Query params**

| Param | Type | Required |
|---|---|---|
| `startDate` | string (ISO date) | yes |
| `endDate` | string (ISO date) | yes |
| `propertyId` | string | no |

`startDate` must be before `endDate`.

---

#### `GET /admin/units/:id`

Full unit with `property`, `unitType`, and lease history.

---

#### `POST /admin/units`

```json
{
  "name": "Room 101",
  "unitTypeId": "clx...",
  "maxOccupancy": 2
}
```

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `unitTypeId` | string | yes |
| `maxOccupancy` | integer \| null | no |

New units default to `status: "vacant"`.

**Errors:** `404` unit type not found · `409` duplicate name in property · `422` validation failed

---

#### `PUT /admin/units/:id`

Optional: `name`, `maxOccupancy`, `status` (`vacant` \| `occupied`). Send `null` for `maxOccupancy` to clear.

**Errors:** `404` · `409` duplicate name · `422`

---

#### `DELETE /admin/units/:id`

**Error `409`** — unit status is `occupied`.

---

### Users (Tenants)

Manage users with `role: tenant` (for lease assignment).

#### `GET /admin/users`

**Query params**

| Param | Type | Required | Description |
|---|---|---|---|
| `search` | string | no | Case-insensitive match on name or email |

**Response `200`**

```json
{
  "data": [
    {
      "id": "usr...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "tenant",
      "isActive": true,
      "emailVerified": false,
      "image": null,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    }
  ]
}
```

---

#### `POST /admin/users`

Create a new tenant account.

**Request body**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "supersecret"
}
```

**Response `200`** — same shape as a single list item.

**Errors:** `409` email already in use · `422` validation failed

---

#### `GET /admin/users/:id`

**Response `200`** — same shape as a single list item.

**Error `404`** — user not found or not a tenant.

---

#### `PATCH /admin/users/:id`

Update a tenant's profile fields.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

At least one of `name` or `email` is required.

**Errors:** `404` tenant not found · `409` email already in use · `422` validation failed

---

#### `PATCH /admin/users/:id/active`

Enable or disable a tenant account.

```json
{
  "isActive": false
}
```

Inactive tenants cannot sign in. Existing sessions are revoked when deactivated.

**Errors:** `404` tenant not found · `422` validation failed

---

#### `POST /admin/users/:id/reset-password`

Reset a tenant's password when they forgot it. Generates a random 8-character alphanumeric temporary password and invalidates their active sessions.

**Response `200`**

```json
{
  "data": {
    "user": {
      "id": "usr...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "tenant",
      "isActive": true,
      "emailVerified": false,
      "image": null,
      "createdAt": "2026-05-01T00:00:00.000Z",
      "updatedAt": "2026-05-01T00:00:00.000Z"
    },
    "temporaryPassword": "aB3xY9k2"
  }
}
```

Share `temporaryPassword` with the tenant securely. They should sign in and change it via `PUT /profile/password`.

**Errors:** `404` tenant not found · `400` tenant has no email/password account

---

### Staff

Manage admin and superadmin accounts. **Superadmin only** — regular `admin` users receive `403`.

#### `GET /admin/staff`

**Query params:** `search` (optional) — case-insensitive match on name or email.

**Response `200`** — list of staff users (`role`: `admin` or `superadmin`, plus `isActive`, profile fields).

---

#### `POST /admin/staff`

Create a new staff account.

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "supersecret",
  "role": "admin"
}
```

| Field | Type | Required |
|---|---|---|
| `name` | string | yes |
| `email` | string | yes |
| `password` | string | yes — min 8 chars |
| `role` | `admin` \| `superadmin` | no — defaults to `admin` |

**Errors:** `403` not superadmin · `409` email already in use · `422` validation failed

---

#### `GET /admin/staff/:id`

**Error `404`** — staff user not found.

---

#### `PATCH /admin/staff/:id`

Update staff profile. At least one field required.

```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "role": "admin"
}
```

Cannot demote the last remaining `superadmin`.

**Errors:** `403` · `404` · `409` · `422`

---

#### `PATCH /admin/staff/:id/active`

```json
{
  "isActive": false
}
```

Cannot deactivate yourself. Cannot deactivate the last remaining `superadmin`.

**Errors:** `403` · `404` · `422`

---

#### `POST /admin/staff/:id/reset-password`

Same response shape as tenant reset — returns `{ data: { user, temporaryPassword } }`.

**Errors:** `403` · `404` · `400` no credential account

---

### Leases

Rental agreements. `endDate` is **always computed** as `startDate + unitPricing.durationDays`.

- Creating a lease does **not** auto-occupy the unit.
- Creating a lease **also creates** a linked `leaseRenewal` (1:1) with `isRenewLease: false`, `isConfirmed: false`, `markAsCompleted: false`, and `leaseEndDate` set to 5 days before the lease `endDate`.
- **Overlap prevention:** a new lease is rejected (`409`) if its date range overlaps another lease on the **same unit**, or if the **same tenant** already has any lease (any unit) overlapping that period. Back-to-back leases are allowed when the new `startDate` equals the previous `endDate`. When creating a renewal follow-up lease via `leaseRenewalId`, the parent lease being renewed is excluded from both checks.
- When creating a lease to fulfill a tenant renewal, pass `leaseRenewalId` (the existing renewal record's `id`) — the API sets that renewal's `markAsCompleted` to `true` in the same transaction.
- Renewal flow: tenant responds via `PUT /leases/:id/renewal` (`isRenewLease`) → admin confirms renewal requests via `PUT /admin/leases/:id/renewal` (`isConfirmed`, or auto-confirmed by cron) → admin creates follow-up lease via `POST /admin/leases` with `leaseRenewalId` (`markAsCompleted`). When the tenant declines or cancels (`isRenewLease: false`), the API sets `isConfirmed: true` to record their decision (distinct from the unanswered initial state where both flags are `false`).
- Setting `status` to `paid` sets the unit to `occupied`.
- Deleting a lease sets the unit to `vacant` (cascades to `leaseRenewal`).
- When `startDate` or `unitPricingId` changes on update, `leaseRenewal.leaseEndDate` is recalculated from the new `endDate`.
- After lease `endDate`, the `expire-leases` cron sets the unit back to `vacant` if no other active paid lease exists.

#### `GET /admin/leases`

**Query params:** `unitId`, `userId`, `propertyId` (all optional)

**Response `200`** — includes `unit` (with `property`, `unitType`), `user`, `unitPricing`, `leaseRenewal` (or `null`), `downpaymentAttachments`, `createdBy`, `updatedBy`.

---

#### `GET /admin/leases/:id`

Returns a single lease with the same nested fields as the list endpoint.

**Error `404`** — lease not found.

---

#### `POST /admin/leases`

Accepts **JSON** or **`multipart/form-data`**. Use multipart when attaching an optional downpayment proof image.

**JSON body**

```json
{
  "unitId": "clx...",
  "userId": "usr...",
  "startDate": "2026-05-01",
  "unitPricingId": "clx...",
  "leaseRenewalId": "clx..."
}
```

| Field | Type | Required |
|---|---|---|
| `unitId` | string | yes |
| `userId` | string | yes |
| `startDate` | string (ISO date) | yes |
| `unitPricingId` | string | yes |
| `leaseRenewalId` | string | no |

**Multipart form** (`Content-Type: multipart/form-data`) — same fields as JSON, plus optional `file` (image)

| Field | Type | Required |
|---|---|---|
| `unitId` | string | yes |
| `userId` | string | yes |
| `startDate` | string (ISO date) | yes |
| `unitPricingId` | string | yes |
| `leaseRenewalId` | string | no |
| `file` | file (image) | no — downpayment proof; uploaded to DigitalOcean Spaces |

`unitPricing` must belong to the unit's `unitTypeId`.

When `leaseRenewalId` is provided, the API marks that renewal's `markAsCompleted` as `true` after the new lease is created. The `userId` must match the tenant on the renewal's parent lease. Use the renewal record's `id` (from the tenant's existing lease), not the lease `id`.

When `file` is included, the image is validated, converted to WebP, stored at `cherry-sky-kost/leases/{leaseId}/downpayment/...`, and linked as `downpaymentAttachments`.

**Response `200`** — includes the new lease, its `leaseRenewal`, and `downpaymentAttachments` (if uploaded).

**Errors:** `404` unit, pricing, or lease renewal not found · `409` date overlap on same unit or same tenant · `422` validation failed (including renewal already completed, tenant mismatch, or invalid image)

---

#### `PUT /admin/leases/:id`

```json
{
  "status": "paid"
}
```

| Field | Type | Required |
|---|---|---|
| `startDate` | string (ISO date) | no |
| `unitPricingId` | string | no |
| `status` | `unpaid` \| `waiting_for_review` \| `paid` | no |

`endDate` is recalculated when `startDate` or `unitPricingId` changes (cannot be sent in the body).

**Errors:** `404` · `409` unit or tenant date overlap · `422`

---

#### `PUT /admin/leases/:id/renewal`

Update renewal confirmation for a lease.

```json
{
  "isConfirmed": true
}
```

| Field | Type | Required |
|---|---|---|
| `isConfirmed` | boolean | yes |

**Response `200`** — updated `leaseRenewal` (with `updatedBy`).

**Errors:** `404` lease or renewal not found · `422` validation failed

**Note:** If the tenant took no action (`isRenewLease` still `false`) when the confirmation deadline (`leaseEndDate`) is reached, the `decline-lease-renewals` cron auto-declines at the next midnight run. Tenants who already requested renewal are left for admin confirmation.

---

#### `DELETE /admin/leases/:id`

Resets the unit to `vacant`.

---

### Ledger Entries

Manual **income** and **expense** records for bookkeeping (separate from leases).

#### `GET /admin/ledger-entries`

List income and expense entries. Filters can be combined; `summary` totals reflect the filtered result set only.

**Query params**

| Param | Type | Required | Description |
|---|---|---|---|
| `propertyId` | string | no | Filter by property |
| `type` | string | no | `income` or `expense` |
| `startDate` | string (ISO date) | no | Include entries on or after this date (inclusive, calendar day) |
| `endDate` | string (ISO date) | no | Include entries on or before this date (inclusive, calendar day) |

`startDate` and `endDate` are optional and independent — you may pass either, both, or neither. When both are provided, `startDate` must be on or before `endDate`.

**Example requests**

```
# All entries
GET /admin/ledger-entries

# January 2026 expenses for one property
GET /admin/ledger-entries?propertyId=clx...&type=expense&startDate=2026-01-01&endDate=2026-01-31

# Entries from a start date onward
GET /admin/ledger-entries?startDate=2026-06-01
```

**Response `200`** — ordered by `date` descending; includes `property` (if set), `attachments`, `createdBy`, and `updatedBy`. Also returns a `summary` object with `income`, `expense`, and `net` totals for the filtered list.

```json
{
  "data": [
    {
      "id": "clx...",
      "type": "expense",
      "amount": 250000,
      "description": "Electricity bill",
      "category": "utilities",
      "date": "2026-01-15T00:00:00.000Z",
      "propertyId": "clx...",
      "property": { "id": "clx...", "name": "SKYKOST" },
      "attachments": [],
      "createdBy": { "id": "...", "name": "Admin" },
      "updatedBy": { "id": "...", "name": "Admin" },
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "summary": {
    "income": 1500000,
    "expense": 250000,
    "net": 1250000
  }
}
```

**Errors:** `404` property not found (when `propertyId` is set) · `422` validation failed (invalid date or `startDate` after `endDate`)

---

#### `GET /admin/ledger-entries/:id`

**Error `404`** — not found.

---

#### `POST /admin/ledger-entries`

Accepts **JSON** or **`multipart/form-data`**. Use multipart when attaching an optional receipt or invoice image.

**JSON body**

```json
{
  "type": "income",
  "amount": 1500000,
  "description": "Monthly rent - Room 101",
  "category": "rent",
  "date": "2026-05-01",
  "propertyId": "clx..."
}
```

| Field | Type | Required |
|---|---|---|
| `type` | `income` \| `expense` | yes |
| `amount` | integer | yes |
| `description` | string | yes |
| `date` | string (ISO date) | yes |
| `category` | string \| null | no |
| `propertyId` | string \| null | no |

**Multipart form** (`Content-Type: multipart/form-data`)

| Field | Type | Required |
|---|---|---|
| `type` | `income` \| `expense` | yes |
| `amount` | integer | yes — smallest currency unit (e.g. Rupiah) |
| `description` | string | yes |
| `date` | string (ISO date) | yes |
| `category` | string | no — must match entry type (see below) |
| `propertyId` | string | no |
| `file` | file (image) | no — receipt/invoice; uploaded to DigitalOcean Spaces |

**Categories**

| Type | Allowed values |
|---|---|
| `income` | `rent`, `deposit`, `late_fee`, `other_income` |
| `expense` | `utilities`, `maintenance`, `cleaning`, `staff`, `supplies`, `tax`, `other_expense` |

When `file` is included, the image is validated, converted to WebP, stored at `cherry-sky-kost/ledger-entries/{ledgerEntryId}/...`, and linked as `attachments`.

**Response `200`** — created entry with `attachments` (if uploaded).

**Errors:** `404` property not found · `422` validation failed (including invalid category or image)

---

#### `PUT /admin/ledger-entries/:id`

All fields optional (same as create).

**Errors:** `404` · `422`

---

#### `DELETE /admin/ledger-entries/:id`

**Error `404`** — not found.

---

### Attachments

Upload files to DigitalOcean Spaces and persist metadata in attachment tables.

**Image processing (all uploads):** JPEG, PNG, WebP, and GIF are accepted. Images are validated, resized (max dimension from `UPLOAD_MAX_DIMENSION`, default 1920px), converted to WebP, and stored with `public-read` ACL. Max file size defaults to 5 MB (`UPLOAD_MAX_BYTES`).

**Attachment object shape** (nested on reads as `propertyAttachments`, `unitTypeAttachments`, `downpaymentAttachments`, or `attachments`):

| Field | Type | Description |
|---|---|---|
| `id` | string | Attachment ID |
| `fileName` | string | Stored file name (`.webp`) |
| `url` | string \| null | Public URL when available |
| `objectKey` | string | Path in object storage |
| `contentType` | string \| null | Usually `image/webp` |
| `sizeBytes` | integer \| null | File size after processing |
| `createdAt` | datetime | |

Lease downpayment and ledger entry attachments are created on **`POST /admin/leases`** and **`POST /admin/ledger-entries`** (optional `file` field). Property and unit type attachments use dedicated upload endpoints below. All attachment types have separate delete endpoints.

#### `GET /admin/attachments/checkup`

Runs a storage health check by uploading and deleting a small probe file in DigitalOcean Spaces.

**Response `200`**

```json
{
  "data": {
    "ok": true,
    "bucket": "your-space-bucket-name",
    "endpoint": "https://sgp1.digitaloceanspaces.com",
    "region": "sgp1"
  }
}
```

**Errors:** `422` storage credentials/config/signing issue

---

#### `POST /admin/attachments/property`

`multipart/form-data` body:

| Field | Type | Required |
|---|---|---|
| `propertyId` | string | yes |
| `file` | file | yes |

**Errors:** `404` property not found · `422` invalid data

---

#### `POST /admin/attachments/unit-type`

`multipart/form-data` body:

| Field | Type | Required |
|---|---|---|
| `unitTypeId` | string | yes |
| `file` | file | yes |

**Errors:** `404` unit type not found · `422` invalid data

---

#### `DELETE /admin/attachments/property/:id`

Deletes a property attachment by ID. Removes the object from DigitalOcean Spaces, then deletes the database record.

**Path params**

| Param | Type | Description |
|---|---|---|
| `id` | string | `PropertyAttachment` ID |

**Response `200`** — deleted attachment record.

**Errors:** `404` attachment not found · `422` storage delete failed

---

#### `DELETE /admin/attachments/unit-type/:id`

Deletes a unit type attachment by ID. Removes the object from DigitalOcean Spaces, then deletes the database record.

**Path params**

| Param | Type | Description |
|---|---|---|
| `id` | string | `UnitTypeAttachment` ID |

**Response `200`** — deleted attachment record.

**Errors:** `404` attachment not found · `422` storage delete failed

---

#### `DELETE /admin/attachments/lease-downpayment/:id`

Deletes a lease downpayment attachment by ID. Removes the object from DigitalOcean Spaces, then deletes the database record.

**Path params**

| Param | Type | Description |
|---|---|---|
| `id` | string | `LeaseDownpaymentAttachment` ID |

**Response `200`** — deleted attachment record.

**Errors:** `404` attachment not found · `422` storage delete failed

---

#### `DELETE /admin/attachments/ledger-entry/:id`

Deletes a ledger entry attachment by ID. Removes the object from DigitalOcean Spaces, then deletes the database record.

**Path params**

| Param | Type | Description |
|---|---|---|
| `id` | string | `LedgerEntryAttachment` ID |

**Response `200`** — deleted attachment record.

**Errors:** `404` attachment not found · `422` storage delete failed

---

## Public Routes

> No authentication required. Intended for the public-facing frontend (landing page, search kosts, property listings).
> All public routes are prefixed with `/public`.

| Resource | Prefix |
|---|---|
| Properties | `/public/properties` |
| Search rooms | `/public/search` |

### Properties (Public)

Read-only property catalogue with nested unit types, units, and all pricing packages.

#### `GET /public/properties`

Returns all properties with their unit types, units, pricing options, and attachment images.

**Images on each property / unit type**

| Field | Description |
|---|---|
| `propertyAttachments` | Array of property images; each item has a resolved `url` (from DB or built from `objectKey` + CDN/Spaces) |
| `primaryImageUrl` | First image attachment URL for the property (convenience for cards) |
| `unitTypes[].unitTypeAttachments` | Images for that unit type |
| `unitTypes[].primaryImageUrl` | First image URL for that unit type |

**Auth required:** no

**Response `200`**

```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Cherry Sky Kost A",
      "address": "Jl. Sudirman No. 12",
      "city": "Jakarta",
      "unitTypes": [
        {
          "id": "clx...",
          "name": "Studio",
          "description": "Compact single room",
          "size": 18,
          "pricings": [
            { "id": "clx...", "durationDays": 7, "price": 450000 },
            { "id": "clx...", "durationDays": 30, "price": 1500000 }
          ],
          "units": [
            { "id": "clx...", "name": "Room 101", "maxOccupancy": 2, "status": "vacant" },
            { "id": "clx...", "name": "Room 102", "maxOccupancy": 2, "status": "occupied" }
          ]
        }
      ]
    }
  ]
}
```

---

#### `GET /public/properties/:id`

Returns a single property with full unit and pricing detail.

**Auth required:** no

**Path params**

| Param | Type | Description |
|---|---|---|
| `id` | string | Property ID |

**Response `200`** — same shape as a single item from the list above.

**Error `404`** — property not found.

---

### Search rooms (Public)

Search rentable units across all properties. Intended for the public **search kosts** page (e.g. `/en/search-kosts` on the frontend).

#### `GET /public/search`

Returns a flat list of matching units with property, unit type, pricing packages, and attachment images. Each `property` and `unitType` includes `propertyAttachments` / `unitTypeAttachments` (with resolved `url`) and `primaryImageUrl` for display. No authentication required.

**Auth required:** no

**Query params**

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | string | no | Free-text search (unit name, property name/address/city, unit type name) |
| `city` | string | no | Filter by property city (case-insensitive partial match) |
| `propertyId` | string | no | Limit to a single property |
| `unitTypeId` | string | no | Limit to a single unit type |
| `status` | `vacant` \| `occupied` | no | Filter by unit status |
| `startDate` | string (ISO date) | no* | Availability window start |
| `endDate` | string (ISO date) | no* | Availability window end |
| `minPrice` | integer | no | Minimum price (smallest currency unit, e.g. Rupiah) |
| `maxPrice` | integer | no | Maximum price |
| `durationDays` | integer | no | Require a pricing row with this exact duration (see below) |

\* `startDate` and `endDate` must be provided together. Units with a lease overlapping that range are excluded.

**How price filters work**

`minPrice` / `maxPrice` apply to a single `unit_pricing` row on the unit’s type:

- **Without `durationDays`** — any package whose price falls in range counts (e.g. a 7-day package at Rp 450.000 matches `minPrice=500000` only if you lower the min, or if another package is in range).
- **With `durationDays`** — only that duration’s package is checked. Example: `durationDays=30` + price range requires a **30-day** row in range. If the DB only has `durationDays: 7`, the unit is **excluded** even when a 7-day price would match the slider.

That is why `GET /public/search?status=vacant&minPrice=500000&maxPrice=2500000&durationDays=30` can return **0** while the same query **without** `durationDays` returns results: the frontend was sending `durationDays=30` on every load while data only had 7-day (or other) packages.

**Recommended default (search-kosts page load)**

Do **not** send `durationDays` until the user picks 7, 12, or 30 in the UI:

```
GET /public/search?status=vacant&minPrice=500000&maxPrice=2500000
```

**Example requests**

```
# Default page load (vacant + price slider only)
GET /public/search?status=vacant&minPrice=500000&maxPrice=2500000

# Text search
GET /public/search?q=Medan&status=vacant

# Duration chosen in UI — must exist in DB for that unit type
GET /public/search?status=vacant&durationDays=7&minPrice=500000&maxPrice=2500000

# All units (no filters)
GET /public/search
```

To support monthly search in the UI, add admin pricing with `durationDays: 30` for the relevant unit types (or default the frontend duration dropdown to a duration that exists in data).

**Response `200`**

```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Room 101",
      "maxOccupancy": 2,
      "status": "vacant",
      "property": {
        "id": "clx...",
        "name": "Cherry Sky Kost A",
        "address": "Jl. Sudirman No. 12",
        "city": "Jakarta"
      },
      "unitType": {
        "id": "clx...",
        "name": "Studio",
        "description": "Compact single room",
        "size": 18,
        "pricings": [
          { "id": "clx...", "durationDays": 7, "price": 450000 },
          { "id": "clx...", "durationDays": 30, "price": 1500000 }
        ]
      }
    }
  ],
  "meta": {
    "total": 1
  }
}
```

**Error `422`** — invalid query (e.g. only one of `startDate`/`endDate` sent, or `minPrice` > `maxPrice`).

**Frontend usage**

```ts
const params = new URLSearchParams({
  city: "Jakarta",
  status: "vacant",
  startDate: "2026-06-01",
  endDate: "2026-07-01",
});
const res = await fetch(`http://localhost:8000/public/search?${params}`);
const { data, meta } = await res.json();
```

---

## Tenant Routes

> Auth required. Not under `/admin`. Available to any authenticated user (typically `role: tenant`).
> Admin-only routes under `/admin` return `403` for tenant sessions.

### Profile

#### `GET /profile`

Returns the authenticated user's profile (`id`, `name`, `email`, `role`, `emailVerified`, `image`, `createdAt`, `updatedAt`).

**Error `404`** — user record not found.

---

#### `PUT /profile`

Update the authenticated user's profile (`name` and/or `image`). Email cannot be changed on this endpoint.

**Request body**

```json
{
  "name": "John Doe",
  "image": "https://example.com/avatar.jpg"
}
```

At least one of `name` or `image` is required. Pass `"image": null` to remove the profile image.

**Response `200`** — updated profile (same shape as `GET /profile`).

**Errors:** `401` not authenticated · `422` validation failed

---

#### `PUT /profile/password`

Change the authenticated user's password. Requires the current password.

**Request body**

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword1234",
  "revokeOtherSessions": true
}
```

`revokeOtherSessions` defaults to `true` when omitted.

**Response `200`**

```json
{
  "data": {
    "success": true
  }
}
```

**Errors:** `400` incorrect current password · `401` not authenticated · `422` validation failed

---

### Leases

Tenants can view their own leases only.

#### `GET /leases`

Returns all leases for the authenticated user.

**Response `200`** — includes `unit` (with `property`, `unitType`), `unitPricing`, `leaseRenewal` (`isRenewLease`, `isConfirmed`, `markAsCompleted`, `leaseEndDate`, etc.), and `downpaymentAttachments` (payment proof images with resolved `url` when available).

---

#### `GET /leases/:id`

Returns a single lease for the authenticated user. Same shape as a single item from `GET /leases` (includes `downpaymentAttachments`).

**Error `404`** — lease not found or does not belong to the current user.

---

#### `PUT /leases/:id/renewal`

Request or cancel a lease renewal for the tenant's own lease.

```json
{
  "isRenewLease": true
}
```

| Field | Type | Required |
|---|---|---|
| `isRenewLease` | boolean | yes |

Set `isRenewLease` to `true` to request renewal, or `false` to decline or cancel a pending request. Only **paid** leases can request renewal (`isRenewLease: true`). Declining or cancelling sets `isRenewLease: false` and `isConfirmed: true`. Requesting renewal sets `isRenewLease: true` and resets `isConfirmed` to `false`. Cannot update a renewal that has already been marked completed by admin.

**Response `200`** — updated `leaseRenewal`.

**Errors:** `404` lease or renewal not found · `422` validation failed (including lease not paid or renewal already completed)

Admin renewal confirmation (`isConfirmed` on an `isRenewLease: true` request) is via `PUT /admin/leases/:id/renewal`.

---

## Data Models Reference

### `Property`

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `name` | string | Display name |
| `address` | string | Street address |
| `city` | string | City |
| `createdById` | string | User who created this record |
| `updatedById` | string | User who last updated this record |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### `UnitType`

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `name` | string | Type name (unique per property) |
| `description` | string | Notes about what distinguishes this type |
| `size` | integer \| null | Floor area in m² |
| `propertyId` | string | Parent property |

### `UnitPricing`

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `unitTypeId` | string | Parent unit type |
| `propertyId` | string | Denormalized from unit type |
| `durationDays` | integer | Rental period in days |
| `price` | integer | Total price in smallest currency unit |

### `Unit`

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `name` | string | Room identifier (unique per property) |
| `maxOccupancy` | integer \| null | Maximum tenants allowed |
| `status` | `vacant` \| `occupied` | Occupancy status |
| `unitTypeId` | string | Unit category |
| `propertyId` | string | Parent property |

### `Lease`

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `unitId` | string | Leased unit |
| `propertyId` | string | Denormalized from unit |
| `userId` | string | Tenant |
| `unitPricingId` | string | Pricing package used |
| `startDate` | datetime | Lease start |
| `endDate` | datetime | Lease end (computed) |
| `status` | `unpaid` \| `waiting_for_review` \| `paid` | Payment status |
| `downpaymentAttachments` | array | Payment proof images (optional; uploaded on lease create) |
| `leaseRenewal` | `LeaseRenewal` \| null | 1:1 renewal record (auto-created on lease create) |
| `createdById` | string | Admin who created this lease |
| `updatedById` | string | Admin who last updated this lease |

A tenant may not have two leases with overlapping date ranges (across any units). A unit may not have two leases with overlapping date ranges. DB constraint `@@unique([unitId, startDate])` also prevents two leases on the same unit from starting on the same calendar day.

### `LeaseRenewal`

One renewal record per lease (1:1). Created automatically when a lease is created. Included on lease reads as `leaseRenewal`.

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `leaseId` | string | Parent lease (unique — one renewal per lease) |
| `isRenewLease` | boolean | Tenant wants to renew (default `false`) |
| `isConfirmed` | boolean | Decision recorded (default `false`). Set to `true` when the tenant declines/cancels (`isRenewLease: false`), when admin confirms a renewal request, or auto-set by cron after the deadline if still `false`. Unanswered initial state: `isRenewLease: false`, `isConfirmed: false`. Tenant declined: `isRenewLease: false`, `isConfirmed: true`. |
| `markAsCompleted` | boolean | Admin has created the follow-up lease for this renewal (default `false`; set via `POST /admin/leases` with `leaseRenewalId`) |
| `leaseEndDate` | datetime | Confirmation deadline — lease `endDate` minus 5 days |
| `updatedById` | string | User who last updated this renewal |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### `User` (tenant, admin read)

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier |
| `name` | string | Display name |
| `email` | string | Email address |
| `role` | `tenant` | Always `tenant` on `/admin/users` |
| `isActive` | boolean | Account enabled flag |
| `emailVerified` | boolean | Email verified flag |
| `image` | string \| null | Profile image URL |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### `LedgerEntry`

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `type` | `income` \| `expense` | Entry type |
| `amount` | integer | Amount in smallest currency unit |
| `description` | string | What the entry is for |
| `category` | string \| null | Optional category (see ledger entry categories above) |
| `date` | datetime | Entry date |
| `propertyId` | string \| null | Optional property link |
| `attachments` | array | Receipt/invoice images (optional; uploaded on entry create) |
| `createdById` | string | User who recorded the entry |
| `updatedById` | string | User who last updated the entry |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### `LeaseDownpaymentAttachment`

Payment proof linked to a lease. Created via `POST /admin/leases` (multipart `file`). Deleted via `DELETE /admin/attachments/lease-downpayment/:id`. Cascade-deleted when the parent lease is removed.

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `leaseId` | string | Parent lease |
| `fileName` | string | Stored file name |
| `objectKey` | string | Path in object storage |
| `bucket` | string | Spaces bucket name |
| `contentType` | string \| null | MIME type |
| `sizeBytes` | integer \| null | File size |
| `url` | string \| null | Public URL |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### `LedgerEntryAttachment`

Supporting document linked to a ledger entry. Created via `POST /admin/ledger-entries` (multipart `file`). Deleted via `DELETE /admin/attachments/ledger-entry/:id`. Cascade-deleted when the parent entry is removed.

| Field | Type | Description |
|---|---|---|
| `id` | string (cuid) | Unique identifier |
| `ledgerEntryId` | string | Parent ledger entry |
| `fileName` | string | Stored file name |
| `objectKey` | string | Path in object storage |
| `bucket` | string | Spaces bucket name |
| `contentType` | string \| null | MIME type |
| `sizeBytes` | integer \| null | File size |
| `url` | string \| null | Public URL |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### `PropertyAttachment` / `UnitTypeAttachment`

Same field shape as `LeaseDownpaymentAttachment`, with `propertyId` or `unitTypeId` instead of `leaseId`. Uploaded via dedicated `POST /admin/attachments/...` endpoints.
