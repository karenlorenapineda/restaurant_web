/*
  Warnings:

  - The `Estado` column on the `Amigos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EstadosSolicitud" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Amigos" DROP COLUMN "Estado",
ADD COLUMN     "Estado" "EstadosSolicitud" NOT NULL DEFAULT 'pending',
ALTER COLUMN "FechaCreacion" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DetallePedidos" ALTER COLUMN "Cantidad" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Empleados" ALTER COLUMN "Activo" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Facturas" ALTER COLUMN "FechaEmision" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "HistorialEstadoPedido" ALTER COLUMN "FechaHora" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Insumos" ALTER COLUMN "StockActual" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ItemsMenu" ALTER COLUMN "Disponible" SET DEFAULT true;

-- AlterTable
ALTER TABLE "MensajeChat" ALTER COLUMN "FechaHora" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "Leido" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Notificaciones" ALTER COLUMN "FechaHora" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Pagos" ALTER COLUMN "FechaHora" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Pedidos" ALTER COLUMN "Total" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "ResenasRestaurante" ALTER COLUMN "Comentario" DROP NOT NULL,
ALTER COLUMN "FechaHora" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Restaurantes" ALTER COLUMN "Activo" SET DEFAULT true;

-- AlterTable
ALTER TABLE "Usuarios" ALTER COLUMN "Activo" SET DEFAULT true,
ALTER COLUMN "EmailVereficado" SET DEFAULT false;
