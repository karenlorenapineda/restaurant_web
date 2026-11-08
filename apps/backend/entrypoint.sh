#!/bin/sh
set -eu

echo "Aplicando migraciones de Prisma..."
./node_modules/.bin/prisma migrate deploy \
  --schema apps/backend/prisma/schema.prisma

echo "Migraciones aplicadas. Iniciando backend..."
exec "$@"
