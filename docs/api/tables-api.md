# Tables catalog

`GET /api/tables` returns the existing tables, ordered by table number and ID:

```json
[{ "id": 42, "tableNumber": "Terraza 7", "capacity": 4 }]
```

An empty catalog returns `[]`. No tables are created by this endpoint. The order form displays number and capacity and sends the selected numeric ID as `tableId` in a `dine_in` order. The existing schema has a global table catalog without a restaurant relation.

This endpoint follows the current development API setup. Authentication and server permissions remain a separate pending integration.
