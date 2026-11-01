# Inventory API

Artículos como vasos o servilletas; pedidos no los descuenta automáticamente. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs de ejemplo: sustituir por los reales. Autenticación pendiente de integración.

## GET /api/inventory

Listar todos los registros. Sin resultados: `[]`.

Sin body.

**Devuelve:**

```json
[
 {
  "id": 7,
  "const": "$200 COP",
  "name": "Vasos",
  "stock": "100",
  "threshold": "20",
  "unit": "ud"
 }
]
```

## POST /api/inventory

Crear un registro (201).

**Enviar:**

```json
{
 "name": "Vasos",
 "unitId": 3,
 "unitCost": 200,
 "currentStock": 100,
 "minimumStock": 20
}
```

**Devuelve:**

```json
{
 "id": 7,
 "name": "Vasos",
 "unitId": 3,
 "unitCost": "200",
 "currentStock": "100",
 "minimumStock": "20"
}
```

## PATCH /api/inventory/7

Editar solo los campos enviados (200).

**Enviar:**

```json
{
 "currentStock": 3
}
```

**Devuelve:**

```json
{
 "id": 7,
 "name": "Vasos",
 "unitId": 3,
 "unitCost": "200",
 "currentStock": "3",
 "minimumStock": "20"
}
```

## DELETE /api/inventory/7

Borrar definitivamente y devolver el registro anterior (200).

Sin body.

**Devuelve:**

```json
{
 "id": 7,
 "name": "Vasos",
 "unitId": 3,
 "unitCost": "200",
 "currentStock": "100",
 "minimumStock": "20"
}
```

## Campos

- `name`: nombre obligatorio al crear, no vacío, máximo 255 caracteres.
- `unitId`: ID entero positivo de una unidad existente; obligatorio al crear.
- `unitCost`: coste en COP por unidad; obligatorio al crear, ≥ 0, máximo 2 decimales.
- `currentStock`: cantidad disponible, opcional al crear (0 por defecto), ≥ 0, máximo 3 decimales. PATCH reemplaza, no suma.
- `minimumStock`: umbral mínimo, opcional al crear (0 por defecto), ≥ 0, máximo 3 decimales.
- PATCH admite esos cinco campos, todos opcionales. Las cantidades y el precio enviados se expresan en la unidad indicada.
- `id`: ID del registro. POST/PATCH/DELETE devuelven decimales como cadenas.
- GET cambia los nombres: `const` = coste formateado (nombre literal actual), `stock` = `currentStock`, `threshold` = `minimumStock`, `unit` = abreviatura.
- Consultar `/api/units` para seleccionar unidades.
