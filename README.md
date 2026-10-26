# restaurant_web


## Run locally

Requires Docker and Node.js 22.

Start PostgreSQL:

```bash
docker compose up -d database
```

Set `DATABASE_URL` in `.env` to use `localhost:5432`, then start the frontend and backend:

```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000/api/health

Stop the app with `Ctrl+C`, then stop PostgreSQL:

```bash
docker compose down
```

## Run everything with Docker

Set `DATABASE_URL` in `.env` to use `database:5432`, then run:

```bash
docker compose up -d --build
```

Stop everything with:

```bash
docker compose down
```

## Run tests

```bash
npm run test
```