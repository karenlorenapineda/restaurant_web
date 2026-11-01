# Chat API

Chat exclusivamente de uno a uno, sin grupos. Enviar HTTP POST como JSON (`Content-Type: application/json`). **Autenticación pendiente:** por ahora el cliente envía senderId en mensajes y userId en join.

## POST /api/chat/send

Guardar mensaje privado (201). Para entrega en vivo, usar el evento sendMessage.

**Enviar:**

```json
{
 "senderId": 1,
 "receiverId": 2,
 "message": "Hola"
}
```

**Devuelve:**

```json
{
 "id": 10,
 "senderId": 1,
 "receiverId": 2,
 "message": "Hola",
 "sentAt": "2026-10-16T20:00:00.000Z"
}
```

## GET /api/chat/conversation/1/2

Historial en ambas direcciones, del más antiguo al más reciente. Sin mensajes: [].

Sin body.

**Devuelve:**

```json
[
 {
  "id": 10,
  "senderId": 1,
  "receiverId": 2,
  "message": "Hola",
  "sentAt": "2026-10-16T20:00:00.000Z"
 }
]
```

## Socket.IO (tiempo real)

Conectar al origen/path de Socket.IO configurado en el proyecto; /api es el prefijo HTTP, no el path del socket.

### join — registrar la conexión del propio usuario

Enviar:

```json
{
 "userId": 2
}
```

Confirmación:

```json
{
 "status": "joined",
 "room": "user_2"
}
```

`room` es un canal interno para entregar mensajes a las conexiones del usuario; **no es un grupo de chat**. Repetir join al reconectar.

### sendMessage — guardar y entregar al receptor

Enviar:

```json
{
 "senderId": 1,
 "receiverId": 2,
 "message": "Hola"
}
```

Confirmación al emisor:

```json
{
 "id": 10,
 "senderId": 1,
 "receiverId": 2,
 "message": "Hola",
 "sentAt": "2026-10-16T20:00:00.000Z"
}
```

### newMessage — evento recibido por el receptor

Datos:

```json
{
 "id": 10,
 "senderId": 1,
 "receiverId": 2,
 "message": "Hola",
 "sentAt": "2026-10-16T20:00:00.000Z"
}
```

Para guardar y entregar en vivo, enviar una vez mediante sendMessage. Si el receptor está desconectado, recupera el historial por GET.

## Campos

- `senderId`: ID del emisor, entero ≥ 1 en HTTP; provisional.
- `receiverId`: ID del receptor existente, entero ≥ 1 en HTTP.
- `message`: texto no vacío en HTTP. Backend cifra al guardar y descifra al consultar; frontend usa texto plano.
- `userId` en join: ID del propio usuario para recibir mensajes, no del interlocutor.
- `id`: ID del mensaje; usar para evitar duplicados. `sentAt`: fecha ISO.
- `status` y `room` son confirmación técnica de join.
- HTTP: 400 datos inválidos; 404 receptor inexistente; 500 error no traducido.
