# restaurant_web

Requires Docker and Node.js 22.12 or newer.

## Run locally

Start PostgreSQL with its development port, without starting a second backend:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d database
npm ci
```

Configure `apps/backend/.env` with the database credentials from the root `.env`, using `localhost:5432` in `DATABASE_URL`. The root `.env` keeps `database:5432` for Docker. Never commit credentials.

Before starting, inspect migration status:

```bash
cd apps/backend
npx prisma migrate status
```

Do not reset an existing database to resolve migration differences. Back up existing data and review migrations before applying them.

From the repository root:

```bash
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3000/api/health

## Run everything with Docker

Set `DATABASE_URL` in the root `.env` to use `database:5432`:

```bash
docker compose up -d --build
```

Development PostgreSQL access is available only at `127.0.0.1:5432` with `compose.dev.yaml`.

Stop the development environment while preserving data:

```bash
docker compose -f compose.yaml -f compose.dev.yaml down
```

## Checks

```bash
npm run build
npm run test:ci
```
