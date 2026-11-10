# Menu API

Consulta y gestión de platos. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs de ejemplo: sustituir por los reales. Autenticación pendiente de integración.

## GET /api/menu

Carta por categorías. Incluye todos los platos registrados.

Sin body.

**Devuelve:**

```json
[
 {
  "title": "Platos principales",
  "items": [
   {
    "id": 10,
    "name": "Pizza",
    "description": null,
    "price": "$25.000 COP"
   }
  ]
 }
]
```

## GET /api/menu/featured

Solo destacados y disponibles.

Sin body.

**Devuelve:**

```json
[
 {
  "id": 10,
  "name": "Pizza",
  "description": null,
  "price": "$25.000 COP",
  "image": null
 }
]
```

## GET /api/menu/management

Todos los platos para gestión, activos e inactivos.

Sin body.

**Devuelve:**

```json
[
 {
  "id": 10,
  "name": "Pizza",
  "description": null,
  "price": "$25.000 COP",
  "category": "Platos principales",
  "image": null,
  "active": true,
  "featured": false,
  "showImage": false,
  "recipe": null
 }
]
```

## POST /api/menu

Crear plato; ingredientes opcionales. Devuelve 201.

**Enviar:**

```json
{
 "name": "Pizza",
 "price": 25000,
 "categoryId": 1,
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
 "id": 10,
 "name": "Pizza",
 "imageUrl": null,
 "description": null,
 "price": "25000",
 "categoryId": 1,
 "isAvailable": true,
 "internalRecipe": null,
 "isFavorite": false,
 "showImageInGallery": false,
 "recipes": [
  {
   "id": 20,
   "itemId": 10,
   "ingredientId": 5,
   "quantity": "250",
   "unitId": 1
  }
 ]
}
```

## PATCH /api/menu/10

Editar plato y recetas existentes en una transacción (200).

**Enviar:**

```json
{
 "price": 25000,
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
{
 "id": 10,
 "name": "Pizza",
 "imageUrl": null,
 "description": null,
 "price": "25000",
 "categoryId": 1,
 "isAvailable": true,
 "internalRecipe": null,
 "isFavorite": false,
 "showImageInGallery": false,
 "recipes": [
  {
   "id": 20,
   "itemId": 10,
   "ingredientId": 5,
   "quantity": "250",
   "unitId": 1
  }
 ]
}
```

## DELETE /api/menu/10

Eliminar un plato sin pedidos asociados (200).

Sin body.

**Devuelve:**

```json
{
 "id": 10,
 "name": "Pizza",
 "imageUrl": null,
 "description": null,
 "price": "25000",
 "categoryId": 1,
 "isAvailable": true,
 "internalRecipe": null,
 "isFavorite": false,
 "showImageInGallery": false
}
```

Si tiene pedidos, DELETE desactiva el plato y devuelve el registro con `isAvailable: false` y `recipes`, conservando el historial.

## Campos

- `name`: obligatorio en POST, texto no vacío, máximo 255.
- `price`: obligatorio en POST, número COP ≥ 0, máximo 2 decimales. GET lo formatea; escrituras lo devuelven como cadena decimal.
- `categoryId`: obligatorio en POST, entero positivo de categoría existente.
- Opcionales: `description` (texto no vacío), `imageUrl` (texto no vacío), `internalRecipe` (instrucciones), `isAvailable` (booleano, defecto true), `isFavorite` y `showImageInGallery` (booleanos, defecto false).
- `ingredients`: opcional; si se envía, array no vacío. POST exige `ingredientId`, `quantity` y `unitId` en cada elemento. Cantidad ≥ 0, máximo 3 decimales; IDs positivos y unidades compatibles.
- PATCH: campos del plato opcionales; cada receta requiere `id`, permite `ingredientId`, `quantity`, `unitId` y debe pertenecer al plato.
- Respuestas: `id` identifica plato, `recipes[].id` identifica receta, `recipes[].itemId` identifica plato.
- Gestión renombra campos: `active` = `isAvailable`, `featured` = `isFavorite`, `showImage` = `showImageInGallery`, `image` = `imageUrl`, `recipe` = `internalRecipe`, `category` = nombre. `title` es nombre de categoría.
- Textos opcionales de la respuesta pueden ser null. GET sin datos devuelve [].
