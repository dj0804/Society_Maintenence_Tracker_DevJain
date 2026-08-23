# System Design Write-up

Society Maintenance Tracker is a single Next.js 15 application: server components read
data directly through Prisma, while every mutation goes through a JSON route handler under
`app/api`. Keeping one deployable unit avoids CORS, a second host, and a duplicated auth
layer, while the route handlers still give a real, documentable API that can be exercised
independently of the UI. Sessions are signed JWTs (`jose`) in an httpOnly cookie.
`middleware.ts` guards pages by role, but every handler independently re-checks the caller
with `requireApiUser(role?)`, so the API is safe even if the middleware matcher is wrong.

## Complaint history model

`ComplaintStatusHistory` is a separate, append-only table rather than a column on the
complaint: `(complaintId, fromStatus, toStatus, note, changedById, createdAt)`. Rows are
only ever inserted — never updated or deleted — which is what makes it trustworthy as an
audit trail.

Two decisions matter here. First, raising a complaint writes a `null → OPEN` row
immediately, so a complaint's timeline is complete from birth and the UI never has to
special-case "the beginning". Second, the status update and its history row are written in
the same `prisma.$transaction` inside `lib/complaints.ts`, so the trail can never drift
from the complaint it describes — there is no code path that changes status without
recording why.

The legal transitions live in one table in that same module: `OPEN → IN_PROGRESS |
RESOLVED`, `IN_PROGRESS → RESOLVED`, and `RESOLVED → nothing`. Because `RESOLVED` has no
outgoing edges, "once resolved, it is closed" falls out of the data structure rather than
being enforced by scattered `if` statements; both the status and priority endpoints return
`409` on a closed complaint, and the admin UI reads the same allowed-transition list to
decide what to render.

Storing history separately also means the complaint row stays small and hot — list and
dashboard queries never touch the history table — while the detail view fetches the full
timeline with one `include`.

## Overdue detection

Overdue is **derived, never stored**. A complaint is overdue when it is unresolved *and*
either `createdAt` is older than the configured threshold or an admin has manually flagged
it. The threshold lives in a `Setting` row (`overdue_threshold_days`, default 3) that the
admin edits at `/admin/settings`.

The alternative — a stored `isOverdue` boolean maintained by a cron job — would be wrong
in two ways: it is stale between runs, and changing the threshold would require backfilling
every complaint. Deriving it means a threshold change re-evaluates the entire dataset on
the next read, with no job and no migration.

`lib/overdue.ts` exposes the rule in two shapes so it stays consistent: `isOverdue()` for
in-memory checks on rows already loaded, and `overdueWhere()`, a Prisma `where` fragment,
so the overdue-only filter and the dashboard count are evaluated in the database rather
than in Node. The stored `isOverdueFlagged` boolean is deliberately narrow: it records only
the admin's manual escalation and is OR-ed into the same predicate, so there is exactly one
definition of "overdue" in the codebase.

Admin lists are sorted overdue first, then High → Low priority, then oldest first, which is
the order an admin actually triages in.

## Photo handling

Complaints accept one optional image, posted as `multipart/form-data`. The route handler
validates MIME type (JPEG/PNG/WebP) and size (≤5 MB) *before* touching storage, then
uploads to Vercel Blob and stores only the returned URL on the complaint. Keeping binaries
out of Postgres keeps rows small and lets the CDN serve images.

`lib/storage.ts` is a thin adapter with one deliberate fallback: without
`BLOB_READ_WRITE_TOKEN` the file is written to `.uploads/` and served back through an
authenticated `/api/uploads` route handler, which flattens the requested name with
`path.basename` so no request can escape the directory. This exists so the app runs end to
end with no third-party account — it is documented as development-only, because serverless
filesystems are ephemeral. Swapping in S3 or Cloudinary means editing one function.

## Notification flow

Two events notify: a complaint's status changing, and an important notice being posted.
`lib/notifications.ts` decides *who* is notified; `lib/email.ts` wraps Resend and handles
*how*. A status change emails that one resident with the old status, the new status, and
the admin's note. An important notice emails every resident in a single Resend call.

Notification failures are contained inside `sendMail`, which try/catches and logs: a bounced
email must never roll back a status change the admin just made. The send is awaited rather
than fired and forgotten, because serverless functions may be frozen the moment the response
is returned. Without `RESEND_API_KEY`, sends are logged to the console — the same graceful
degradation as photo storage, so the whole system is reviewable with only a database and a
JWT secret configured.

Because triggering lives at the route-handler boundary rather than inside `changeStatus`,
the transaction stays purely about data, and adding a channel later (SMS, push) means
touching one module.
