# Restaurant API

Datos del único restaurante del proyecto. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs de ejemplo: sustituir por los reales. Autenticación pendiente de integración.

## GET /api/restaurant

Consultar los datos del restaurante.

Sin body.

**Devuelve:**

```json
[
 {
  "id": 1,
  "name": "Picasso",
  "address": "Calle 10",
  "isActive": true
 }
]
```

## Campos

- `id`: ID del restaurante.
- `name`: nombre.
- `address`: dirección.
- `isActive`: estado.
- Devuelve un array aunque solo exista un restaurante.
