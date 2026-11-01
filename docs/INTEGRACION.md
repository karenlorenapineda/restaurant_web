# Integración del frontend y backend

## 1. Actualizar la rama

Se incorporó `origin/main` (incluida la PR #13) a `chore/frontend_basic_design` mediante el merge `8f831ab`. Se conservaron el portugués, el sistema de diseño y las pantallas de demostración. El único conflicto fue el README, resuelto conservando instrucciones de ambos lados y corrigiendo el arranque local.

Las especificaciones recibidas están en `docs/api/`. Se han contrastado con los controladores, DTO y servicios, porque GET y POST no devuelven el mismo formato.

## 2. Separar la API de las pantallas

- `src/api/client.ts`: peticiones JSON, errores HTTP, abortado/tiempo límite, validación de respuestas y conversión de importes COP.
- `src/api/menu.ts` y `usePublicMenu.tsx`: consulta de carta, estados de carga/error y actualización después de cambios.
- `src/api/orders.ts`: creación de pedidos y transiciones válidas.
- `src/api/recipes.ts`: validación de recetas agrupadas y sus identificadores.

Las URLs HTTP son relativas (`/api/...`); Vite y Nginx las reenvían al backend. Socket.IO usa `/socket.io`, sin el prefijo `/api`.

## 3. Conectar los flujos

| Pantalla             | Fuente y escrituras                                                                                |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| Inicio y carta       | GET `/menu`; utiliza imágenes y galería guardadas; muestra hasta tres platos disponibles en inicio |
| Pedido online        | GET `/menu`, POST `/orders`; toma ID y total del servidor                                          |
| Platos               | GET `/menu/management`, `/categories`; POST/PATCH/DELETE `/menu`                                   |
| Insumos e inventario | GET/POST/PATCH/DELETE de cada módulo; unidades desde `/units`                                      |
| Pedidos internos     | GET `/orders`, POST `/orders`, PATCH `/orders/:id/status`; permite exclusiones por `recipeId`      |
| Recetas              | GET/POST/PATCH/DELETE `/recipes`; edición de cantidades y unidades                                 |
| Empleados            | GET/POST/PATCH `/employees`; activar/desactivar por sus rutas específicas                          |
| Chat interno         | GET historial + Socket.IO `join`, `sendMessage`, `newMessage`                                      |

El panel conectado recupera el diseño original: selector de vistas admin/sala/cocina, barra lateral, métricas de platos, formularios, tablero y conversaciones. Reutiliza `MenuManagement`, `SuppliesManagement`, `EmployeesManagement`, `OrdersManagement` y `ChatManagement`; la conexión se concentra en `useConnectedPanel` y `api/employeePanel.ts`. Las vistas de sala/cocina mantienen sus opciones y campos de consulta. El selector es exclusivamente de desarrollo y no concede permisos en el servidor.

Los formularios conservan Button, Input, Select, Field y Panel. Las escrituras tienen botón Guardar; no se envía una petición por cada tecla. Los botones se bloquean durante el envío. Después del éxito se vuelve a consultar el servidor. Si falla la escritura, se conserva el formulario y se muestra el error. Si la escritura funciona pero falla la actualización de la lista, se indica expresamente que no debe repetirse el envío.

El backend calcula precios y totales y descuenta ingredientes al pasar de `queued` a `preparing`. El frontend no envía totales ni actualiza stock por su cuenta. Se muestran los cinco estados reales, sin saltos: `queued → preparing → ready → completed`, con cancelación desde estados no terminales. Un conflicto 409 se muestra sin simular una transición correcta.

No se guardan pedidos reales en localStorage. Solo se confirma el pedido tras una respuesta válida del servidor. La selección de idioma sigue siendo local. El pago online sigue pendiente: el flujo conectado permite revisar y enviar un pedido, sin mostrar ni recopilar tarjetas.

## 4. Ajuste mínimo del backend

GET `/api/menu` ahora filtra platos no disponibles y devuelve `image`, `available`, `featured` y `showImage` junto con los campos anteriores. La interfaz ya no utiliza `featured`: se conserva en la API por compatibilidad. Los demás campos permiten mostrar la configuración guardada en inicio/carta y no permitir elegir platos que el servidor rechazará. No se exponen las recetas internas en esa respuesta. Se actualizó su test; no se cambió el esquema ni las migraciones.

Para alimentar los formularios originales, GET `/employees` añade `userId`, `firstName`, `lastName`, `positionId` y `restaurantId`; GET `/menu/management` añade `categoryId`; GET `/supplies` e `/inventory` añaden `unitId`. Se mantienen los campos previos y no se cambian modelos ni migraciones. El chat utiliza `userId` del directorio de empleados, nunca su `id` de empleado.

En gestión, los costes formateados de GET (`const`, nombre literal de la API) se convierten a números antes del PATCH. Las categorías y unidades se seleccionan por ID. Si nombres/abreviaturas están duplicados, se exige elegir explícitamente en lugar de adivinar el ID.

## 5. Arranque con una base nueva y aislada

**La base que estaba ejecutándose contiene tablas antiguas y no se ha modificado.** No ejecutar `migrate reset`, ni aplicar el nuevo historial encima sin preparar una migración de sus datos.

Para probar sin tocarla, en Ubuntu/WSL, desde el repositorio y con Node >=22.12:

```bash
npm ci
docker run -d --name picasso-integration-test \
  -e POSTGRES_PASSWORD=local_test_only \
  -e POSTGRES_USER=picasso \
  -e POSTGRES_DB=picasso_integration \
  -p 127.0.0.1:55433:5432 \
  -v picasso_integration_data:/var/lib/postgresql/data postgres:17-alpine
```

Si ese contenedor ya existe, no repetir `docker run`: usar `docker start picasso-integration-test` si está detenido. Esperar a que esté preparado:

```bash
docker exec picasso-integration-test pg_isready -U picasso
```

Preparar únicamente esa base:

```bash
export DATABASE_URL='postgresql://picasso:local_test_only@localhost:55433/picasso_integration'
npx prisma generate --schema apps/backend/prisma/schema.prisma
npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma
node scripts/seed-integration.cjs
PORT=3001 npm run start:dev --workspace @picasso/backend
```

En otra terminal:

```bash
BACKEND_PROXY_TARGET=http://localhost:3001 npm run dev --workspace @picasso/frontend -- --port 5175
```

Abrir `http://localhost:5175` y `http://localhost:5175/empleados`. El seed imprime los IDs de prueba para chat, puesto y mesa. Solo funciona sobre la base llamada `picasso_integration`, no borra registros y puede repetirse. Las credenciales anteriores son exclusivamente para esa base de prueba.

La base de prueba usa el volumen independiente `picasso_integration_data`: detener el contenedor conserva sus registros y las rutas de sus fotos. No usarlo para datos reales. Los servicios Docker originales permanecen independientes. Después de reiniciar el ordenador hay que arrancar también el backend y Vite con los comandos anteriores; los archivos locales se sirven desde Vite mientras está ejecutándose.

Las imágenes de `apps/frontend/public/images` se referencian mediante `/images/Nombre.png`, respetando mayúsculas y minúsculas. No usar rutas del disco ni incluir `public/` en la URL. En modo API, cada plato necesita su `imageUrl` y la marca de galería correspondiente; tener una foto en el disco no crea un plato en la base de datos.

Para el backend normal, el proxy sigue apuntando por defecto a `localhost:3000`. La puesta en marcha con datos antiguos requiere primero una migración de datos revisada y una copia de seguridad. El frontend nuevo debe usarse junto con el backend actualizado, no con la imagen Docker antigua.

## 6. Modo de demostración y despliegue

El modo por defecto consulta APIs. Para explorar las pantallas antiguas sin backend, arrancar Vite con `VITE_DATA_MODE=demo`. No se activa automáticamente si falla la red: un error real nunca se disimula con datos de ejemplo.

El panel conectado funciona en desarrollo. En builds de producción queda deshabilitado por defecto mientras no exista autenticación; `VITE_ENABLE_DEV_PANEL=true` permite compilarlo explícitamente para un entorno de pruebas aislado. **Esto solo limita la interfaz: no protege las rutas del backend.** No sustituye los guards ni los permisos pendientes.

El widget público de chat de demostración no se muestra en modo API: el backend actual solo soporta conversaciones entre usuarios existentes, sin invitados. El chat interno conserva el directorio y las conversaciones originales. Para probarlo, se selecciona un empleado como emisor y otro como destinatario; la petición utiliza sus IDs de usuario devueltos por la API. Tras una reconexión vuelve a ejecutar `join` y recuperar historial, evitando duplicados por ID.

## 7. Límites que debe resolver el equipo de backend

- Autenticación, autorización por rol y asociación del usuario al restaurante. El backend aún crea pedidos con la identidad temporal restaurante 1 / empleado 1.
- Catálogo y gestión de usuarios pendientes del módulo de autenticación. Los puestos se consultan con GET `/api/employees/positions`. Crear empleado requiere `userId` existente y un puesto seleccionado del catálogo. La UI no inventa usuarios ni permite editar emails o roles con endpoints inexistentes.
- GET de empleados ahora devuelve nombre y apellidos separados, además del nombre completo. PATCH recibe esos campos sin dividir nombres compuestos. La API no admite vaciar un teléfono guardado; el formulario lo indica como error y conserva los datos.
- Los cambios de receta existentes se envían con el plato. Altas y bajas de ingredientes usan peticiones separadas: si alguna falla tras guardar el plato, se informa del resultado parcial y se recargan los datos para evitar repetir altas inadvertidamente.
- GET `/api/tables` devuelve mesas existentes con número y capacidad. En pedidos en local se selecciona una mesa del catálogo; no se introducen IDs manualmente. Un catálogo vacío impide confirmar pedidos en local. El modelo actual de mesas es global y no incorpora asociación por restaurante.
- Edición de platos o cantidades de pedidos ya enviados y devolución de stock al cancelar después de preparar no están implementadas en la API. La UI no las simula.
- No existe clave de idempotencia para crear pedidos. Se bloquea el doble clic, pero ante una interrupción de red hay que comprobar el panel antes de reenviar.
- Migrar los registros antiguos sin perderlos. Las pruebas sobre una base vacía no validan la migración de la base anterior.
- Las descripciones nuevas y los mensajes escritos por usuarios se muestran como contenido; no se traducen automáticamente.
- Analytics #12 no está incluido en `main` y no forma parte de esta integración.

## Búsqueda e idiomas en el modo conectado

La carta y la gestión de platos comparten búsqueda por texto, categoría, rango de precios COP, ordenación y paginación. La búsqueda se realiza en el navegador sobre los datos recibidos de la API; no añade endpoints ni paginación en el servidor. El panel permite además filtrar disponibilidad. La carta pública solo muestra platos disponibles.

Los controles y mensajes siguen el idioma seleccionado (español, inglés o portugués). Cambiar de idioma conserva filtros y borradores. Los identificadores de categorías, unidades, ingredientes y platos se mantienen como valores de las peticiones aunque cambien las etiquetas visibles.

## 8. Comprobaciones

```bash
npm run build
npm run test:ci
```

Prueba real HTTP y Socket.IO sobre **una base `picasso_integration` recién creada y migrada, antes de ejecutar el seed**:

```bash
DATABASE_URL='postgresql://picasso:local_test_only@localhost:55433/picasso_integration' \
  node scripts/integration-smoke.cjs
```

El script comprueba que estén libres los puertos 3001 y 5175, inicia un backend temporal y Vite en modo API y detiene ambos al acabar. Las peticiones HTTP y WebSocket pasan por el proxy de Vite. Comprueba CRUD, totales decimales, stock ante concurrencia, estados, desactivación de platos con historial, recetas, creación/edición de empleados, catálogos de puestos/mesas e historial/entrega de chat. Reinicia el backend y verifica persistencia y entrega de chat tras reconectar. No debe ejecutarse contra la base del proyecto ni una base de producción.

Esta prueba usa servicios y PostgreSQL reales, pero no abre un navegador ni valida visualmente la interfaz. Resultados de la ejecución: [validación de integración](VALIDACION_INTEGRACION.md).

## Despliegue y datos antiguos

El arranque Docker aplica las migraciones mediante un servicio previo al backend. La migración de la carta antigua se ha verificado sobre una copia aislada; la base original sigue intacta. Procedimiento y evidencias: [despliegue y migración](DESPLIEGUE_Y_MIGRACION.md).
