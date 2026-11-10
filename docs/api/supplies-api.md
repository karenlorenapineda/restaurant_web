# Supplies API

Ingredientes usados por recetas; pedidos los descuenta al pasar a `preparing`. Si están usados por recetas, DELETE responde 409 y no elimina. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs de ejemplo: sustituir por los reales. Autenticación pendiente de integración.

## GET /api/supplies

Listar todos los registros. Sin resultados: `[]`.

Sin body.

**Devuelve:**

```json
[
 {
  "id": 5,
  "const": "$4.000 COP",
  "name": "Harina",
  "stock": "2",
  "threshold": "0.5",
  "unit": "kg"
 }
]
```

## POST /api/supplies

Crear un registro (201).

**Enviar:**

```json
{
 "name": "Harina",
 "unitId": 2,
 "unitCost": 4000,
 "currentStock": 2,
 "minimumStock": 0.5
}
```

**Devuelve:**

```json
{
 "id": 5,
 "name": "Harina",
 "unitId": 2,
 "unitCost": "4000",
 "currentStock": "2",
 "minimumStock": "0.5"
}
```

## PATCH /api/supplies/5

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
 "id": 5,
 "name": "Harina",
 "unitId": 2,
 "unitCost": "4000",
 "currentStock": "3",
 "minimumStock": "0.5"
}
```

## DELETE /api/supplies/5

Borrar definitivamente y devolver el registro anterior (200).

Sin body.

**Devuelve:**

```json
{
 "id": 5,
 "name": "Harina",
 "unitId": 2,
 "unitCost": "4000",
 "currentStock": "2",
 "minimumStock": "0.5"
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
