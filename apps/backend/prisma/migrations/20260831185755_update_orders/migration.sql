/*
  Warnings:

  - You are about to drop the column `status_id` on the `order_status_history` table. All the data in the column will be lost.
  - You are about to drop the column `status_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the `order_statuses` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `status` to the `order_status_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('queued', 'preparing', 'ready', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('dine_in', 'takeaway', 'delivery');

-- DropForeignKey
ALTER TABLE "order_status_history" DROP CONSTRAINT "order_status_history_status_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_status_id_fkey";

-- AlterTable
ALTER TABLE "order_status_history" DROP COLUMN "status_id",
ADD COLUMN     "status" "OrderStatus" NOT NULL;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "status_id",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'queued',
ADD COLUMN     "type" "OrderType" NOT NULL;

-- DropTable
DROP TABLE "order_statuses";

-- CreateTable
CREATE TABLE "order_detail_modifications" (
    "order_detail_modification_id" SERIAL NOT NULL,
    "order_detail_id" INTEGER NOT NULL,
    "recipe_id" INTEGER NOT NULL,

    CONSTRAINT "order_detail_modifications_pkey" PRIMARY KEY ("order_detail_modification_id")
);

-- AddForeignKey
ALTER TABLE "order_detail_modifications" ADD CONSTRAINT "order_detail_modifications_order_detail_id_fkey" FOREIGN KEY ("order_detail_id") REFERENCES "order_details"("order_detail_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_detail_modifications" ADD CONSTRAINT "order_detail_modifications_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("recipe_id") ON DELETE RESTRICT ON UPDATE CASCADE;
