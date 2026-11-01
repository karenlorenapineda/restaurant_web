# Orders API

Pedidos y avance de preparación. Enviar POST/PATCH como JSON (`Content-Type: application/json`). **Autenticación pendiente:** restaurantId y employeeId se obtienen provisionalmente de request.user o de valores simulados 1 y 1; esos registros deben existir. El frontend envía los campos del DTO.

## GET /api/orders

Listar pedidos del más reciente al más antiguo. Sin datos: [].

Sin body.

**Devuelve:**

```json
[
 {
  "id": 10,
  "type": "takeaway",
  "status": "queued",
  "customer": "Ana",
  "customerPhone": null,
  "tableOrLocation": "Para llevar",
  "total": "$25.000 COP",
  "createdAt": "2026-10-16T20:00:00.000Z",
  "items": [
   {
    "itemId": 5,
    "name": "Pizza",
    "quantity": 1,
    "unitPrice": "25000",
    "notes": null,
    "removedIngredients": []
   }
  ]
 }
]
```

## GET /api/orders/10

Obtener un pedido.

Sin body.

**Devuelve:**

```json
{
 "id": 10,
 "type": "takeaway",
 "status": "queued",
 "customer": "Ana",
 "customerPhone": null,
 "tableOrLocation": "Para llevar",
 "total": "$25.000 COP",
 "createdAt": "2026-10-16T20:00:00.000Z",
 "items": [
  {
   "itemId": 5,
   "name": "Pizza",
   "quantity": 1,
   "unitPrice": "25000",
   "notes": null,
   "removedIngredients": []
  }
 ]
}
```

## POST /api/orders

Crear pedido queued (201). Precio y total se calculan en backend.

**Enviar:**

```json
{
 "type": "takeaway",
 "customerName": "Ana",
 "items": [
  {
   "itemId": 5,
   "quantity": 1
  }
 ]
}
```

**Devuelve:**

```json
{
 "id": 10,
 "tableId": null,
 "customerName": "Ana",
 "customerAddress": null,
 "customerPhone": null,
 "restaurantId": 1,
 "employeeId": 1,
 "status": "queued",
 "type": "takeaway",
 "orderDate": "2026-10-16T20:00:00.000Z",
 "total": "25000",
 "orderDetails": [
  {
   "id": 30,
   "orderId": 10,
   "itemId": 5,
   "quantity": 1,
   "unitPrice": "25000",
   "notes": null,
   "modifications": []
  }
 ],
 "statusHistory": [
  {
   "id": 40,
   "orderId": 10,
   "status": "queued",
   "statusDate": "2026-10-16T20:00:00.000Z"
  }
 ]
}
```

## PATCH /api/orders/10/status

Cambiar estado (200). Devuelve registro e historial, sin orderDetails.

**Enviar:**

```json
{
 "status": "preparing"
}
```

**Devuelve:**

```json
{
 "id": 10,
 "tableId": null,
 "customerName": "Ana",
 "customerAddress": null,
 "customerPhone": null,
 "restaurantId": 1,
 "employeeId": 1,
 "status": "preparing",
 "type": "takeaway",
 "orderDate": "2026-10-16T20:00:00.000Z",
 "total": "25000",
 "statusHistory": [
  {
   "id": 40,
   "orderId": 10,
   "status": "queued",
   "statusDate": "2026-10-16T20:00:00.000Z"
  },
  {
   "id": 41,
   "orderId": 10,
   "status": "preparing",
   "statusDate": "2026-10-16T20:00:00.000Z"
  }
 ]
}
```

## Estados

| Actual | Siguientes |
|---|---|
| queued | preparing, cancelled |
| preparing | ready, cancelled |
| ready | completed, cancelled |
| completed / cancelled | Ninguno |

Al pasar a preparing descuenta ingredientes, convirtiendo unidades y excluyendo modificaciones.

## Campos

- `type`: obligatorio: dine_in, takeaway, delivery. `tableId`: obligatorio para dine_in, prohibido en los otros; ID positivo de mesa existente.
- `customerName`: nombre opcional no vacío. `customerAddress` y `customerPhone`: textos no vacíos obligatorios para delivery, opcionales en otros casos.
- `items`: array obligatorio no vacío. Cada línea requiere `itemId` (plato disponible) y `quantity` (entero ≥ 1).
- Línea opcional: `notes` (texto), `modifications` (array de objetos `{ "recipeId": 20 }` para excluir recetas del plato). Notas no excluyen ingredientes automáticamente.
- PATCH solo recibe `status`; no permite saltos ni repetir estado.
- GET: `customer` = nombre o Cliente general; `tableOrLocation` = mesa/Para llevar/Domicilio; `createdAt` = fecha ISO; `total` = COP formateado; `items[].removedIngredients` = nombres excluidos. `unitPrice` es cadena decimal.
- POST/PATCH: `orderDate` = fecha, `total` = cadena decimal; IDs de usuario/restaurante/mesa/empleado son relaciones. `orderDetails` = líneas con `orderId`, `itemId`, cantidad, precio y notas; modificaciones incluyen receta e ingrediente si existen. `statusHistory` = registros con id, orderId, status, statusDate.
- Consultar GET /api/orders/:id para refrescar la pantalla con el formato de consulta.
- 400: datos/transición inválidos; 404: pedido o mesa inexistente; 409: otra petición cambió el estado.
