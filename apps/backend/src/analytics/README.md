# Analytics module

Backend-only feature for the "Advanced analytics dashboard with data
visualization" task. It exposes read-only, aggregated data over
`orders`, `order_details` and `payments` so the frontend can render
interactive charts (line/bar/pie), plus two export endpoints (CSV/PDF).

All routes are mounted under the global `/api` prefix, so in practice:
`GET /api/analytics/...`.

## Common query parameters

Every endpoint accepts the same optional filters:

| Param          | Type            | Default          | Notes                                   |
|----------------|-----------------|-------------------|------------------------------------------|
| `from`         | ISO date string | 30 days before `to` | Inclusive lower bound                  |
| `to`           | ISO date string | now               | Inclusive upper bound                   |
| `restaurantId` | integer         | —                 | Filters to a single restaurant          |

Example: `?from=2026-08-01&to=2026-08-31&restaurantId=1`

### How dates are interpreted

- Everything is handled in **UTC**.
- Internally the window is half-open: `from <= order_date < endExclusive`.
- If `to` is a plain date (`2026-08-31`) the **whole day is included**
  (up to `2026-08-31T23:59:59.999Z`). If `to` carries a time
  (`2026-08-31T12:00:00Z`) that exact instant is the end.
- `from` after `to`, or a date that does not exist, returns **400**.
- The `range.to` returned by `/summary` is the inclusive end of the window.

### What counts as a sale

`Order.status` is the Prisma enum `OrderStatus`
(`queued | preparing | ready | completed | cancelled`). Orders with status
**`cancelled`** are **not sales**: they are excluded from revenue, order
count, items sold, average ticket, revenue-over-time, top items, sales by
category, and from payments that belong to them.

The only report that deliberately keeps them is `orders-by-status`,
because its purpose is to show how many orders are in each status.

The rule lives in one place: `analytics.constants.ts`
(`NON_SALE_STATUSES`). If a new non-sale status is added to the enum, add it
there; every metric (Prisma and raw SQL) follows.

## Endpoints

- `GET /analytics/summary` — KPIs: `totalRevenue`, `totalOrders`,
  `averageTicket`, `totalItemsSold`.
- `GET /analytics/revenue-over-time?groupBy=day|week|month` — time
  series for a **line chart** (`period`, `revenue`, `orders`).
- `GET /analytics/orders-by-status` — counts per order status, for a
  **bar or pie chart**.
- `GET /analytics/top-menu-items?limit=10&metric=revenue|quantity` —
  best-selling dishes, for a **bar chart**.
- `GET /analytics/sales-by-category` — revenue/quantity grouped by
  menu category, for a **pie chart**.
- `GET /analytics/payment-methods` — amounts grouped by payment
  method, for a **pie chart**.

## Export

- `GET /analytics/export/csv?report=<report>&...filters` → downloads
  a `.csv` file.
- `GET /analytics/export/pdf?report=<report>&...filters` → downloads
  a formatted `.pdf` report (KPI cards + table).

`report` is one of: `summary`, `revenue-over-time`,
`orders-by-status`, `top-menu-items`, `sales-by-category`,
`payment-methods`. The extra params (`groupBy`, `limit`, `metric`)
apply to the matching report, same as the JSON endpoints.

The PDF is intentionally tabular (title, KPIs, table) rather than a
rendered chart image: producing actual chart bitmaps server-side
needs a headless browser or a native `canvas` build, which is heavy
for a Docker/Alpine image. The frontend renders the interactive
charts from the JSON endpoints; the PDF is the "take it with you"
summary.

## Real-time updates

Out of scope for this iteration (per team decision: manual refresh is
fine for now). If it's picked up later, `socket.io` is already a
backend dependency — the natural approach is a `AnalyticsGateway` that
re-emits `summary`/`revenue-over-time` payloads whenever an
`OrdersService` (not built yet) creates/updates an order or payment,
instead of polling.

## Demo data

The rest of the team hasn't built the Orders module yet, so there's
no way to generate real orders through the API. `prisma/seed.ts`
(`prisma/seed-analytics-demo.ts`, independent from the project's general
`prisma/seed.ts`) seeds ~60 days of realistic demo orders/payments so the
endpoints return non-empty data locally:

```bash
npm run seed:analytics --workspace @picasso/backend
```

Safety rules of the seed:

- It works on its **own restaurant** (`[DEMO] Picasso Demo Restaurant`)
  and only ever deletes orders/payments/details of that restaurant.
  Real data of other restaurants is never touched.
- Lookup tables (payment methods, categories, menu items...)
  are found by name and created only if missing; nothing is deleted and
  no fixed ids are assumed.
- The wipe + re-creation runs in a single transaction: if it fails, the
  previous demo data stays as it was.
- It refuses to run with `NODE_ENV=production` unless `ALLOW_DEMO_SEED=1`.

Use `restaurantId=<id of the demo restaurant>` in the endpoints to see
only the demo data.

## Tests

`analytics.service.spec.ts` (mocked `PrismaService`, same pattern as
`health.service.spec.ts`) covers:

- summary KPI math and the zero-orders case;
- date ranges: default 30 days, whole last day included for a plain
  `to`, exact instant when `to` has a time, same-day range, `from > to`
  and invalid dates rejected;
- cancelled orders (enum `OrderStatus.cancelled`) excluded from summary,
  payments and the three raw SQL reports, and kept in `orders-by-status`.

Because the unit tests mock Prisma, the three raw SQL queries were also
run once by hand against a real PostgreSQL with the project's migrations
and edge-case data (order at 23:30 on the last day, a cancelled order, order at midnight of the next day, another
restaurant). All expectations held.

## Before merging

```bash
npm ci
npx prisma generate --schema apps/backend/prisma/schema.prisma
npm run build --workspace @picasso/backend
npm run test:ci --workspace @picasso/backend
```
