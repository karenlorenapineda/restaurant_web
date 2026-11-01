# Employees API

Gestión de empleados del único restaurante. Enviar POST/PATCH como JSON (`Content-Type: application/json`). IDs ilustrativos. **Autenticación y permisos pendientes de integración.**

## GET /api/employees

Listar activos e inactivos. Sin datos: [].

Sin body.

**Devuelve:**

```json
[
 {
  "id": 7,
  "name": "Ana Pérez",
  "phone": null,
  "active": true,
  "email": "ana@example.com",
  "position": "Mesero",
  "role": "Employee"
 }
]
```

## POST /api/employees

Crear empleado asociado a usuario existente (201).

**Enviar:**

```json
{
 "userId": 12,
 "firstName": "Ana",
 "lastName": "Pérez",
 "restaurantId": 1,
 "positionId": 2
}
```

**Devuelve:**

```json
{
 "id": 7,
 "userId": 12,
 "firstName": "Ana",
 "lastName": "Pérez",
 "phone": null,
 "restaurantId": 1,
 "positionId": 2,
 "birthDate": null,
 "hireDate": "2026-10-16T20:00:00.000Z",
 "terminationDate": null,
 "isActive": true
}
```

## PATCH /api/employees/7

Editar los campos enviados (200).

**Enviar:**

```json
{
 "firstName": "Ana",
 "positionId": 2
}
```

**Devuelve:**

```json
{
 "id": 7,
 "userId": 12,
 "firstName": "Ana",
 "lastName": "Pérez",
 "phone": null,
 "restaurantId": 1,
 "positionId": 2,
 "birthDate": null,
 "hireDate": "2026-10-16T20:00:00.000Z",
 "terminationDate": null,
 "isActive": true
}
```

## PATCH /api/employees/7/activate

Activar empleado y limpiar fecha de baja (200).

Sin body.

**Devuelve:**

```json
{
 "id": 7,
 "userId": 12,
 "firstName": "Ana",
 "lastName": "Pérez",
 "phone": null,
 "restaurantId": 1,
 "positionId": 2,
 "birthDate": null,
 "hireDate": "2026-10-16T20:00:00.000Z",
 "terminationDate": null,
 "isActive": true
}
```

## PATCH /api/employees/7/deactivate

Desactivar empleado y registrar fecha actual de baja (200).

Sin body.

**Devuelve:**

```json
{
 "id": 7,
 "userId": 12,
 "firstName": "Ana",
 "lastName": "Pérez",
 "phone": null,
 "restaurantId": 1,
 "positionId": 2,
 "birthDate": null,
 "hireDate": "2026-10-16T20:00:00.000Z",
 "terminationDate": "2026-10-17T12:00:00.000Z",
 "isActive": false
}
```

## Campos

- POST obligatorios: `userId` (usuario existente sin otro empleado), `firstName` y `lastName` (textos no vacíos, máximo 255), `restaurantId` (restaurante existente), `positionId` (puesto existente). IDs enteros positivos.
- Opcionales: `phone` (texto no vacío, máximo 255), `birthDate` (fecha ISO).
- PATCH permite `firstName`, `lastName`, `phone`, `positionId`, `birthDate`, todos opcionales.
- Respuesta escrita: `id` = empleado, `isActive` = estado, `hireDate` = contratación, `terminationDate` = baja; fechas ISO o null donde corresponda.
- GET: `name` concatena nombre y apellido, `active` es estado del empleado, `email`/`role` pertenecen al usuario, `position` es nombre del puesto.
