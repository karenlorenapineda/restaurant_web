# Despliegue y migración de la carta antigua

## Arranque desde una base nueva

Configurar `.env` a partir de `.env.example`, con `DATABASE_URL` apuntando a `database:5432` y credenciales coincidentes con PostgreSQL. Ejecutar:

```bash
docker compose up -d --build
```

Compose espera a PostgreSQL, ejecuta `prisma migrate deploy` mediante el servicio `migrations` y solo inicia el backend si termina correctamente. Nginx espera a que el backend esté saludable. El servicio de migraciones conserva las herramientas necesarias, mientras que la imagen de ejecución elimina dependencias de desarrollo.

`HTTP_PORT` y `HTTPS_PORT` permiten puertos alternativos; la redirección HTTP conserva ruta, consulta y puerto HTTPS configurado. El certificado generado es autofirmado para localhost. Un navegador necesita confiar explícitamente en ese certificado para evitar avisos; un despliegue público requiere un certificado apropiado para su dominio.

El panel conectado continúa deshabilitado en producción mientras la autenticación esté pendiente. No activar el panel de desarrollo en un servicio público.

## Base antigua inspeccionada

La base actual contiene únicamente `CategoriasMenu` (3 filas) e `ItemsMenu` (6 filas). No es una base con el historial nuevo de Prisma ni contiene pedidos antiguos que convertir. Las tablas nuevas utilizan nombres y columnas diferentes.

No se aplicó ningún cambio a esta base. Se hizo una copia privada de ambas tablas en `/tmp/picasso-legacy-menu-20261101.dump` (formato personalizado de PostgreSQL, permisos 600). Es un archivo local temporal: conservar una copia duradera antes de cualquier intervención en la base original.

## Procedimiento de migración preparado

1. Guardar una copia de seguridad y detener escrituras para obtener una instantánea consistente.
2. Crear una base de destino independiente y aplicar las migraciones de Prisma.
3. Restaurar las dos tablas antiguas desde la copia con `pg_restore --no-owner --no-privileges`, conservando sus nombres.
4. En esa base de destino, ejecutar `scripts/migrate-legacy-menu.sql` con `psql -v ON_ERROR_STOP=1 -f scripts/migrate-legacy-menu.sql`.
5. Comparar IDs, nombres, descripciones, imágenes, precios, categorías y disponibilidad antes de cambiar la aplicación a la nueva base.
6. Solo después de revisar el resultado, planificar el cambio de conexión. Conservar la base original como posibilidad de vuelta atrás.

El script importa en una transacción, bloquea las tablas mientras trabaja y se niega a continuar si el destino ya tiene categorías o platos. Rechaza valores incompatibles, conserva los IDs, ajusta las secuencias y no borra las tablas antiguas. Esta importación está diseñada para las dos tablas inspeccionadas, no para otras versiones históricas del esquema.

## Verificación ejecutada — 1 de noviembre de 2026

Proyecto Docker aislado: `picasso-deploy-validation-20261101`; puertos 18081/18444; volúmenes independientes de los habituales.

- Construcción y arranque con un único `docker compose ... up -d --build`: correctos.
- Las siete migraciones se aplican automáticamente; el backend alcanza estado saludable.
- HTTPS para la web, rutas SPA y API: correcto, validando el certificado local con su CA explícita, sin desactivar la verificación TLS.
- HTTP redirige a HTTPS conservando ruta, consulta y puerto alternativo.
- WebSocket seguro (WSS) conecta a través de Nginx con validación del certificado.
- Restauración de la copia e importación: 3 categorías y 6 platos. Comparación bidireccional de todos los campos: cero diferencias.
- Segunda importación: rechazada por destino no vacío, sin sobrescribir datos.
- Parada y nuevo arranque: persisten los 9 registros y las 7 migraciones aplicadas; la API vuelve a estar saludable.
- Base original: sin cambios, conserva 3 categorías y 6 platos.

Se detuvo únicamente el proyecto de validación, conservando sus volúmenes. Los servicios originales siguieron en ejecución. No se ha cambiado la aplicación habitual a la base migrada ni se ha realizado una revisión visual en navegador.
