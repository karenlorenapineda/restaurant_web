# Recipes API

Cantidades de ingredientes que componen cada plato. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs de ejemplo: sustituir por los reales. Autenticación pendiente de integración.

## GET /api/recipes

Todas las recetas agrupadas por ID del plato.

Sin body.

**Devuelve:**

```json
{
 "10": {
  "itemId": 10,
  "name": "Pizza",
  "ingredients": [
   {
    "id": 20,
    "ingredientId": 5,
    "unitId": 1,
    "quantity": "250",
    "supplyName": "Harina",
    "unit": "g"
   }
  ],
  "recipe": null
 }
}
```

## GET /api/recipes/10

Recetas del plato 10. Sin recetas o plato inexistente: {}.

Sin body.

**Devuelve:**

```json
{
 "10": {
  "itemId": 10,
  "name": "Pizza",
  "ingredients": [
   {
    "id": 20,
    "ingredientId": 5,
    "unitId": 1,
    "quantity": "250",
    "supplyName": "Harina",
    "unit": "g"
   }
  ],
  "recipe": null
 }
}
```

## POST /api/recipes

Añadir recetas a un plato (201); no reemplaza las existentes.

**Enviar:**

```json
{
 "itemId": 10,
 "ingredients": [
  {
   "ingredientId": 5,
   "quantity": 250,
   "unitId": 1
  }
 ]
}
```

**Devuelve:**

```json
{
 "count": 1
}
```

## PATCH /api/recipes

Editar recetas en una transacción (200).

**Enviar:**

```json
{
 "ingredients": [
  {
   "id": 20,
   "quantity": 250
  }
 ]
}
```

**Devuelve:**

```json
[
 {
  "id": 20,
  "itemId": 10,
  "ingredientId": 5,
  "quantity": "250",
  "unitId": 1
 }
]
```

## DELETE /api/recipes

Eliminar recetas por ID (200). Devuelve las encontradas; IDs inexistentes se ignoran.

**Enviar:**

```json
{
 "ids": [
  20
 ]
}
```

**Devuelve:**

```json
[
 {
  "id": 20,
  "itemId": 10,
  "ingredientId": 5,
  "quantity": "250",
  "unitId": 1
 }
]
```

## Campos

- `itemId`: ID positivo del plato; obligatorio en POST. `dishId` de la ruta GET es ese ID.
- `ingredients`: array obligatorio y no vacío en POST/PATCH. POST requiere `ingredientId` (ID ingrediente), `quantity` (número ≥ 0, máximo 3 decimales), `unitId` (ID unidad compatible).
- PATCH exige `ingredients[].id` (ID receta) y admite los otros tres campos opcionales. Enviar cantidad y unidad coherentes.
- DELETE requiere `ids`: array no vacío de enteros positivos. Si hay referencias desde pedidos, puede fallar el borrado.
- GET: clave numérica como texto = plato; `name` = nombre plato, `supplyName` = ingrediente, `unit` = abreviatura, `recipe` = instrucciones o null.
- `id` dentro de ingredientes identifica receta; sirve también como `recipeId` en modificaciones de pedidos. `quantity` se devuelve como cadena decimal.
- `count`: número de recetas creadas. Editar instrucciones mediante menú: `internalRecipe`.
