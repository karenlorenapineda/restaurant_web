# Units API

Catálogo de unidades para ingredientes, inventario y recetas. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs de ejemplo: sustituir por los reales. Autenticación pendiente de integración.

## GET /api/units

Obtener unidades para un selector.

Sin body.

**Devuelve:**

```json
[
 {
  "id": 2,
  "abbreviation": "kg",
  "name": "Kilogramo",
  "type": "weight",
  "baseFactor": "1000"
 }
]
```

## Campos

- `id`: valor a enviar como `unitId`.
- `abbreviation`: símbolo visible.
- `name`: nombre completo.
- `type`: `weight`, `volume` o `count`.
- `baseFactor`: factor de conversión como cadena decimal.
- Las cantidades se envían en la unidad elegida: `1` con kg significa 1 kg. Sin datos: `[]`.
