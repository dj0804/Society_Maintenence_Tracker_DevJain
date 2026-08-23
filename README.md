# Society Maintenance Tracker

A complaint-management platform for apartment societies. Residents raise maintenance
complaints with photos and follow every status change; the admin triages them by priority,
sees what has gone overdue, posts notices, and residents are emailed as things move.

**Live application:** <https://society-maintenance-tracker-alpha.vercel.app>

Sign in with `admin@society.com` / `Admin@123` for the admin view, or
`rhea@example.com` / `Resident@123` for a resident. The database is seeded with 12
complaints across every status and category — several deliberately backdated, so overdue
detection and the dashboard have real data on first load.

> **A note on email.** The hosted deployment runs without a `RESEND_API_KEY`, so
> notifications are written to the Vercel function logs rather than sent. This is a
> deliberate fallback in `lib/email.ts`, not a missing feature: set the key and the same
> code path sends through Resend. Photo uploads on the hosted app *are* live, going to
> Vercel Blob.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Demo accounts](#demo-accounts)
- [Project structure](#project-structure)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [How the core mechanics work](#how-the-core-mechanics-work)
- [Deployment](#deployment)

---

## Features

**Residents**

- Register and sign in
- Raise a complaint with a category, title, description, and an optional photo
- See every complaint they have raised, with its full status history — who changed what, when, and why
- Read the society notice board
- Receive an email when a complaint's status changes, and when an important notice is posted

**Admin**

- See every complaint, filtered by status, category, or date range
- Complaints are ordered for triage: overdue first, then High → Low priority, then oldest first
- Set priority (Low / Medium / High)
- Move a complaint through `Open → In Progress → Resolved`, with an optional note that reaches the resident
- Resolving a complaint closes it permanently — no further status or priority changes
- Flag a complaint overdue manually, ahead of the automatic age threshold
- Configure the overdue threshold (in days); it applies to every complaint immediately
- Post notices, and pin important ones to the top of the board
- Dashboard: totals by status, breakdown by category, overdue count, and average resolution time

---

## Tech stack

| Layer     | Choice                                                  |
| --------- | ------------------------------------------------------- |
| Framework | Next.js 15 (App Router) — server components + route handlers |
| Language  | TypeScript                                              |
| Database  | PostgreSQL via Prisma ORM                               |
| Auth      | JWT (`jose`) in an httpOnly cookie, `bcryptjs` hashing  |
| Styling   | Tailwind CSS v4                                         |
| Uploads   | Vercel Blob (local filesystem fallback in development)  |
| Email     | Resend (console fallback in development)                |
| Validation| Zod                                                     |

Dependencies are kept deliberately minimal — no auth framework, no UI kit, no state
library, no chart library.

---

## Getting started

**Prerequisites:** Node.js 20+ and a PostgreSQL database.

```bash
git clone https://github.com/dj0804/Society_Maintenence_Tracker_DevJain.git
cd Society_Maintenence_Tracker_DevJain
npm install
```

Create your environment file and fill in `DATABASE_URL` and `JWT_SECRET`:

```bash
cp .env.example .env
```

Generate a signing secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Create the schema and load demo data:

```bash
npm run db:migrate
npm run db:seed
```

Start the app at <http://localhost:3000>:

```bash
npm run dev
```

Don't have Postgres locally? One line with Docker:

```bash
docker run -d --name society-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=society_tracker -p 5433:5432 postgres:16-alpine
```

Then set `DATABASE_URL="postgresql://postgres:postgres@localhost:5433/society_tracker?schema=public"`.

### Scripts

| Script            | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Development server                             |
| `npm run build`   | Generate the Prisma client and build for production |
| `npm start`       | Serve the production build                     |
| `npm run db:migrate` | Create and apply a migration (development)  |
| `npm run db:deploy`  | Apply existing migrations (production)      |
| `npm run db:seed`    | Load demo users, complaints, and notices    |

---

## Environment variables

| Variable                 | Required | Purpose                                                                   |
| ------------------------ | -------- | ------------------------------------------------------------------------- |
| `DATABASE_URL`           | Yes      | PostgreSQL connection string (the **pooled** one on Neon)                 |
| `DATABASE_URL_UNPOOLED`  | Yes      | Direct connection, used only for migrations. Same value on plain Postgres |
| `JWT_SECRET`             | Yes      | Secret used to sign session tokens                                        |
| `APP_URL`                | No       | Base URL used to build links inside emails. Defaults to `localhost:3000`  |
| `RESEND_API_KEY`         | No       | Resend API key. Omit and emails are logged to the console instead of sent |
| `MAIL_FROM`              | No       | From address for outgoing email                                           |
| `BLOB_READ_WRITE_TOKEN`  | No       | Vercel Blob token. Omit and photos are written to `.uploads/` locally     |
| `SEED_ADMIN_EMAIL`       | No       | Admin email created by the seed script (default `admin@society.com`)      |
| `SEED_ADMIN_PASSWORD`    | No       | Admin password created by the seed script (default `Admin@123`)           |

The app runs end to end with only the database and `JWT_SECRET` configured — email and
photo storage both degrade gracefully, so no third-party account is needed to evaluate it.
`APP_URL` is read server-side only, when composing email links.

---

## Demo accounts

Created by `npm run db:seed`:

| Role     | Email                | Password       |
| -------- | -------------------- | -------------- |
| Admin    | `admin@society.com`  | `Admin@123`    |
| Resident | `rhea@example.com`   | `Resident@123` |
| Resident | `arjun@example.com`  | `Resident@123` |
| Resident | `priya@example.com`  | `Resident@123` |
| Resident | `karan@example.com`  | `Resident@123` |

The seed backdates several complaints so overdue detection, priority ordering, and the
dashboard have real data to show from the first page load.

---

## Project structure

```
app/
  (auth)/                     login and register pages
  (app)/                      signed-in shell (nav + layout)
    complaints/               resident: list, new, detail
    notices/                  notice board
    admin/                    dashboard, complaint queue, notices, settings
  api/
    auth/                     register, login, logout, me
    complaints/               list, create, detail, status, priority, overdue-flag
    notices/                  list, create, update, delete
    dashboard/stats           aggregated counts
    settings                  overdue threshold
    uploads/                  serves development-fallback photos
components/                   shared UI (badges, lists, forms, timeline)
emails/templates.ts           HTML email bodies
lib/
  auth.ts, session.ts         JWT sessions and role guards
  complaints.ts               status transitions + history writes
  overdue.ts                  overdue threshold and derivation
  dashboard.ts                aggregate queries
  storage.ts, email.ts        photo and email adapters
  validation.ts               Zod schemas
prisma/
  schema.prisma               data model
  migrations/                 SQL migrations
  seed.mts                    demo data
middleware.ts                 page-level route guard
```

---

## Database schema

### `User`

| Column         | Type              | Notes                        |
| -------------- | ----------------- | ---------------------------- |
| `id`           | `String` (cuid)   | Primary key                  |
| `name`         | `String`          |                              |
| `email`        | `String`          | Unique                       |
| `passwordHash` | `String`          | bcrypt, cost 10              |
| `role`         | `RESIDENT \| ADMIN` | Default `RESIDENT`         |
| `flatNumber`   | `String`          |                              |
| `phone`        | `String?`         |                              |
| `createdAt`    | `DateTime`        |                              |

### `Complaint`

| Column             | Type                                  | Notes                                    |
| ------------------ | ------------------------------------- | ---------------------------------------- |
| `id`               | `String` (cuid)                       | Primary key                              |
| `ticketNo`         | `String`                              | Unique, human-readable (`SMT-0001`)      |
| `residentId`       | `String` → `User.id`                  | Cascade delete                           |
| `category`         | `Category`                            | 9 values, see enum below                 |
| `title`            | `String`                              |                                          |
| `description`      | `String`                              |                                          |
| `status`           | `OPEN \| IN_PROGRESS \| RESOLVED`     | Default `OPEN`                           |
| `priority`         | `LOW \| MEDIUM \| HIGH`               | Default `MEDIUM`                         |
| `photoUrl`         | `String?`                             | Blob URL, or `/api/uploads/...` locally  |
| `isOverdueFlagged` | `Boolean`                             | Manual admin flag only                   |
| `createdAt`        | `DateTime`                            | Indexed                                  |
| `updatedAt`        | `DateTime`                            |                                          |
| `resolvedAt`       | `DateTime?`                           | Set when status becomes `RESOLVED`       |

Indexed on `residentId`, `status`, `category`, `createdAt`, and `(status, createdAt)`.

### `ComplaintStatusHistory`

| Column        | Type                              | Notes                                      |
| ------------- | --------------------------------- | ------------------------------------------ |
| `id`          | `String` (cuid)                   | Primary key                                |
| `complaintId` | `String` → `Complaint.id`         | Cascade delete                             |
| `fromStatus`  | `ComplaintStatus?`                | `null` on the row written at creation      |
| `toStatus`    | `ComplaintStatus`                 |                                            |
| `note`        | `String?`                         | Optional note, shown to the resident       |
| `changedById` | `String` → `User.id`              | Who made the change                        |
| `createdAt`   | `DateTime`                        | Indexed with `complaintId`                 |

**Append-only.** Rows are never updated or deleted; the table is the complaint's audit trail.

### `Notice`

| Column        | Type                   | Notes                                 |
| ------------- | ---------------------- | ------------------------------------- |
| `id`          | `String` (cuid)        | Primary key                           |
| `title`       | `String`               |                                       |
| `body`        | `String`               |                                       |
| `isImportant` | `Boolean`              | Pinned to the top; emails residents   |
| `postedById`  | `String` → `User.id`   |                                       |
| `createdAt`   | `DateTime`             | Indexed with `isImportant`            |

### `Setting`

Key/value configuration. Holds `overdue_threshold_days` (the admin-configurable overdue
window) and `complaint_seq` (the ticket-number counter).

### Enums

```
Role            RESIDENT | ADMIN
ComplaintStatus OPEN | IN_PROGRESS | RESOLVED
Priority        LOW | MEDIUM | HIGH
Category        PLUMBING | ELECTRICAL | LIFT | HOUSEKEEPING | SECURITY
                | PARKING | WATER | COMMON_AREA | OTHER
```

### Relationships

```
User 1──* Complaint                (a resident raises many complaints)
User 1──* ComplaintStatusHistory   (a user is the actor on many status changes)
User 1──* Notice                   (an admin posts many notices)
Complaint 1──* ComplaintStatusHistory
```

---

## API reference

All endpoints return JSON. Authentication is a signed httpOnly cookie set at login.
Every handler re-checks the caller's role; the middleware only guards pages.

### Auth

| Method | Endpoint             | Access    | Description                                    |
| ------ | -------------------- | --------- | ---------------------------------------------- |
| `POST` | `/api/auth/register` | Public    | Create a resident account and sign in          |
| `POST` | `/api/auth/login`    | Public    | Sign in                                        |
| `POST` | `/api/auth/logout`   | Public    | Clear the session cookie                       |
| `GET`  | `/api/auth/me`       | Any user  | The signed-in user's profile                   |

<details>
<summary><code>POST /api/auth/register</code></summary>

```json
{
  "name": "Rhea Menon",
  "email": "rhea@example.com",
  "password": "Resident@123",
  "flatNumber": "A-1203",
  "phone": "+91 98200 11111"
}
```

`201` → `{ "id": "...", "name": "...", "email": "...", "role": "RESIDENT" }`
</details>

### Complaints

| Method  | Endpoint                             | Access   | Description                                        |
| ------- | ------------------------------------ | -------- | -------------------------------------------------- |
| `GET`   | `/api/complaints`                    | Any user | Residents get their own; admins get all + filters  |
| `POST`  | `/api/complaints`                    | Resident | Raise a complaint (`multipart/form-data`)          |
| `GET`   | `/api/complaints/:id`                | Any user | One complaint with its full status history         |
| `PATCH` | `/api/complaints/:id/status`         | Admin    | Move the complaint along its lifecycle             |
| `PATCH` | `/api/complaints/:id/priority`       | Admin    | Set `LOW` / `MEDIUM` / `HIGH`                      |
| `PATCH` | `/api/complaints/:id/overdue-flag`   | Admin    | Set or clear the manual overdue flag               |

**`GET /api/complaints` query parameters** (admin only): `status`, `category`,
`from` (`YYYY-MM-DD`), `to` (`YYYY-MM-DD`), `overdue=true`.

<details>
<summary><code>POST /api/complaints</code> — multipart fields</summary>

| Field         | Required | Notes                                            |
| ------------- | -------- | ------------------------------------------------ |
| `title`       | Yes      | 5–120 characters                                 |
| `description` | Yes      | 10–2000 characters                               |
| `category`    | Yes      | One of the `Category` enum values                |
| `photo`       | No       | JPEG / PNG / WebP, max 5 MB                      |

```bash
curl -X POST http://localhost:3000/api/complaints \
  -b cookies.txt \
  -F 'title=Water leakage from bathroom ceiling' \
  -F 'description=Dripping since Monday, the patch is spreading.' \
  -F 'category=PLUMBING' \
  -F 'photo=@leak.jpg'
```
</details>

<details>
<summary><code>PATCH /api/complaints/:id/status</code></summary>

```json
{ "status": "IN_PROGRESS", "note": "Plumber assigned, visiting tomorrow." }
```

`200` → `{ "id": "...", "status": "IN_PROGRESS", "resolvedAt": null }`
`409` if the complaint is already resolved, or the transition is not allowed.
</details>

### Notices

| Method   | Endpoint            | Access   | Description                                     |
| -------- | ------------------- | -------- | ----------------------------------------------- |
| `GET`    | `/api/notices`      | Any user | Notice board, important notices first           |
| `POST`   | `/api/notices`      | Admin    | Post a notice; important ones email residents   |
| `PATCH`  | `/api/notices/:id`  | Admin    | Edit a notice or toggle its pinned state        |
| `DELETE` | `/api/notices/:id`  | Admin    | Delete a notice                                 |

### Dashboard & settings

| Method | Endpoint               | Access   | Description                                          |
| ------ | ---------------------- | -------- | ---------------------------------------------------- |
| `GET`  | `/api/dashboard/stats` | Admin    | Totals by status, category, priority; overdue count  |
| `GET`  | `/api/settings`        | Any user | Current overdue threshold                            |
| `PUT`  | `/api/settings`        | Admin    | Set the overdue threshold (1–365 days)               |
| `GET`  | `/api/uploads/:file`   | Any user | Serves photos stored by the development fallback     |

### Status codes

| Code  | Meaning                                                             |
| ----- | ------------------------------------------------------------------- |
| `200` | Success                                                             |
| `201` | Created                                                             |
| `401` | Not signed in                                                       |
| `403` | Signed in, but the wrong role                                       |
| `404` | Not found, or another resident's complaint                          |
| `409` | Illegal status transition, or a change to a closed complaint        |
| `413` | Photo larger than 5 MB                                              |
| `415` | Photo is not a JPEG, PNG or WebP                                    |
| `422` | Validation failed — the body includes per-field `details`           |

Validation errors are shaped for direct use in forms:

```json
{
  "error": "Validation failed",
  "details": { "title": ["Title must be at least 5 characters"] }
}
```

---

## How the core mechanics work

**Status history.** `ComplaintStatusHistory` is append-only. Raising a complaint writes a
`null → OPEN` row, so every complaint has a complete timeline from the start. Each later
transition writes another row inside the same transaction as the status update
(`lib/complaints.ts`), so the audit trail can never drift from the complaint itself.

**Lifecycle.** Legal transitions are declared once: `OPEN → IN_PROGRESS | RESOLVED`,
`IN_PROGRESS → RESOLVED`. `RESOLVED` has no outgoing edges, so a resolved complaint is
closed — status and priority writes both return `409`.

**Overdue detection.** Overdue is derived at read time, not stored:
a complaint is overdue when it is unresolved *and* either older than the configured
threshold or manually flagged by the admin (`lib/overdue.ts`). Changing the threshold
therefore re-evaluates every complaint instantly, with no background job or backfill.

**Photos.** Validated for type and size, then uploaded to Vercel Blob; only the returned
URL is stored. Without a blob token, photos are written to `.uploads/` and served through
`/api/uploads` — a development convenience, since serverless filesystems are ephemeral.

**Email.** Two triggers: a complaint's status changing (emails that resident), and an
important notice being posted (emails all residents). Sends are wrapped so a mail failure
is logged but never fails the request that triggered it. Without `RESEND_API_KEY` the
send is logged to the console instead.

---

## Deployment

Deployed on Vercel with a Neon Postgres database, provisioned through the Vercel
Marketplace so `DATABASE_URL` and `DATABASE_URL_UNPOOLED` are injected automatically.

1. Push the repository to GitHub and import it into Vercel.
2. Create a Postgres database (Neon, Supabase, or Vercel Postgres) and copy its
   connection string.
3. Add the environment variables from the table above to the Vercel project.
4. Create a Vercel Blob store and add `BLOB_READ_WRITE_TOKEN` for photo uploads.
5. Add a Resend API key for email; verify a sending domain, or use Resend's
   `onboarding@resend.dev` sender for testing.
6. Apply migrations and load demo data against the production database:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

`npm run build` runs `prisma generate` first, so the Prisma client is always built
against the current schema.
