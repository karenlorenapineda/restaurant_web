# restaurant_web
## Local development

Start the application with PostgreSQL accessible from the host:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up -d
```

The development configuration publishes PostgreSQL only on
`127.0.0.1:5432`.

Configure the database connections using the same database credentials:

- Root `.env`: `DATABASE_URL` uses `database:5432` for the backend container.
- `apps/backend/.env`: `DATABASE_URL` uses `localhost:5432` for local Prisma commands.

Do not commit `.env` files containing credentials.

Check database connectivity and migration status:

```bash
cd apps/backend
npx prisma migrate status
```

Run the following commands from the repository root.

Stop the development environment while preserving database data:

```bash
docker compose -f compose.yaml -f compose.dev.yaml down
```

Start without publishing PostgreSQL to the host:

```bash
docker compose -f compose.yaml up -d
```