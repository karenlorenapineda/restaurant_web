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

## Frontend modules: advanced search and three languages

This branch keeps the frontend preview independent of the pending API integration.
Menu and employee operations use local preview data. It does not add backend search endpoints.

- **Advanced search (1 point):** `/menu` and the menu section of `/empleados` support combined name/description search, category and COP price filters, name/price sorting, and pagination (6, 12 or 24 results). Employee management also filters availability; the public menu only shows available dishes. Search ignores accents and matches the original text and its translation in the selected language. Invalid price ranges show an error. Clear filters restores defaults.
- **Three languages (1 point):** Spanish, English and Portuguese are available in the header. The selection is stored locally and updates the document language. Navigation, forms, search controls, dashboard actions, accessible labels and feedback messages follow the selected language. Custom names, messages and descriptions remain user content rather than being automatically translated.

### Demonstration

1. Run `npm run dev --workspace @picasso/frontend` with Node >=22.12. Open `/menu`.
2. Search for a word from a dish name or description, combine category and price limits, and change sorting and page size. Clear filters and navigate between pages.
3. Open `/empleados`, choose the administrator preview, and repeat with the availability filter.
4. Switch ES / EN / PT in the header on the home, menu, order and employee pages. Change language while editing a draft to verify the fields are preserved.
5. Run `npm run build --workspace @picasso/frontend` and `npm run test:ci --workspace @picasso/frontend`.

The role selector is a frontend preview and does not authenticate users or enforce server permissions. Health status requires a running backend; the preview menu and dashboard work independently.
