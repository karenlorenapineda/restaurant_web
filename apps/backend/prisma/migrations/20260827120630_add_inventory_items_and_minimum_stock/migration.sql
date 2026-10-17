-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "minimum_stock" DECIMAL(10,3) NOT NULL DEFAULT 0.000;

-- CreateTable
CREATE TABLE "inventory_items" (
    "item_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "unit_id" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "current_stock" DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    "minimum_stock" DECIMAL(10,3) NOT NULL DEFAULT 0.000,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("item_id")
);

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units_of_measure"("unit_id") ON DELETE RESTRICT ON UPDATE CASCADE;
