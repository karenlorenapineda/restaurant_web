# Validación real de integración — 1 de noviembre de 2026

Rama: `feature/frontend-backend-integration`.

Resultado: **PASS** en `scripts/integration-smoke.cjs`, utilizando Node 22.23.3, PostgreSQL 17 y las siete migraciones del repositorio.

## Aislamiento

Se creó un contenedor temporal independiente, `picasso-flow-validation-20261101`, publicado solo en `127.0.0.1:55434`. No se modificaron la base habitual ni el contenedor antiguo `picasso-integration-test`. La ejecución completa que pasó usó un esquema vacío llamado `flow_retry` en la base temporal `picasso_integration`.

La primera ejecución descubrió una suposición incorrecta del script: consultaba al primer empleado de la lista después de desactivar uno. Con varios empleados el orden no está garantizado. Se corrigió para consultar por su ID y se repitió desde un esquema vacío.

## Comprobaciones superadas

- HTTP por el proxy real de Vite (5175), conectado al backend temporal (3001).
- Catálogos reales de puestos y mesas; creación y edición de un empleado vinculado a un usuario de prueba existente.
- Carta con descripciones nulas e importes COP decimales.
- Alta, edición, consulta y borrado de inventario.
- Pedido en local con mesa real y cancelación antes de preparar sin descontar ingredientes.
- Pedido a domicilio: cálculo del total por el servidor y transiciones hasta completado.
- Dos peticiones simultáneas de preparación: solo una tiene éxito y los ingredientes se descuentan una sola vez.
- Desactivación de un plato con historial, conservando sus recetas y ocultándolo de la carta pública.
- Edición de cantidades de receta y activación/desactivación de empleados.
- Dos clientes Socket.IO usando WebSocket por el proxy del frontend; entrega e historial de mensajes.
- Mensajes almacenados cifrados en PostgreSQL.
- Tras reiniciar el backend: persisten pedido, stock, plato, receta, empleado, mesa e historial de chat; los clientes pueden reconectarse y volver a enviar mensajes.

## Límites

No se abrió un navegador: esta ejecución valida servicios, almacenamiento y proxy, no interacción visual o diseño responsive. Autenticación y permisos siguen pendientes del trabajo de su responsable. El despliegue completo mediante Docker/HTTPS y la migración de los datos antiguos son pasos separados y no quedan validados por esta prueba.
