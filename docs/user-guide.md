# Cherry Sky Living — User Guide

Complete guide for using the Cherry Sky Living platform: the public website, tenant portal, and admin suite.

---

## Table of contents

1. [Introduction](#1-introduction)
2. [System overview](#2-system-overview)
3. [Public website](#3-public-website)
4. [Tenant portal](#4-tenant-portal)
5. [Admin suite](#5-admin-suite)
6. [Key workflows](#6-key-workflows)
7. [Reference tables](#7-reference-tables)
8. [Support and contact](#8-support-and-contact)

---

## 1. Introduction

**Cherry Sky Living** is a kost (boarding house) management platform based in Medan, Indonesia. It helps prospective residents discover available rooms, lets current tenants manage their leases online, and gives property staff a full admin panel for inventory, leases, renewals, and bookkeeping.

The platform is available in **English** and **Indonesian**. Switch language from the navigation menu; URLs use a locale prefix (`/en/...` or `/id/...`).

### Who uses what

| Role | Access | Purpose |
|---|---|---|
| **Visitor** | Public website | Browse properties, search rooms, send inquiries |
| **Tenant** | Tenant portal (`/tenant/login`) | View leases, respond to renewals, update profile |
| **Admin** | Admin suite (`/admin/login`) | Manage properties, units, leases, tenants, and finances |
| **Superadmin** | Admin suite | Everything an admin can do, plus staff account management |

---

## 2. System overview

### Property hierarchy

```
Property (kost building)
 └── Unit type (room category, e.g. Studio, Sky Room AC)
      ├── Pricing packages (duration + price, e.g. 30 days @ Rp 1.500.000)
      └── Units (individual rooms, e.g. Room 101)
           └── Leases (rental agreements with tenants)
```

### Lease lifecycle (summary)

1. **Admin creates a lease** — assigns a tenant, unit, start date, and pricing package. The lease starts as `unpaid`.
2. **Admin marks lease as paid** — the unit becomes `occupied`.
3. **Lease runs until end date** — computed automatically as start date + pricing duration.
4. **Renewal window opens** — 5 days before lease end, tenants are prompted to renew or decline.
5. **Lease expires** — a nightly background job sets the unit back to `vacant` when the paid lease ends and no other active paid lease covers the unit.

### Important rules

- A **unit** cannot have two leases with overlapping dates.
- A **tenant** cannot have two leases (across any units) with overlapping dates.
- Back-to-back leases are allowed when the new start date equals the previous end date.
- Creating a lease does **not** automatically occupy the unit — only setting status to **paid** does.
- Deleting a lease sets the unit back to **vacant**.

---

## 3. Public website

No account is required to browse properties or search for rooms.

### 3.1 Homepage

**URL:** `/` (or `/en`, `/id`)

The homepage introduces Cherry Sky Living with:

- A hero section and call-to-action to view properties
- Featured properties with room availability
- Facility highlights (Wi-Fi, AC, security, parking)

Use **Search Kost** in the navigation to find specific rooms.

### 3.2 Search Kost

**URL:** `/search-kosts`

Search and filter available rooms across all properties.

#### Filters

| Filter | Description |
|---|---|
| **Search text** | Matches unit name, property name, address, city, or unit type |
| **Property** | Limit results to one building |
| **Availability** | Vacant only, or all rooms |
| **Price range** | Minimum and maximum price (IDR) |
| **Rent duration** | 7, 12, or 30 days — only applies when selected |
| **Sort** | Property name, price (low/high), newest |

#### Tips for search

- On first load, leave **duration** unset unless you have chosen a specific rental period. Filtering by a duration that does not exist in the database (e.g. 30-day packages when only 7-day packages exist) returns no results.
- Use **Vacant only** to see rooms that are currently available.
- Results show property name, room type, pricing packages, and availability count.

Click a result to open the property or room detail page.

### 3.3 Property detail

**URL:** `/kosts/[property-id]`

Shows:

- Property name, address, and images
- All **room types** at that property with descriptions, size, facilities, and pricing
- How many rooms are available per type

Select a room type to view individual room details.

### 3.4 Room detail

From a property page, open a specific room type to see:

- Photo gallery
- Room size, capacity, and facilities
- Pricing packages (7 / 12 / 30 day options when configured)
- Availability (e.g. "3 of 10 rooms available")
- **Send Inquiry** — opens the WhatsApp inquiry dialog

### 3.5 WhatsApp inquiry (booking)

When you tap **Send Inquiry** or **Contact via WhatsApp**, a form collects:

| Field | Required |
|---|---|
| Full name | Yes |
| Phone number | Yes |
| Duration of stay | Yes — from available pricing packages |
| Check-in date | Yes |

After submitting, WhatsApp opens with a pre-filled message including your details and a note that a **Rp 300.000 deposit** is required to secure a lease upon booking confirmation.

You are not charged through the website — the message is sent to the property team via WhatsApp for follow-up.

### 3.6 Contact page

**URL:** `/contact`

Provides property addresses, phone numbers, email, operating hours, and a contact form. Submissions can be sent via WhatsApp or email.

**Contact details:**

- Email: info@cherryskykost.com
- Phone: +62 811-6359-119
- Address: Jl. Gaharu Gg. Amat Lama No. 12, Medan

### 3.7 Other public pages

| Page | URL | Content |
|---|---|---|
| About | `/about` | Company mission and values |
| Terms & Conditions | `/terms` | Legal terms of use |
| Privacy Policy | `/privacy` | Data handling and privacy practices |

---

## 4. Tenant portal

Tenants sign in at **`/tenant/login`** with an email and password provided by the property administrator.

> Tenants cannot self-register through the admin system in most cases — an admin creates the account under **Tenants** and shares the credentials. Tenants should change their password after first sign-in.

After sign-in, you land on **My Leases** (`/tenant/leases`).

### 4.1 Navigation

| Menu item | URL | Description |
|---|---|---|
| My leases | `/tenant/leases` | All rental agreements on your account |
| Lease renewals | `/tenant/lease-renewals` | Track renewal status across leases |
| Profile | `/tenant/profile` | Update name and password |
| Logout | — | Signs you out of the portal |

### 4.2 My leases

The lease list shows each agreement with:

- Unit and property name
- Lease period (start → end)
- Status: `unpaid`, `waiting_for_review`, or `paid`
- Rent amount (IDR)

Click **View** to open lease details.

#### Lease detail page

Shows full lease information:

- Property address and city
- Unit name and room type
- Start date, end date, and duration
- Pricing package used
- **Payment proof** — images uploaded by admin as downpayment evidence (when available)

### 4.3 Lease renewals

Each paid lease automatically gets a renewal record. You will be prompted when your lease enters its final renewal window (5 days before end date).

#### Responding to a renewal prompt

On the lease detail page (or **Lease renewals** page), you can:

| Action | What happens |
|---|---|
| **Yes, renew my lease** | Submits a renewal request. Admin reviews and confirms. |
| **No thanks** | Records that you do not wish to renew. |
| **Cancel renewal request** | Withdraws a pending renewal request. |

Only **paid** leases can request renewal.

#### Renewal statuses (tenant view)

| Status | Meaning |
|---|---|
| Response needed | You have not yet responded before the deadline |
| Request submitted | You asked to renew; awaiting admin confirmation |
| Approved | Admin confirmed; a new lease will be prepared |
| Completed | Follow-up lease has been created |
| Declined | You chose not to renew |
| Window closed | The respond-by date has passed |
| Not eligible | Lease is not paid — complete payment first |

**Respond-by date** = lease end date minus 5 days. If you do not respond and admin does not confirm, the system may auto-confirm at midnight after the deadline (see admin section).

### 4.4 Profile

**URL:** `/tenant/profile`

#### Account details

- Update your **display name**
- Email is read-only — contact your administrator to change it

#### Change password

1. Enter your **current password**
2. Enter and confirm a **new password**
3. Click **Update password**

If an admin reset your password, sign in with the temporary password they provided, then change it here immediately.

### 4.5 Tenant sign-in errors

| Message | Cause | What to do |
|---|---|---|
| Invalid email or password | Wrong credentials | Check spelling; ask admin for a password reset |
| Wrong portal | You used admin login | Use `/tenant/login` instead |
| Account deactivated | Admin disabled your account | Contact your property administrator |

---

## 5. Admin suite

Staff sign in at **`/admin/login`**. Access requires an `admin` or `superadmin` role.

After sign-in, you land on the **Dashboard** (`/admin`).

### 5.1 Roles and permissions

| Capability | Admin | Superadmin |
|---|---|---|
| Dashboard, properties, units, pricing, leases | Yes | Yes |
| Tenants (create, edit, reset password) | Yes | Yes |
| Bookkeeping | Yes | Yes |
| Staff management | No | Yes |
| Assign superadmin role | No | Yes |

Tenants who try to access admin routes receive "Admin access required."

### 5.2 Navigation

| Group | Pages |
|---|---|
| **Main** | Dashboard |
| **Inventory** | Properties, Unit types, Units, Pricing |
| **Operations** | Leases, Lease renewals, Tenants, Staff |
| **Finance** | Bookkeeping |

### 5.3 Dashboard

Overview of your portfolio:

- Total properties and units (with occupancy count)
- Active leases and leases expiring within 5 days
- Monthly revenue from paid leases
- Quick actions: add property, manage units, create lease, set pricing
- Recent lease activity

### 5.4 Properties

**URL:** `/admin/properties`

Manage kost buildings. Each property has a name, address, and city.

#### Create or edit a property

1. Click **Add** (or edit an existing property)
2. Fill in name, address, and city
3. Save
4. Optionally upload a **property image** after saving (JPEG, PNG, WebP, or GIF — automatically converted and resized)

#### Delete a property

Permanently removes the property and **all associated units** (cascade). Use with caution.

### 5.5 Unit types

**URL:** `/admin/unit-types`

Room categories within a property (e.g. Studio, Sky Room AC, Standard Room Fan).

| Field | Notes |
|---|---|
| Name | Unique per property |
| Property | Which building this type belongs to |
| Description | Shown on the public property page — describe layout, amenities, and ideal occupant |
| Size (m²) | Optional floor area |

Upload **unit type images** after saving to display on the public website.

Cannot delete a unit type that still has units assigned.

### 5.6 Units

**URL:** `/admin/units`

Individual rentable rooms.

| Field | Notes |
|---|---|
| Name | Unique per property (e.g. Room 101) |
| Unit type | Determines pricing packages |
| Max occupancy | Optional |
| Status | `vacant` or `occupied` (auto-updated when leases are paid/expired) |

#### Views

- **Map view** — visual floor layout with color-coded occupancy
- **Table view** — sortable list with search

#### Vacant room search

Use **Check availability** to find rooms with no lease overlapping a selected date range. Useful when preparing a new lease for a specific move-in period.

Cannot delete a unit that is currently **occupied**.

### 5.7 Pricing

**URL:** `/admin/pricing`

Price packages linked to a unit type and rental duration.

| Field | Example |
|---|---|
| Unit type | Studio |
| Duration (days) | 7, 12, or 30 |
| Price (IDR) | 1500000 |

Each unit type can have one price row per duration. These packages appear on the public website and are selected when creating a lease.

Cannot delete a pricing package referenced by an existing lease.

### 5.8 Leases

**URL:** `/admin/leases`

Rental agreements connecting a tenant, unit, and pricing package.

#### Create a new lease

1. Click **New Lease**
2. Select **unit**, **tenant**, **start date**, and **pricing package**
3. Optionally upload **downpayment proof** (image)
4. Save — lease is created with status `unpaid`

The **end date** is computed automatically: start date + pricing duration (days).

#### Overlap validation

The system blocks leases that overlap:

- Another lease on the **same unit**
- Another lease for the **same tenant** (any unit)

Back-to-back leases are allowed (new start = previous end).

When creating a **renewal follow-up lease**, use the renewal workflow (section 5.9) — the parent lease is excluded from overlap checks.

#### Update a lease

You can change:

- Start date (recalculates end date and renewal deadline)
- Pricing package (recalculates end date)
- Status: `unpaid` → `waiting_for_review` → `paid`

Setting status to **paid** marks the unit as **occupied**.

#### Delete a lease

Removes the lease and sets the unit back to **vacant**. The linked renewal record is also removed.

### 5.9 Lease renewals

**URL:** `/admin/lease-renewals`

Track and process tenant renewal requests.

#### Renewal flow (admin steps)

```
Tenant responds (renew / decline)
        ↓
Admin confirms renewal request (if tenant chose to renew)
        ↓
Admin creates follow-up lease with leaseRenewalId
        ↓
Renewal marked completed
```

#### Filter tabs

| Filter | Shows |
|---|---|
| All renewals | Every renewal record |
| Tenant requested | Tenants who chose to renew |
| Awaiting confirmation | Needs admin approval |
| Confirmed | Approved, follow-up lease not yet created |
| Completed | Follow-up lease created |

#### Confirm a renewal

For leases where the tenant requested renewal (`isRenewLease: true`), click **Confirm renewal** to approve.

If neither tenant nor admin confirms before the deadline (`leaseEndDate`), a nightly cron job auto-sets `isConfirmed` to `true` at midnight.

#### Create a renewal follow-up lease

1. From a **confirmed** renewal, click **Create renewal lease**
2. Unit and tenant are pre-filled from the current lease
3. Set the new start date and pricing package
4. Save — the renewal is marked **completed**

Pass the renewal record ID when creating the lease so the system links them correctly.

### 5.10 Tenants

**URL:** `/admin/users`

Manage tenant accounts used for lease assignment and portal access.

#### Add a tenant

1. Click **Add tenant**
2. Enter name, email, and password (minimum 8 characters)
3. Share credentials with the tenant securely

#### Tenant actions

| Action | Effect |
|---|---|
| **Edit** | Update name or email |
| **Activate / Deactivate** | Deactivated tenants cannot sign in; active sessions are revoked |
| **Reset password** | Generates an 8-character temporary password; tenant is signed out everywhere |
| **View details** | Profile plus full lease history |

### 5.11 Staff (superadmin only)

**URL:** `/admin/staff`

Manage admin portal accounts.

| Role | Access |
|---|---|
| **Admin** | Standard admin suite |
| **Superadmin** | Admin suite + staff management |

#### Safeguards

- Cannot deactivate yourself
- Cannot deactivate the last remaining superadmin
- Cannot demote the last remaining superadmin

Staff password reset works the same as tenant reset.

### 5.12 Bookkeeping

**URL:** `/admin/bookkeeping`

Record income and expenses separate from lease payments.

#### Create an entry

| Field | Options |
|---|---|
| Type | `income` or `expense` |
| Amount | IDR (integer) |
| Description | What the entry is for |
| Date | Entry date |
| Category | See table below |
| Property | Optional link to a property |
| Receipt image | Optional upload |

#### Categories

| Income | Expense |
|---|---|
| rent | utilities |
| deposit | maintenance |
| late_fee | cleaning |
| other_income | staff |
| | supplies |
| | tax |
| | other_expense |

#### Filters and summary

Filter by property, type, and date range (`startDate`, `endDate`). The list shows a **summary** with total income, expense, and net for the filtered results.

### 5.13 Images and attachments

Images can be attached to:

| Entity | When |
|---|---|
| Property | After saving the property record |
| Unit type | After saving the unit type record |
| Lease (downpayment proof) | When creating a lease, or after saving |
| Ledger entry (receipt) | When creating an entry, or after saving |

**Accepted formats:** JPEG, PNG, WebP, GIF (max 5 MB). Images are resized and stored as WebP.

Remove images from the record's detail/edit page.

### 5.14 Admin profile

**URL:** `/admin/profile`

Update your display name and password. Email changes require a superadmin to edit your staff record.

---

## 6. Key workflows

### 6.1 New tenant move-in (end to end)

1. **Admin** creates a tenant account under Tenants
2. **Admin** verifies the unit is vacant (Units page or vacant search)
3. **Admin** creates a lease: unit + tenant + start date + pricing → status `unpaid`
4. **Admin** uploads downpayment proof if provided
5. **Admin** sets lease status to **paid** → unit becomes occupied
6. **Tenant** signs in at `/tenant/login` and views the lease

### 6.2 Visitor inquiry to lease

1. **Visitor** finds a room on the public website
2. **Visitor** submits WhatsApp inquiry with name, phone, duration, and check-in date
3. **Property team** follows up via WhatsApp (deposit Rp 300.000 noted in message)
4. **Admin** creates tenant account (if new) and lease as in workflow 6.1

### 6.3 Lease renewal (full cycle)

```
Day 0 — Lease created (paid)
        └── Renewal record auto-created; deadline = endDate − 5 days

Before deadline — Tenant sees renewal prompt
        ├── "Yes, renew" → isRenewLease: true, isConfirmed: false
        └── "No thanks"  → isRenewLease: false, isConfirmed: true

If tenant requested renewal:
        └── Admin confirms via Lease renewals page

After confirmation:
        └── Admin creates follow-up lease (with leaseRenewalId)
        └── Renewal marked completed; old lease eventually expires

After old lease endDate:
        └── Nightly job sets unit vacant if no other active paid lease
```

### 6.4 Lease expiry (automatic)

Every night at midnight, the backend runs two jobs:

| Job | Action |
|---|---|
| `expire-leases` | Sets occupied units to vacant when their paid lease has ended |
| `confirm-lease-renewals` | Auto-confirms renewals still pending after the deadline |

These jobs only run while the backend server is running.

### 6.5 Monthly bookkeeping review

1. Go to **Bookkeeping**
2. Filter by property and date range (e.g. first to last day of the month)
3. Review income vs expense summary
4. Add any missing entries with receipt images

---

## 7. Reference tables

### Lease statuses

| Status | Meaning | Unit effect |
|---|---|---|
| `unpaid` | Lease recorded, payment not confirmed | No change |
| `waiting_for_review` | Payment submitted, under review | No change |
| `paid` | Payment confirmed | Unit set to **occupied** |

### Unit statuses

| Status | Meaning |
|---|---|
| `vacant` | No active paid lease |
| `occupied` | Active paid lease in effect |

### Renewal field combinations

| isRenewLease | isConfirmed | Meaning |
|---|---|---|
| false | false | Initial state — tenant has not responded |
| true | false | Tenant requested renewal — awaiting admin confirmation |
| false | true | Tenant declined or cancelled |
| true | true | Admin confirmed (or auto-confirmed by cron) |
| markAsCompleted: true | — | Follow-up lease has been created |

### Public search duration tip

| Scenario | Recommendation |
|---|---|
| Page first loads | Do not filter by duration until user picks 7, 12, or 30 days |
| User selects 30-day rent | Ensure 30-day pricing exists for that unit type in admin |
| No results with duration filter | Try removing duration filter or add matching pricing packages |

### Admin vs tenant login

| Portal | URL | For |
|---|---|---|
| Tenant | `/tenant/login` | Residents with `tenant` role |
| Admin | `/admin/login` | Staff with `admin` or `superadmin` role |

Using the wrong portal shows a "Wrong portal" error.

---

## 8. Support and contact

### Property contact

- **Email:** info@cherryskykost.com
- **Phone:** +62 811-6359-119
- **Address:** Jl. Gaharu Gg. Amat Lama No. 12, Medan
- **Website inquiries:** Use the Contact page or WhatsApp inquiry on any room

### For tenants

- Forgot password → ask your property administrator to reset it from the admin Tenants page
- Email change → contact your administrator (cannot be changed in the tenant portal)
- Account deactivated → contact your administrator to reactivate

### For administrators

- API reference → [README-Backend.md](../README-Backend.md)
- Frontend setup → [README.md](../README.md)
- Storage uploads require DigitalOcean Spaces credentials on the backend (see README-Backend.md)

---

*Last updated: June 2026*
