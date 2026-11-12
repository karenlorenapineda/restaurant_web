# Módulo `user-activity` — Analítica de actividad de usuarios

Módulo independiente de `analytics`. Calcula métricas de actividad de usuarios
**solo con datos que ya existen** en la base de datos (usuarios, chat, amistades,
pedidos atendidos por empleados). No añade tablas ni migraciones.

## Endpoints

Todos son `GET` bajo `/user-activity`.

| Ruta                          | Qué devuelve                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/summary`                    | KPIs del periodo (usuarios totales/activos/verificados, altas, inactivos, mensajes, chatters activos, amistades, pedidos atendidos) |
| `/signups-over-time`          | Altas agrupadas por `day`, `week` o `month` (listo para gráfica)                                                                    |
| `/chat-activity-over-time`    | Mensajes de chat agrupados por `day`, `week` o `month`                                                                              |
| `/users-by-role`              | Número de usuarios por rol                                                                                                          |
| `/top-active-users`           | Ranking de usuarios más activos (`metric=messages` o `orders`, `limit` 1–50)                                                        |
| `/insights`                   | Observaciones automáticas (tendencias, inactivos, mensajes sin leer, hora punta)                                                    |
| `/export/csv` y `/export/pdf` | Exportación de cualquiera de los 6 informes con `report=...`                                                                        |

### Filtros comunes

- `from`, `to`: fechas ISO. Si `to` es solo una fecha (`2026-08-31`) se incluye el día completo.
  Se rechazan días imposibles (`2026-02-30`). Por defecto, últimos 30 días.
- `restaurantId` (opcional): ver limitaciones.
- `groupBy`: `day` (por defecto), `week`, `month`.
- `limit` y `metric`: solo en `top-active-users`.
- `report`: `summary`, `signups-over-time`, `chat-activity-over-time`, `users-by-role`,
  `top-active-users`, `insights`.

## Definiciones

- **Ventana temporal**: intervalo semiabierto `[from, fin)` en **UTC**.
- **Usuario inactivo (dormido)**: último inicio de sesión hace más de 30 días
  (`DORMANT_AFTER_DAYS`).
- **Pedidos atendidos**: pedidos con empleado asignado que cuentan como venta
  (se excluyen los cancelados, igual que en `analytics`).
- **Insights**: tendencia de altas y de chat frente al periodo anterior de la misma
  duración (≥ +10 % positivo, ≤ −10 % aviso, si no, estable); aviso si ≥ 50 % de los
  usuarios están inactivos; aviso si > 30 % de los mensajes siguen sin leer; hora y día
  de la semana con más chat (UTC).

## Privacidad

- El contenido del chat está cifrado y **nunca se lee**: solo se cuentan mensajes.
- Si un usuario no tiene nombre de empleado se muestra su e-mail enmascarado (`ma***@x.com`).
- Los CSV protegen frente a inyección de fórmulas (`=`, `+`, `-`, `@` al inicio de celda).

## Limitaciones conocidas

- `lastLogin` solo guarda el **último** inicio de sesión (sin histórico), así que no se
  puede calcular "usuarios activos por día" real; se aproxima con "último login dentro del rango".
- `restaurantId` solo filtra las métricas ligadas a empleados o pedidos (pedidos atendidos,
  ranking por pedidos, mensajes de empleados). Los usuarios clientes no pertenecen a un restaurante.
- Los límites de día son UTC.
- El proyecto no tiene guards de autenticación todavía: los endpoints son públicos como los de `analytics`.
- La página `/actividad` no tiene enlace en el menú: se accede por URL (se puede enlazar desde el panel de empleados cuando se decida).

## Cómo se ha verificado

- Tests unitarios con Prisma simulado (`*.spec.ts`) y un test que arranca el módulo real por HTTP (rutas, validación y descargas).
- SQL crudo comprobado contra un PostgreSQL real con el esquema de las migraciones
  (bordes de periodo, cancelados, filtro por restaurante, protección CSV).
- Las consultas con el cliente de Prisma (`count`, `groupBy`) solo están cubiertas con mocks.

## Reutilización

Las fechas se validan con `AnalyticsService.resolveDateRange` (mismas reglas que las ventas).
`UserActivityModule` lo registra como proveedor propio para no modificar `AnalyticsModule`.

## Frontend

La página `/actividad` (`apps/frontend/src/pages/UserActivityPage.tsx`) consume estos endpoints:
filtros de fechas, agrupación, ranking y restaurante; KPIs, conclusiones traducidas (es/en/pt),
gráficas SVG (líneas, anillo y barras) y descarga CSV/PDF. No necesita librerías nuevas.
