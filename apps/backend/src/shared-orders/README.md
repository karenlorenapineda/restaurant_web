# Módulo `shared-orders` — Pedido compartido de mesa (tiempo real)

Varias personas de una mesa editan **a la vez el mismo pedido** y lo envían a cocina de una vez.
Cubre el módulo _Real-time collaborative features_ (espacio de trabajo compartido + edición en vivo).

## Cómo funciona

1. Alguien crea el pedido eligiendo una mesa y su nombre → recibe un **código de 6 caracteres**
   (sin letras ambiguas: 0/O, 1/I/L) y un enlace `/mesa?codigo=XXXXXX`.
2. El resto entra con el código. Todos ven quién está conectado.
3. Cualquiera añade platos, cambia cantidades, escribe notas o quita líneas; el resto lo ve al instante.
4. Cualquiera pulsa **Enviar a cocina**: se crea **un único** pedido `dine_in` con el servicio de
   pedidos existente (`OrdersService`). Cada línea lleva el nombre de quien la pidió en las notas.

## Diseño

- El **servidor es la única fuente de verdad**. Cada cambio pasa por `SharedOrdersService` (un solo hilo),
  que decide el orden y envía a todos la misma foto numerada (`version`). El cliente ignora fotos más viejas.
- El estado vive **en memoria**: no hay tablas nuevas ni migración. Hasta el envío no se escribe nada en la base de datos.
- Los precios se leen **siempre de la base de datos**; el cliente nunca los manda.
- Namespace socket.io `/shared-orders`. Eventos con acuse (`{status:"ok"}` / `{status:"error", message}`):
  `create`, `join`, `add-item`, `set-quantity`, `set-notes`, `remove-item`, `submit`, `leave`.
  El servidor emite a la sala `session:update` (estado completo) y `session:closed` (`{reason}`).
- **Reconexión**: al entrar se entrega un token secreto; con él la persona recupera su sitio tras un corte o
  al refrescar (el frontend lo guarda en `sessionStorage`). Los tokens nunca viajan en las fotos compartidas.
- **Doble envío**: el pedido se bloquea (`submitting`) antes de crear el pedido real; si falla, se reabre.

## Límites y limpieza

| Qué                      | Valor                 |
| ------------------------ | --------------------- |
| Mesas abiertas a la vez  | 200                   |
| Personas por mesa        | 12                    |
| Líneas por pedido        | 50                    |
| Cantidad por plato       | 1–20                  |
| Nombre / nota            | 30 / 140 caracteres   |
| Eventos por conexión     | 40 cada 10 s          |
| Mesa sin actividad       | se borra a las 4 h    |
| Mesa sin nadie conectado | se borra a los 30 min |
| Pedido ya enviado        | se borra a los 10 min |

Un temporizador (cada minuto) borra las mesas caducadas y avisa a quien siga conectado con `session:closed`.

## Configuración

- `SHARED_ORDER_RESTAURANT_ID` (por defecto `1`): restaurante al que se asigna el pedido final. El proyecto no
  tiene sesión real todavía; el controlador de pedidos usa el mismo valor simulado.
- `SHARED_ORDERS_CORS_ORIGIN` (por defecto `*`, como el chat): origen permitido para los sockets.

## Limitaciones conocidas

- Al reiniciar el servidor se pierden las mesas abiertas (es estado en memoria; con varias instancias haría falta Redis).
- No hay autenticación (como en el resto del proyecto): quien conozca el código puede entrar.
- Si alguien entra de nuevo **sin su token** (otro navegador), aparece como una persona nueva y la anterior
  queda como "desconectada" hasta que la mesa se cierre.
- El precio mostrado es el del momento de añadir el plato; al enviar, el pedido real usa el precio vigente.
- `AnalyticsModule`/`OrdersModule` no se modifican: `OrdersService` se registra también en este módulo.

## Cómo se ha verificado

- Tests unitarios del servicio (límites, carreras entre consulta a la base de datos y desconexión, caducidad, doble envío).
- Tests con **sockets reales** (`socket.io-client`) contra el módulo Nest: seis personas editando a la vez,
  reconexión con token, doble envío, límite de eventos, cierre de mesa.
- Prueba extremo a extremo con navegador real (dos personas), comprobando que se crea un solo pedido.
- Pruebas de mutación: se rompieron reglas a propósito y los tests las detectan.
