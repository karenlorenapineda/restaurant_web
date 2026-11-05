# restaurant_web

Requires Docker and Node.js 22.12 or newer.

Frontend/backend integration, isolated test database and endpoint coverage:
[step-by-step guide](docs/INTEGRACION.md).

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

Deployment startup and legacy menu migration: [validated procedure](docs/DESPLIEGUE_Y_MIGRACION.md).

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

## Frontend modules: advanced search and three languages

This branch combines backend API integration with advanced search and three languages.
By default, menu and employee operations use the API. `VITE_DATA_MODE=demo` enables the independent frontend preview. Search runs on the fetched menu in the browser; no backend search endpoints are added.

- **Advanced search (1 point):** `/menu` and the menu section of `/empleados` support combined name/description search, category and COP price filters, name/price sorting, and pagination (6, 12 or 24 results). Employee management also filters availability; the public menu only shows available dishes. Search ignores accents and matches the original text and its translation in the selected language. Invalid price ranges show an error. Clear filters restores defaults.
- **Three languages (1 point):** Spanish, English and Portuguese are available in the header. The selection is stored locally and updates the document language. Navigation, forms, search controls, dashboard actions, accessible labels and feedback messages follow the selected language. Custom names, messages and descriptions remain user content rather than being automatically translated.

### Demonstration

1. With Node >=22.12, follow [the integration guide](docs/INTEGRACION.md) to run against the API, or use `VITE_DATA_MODE=demo npm run dev --workspace @picasso/frontend` for the standalone preview. Open `/menu`.
2. Search for a word from a dish name or description, combine category and price limits, and change sorting and page size. Clear filters and navigate between pages.
3. Open `/empleados`, choose the administrator preview, and repeat with the availability filter.
4. Switch ES / EN / PT in the header on the home, menu, order and employee pages. Change language while editing a draft to verify the fields are preserved.
5. Run `npm run build --workspace @picasso/frontend` and `npm run test:ci --workspace @picasso/frontend`.

The role selector is for development and does not authenticate users or enforce server permissions. The connected panel is disabled in production until authentication is integrated. See [the integration guide](docs/INTEGRACION.md) for the isolated test database and backend setup.

## Privacidad y términos

Las páginas públicas `/privacidad` y `/terminos` están enlazadas desde el pie de página y disponibles en español, inglés y portugués. También admiten `/privacy` y `/terms`, con o sin barra final.

Los textos describen el entorno académico actual, los datos de pedidos/empleados/chat, el almacenamiento local, los registros técnicos, la conservación y el alcance de las demostraciones. No hay un correo público confirmado: las consultas se dirigen al equipo mediante el canal que facilita el acceso. Deben revisarse al definir un responsable comercial, un contacto público, plazos de conservación o nuevas funciones.

Detalles y fuentes editoriales: [privacidad y términos](docs/PRIVACIDAD_Y_TERMINOS.md).
