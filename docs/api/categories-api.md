# Categories API

Categorías para clasificar platos. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs de ejemplo: sustituir por los reales. Autenticación pendiente de integración.

## GET /api/categories

Obtener categorías para el selector de un plato.

Sin body.

**Devuelve:**

```json
[
 {
  "id": 1,
  "name": "Platos principales",
  "description": null
 }
]
```

## Campos

- `id`: identificador que se envía como `categoryId` en menú.
- `name`: nombre visible.
- `description`: descripción o `null`.
- Sin datos: `[]`.
