/*
  Warnings:

  - Added the required column `unit_id` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `units_of_measure` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('weight', 'volume', 'count');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "unit_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "units_of_measure" ADD COLUMN     "type" "UnitType" NOT NULL;

-- CreateIndex
CREATE INDEX "recipes_ingredient_id_idx" ON "recipes"("ingredient_id");

-- CreateIndex
CREATE INDEX "recipes_unit_id_idx" ON "recipes"("unit_id");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units_of_measure"("unit_id") ON DELETE RESTRICT ON UPDATE CASCADE;
