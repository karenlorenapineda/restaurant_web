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
- `from` after `to`, or a day that is not in the calendar (`2026-02-30`,
  `2026-04-31`, `2026-02-29` in a non-leap year...), returns **400**. Dates
  are never "rolled over" to the next month.
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

CSV cells with text that starts with `=`, `+`, `-` or `@` (or a tab / carriage
return) are prefixed with `'` so Excel/LibreOffice show them as text instead of
running them as formulas (CSV injection). Numbers, including negative ones,
are not touched.

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

Live updates over **socket.io**, namespace `/analytics` (same server and port
as the REST API; nginx already proxies `/socket.io/` with WebSocket upgrade).
It does **not** touch the Orders module.

How it works: while at least one client is subscribed, every
`ANALYTICS_REALTIME_INTERVAL_MS` (default `15000`, minimum `5000`) the server
recomputes the dashboard **once per distinct set of filters** (clients with the
same filters share one set of queries) and pushes it **only if the numbers
changed**. With nobody subscribed the timer is off and no query runs. At most
50 different filter sets can be open at the same time.

Client (frontend):

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3000/analytics"); // or the site URL behind nginx

// 1. subscribe with the same filters as the REST endpoints
socket.emit(
  "subscribe",
  { from: "2026-08-01", to: "2026-08-31", restaurantId: 1, groupBy: "day", limit: 10, metric: "revenue" },
  (ack) => {
    if (ack.status === "subscribed") render(ack.snapshot); // first data
    else console.error(ack.message);                       // e.g. to=2026-02-30
  },
);

// 2. the server pushes a new snapshot when the data changes
socket.on("analytics:update", (snapshot) => render(snapshot));

// optional
socket.emit("refresh", undefined, (r) => r.status === "ok" && render(r.snapshot));
socket.emit("unsubscribe");
```

A snapshot has everything the charts need: `summary`, `revenueOverTime`
(line), `ordersByStatus` (bar/pie), `topMenuItems` (bar), `salesByCategory`
(pie) and `paymentMethods` (pie), plus `generatedAt`. Calling `subscribe`
again with other filters replaces the previous subscription. Bad filters
(`to=2026-02-30`, `from > to`, unknown fields) answer
`{ status: "error", message }` and nothing is subscribed.

Configuration (environment variables, both optional):

| Variable | Default | Meaning |
|---|---|---|
| `ANALYTICS_REALTIME_INTERVAL_MS` | `15000` | Refresh period (never below 5000) |
| `ANALYTICS_CORS_ORIGIN` | `*` | Allowed origin for the WebSocket. `*` like the chat gateway; set the frontend URL to restrict it |

It is periodic on purpose (the Orders module has no events to listen to).
`AnalyticsRealtimeService.refreshNow(clientId)` is the hook for the future: if
Orders emits an "order created/changed" event, it can trigger an immediate
refresh instead of waiting for the next tick.

Like the REST endpoints, the WebSocket has **no authentication yet**: the
project has no auth guards. Restrict both when authentication lands.

## Demo data

The Orders module is new, so `prisma/seed-analytics-demo.ts` (independent from
the project's general `prisma/seed.ts`) seeds ~60 days of realistic demo
orders/payments so the endpoints return non-empty data.

**Run it only on a dedicated demo/test database.** It creates menu categories
and dishes, and the menu module lists every row of those tables, so on the
shared development database twelve demo dishes would appear in the real menu.
The seed therefore refuses to run unless the database name (from
`DATABASE_URL`) contains `demo` or `test`, and never with `NODE_ENV=production`.

```bash
# 1. create an empty database, e.g. picasso_demo
# 2. apply the migrations to it
DATABASE_URL=postgresql://USER:PASS@HOST:5432/picasso_demo?schema=public \
  npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
# 3. seed it
DATABASE_URL=postgresql://USER:PASS@HOST:5432/picasso_demo?schema=public \
  npm run seed:analytics --workspace @picasso/backend
```

Other safety rules of the seed:

- Everything hangs off its **own restaurant** (`[DEMO] Picasso Demo Restaurant`)
  and it only ever deletes orders/payments/details of that restaurant.
- Lookup tables (payment methods, categories, menu items...) are found by name
  and created only if missing; nothing is deleted and no fixed ids are assumed.
- The wipe + re-creation runs in a single transaction: if it fails, the
  previous demo data stays as it was.

Use `restaurantId=<id of the demo restaurant>` in the endpoints to see only the
demo orders.

## Tests

`analytics.service.spec.ts` (mocked `PrismaService`, same pattern as
`health.service.spec.ts`) covers:

- summary KPI math and the zero-orders case;
- date ranges: default 30 days, whole last day included for a plain
  `to`, exact instant when `to` has a time, same-day range, `from > to`
  rejected, impossible calendar days (30 Feb, 31 Apr, 29 Feb 2026) rejected
  and 29 Feb 2028 accepted;
- CSV injection: formula-like text is neutralised (`csv.util.spec.ts`);
- the demo-seed database guard (`demo-database.util.spec.ts`);
- live updates: shared rooms, push only on change, timer on/off, limits, bad
  filters (`realtime/*.spec.ts`); also checked once end-to-end with a real
  socket.io server and clients;
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
