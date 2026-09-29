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
seeds ~60 days of realistic demo orders/payments for restaurant #1 so
the endpoints return non-empty data locally:

```bash
npm run seed --workspace @picasso/backend
```

It's idempotent for the lookup tables (roles, statuses, payment
methods, menu, etc.) and wipes/recreates only the demo orders on each
run, so it's safe to re-run.

## Tests

`analytics.service.spec.ts` covers the summary KPI math and the
date-range resolution (default 30-day window vs. explicit `from`/`to`)
with a mocked `PrismaService`, following the same pattern as
`health.service.spec.ts`.

## Note on this sandbox

`prisma generate` could not be run in the environment this module was
written in (it needs `binaries.prisma.sh`, which isn't reachable from
here), so the Prisma Client types weren't available to fully
type-check the raw SQL result mappings. Every field/table name used in
`analytics.service.ts` was cross-checked by hand against
`prisma/schema.prisma`. Please run, before merging:

```bash
npm install
npx prisma generate --schema apps/backend/prisma/schema.prisma
npm run build --workspace @picasso/backend
npm run test:ci --workspace @picasso/backend
```
